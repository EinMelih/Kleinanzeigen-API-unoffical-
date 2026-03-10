import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import { emailToSlug } from "../../shared/utils";
import { ChromeService } from "./chromeService";
import {
  PlatformBlockInspection,
  PlatformBlockState,
  PlatformGuardService,
} from "./platform-guard.service";

const SESSION_CONFIG = {
  LOGIN_URL: "https://www.kleinanzeigen.de/m-einloggen.html",
  HOME_URL: "https://www.kleinanzeigen.de/",
  LOGIN_INDICATORS: [
    "Mein Konto",
    "Meine Anzeigen",
    "Abmelden",
    "Nachrichten",
    "Einstellungen",
    "Favoriten",
    "Meine Anzeigen verwalten",
  ],
  TIMEOUTS: {
    NAVIGATION: 30000,
    WAIT_AFTER_LOAD: 1500,
  },
  PORT_RANGE_START: 9400,
  PORT_RANGE_SIZE: 400,
} as const;

export type SessionProfileState =
  | "not_started"
  | "pending_manual_login"
  | "authenticated"
  | "needs_reauth"
  | "blocked"
  | "error";

export interface SessionProfileMetadata {
  email: string;
  profileDir: string;
  debugPort: number;
  cookiePath: string;
  state: SessionProfileState;
  createdAt: string;
  updatedAt: string;
  lastManualLoginStartedAt?: string;
  lastVerifiedAt?: string;
  lastSuccessfulLoginAt?: string;
  lastError?: string;
}

export interface SessionProfileStatus {
  email: string;
  profileDir: string;
  debugPort: number;
  cookiePath: string;
  profileExists: boolean;
  cookieFileExists: boolean;
  chromeRunning: boolean;
  state: SessionProfileState;
  wsEndpoint?: string;
  createdAt?: string;
  updatedAt?: string;
  lastManualLoginStartedAt?: string;
  lastVerifiedAt?: string;
  lastSuccessfulLoginAt?: string;
  lastError?: string;
}

export interface EnsureProfileBrowserResult {
  debugPort: number;
  profileDir: string;
  webSocketUrl: string;
  alreadyRunning: boolean;
}

export interface ManualLoginStartResult {
  loginUrl: string;
  alreadyRunning: boolean;
  status: SessionProfileStatus;
}

export interface SessionVerificationOptions {
  startIfNeeded?: boolean;
  saveCookies?: boolean;
  source?: string;
}

export interface SessionVerificationResult {
  loggedIn: boolean;
  cookieCount: number;
  status: SessionProfileStatus;
  error?: string;
  blockState?: PlatformBlockState;
}

interface MetadataChanges {
  state?: SessionProfileState;
  lastManualLoginStartedAt?: string;
  lastVerifiedAt?: string;
  lastSuccessfulLoginAt?: string;
  lastError?: string | null;
}

export class SessionProfileService {
  private readonly profilesDir: string;
  private readonly cookiesDir: string;
  private readonly platformGuard: PlatformGuardService;

  constructor() {
    this.profilesDir = path.join(process.cwd(), "data", "browser-profiles");
    this.cookiesDir = path.join(process.cwd(), "data", "cookies");
    this.platformGuard = new PlatformGuardService();
  }

  getProfileDir(email: string): string {
    return path.join(this.profilesDir, emailToSlug(email));
  }

  getCookiePath(email: string): string {
    return path.join(
      this.cookiesDir,
      `cookies-${emailToSlug(email)}.json`
    );
  }

  getMetadataPath(email: string): string {
    return path.join(this.getProfileDir(email), "session-profile.json");
  }

  getDebugPort(email: string): number {
    const slug = emailToSlug(email);
    let hash = 0;

    for (let index = 0; index < slug.length; index++) {
      hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
    }

    return (
      SESSION_CONFIG.PORT_RANGE_START + (hash % SESSION_CONFIG.PORT_RANGE_SIZE)
    );
  }

  private ensureDirectoryLayout(email: string): void {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }

    if (!fs.existsSync(this.cookiesDir)) {
      fs.mkdirSync(this.cookiesDir, { recursive: true });
    }

