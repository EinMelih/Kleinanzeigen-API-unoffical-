import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import { getGermanDate } from "../../shared/utils";
import { ChromeService } from "./chromeService";

// Configuration for cookie validation
const COOKIE_CONFIG = {
  TIMEOUTS: {
    PAGE_LOAD: 30000,
    WAIT_FOR_LOAD: 2000,
  },
  LOGIN_INDICATORS: [
    "Mein Konto",
    "Meine Anzeigen",
    "Abmelden",
    "Nachrichten",
    "Einstellungen",
    "Favoriten",
    "Meine Anzeigen verwalten",
  ],
  SELECTORS: {
    LOGOUT_BUTTON:
      'a[href*="logout"], a[href*="abmelden"], button[onclick*="logout"]',
    USER_ELEMENTS:
      '[class*="user"], [class*="profile"], [id*="user"], [id*="profile"]',
    ACCOUNT_LINKS: 'a[href*="account"], a[href*="konto"]',
  },
} as const;

export interface CookieValidationResult {
  isValid: boolean;
  email: string;
  cookieCount: number;
  lastValidated?: Date;
  expiresAt?: Date;
  error?: string;
  cookieDetails?: CookieDetail[];
  validityDuration?: string;
  nextExpiry?: Date;
}

export interface CookieDetail {
  name: string;
  expires: number;
  expiresAt: Date;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export class CookieValidator {
  private readonly cookiesDir: string;

  constructor() {
    this.cookiesDir = path.join(process.cwd(), "data", "cookies");
  }

  // Get all cookie files
  async getAllCookieFiles(): Promise<string[]> {
    if (!fs.existsSync(this.cookiesDir)) {
      return [];
    }

    return fs
      .readdirSync(this.cookiesDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(this.cookiesDir, file));
  }

  // Extract email from cookie filename
  extractEmailFromFilename(filename: string): string {
    const basename = path.basename(filename, ".json");
    return basename.replace("cookies-", "").replace(/_/g, "@");
  }

  // Check if cookies are expired
  async checkCookieExpiry(cookiePath: string): Promise<CookieValidationResult> {
    try {
      const email = this.extractEmailFromFilename(cookiePath);
      const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));

      if (!Array.isArray(cookies) || cookies.length === 0) {
        return {
          isValid: false,
          email,
          cookieCount: 0,
          error: "No cookies found",
        };
      }

      // Check expiry dates and create detailed cookie info
      const now = Date.now() / 1000; // Current time in seconds
      const nowDate = new Date();

      const cookieDetails: CookieDetail[] = cookies.map((cookie: any) => {
        // Handle session cookies (no expiry) and cookies with expiry
        let expiresAt: Date;
        let daysUntilExpiry: number;
        let isExpired: boolean;

        if (cookie.expires && cookie.expires > 0) {
          // Cookie has expiry timestamp
          expiresAt = new Date(cookie.expires * 1000);
          daysUntilExpiry = Math.ceil((cookie.expires - now) / (24 * 60 * 60));
          isExpired = cookie.expires <= now;
        } else if (cookie.expires === -1 || cookie.expires === 0) {
          // Session cookie (expires when browser closes) - give it a realistic "session end" date
          const sessionEndDate = new Date(
            nowDate.getTime() + 365 * 24 * 60 * 60 * 1000
          ); // +1 year as "session end"
          expiresAt = sessionEndDate;
          daysUntilExpiry = 365; // 1 year as "session duration"
          isExpired = false; // Session cookies are valid until browser closes
        } else {
          // No expiry info - treat as session cookie
          const sessionEndDate = new Date(
            nowDate.getTime() + 365 * 24 * 60 * 60 * 1000
          ); // +1 year as "session end"
          expiresAt = sessionEndDate;
          daysUntilExpiry = 365; // 1 year as "session duration"
          isExpired = false; // Assume valid session cookie
        }

        return {
          name: cookie.name,
          expires: cookie.expires || 0,
          expiresAt,
          domain: cookie.domain || "",
          path: cookie.path || "/",
          httpOnly: cookie.httpOnly || false,
          secure: cookie.secure || false,
          session: cookie.session || false,
          daysUntilExpiry,
          isExpired,
        };
      });

      const validCookies = cookieDetails.filter((c) => !c.isExpired);
      const isValid = validCookies.length > 0;

      const nextExpiry =
        validCookies.length > 0
          ? new Date(
              Math.min(...validCookies.map((c) => c.expiresAt.getTime()))
            )
          : undefined;

      // Calculate validity duration
      let validityDuration = "Unknown";
      if (nextExpiry) {
        const days = Math.ceil(
          (nextExpiry.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const hours = Math.ceil(
          (nextExpiry.getTime() - nowDate.getTime()) / (1000 * 60 * 60)
        );

        if (days > 0) {
          validityDuration = `${days} days`;
        } else if (hours > 0) {
          validityDuration = `${hours} hours`;
        } else {
          validityDuration = "Less than 1 hour";
        }
      }

      return {
        isValid,
        email,
        cookieCount: cookies.length,
        lastValidated: getGermanDate(new Date()),
        ...(nextExpiry && { nextExpiry: getGermanDate(nextExpiry) }),
        validityDuration,
        cookieDetails: cookieDetails.map((cookie) => ({
          ...cookie,
          expiresAt: getGermanDate(cookie.expiresAt),
        })),
        ...(isValid ? {} : { error: "All cookies expired" }),
      };
    } catch (error) {
      return {
        isValid: false,
        email: "unknown",
        cookieCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Test if cookies actually work (real login test)
  async testCookieLogin(cookiePath: string): Promise<CookieValidationResult> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      const email = this.extractEmailFromFilename(cookiePath);
      const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));

      if (!Array.isArray(cookies) || cookies.length === 0) {
        return {
          isValid: false,
          email,
          cookieCount: 0,
          error: "No cookies found",
        };
      }

      // Setup Chrome
      const chromeService = new ChromeService();
      const chromeResult = await chromeService.setupChrome({
        saveToEnv: false,
      });

      if (!chromeResult.success || !chromeResult.webSocketUrl) {
        return {
          isValid: false,
          email,
          cookieCount: cookies.length,
          error: "Failed to setup Chrome",
        };
      }

      // Connect to Chrome
      browser = await puppeteer.connect({
        browserWSEndpoint: chromeResult.webSocketUrl,
        defaultViewport: null,
      });

      // Create page and load cookies
      page = await browser.newPage();
      await page.setCookie(...cookies);

      // Go to Kleinanzeigen and check if logged in
      await page.goto("https://www.kleinanzeigen.de/", {
        waitUntil: "networkidle2",
        timeout: COOKIE_CONFIG.TIMEOUTS.PAGE_LOAD,
      });

      // Wait a bit for page to fully load
      await new Promise((resolve) =>
        setTimeout(resolve, COOKIE_CONFIG.TIMEOUTS.WAIT_FOR_LOAD)
      );

      // Check login status using #user-email element as primary indicator
      const loggedIn = await page.evaluate(
        (config) => {
          const bodyText = document.body.innerText || "";

          // Primary: Check for #user-email element (most reliable)
          const userEmailElement = document.querySelector("#user-email");
          const hasUserEmail =
            userEmailElement &&
            userEmailElement.textContent &&
            userEmailElement.textContent.includes("angemeldet als:");

          // Fallback: Check text content indicators
          const hasTextMarkers = config.indicators.some((m) =>
            bodyText.includes(m)
          );

          // Check for logout button
          const logoutButton = document.querySelector(config.selectors.logout);

          // Check for user-specific elements
          const userElements = document.querySelectorAll(
            config.selectors.userElements
          );

          // Check for account-related links
          const accountLinks = document.querySelectorAll(
            config.selectors.accountLinks
          );

          // Check if login button is visible (indicates NOT logged in)
          const loginButton = document.querySelector(
            'a[href*="m-einloggen.html"], a[href*="login"], .button[href*="einloggen"]'
          );
          const isLoginButtonVisible =
            loginButton && (loginButton as HTMLElement).offsetParent !== null;

          // User is logged in if:
          // 1. Has #user-email element (primary) OR
          // 2. Has login indicators AND login button is NOT visible
          return (
            hasUserEmail ||
            ((hasTextMarkers ||
              logoutButton ||
              userElements.length > 0 ||
              accountLinks.length > 0) &&
              !isLoginButtonVisible)
          );
        },
        {
          indicators: COOKIE_CONFIG.LOGIN_INDICATORS,
          selectors: {
            logout: COOKIE_CONFIG.SELECTORS.LOGOUT_BUTTON,
            userElements: COOKIE_CONFIG.SELECTORS.USER_ELEMENTS,
            accountLinks: COOKIE_CONFIG.SELECTORS.ACCOUNT_LINKS,
          },
        }
      );

      if (loggedIn) {
        console.log(`Cookie validation successful for ${email}`);
        return {
          isValid: true,
          email,
          cookieCount: cookies.length,
          lastValidated: getGermanDate(new Date()),
        };
      } else {
        console.log(`Cookie validation failed for ${email}`);
        return {
          isValid: false,
          email,
          cookieCount: cookies.length,
          error: "Login test failed - cookies may be invalid",
        };
      }
    } catch (error) {
      return {
        isValid: false,
        email: "unknown",
        cookieCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      if (page) await page.close();
      // Keep browser open
    }
  }

  // Validate all cookies
  async validateAllCookies(): Promise<CookieValidationResult[]> {
    const cookieFiles = await this.getAllCookieFiles();
    const results: CookieValidationResult[] = [];

    for (const cookieFile of cookieFiles) {
      const result = await this.checkCookieExpiry(cookieFile);
      results.push(result);
    }

    return results;
  }

  // Clean up expired cookies
  async cleanupExpiredCookies(): Promise<{ deleted: number; kept: number }> {
    const cookieFiles = await this.getAllCookieFiles();
    let deleted = 0;
    let kept = 0;

    for (const cookieFile of cookieFiles) {
      const result = await this.checkCookieExpiry(cookieFile);

      if (!result.isValid) {
        try {
          fs.unlinkSync(cookieFile);
          console.log(`Deleted expired cookies for ${result.email}`);
          deleted++;
        } catch (error) {
          console.log(`Failed to delete cookies for ${result.email}:`, error);
        }
      } else {
        kept++;
      }
    }

    return { deleted, kept };
  }

  // Get cookie statistics
  async getCookieStats(): Promise<{
    totalFiles: number;
    validFiles: number;
    expiredFiles: number;
    totalCookieCount: number;
    nextExpiry?: Date;
    validityDuration?: string;
  }> {
    const results = await this.validateAllCookies();

    const validFiles = results.filter((r) => r.isValid).length;
    const expiredFiles = results.filter((r) => !r.isValid).length;
    const totalCookieCount = results.reduce((sum, r) => sum + r.cookieCount, 0);

    // Find earliest expiry across all users
    const allValidResults = results.filter((r) => r.isValid);
    const nextExpiry =
      allValidResults.length > 0
        ? new Date(
            Math.min(
              ...allValidResults.map(
                (r) => r.nextExpiry?.getTime() || Date.now()
              )
            )
          )
        : undefined;

    // Calculate overall validity duration
    let validityDuration = "Unknown";
    if (nextExpiry) {
      const now = new Date();
      const days = Math.ceil(
        (nextExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const hours = Math.ceil(
        (nextExpiry.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      if (days > 0) {
        validityDuration = `${days} days`;
      } else if (hours > 0) {
        validityDuration = `${hours} hours`;
      } else {
        validityDuration = "Less than 1 hour";
      }
    }

    return {
      totalFiles: results.length,
      validFiles,
      expiredFiles,
      totalCookieCount,
      ...(nextExpiry && { nextExpiry }),
      ...(validityDuration && { validityDuration }),
    };
  }

  // Get cookies expiring soon (within specified days)
  async getCookiesExpiringSoon(daysThreshold: number = 7): Promise<
    {
      email: string;
      cookieName: string;
      expiresAt: Date;
      daysUntilExpiry: number;
    }[]
  > {
    const results = await this.validateAllCookies();
    const expiringSoon: {
      email: string;
      cookieName: string;
      expiresAt: Date;
      daysUntilExpiry: number;
    }[] = [];

    for (const result of results) {
      if (result.cookieDetails) {
        for (const cookie of result.cookieDetails) {
          if (!cookie.isExpired && cookie.daysUntilExpiry <= daysThreshold) {
            expiringSoon.push({
              email: result.email,
              cookieName: cookie.name,
              expiresAt: cookie.expiresAt,
              daysUntilExpiry: cookie.daysUntilExpiry,
            });
          }
        }
      }
    }

    // Sort by expiry date (earliest first)
    return expiringSoon.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }
}
