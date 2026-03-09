import * as fs from "fs";
import * as path from "path";
import { Page } from "puppeteer";

export interface PlatformBlockState {
  platform: "kleinanzeigen";
  isBlocked: boolean;
  reason: string;
  source: string;
  detectedAt: string;
  blockedUntil: string;
  refCode?: string;
  ipAddress?: string;
  pageTitle?: string;
  excerpt?: string;
}

export interface PlatformBlockInspection {
  isBlocked: boolean;
  reason: string;
  source: string;
  refCode?: string;
  ipAddress?: string;
  pageTitle?: string;
  excerpt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_PATH = path.join(DATA_DIR, "platform-guard.json");
const DEFAULT_COOLDOWN_MINUTES = 60;

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export class PlatformGuardService {
  private readonly cooldownMinutes: number;

  constructor() {
    const configuredCooldown = parseInt(
      process.env["PLATFORM_BLOCK_COOLDOWN_MINUTES"] || "",
      10
    );
    this.cooldownMinutes =
      Number.isFinite(configuredCooldown) && configuredCooldown > 0
        ? configuredCooldown
        : DEFAULT_COOLDOWN_MINUTES;
  }

  getState(): PlatformBlockState | null {
    try {
      if (!fs.existsSync(STATE_PATH)) {
        return null;
      }

      const content = fs.readFileSync(STATE_PATH, "utf8");
      const state = JSON.parse(content) as PlatformBlockState;

      if (!state.isBlocked) {
        return null;
      }

      const blockedUntil = new Date(state.blockedUntil).getTime();
      if (Number.isNaN(blockedUntil) || blockedUntil <= Date.now()) {
        this.clearState();
        return null;
      }

      return state;
    } catch {
      return null;
    }
  }

  isBlocked(): { blocked: boolean; state?: PlatformBlockState } {
    const state = this.getState();
    if (!state) {
      return { blocked: false };
    }

    return { blocked: true, state };
  }

  clearState(): void {
    if (fs.existsSync(STATE_PATH)) {
      fs.unlinkSync(STATE_PATH);
    }
  }

  recordInspection(inspection: PlatformBlockInspection): PlatformBlockState {
    ensureDataDir();

    const detectedAt = new Date();
    const blockedUntil = new Date(
      detectedAt.getTime() + this.cooldownMinutes * 60 * 1000
    );

    const state: PlatformBlockState = {
      platform: "kleinanzeigen",
      isBlocked: true,
      reason: inspection.reason,
      source: inspection.source,
      detectedAt: detectedAt.toISOString(),
      blockedUntil: blockedUntil.toISOString(),
    };

    if (inspection.refCode) {
      state.refCode = inspection.refCode;
    }
    if (inspection.ipAddress) {
      state.ipAddress = inspection.ipAddress;
    }
    if (inspection.pageTitle) {
      state.pageTitle = inspection.pageTitle;
    }
    if (inspection.excerpt) {
      state.excerpt = inspection.excerpt;
    }

    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
    return state;
  }

  getBlockMessage(state?: PlatformBlockState): string {
    if (!state) {
      return "Kleinanzeigen is temporarily blocked";
    }

    return `Kleinanzeigen block detected (${state.source}). Cooldown active until ${state.blockedUntil}`;
  }

  async inspectKleinanzeigenPage(
    page: Page,
    source: string
  ): Promise<PlatformBlockState | null> {
    const pageSnapshot = await page.evaluate(() => ({
      title: document.title || "",
      bodyText: document.body?.innerText || "",
    }));

    const inspection = this.detectFromContent(
      pageSnapshot.title,
      pageSnapshot.bodyText,
      source
    );

    if (!inspection) {
      return null;
    }

    return this.recordInspection(inspection);
  }

  detectFromContent(
    pageTitle: string,
    bodyText: string,
    source: string
  ): PlatformBlockInspection | null {
    const combined = normalizeText(`${pageTitle}\n${bodyText}`);
    const markers = [
      "ip-bereich voruebergehend gesperrt",
      "ip bereich voruebergehend gesperrt",
      "ip-bereich gesperrt bei kleinanzeigen",
      "ip bereich gesperrt bei kleinanzeigen",
      "vorbeugung von betrug",
      "unsicheren versuchen",
      "bitte versuche es spaeter erneut",
      "zeitweilig von der nutzung von kleinanzeigen ausgeschlossen",
    ];

    const matchedMarkers = markers.filter((marker) => combined.includes(marker));
    if (matchedMarkers.length < 2) {
      return null;
    }

    const rawText = `${pageTitle}\n${bodyText}`;
    const refCode = rawText.match(/Ref#:\s*([^\s]+)/i)?.[1];
    const ipAddress = rawText.match(/IP#:\s*([^\s]+)/i)?.[1];
    const excerpt = bodyText.trim().replace(/\s+/g, " ").slice(0, 500);

    const inspection: PlatformBlockInspection = {
      isBlocked: true,
      reason:
        "Kleinanzeigen reported that the current IP range is temporarily blocked",
      source,
    };

    if (pageTitle) {
      inspection.pageTitle = pageTitle;
    }
    if (excerpt) {
      inspection.excerpt = excerpt;
    }
    if (refCode) {
      inspection.refCode = refCode;
    }
    if (ipAddress) {
      inspection.ipAddress = ipAddress;
    }

    return inspection;
  }
}