    const profileDir = this.getProfileDir(email);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
  }

  private createDefaultMetadata(email: string): SessionProfileMetadata {
    const now = new Date().toISOString();

    return {
      email,
      profileDir: this.getProfileDir(email),
      debugPort: this.getDebugPort(email),
      cookiePath: this.getCookiePath(email),
      state: "not_started",
      createdAt: now,
      updatedAt: now,
    };
  }

  private readMetadata(email: string): SessionProfileMetadata | null {
    try {
      const metadataPath = this.getMetadataPath(email);
      if (!fs.existsSync(metadataPath)) {
        return null;
      }

      const content = fs.readFileSync(metadataPath, "utf8");
      return JSON.parse(content) as SessionProfileMetadata;
    } catch {
      return null;
    }
  }

  private writeMetadata(email: string, metadata: SessionProfileMetadata): void {
    this.ensureDirectoryLayout(email);
    fs.writeFileSync(
      this.getMetadataPath(email),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );
  }

  private persistMetadata(
    email: string,
    changes: MetadataChanges
  ): SessionProfileMetadata {
    const baseMetadata = this.readMetadata(email) ?? this.createDefaultMetadata(email);
    const nextMetadata: SessionProfileMetadata = {
      ...baseMetadata,
      updatedAt: new Date().toISOString(),
    };

    if (changes.state) {
      nextMetadata.state = changes.state;
    }

    if (changes.lastManualLoginStartedAt) {
      nextMetadata.lastManualLoginStartedAt = changes.lastManualLoginStartedAt;
    }

    if (changes.lastVerifiedAt) {
      nextMetadata.lastVerifiedAt = changes.lastVerifiedAt;
    }

    if (changes.lastSuccessfulLoginAt) {
      nextMetadata.lastSuccessfulLoginAt = changes.lastSuccessfulLoginAt;
    }

    if (changes.lastError === null) {
      delete nextMetadata.lastError;
    } else if (changes.lastError) {
      nextMetadata.lastError = changes.lastError;
    }

    this.writeMetadata(email, nextMetadata);
    return nextMetadata;
  }

  async getStatus(email: string): Promise<SessionProfileStatus> {
    const metadata = this.readMetadata(email);
    const profileDir = this.getProfileDir(email);
    const cookiePath = this.getCookiePath(email);
    const debugPort = this.getDebugPort(email);
    const profileExists = fs.existsSync(profileDir);
    const cookieFileExists = fs.existsSync(cookiePath);
    const chromeService = new ChromeService(debugPort, profileDir);
    const chromeStatus = await chromeService.checkChromeStatus();

    const status: SessionProfileStatus = {
      email,
      profileDir,
      debugPort,
      cookiePath,
      profileExists,
      cookieFileExists,
      chromeRunning: chromeStatus.isRunning,
      state:
        metadata?.state ??
        (profileExists ? "needs_reauth" : "not_started"),
    };

    if (metadata?.createdAt) {
      status.createdAt = metadata.createdAt;
    }
    if (metadata?.updatedAt) {
      status.updatedAt = metadata.updatedAt;
    }
    if (metadata?.lastManualLoginStartedAt) {
      status.lastManualLoginStartedAt = metadata.lastManualLoginStartedAt;
    }
    if (metadata?.lastVerifiedAt) {
      status.lastVerifiedAt = metadata.lastVerifiedAt;
    }
    if (metadata?.lastSuccessfulLoginAt) {
      status.lastSuccessfulLoginAt = metadata.lastSuccessfulLoginAt;
    }
    if (metadata?.lastError) {
      status.lastError = metadata.lastError;
    }

    if (chromeStatus.isRunning) {
      const wsEndpoint = await chromeService.getWebSocketEndpoint();
      if (wsEndpoint) {
        status.wsEndpoint = wsEndpoint;
      }
    }

    return status;
  }

  async ensureProfileBrowser(
    email: string,
    startUrl?: string
  ): Promise<EnsureProfileBrowserResult> {
    this.ensureDirectoryLayout(email);
    const profileDir = this.getProfileDir(email);
    const debugPort = this.getDebugPort(email);
    const chromeService = new ChromeService(debugPort, profileDir);
    const initialStatus = await chromeService.checkChromeStatus();
    const chromeOptions = startUrl
      ? { saveToEnv: false, startUrl }
      : { saveToEnv: false };
    const chromeResult = await chromeService.setupChrome(chromeOptions);

    if (!chromeResult.success || !chromeResult.webSocketUrl) {
      throw new Error(
        chromeResult.error || "Could not open Chrome with persistent profile"
      );
    }

    if (!this.readMetadata(email)) {
      this.writeMetadata(email, this.createDefaultMetadata(email));
    }

    return {
      debugPort,
      profileDir,
      webSocketUrl: chromeResult.webSocketUrl,
      alreadyRunning: initialStatus.isRunning,
    };
  }

  async startManualLogin(email: string): Promise<ManualLoginStartResult> {
    const guardStatus = this.platformGuard.isBlocked();
    if (guardStatus.blocked) {
      throw new Error(this.platformGuard.getBlockMessage(guardStatus.state));
    }

    const browserResult = await this.ensureProfileBrowser(
      email,
      SESSION_CONFIG.LOGIN_URL
    );
    this.persistMetadata(email, {
      state: "pending_manual_login",
      lastManualLoginStartedAt: new Date().toISOString(),
      lastError: null,
    });

    return {
      loginUrl: SESSION_CONFIG.LOGIN_URL,
      alreadyRunning: browserResult.alreadyRunning,
      status: await this.getStatus(email),
    };
  }

  recordSessionState(
    email: string,
    input: {
      loggedIn: boolean;
      lastError?: string | null;
      lastManualLoginStartedAt?: string;
    }
  ): SessionProfileMetadata {
    const now = new Date().toISOString();

    return this.persistMetadata(email, {
      state: input.loggedIn ? "authenticated" : "needs_reauth",
      lastVerifiedAt: now,
      ...(input.loggedIn ? { lastSuccessfulLoginAt: now } : {}),
      ...(input.lastManualLoginStartedAt
        ? { lastManualLoginStartedAt: input.lastManualLoginStartedAt }
        : {}),
      lastError: input.loggedIn ? null : input.lastError || "Session is not authenticated",
    });
  }

  private async detectLoggedIn(page: Page): Promise<boolean> {
    return page.evaluate((indicators) => {
      const bodyText = document.body.innerText || "";
      const userEmailElement = document.querySelector("#user-email");
      const hasUserEmail =
        userEmailElement &&
        userEmailElement.textContent &&
        userEmailElement.textContent.includes("angemeldet als:");

      const hasIndicators = indicators.some((indicator: string) =>
        bodyText.includes(indicator)
      );

      const loginButton = document.querySelector(
        'a[href*="m-einloggen.html"], a[href*="login"], .button[href*="einloggen"]'
      );
      const isLoginButtonVisible =
        loginButton && (loginButton as HTMLElement).offsetParent !== null;

      return hasUserEmail || (hasIndicators && !isLoginButtonVisible);
    }, SESSION_CONFIG.LOGIN_INDICATORS);
  }

  private isKleinanzeigenUrl(url: string): boolean {
    return /https?:\/\/([^.]+\.)?kleinanzeigen\.de/i.test(url);
  }

  private isLoginUrl(url: string): boolean {
    return (
      url.includes("login.kleinanzeigen.de") ||
      url.includes("m-einloggen.html")
    );
  }

  private looksAuthenticatedByLocation(pageTitle: string, url: string): boolean {
    const normalizedTitle = pageTitle.toLowerCase();
    const normalizedUrl = url.toLowerCase();

    return (
      normalizedTitle.includes("meine anzeigen") ||
      normalizedTitle.includes("mein konto") ||
      normalizedUrl.includes("/m-meine-anzeigen") ||
      normalizedUrl.includes("/m-nachrichten") ||
      normalizedUrl.includes("/m-mein-konto") ||
      normalizedUrl.includes("login=success")
    );
  }

  private async capturePageSnapshot(
    page: Page
  ): Promise<{ title: string; bodyText: string; url: string }> {
    await page.bringToFront().catch(() => undefined);
    await page.waitForSelector("body", {
      timeout: 5000,
    }).catch(() => undefined);

    const title = await page.title().catch(() => "");
    const url = page.url();
    const bodyText = await page
      .evaluate(() => document.body?.innerText || "")
      .catch(() => "");

    return {
      title,
      bodyText,
      url,
    };
  }

  private async findReusableSessionPage(
    browser: Browser,
    source: string
  ): Promise<{ page: Page | null; blockInspection: PlatformBlockInspection | null }> {
    const pages = await browser.pages();
    let blockInspection: PlatformBlockInspection | null = null;

    for (const candidate of pages) {
      const url = candidate.url();
      if (!this.isKleinanzeigenUrl(url) || this.isLoginUrl(url)) {
        continue;
      }

      const snapshot = await this.capturePageSnapshot(candidate);
      const loggedIn =
        this.looksAuthenticatedByLocation(snapshot.title, snapshot.url) ||
        (await this.detectLoggedIn(candidate).catch(() => false));

      if (loggedIn) {
        return {
          page: candidate,
          blockInspection: null,
        };
      }

      if (!blockInspection) {
        blockInspection =
          this.platformGuard.detectFromContent(
            snapshot.title,
            snapshot.bodyText,
            source
          ) ?? null;
      }
    }

    return {
      page: null,
      blockInspection,
    };
  }

  private async saveCookiesFromPage(email: string, page: Page): Promise<number> {
    const cookies = await page.cookies();
    this.ensureDirectoryLayout(email);
    fs.writeFileSync(
      this.getCookiePath(email),
      JSON.stringify(cookies, null, 2),
      "utf8"
    );
    return cookies.length;
  }

  private isNavigationTimeout(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.toLowerCase().includes("navigation timeout")
    );
  }

  private async navigateForSessionCheck(page: Page, url: string): Promise<void> {
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: SESSION_CONFIG.TIMEOUTS.NAVIGATION,
      });
    } catch (error) {
      if (!this.isNavigationTimeout(error)) {
        throw error;
      }

      await page.waitForSelector("body", {
        timeout: 5000,
      }).catch(() => undefined);
    }

    await page.waitForSelector("body", {
      timeout: 5000,
    }).catch(() => undefined);
  }

  async verifySession(
    email: string,
    options: SessionVerificationOptions = {}
  ): Promise<SessionVerificationResult> {
    const guardStatus = this.platformGuard.isBlocked();
    if (guardStatus.blocked) {
      this.persistMetadata(email, {
        state: "blocked",
        lastVerifiedAt: new Date().toISOString(),
        lastError: this.platformGuard.getBlockMessage(guardStatus.state),
      });

      return {
        loggedIn: false,
        cookieCount: 0,
        status: await this.getStatus(email),
        error: this.platformGuard.getBlockMessage(guardStatus.state),
        ...(guardStatus.state ? { blockState: guardStatus.state } : {}),
      };
    }

    const currentStatus = await this.getStatus(email);
    if (!currentStatus.profileExists && !options.startIfNeeded) {
      return {
        loggedIn: false,
        cookieCount: 0,
        status: currentStatus,
        error: "No persistent browser profile found",
      };
    }

    let page: Page | null = null;
    let closePageAfterCheck = false;

    try {
      let wsEndpoint = currentStatus.wsEndpoint;

      if (!wsEndpoint) {
        if (!options.startIfNeeded) {
          return {
            loggedIn: false,
            cookieCount: 0,
            status: currentStatus,
            error: "Persistent profile browser is not running",
          };
        }

        const browserResult = await this.ensureProfileBrowser(
          email,
          SESSION_CONFIG.HOME_URL
        );
        wsEndpoint = browserResult.webSocketUrl;
      }

      const browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: null,
      });

      const reusableSession = await this.findReusableSessionPage(
        browser,
        options.source || "session:verify"
      );

      page = reusableSession.page;

      if (!page) {
        page = await browser.newPage();
        closePageAfterCheck = true;
        await this.navigateForSessionCheck(page, SESSION_CONFIG.HOME_URL);
      }

      const blockState = await this.platformGuard.inspectKleinanzeigenPage(
        page,
        options.source || "session:verify"
      );
      if (blockState) {
        this.persistMetadata(email, {
          state: "blocked",
          lastVerifiedAt: new Date().toISOString(),
          lastError: this.platformGuard.getBlockMessage(blockState),
        });

        return {
          loggedIn: false,
          cookieCount: 0,
          status: await this.getStatus(email),
          error: this.platformGuard.getBlockMessage(blockState),
          blockState,
        };
      }

      await new Promise((resolve) =>
        setTimeout(resolve, SESSION_CONFIG.TIMEOUTS.WAIT_AFTER_LOAD)
      );

      const pageTitle = await page.title().catch(() => "");
      const loggedIn =
        this.looksAuthenticatedByLocation(pageTitle, page.url()) ||
        (await this.detectLoggedIn(page));
      const now = new Date().toISOString();
      const shouldSaveCookies = options.saveCookies !== false;
      let cookieCount = 0;

      if (loggedIn && shouldSaveCookies) {
        cookieCount = await this.saveCookiesFromPage(email, page);
      } else if (fs.existsSync(this.getCookiePath(email))) {
        try {
          const cookies = JSON.parse(
            fs.readFileSync(this.getCookiePath(email), "utf8")
          ) as unknown[];
          cookieCount = Array.isArray(cookies) ? cookies.length : 0;
        } catch {
          cookieCount = 0;
        }
      }

      this.persistMetadata(email, {
        state: loggedIn ? "authenticated" : "needs_reauth",
        lastVerifiedAt: now,
        ...(loggedIn ? { lastSuccessfulLoginAt: now } : {}),
        lastError: loggedIn ? null : "Session is not authenticated",
      });

      return {
        loggedIn,
        cookieCount,
        status: await this.getStatus(email),
        ...(loggedIn ? {} : { error: "Session is not authenticated" }),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown session error";

      this.persistMetadata(email, {
        state: "error",
        lastVerifiedAt: new Date().toISOString(),
        lastError: errorMessage,
      });

      return {
        loggedIn: false,
        cookieCount: 0,
        status: await this.getStatus(email),
        error: errorMessage,
      };
    } finally {
      if (page && closePageAfterCheck) {
        await page.close().catch(() => undefined);
      }
    }
  }
}
