import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import { LoginCredentials, LoginResult } from "../../shared/types";
import { emailToSlug, randomDelay } from "../../shared/utils";
import { ChromeService } from "../services/chromeService";

// Login configuration
const LOGIN_CONFIG = {
  URL: "https://www.kleinanzeigen.de/m-einloggen.html",
  SELECTORS: {
    EMAIL: 'input[name="loginMail"]',
    PASSWORD: 'input[name="password"]',
    SUBMIT: "#login-submit",
    GDPR_ACCEPT: "#gdpr-banner-accept",
  },
  TIMEOUTS: {
    SELECTOR_WAIT: 5000,
    NAVIGATION: 30000,
    PAGE_LOAD: 2000,
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
} as const;

// Helper function for human-like mouse movement
async function humanMouseMove(page: Page, selector: string): Promise<void> {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(
        box.x + box.width / 2 + (Math.random() - 0.5) * 10,
        box.y + box.height / 2 + (Math.random() - 0.5) * 10
      );
    }
  }
}

// Helper function for human-like typing
async function humanType(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await page.focus(selector);
  for (const char of text) {
    await page.keyboard.type(char);
    await randomDelay();
  }
}

// Test login with cookies only (no password needed)
async function testLoginWithCookiesOnly(
  _email: string,
  cookiePath: string
): Promise<LoginResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Setup Chrome
    const chromeService = new ChromeService();
    const chromeResult = await chromeService.setupChrome({ saveToEnv: true });

    if (!chromeResult.success || !chromeResult.webSocketUrl) {
      return {
        ok: false,
        loggedIn: false,
        didSubmit: false,
        error: "Failed to setup Chrome with remote debugging",
      };
    }

    // Connect to Chrome
    browser = await puppeteer.connect({
      browserWSEndpoint: chromeResult.webSocketUrl,
      defaultViewport: null,
    });

    // Create page and load cookies
    page = await browser.newPage();
    const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
    await page.setCookie(...cookies);

    // Go to Kleinanzeigen and check if logged in
    await page.goto("https://www.kleinanzeigen.de/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Check login status using #user-email element as primary indicator
    const loggedIn = await page.evaluate(() => {
      const bodyText = document.body.innerText || "";

      // Primary: Check for #user-email element (most reliable)
      const userEmailElement = document.querySelector("#user-email");
      const hasUserEmail =
        userEmailElement &&
        userEmailElement.textContent &&
        userEmailElement.textContent.includes("angemeldet als:");

      // Fallback: Check text content indicators
      const markers = [
        "Mein Konto",
        "Meine Anzeigen",
        "Abmelden",
        "Nachrichten",
      ];
      const hasTextMarkers = markers.some((m) => bodyText.includes(m));

      // Check if login button is visible (indicates NOT logged in)
      const loginButton = document.querySelector(
        'a[href*="m-einloggen.html"], a[href*="login"], .button[href*="einloggen"]'
      );
      const isLoginButtonVisible =
        loginButton && (loginButton as HTMLElement).offsetParent !== null;

      // User is logged in if:
      // 1. Has #user-email element (primary) OR
      // 2. Has text markers AND login button is NOT visible
      return hasUserEmail || (hasTextMarkers && !isLoginButtonVisible);
    });

    if (loggedIn) {
      console.log("✅ Login successful with cookies only!");
      return {
        ok: true,
        loggedIn: true,
        didSubmit: false,
        cookieFile: cookiePath,
        message: "Login successful with existing cookies - no password needed!",
      };
    } else {
      console.log("❌ Cookies expired or invalid");
      return {
        ok: false,
        loggedIn: false,
        didSubmit: false,
        error: "Cookies expired or invalid",
      };
    }
  } catch (error) {
    console.error("Cookie-only login error:", error);
    return {
      ok: false,
      loggedIn: false,
      didSubmit: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    if (page) await page.close();
    // Keep browser open
  }
}

