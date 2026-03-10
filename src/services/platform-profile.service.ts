import puppeteer, { Page } from "puppeteer";
import { PlatformGuardService } from "./platform-guard.service";
import { SessionProfileService } from "./session-profile.service";

export interface PlatformProfileSnapshot {
  email: string;
  displayName: string;
  accountType: string;
  memberSince?: string | undefined;
  activeAds: number;
  summary: string;
  sourceUrl: string;
}

export class PlatformProfileService {
  private readonly sessionProfiles: SessionProfileService;
  private readonly platformGuard: PlatformGuardService;

  constructor() {
    this.sessionProfiles = new SessionProfileService();
    this.platformGuard = new PlatformGuardService();
  }

  private async navigateWithFallback(page: Page, url: string): Promise<void> {
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
    } catch (error) {
      const isNavigationTimeout =
        error instanceof Error &&
        error.message.toLowerCase().includes("navigation timeout");
      if (!isNavigationTimeout) {
        throw error;
      }
    }

    await page.waitForSelector("body", {
      timeout: 5000,
    }).catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  async syncProfile(email: string): Promise<PlatformProfileSnapshot> {
    const sessionResult = await this.sessionProfiles.verifySession(email, {
      startIfNeeded: true,
      saveCookies: true,
      source: "profile:sync",
    });

    if (!sessionResult.loggedIn) {
      throw new Error(sessionResult.error || "Session is not authenticated");
    }

    const browserResult = await this.sessionProfiles.ensureProfileBrowser(email);
    const browser = await puppeteer.connect({
      browserWSEndpoint: browserResult.webSocketUrl,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    try {
      await this.navigateWithFallback(
        page,
        "https://www.kleinanzeigen.de/m-meine-anzeigen.html"
      );

      const blockState = await this.platformGuard.inspectKleinanzeigenPage(
        page,
        "profile:sync"
      );

      if (blockState) {
        throw new Error(this.platformGuard.getBlockMessage(blockState));
      }

      const snapshot = await page.evaluate(() => {
        const bodyText = document.body.innerText || "";
        const displayName =
          bodyText.match(/Profil von\s+([^\n]+)/)?.[1]?.trim() || "Unbekannt";
        const accountType = bodyText.includes("Gewerblicher Nutzer")
          ? "commercial"
          : bodyText.includes("Privater Nutzer")
          ? "private"
          : "unknown";
        const memberSinceMatch = bodyText.match(/Aktiv seit\s+(\d{2}\.\d{2}\.\d{4})/);
        const activeAdsMatch = bodyText.match(/(\d+)\s+Anzeigen online/);

        return {
          displayName,
          accountType,
          memberSince: memberSinceMatch?.[1],
          activeAds: activeAdsMatch?.[1] ? Number.parseInt(activeAdsMatch[1], 10) : 0,
          summary: accountType === "commercial"
            ? "Gewerblicher Kleinanzeigen-Account mit persistentem Browser-Profil."
            : "Privater Kleinanzeigen-Account mit persistentem Browser-Profil.",
          sourceUrl: window.location.href,
        };
      });

      return {
        email,
        ...snapshot,
      };
    } finally {
      await page.close().catch(() => undefined);
      await browser.disconnect();
    }
  }
}