export async function performLogin(
  credentials: LoginCredentials
): Promise<LoginResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const { email, password } = credentials;

    // Check if we have valid cookies first
    const cookieFileName = `cookies-${emailToSlug(email)}.json`;
    const cookiePath = path.join(
      process.cwd(),
      "data",
      "cookies",
      cookieFileName
    );

    if (fs.existsSync(cookiePath)) {
      console.log(
        `Found existing cookies for ${email}, checking expiry before testing...`
      );

      // Check cookie expiry before attempting login
      try {
        const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
        if (Array.isArray(cookies) && cookies.length > 0) {
          const now = Date.now() / 1000; // Current time in seconds
          const validCookies = cookies.filter(
            (cookie: any) => cookie.expires && cookie.expires > now
          );

          if (validCookies.length === 0) {
            console.log("All cookies expired, deleting old cookie file...");
            fs.unlinkSync(cookiePath);
          } else {
            console.log(
              `Found ${validCookies.length} valid cookies, testing login status...`
            );

            // Try to use existing cookies without password
            const result = await testLoginWithCookiesOnly(email, cookiePath);
            if (result.ok && result.loggedIn) {
              console.log(
                "Login successful with existing cookies - no password needed!"
              );
              return result;
            }
            console.log(
              "Cookies exist but login failed, proceeding with password login..."
            );
          }
        }
      } catch (error) {
        console.log("Error reading cookies, deleting corrupted file...");
        try {
          fs.unlinkSync(cookiePath);
        } catch {}
      }
    }

    // First setup Chrome with remote debugging
    const chromeService = new ChromeService();
    const chromeResult = await chromeService.setupChrome({ saveToEnv: true });

    if (!chromeResult.success || !chromeResult.webSocketUrl) {
      return {
        ok: false,
        loggedIn: false,
        didSubmit: false,
        error: "Failed to setup Chrome with remote debugging",
      };
    }

    // Connect to existing Chrome instance
    browser = await puppeteer.connect({
      browserWSEndpoint: chromeResult.webSocketUrl,
      defaultViewport: null,
    });

    // Create new page
    page = await browser.newPage();

    // Set user agent
    const userAgents: string[] = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ];
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    const userAgent = userAgents[randomIndex];
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    // Load cookies if they exist (using existing variables)

    if (fs.existsSync(cookiePath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
      if (Array.isArray(cookies) && cookies.length) {
        await page.setCookie(...cookies);
        console.log("Cookies loaded - login might be skipped.");
      }
    }

    // Go to login page
    await page.goto(LOGIN_CONFIG.URL, {
      waitUntil: "networkidle2",
      timeout: 90000,
    });
    await randomDelay();
    await page.evaluate(() => window.scrollBy(0, Math.random() * 100 + 50));

    // GDPR banner (best-effort)
    try {
      await page.waitForSelector(LOGIN_CONFIG.SELECTORS.GDPR_ACCEPT, {
        timeout: LOGIN_CONFIG.TIMEOUTS.SELECTOR_WAIT,
      });
      await humanMouseMove(page, LOGIN_CONFIG.SELECTORS.GDPR_ACCEPT);
      await page.click(LOGIN_CONFIG.SELECTORS.GDPR_ACCEPT);
      await randomDelay();
    } catch {
      /* ignore */
    }

    // If login form present, perform login
    let didSubmit = false;
    try {
      await page.waitForSelector('input[name="loginMail"]', { timeout: 5000 }); // Reduced from 10000ms
      await humanMouseMove(page, 'input[name="loginMail"]');
      await humanType(page, 'input[name="loginMail"]', email);
      await randomDelay();
      await humanMouseMove(page, 'input[name="password"]');
      await humanType(page, 'input[name="password"]', password);
      await randomDelay();
      await humanMouseMove(page, "#login-submit");
      await page.click("#login-submit");
      didSubmit = true;
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000, // Reduced from 60000ms
      });
    } catch (e) {
      // Form not found - might already be logged in
      console.log("Login form not found - might already be logged in");
    }

    // Check login status using #user-email element as primary indicator
    let loggedIn = false;
    try {
      loggedIn = await page.evaluate((indicators) => {
        const bodyText = document.body.innerText || "";

        // Primary: Check for #user-email element (most reliable)
        const userEmailElement = document.querySelector("#user-email");
        const hasUserEmail =
          userEmailElement &&
          userEmailElement.textContent &&
          userEmailElement.textContent.includes("angemeldet als:");

        // Check for login indicators
        const hasLoginIndicators = indicators.some((m: string) =>
          bodyText.includes(m)
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
        return hasUserEmail || (hasLoginIndicators && !isLoginButtonVisible);
      }, LOGIN_CONFIG.LOGIN_INDICATORS);
    } catch {}

    // Save cookies
    const cookies = await page.cookies();
    const cookiesDir = path.dirname(cookiePath);
    if (!fs.existsSync(cookiesDir)) {
      fs.mkdirSync(cookiesDir, { recursive: true });
    }
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));

    return {
      ok: loggedIn || didSubmit, // best-effort
      loggedIn,
      didSubmit,
      cookieFile: cookiePath,
      message: loggedIn ? "Login successful" : "Login attempted",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      ok: false,
      loggedIn: false,
      didSubmit: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    // Keep browser open - don't close anything
    console.log("Login process completed - browser remains open");
  }
}
