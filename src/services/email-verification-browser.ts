import puppeteer, { Browser, Page } from "puppeteer";
import { ChromeService } from "./chromeService";

/**
 * Result of browser-based email verification
 */
export interface BrowserEmailVerificationResult {
    success: boolean;
    message: string;
    verificationLink?: string;
    error?: string;
}

/**
 * Browser-based Email Verification Service
 * Uses Puppeteer to login to Outlook Web and click the verification link
 * 
 * This works around Microsoft's IMAP OAuth2 requirement
 */
export class BrowserEmailVerificationService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    /**
     * Random delay for human-like behavior
     */
    private async randomDelay(min: number = 500, max: number = 1500): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Human-like typing
     */
    private async humanType(page: Page, selector: string, text: string): Promise<void> {
        await page.focus(selector);
        for (const char of text) {
            await page.keyboard.type(char);
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
    }

    /**
     * Connect to Chrome and open Outlook
     */
    async connect(): Promise<boolean> {
        try {
            const chromeService = new ChromeService();
            const chromeResult = await chromeService.setupChrome({ saveToEnv: true });

            if (!chromeResult.success || !chromeResult.webSocketUrl) {
                console.error("❌ Failed to setup Chrome");
                return false;
            }

            this.browser = await puppeteer.connect({
                browserWSEndpoint: chromeResult.webSocketUrl,
                defaultViewport: null,
            });

            this.page = await this.browser.newPage();
            console.log("✅ Connected to Chrome");
            return true;
        } catch (error) {
            console.error("❌ Chrome connection failed:", error);
            return false;
        }
    }

    /**
     * Login to Outlook Web
     */
    async loginToOutlook(email: string, password: string): Promise<boolean> {
        if (!this.page) return false;

        try {
            console.log("📧 Opening Outlook Web...");
            await this.page.goto("https://outlook.live.com/mail/0/inbox", {
                waitUntil: "networkidle2",
                timeout: 60000,
            });

            await this.randomDelay(1000, 2000);

            // Check if already logged in
            const isLoggedIn = await this.page.evaluate(() => {
                return document.body.innerText.includes("Posteingang") ||
                    document.body.innerText.includes("Inbox") ||
                    document.querySelector('[aria-label="Mail"]') !== null;
            });

            if (isLoggedIn) {
                console.log("✅ Already logged in to Outlook");
                return true;
            }

            // Enter email
            console.log("📝 Entering email...");
            await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await this.humanType(this.page, 'input[type="email"]', email);
            await this.randomDelay();

            // Click Next
            await this.page.click('input[type="submit"], button[type="submit"]');
            await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => { });
            await this.randomDelay(1000, 2000);

            // Enter password
            console.log("🔑 Entering password...");
            await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });
            await this.humanType(this.page, 'input[type="password"]', password);
            await this.randomDelay();

            // Click Sign in
            await this.page.click('input[type="submit"], button[type="submit"]');
            await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => { });
            await this.randomDelay(2000, 3000);

            // Handle "Stay signed in?" prompt
            try {
                const staySignedIn = await this.page.$('input[type="submit"][value*="Yes"], button:has-text("Yes"), #idBtn_Back');
                if (staySignedIn) {
                    await staySignedIn.click();
                    await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => { });
                }
            } catch { }

            // Verify login success
            await this.randomDelay(2000, 3000);
            const loginSuccess = await this.page.evaluate(() => {
                return document.body.innerText.includes("Posteingang") ||
                    document.body.innerText.includes("Inbox") ||
                    window.location.href.includes("outlook.live.com/mail");
            });

            if (loginSuccess) {
                console.log("✅ Logged in to Outlook");
                return true;
            } else {
                console.log("❌ Outlook login failed");
                return false;
            }
        } catch (error) {
            console.error("❌ Outlook login error:", error);
            return false;
        }
    }

    /**
     * Find and click Kleinanzeigen verification email
     */
    async findAndClickVerificationEmail(timeout: number = 60000): Promise<BrowserEmailVerificationResult> {
        if (!this.page) {
            return { success: false, message: "No page available", error: "NO_PAGE" };
        }

        const startTime = Date.now();
        console.log(`⏳ Searching for Kleinanzeigen verification email (max ${timeout / 1000}s)...`);

        while (Date.now() - startTime < timeout) {
            try {
                // Refresh inbox
                await this.page.goto("https://outlook.live.com/mail/0/inbox", {
                    waitUntil: "networkidle2",
                    timeout: 30000,
                });
                await this.randomDelay(2000, 3000);

                // Look for Kleinanzeigen email
                const emailFound = await this.page.evaluate(() => {
                    const emails = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], .XG5Jd, [data-convid]'));
                    for (const email of emails) {
                        const text = email.textContent?.toLowerCase() || "";
                        if (text.includes("kleinanzeigen") ||
                            text.includes("anmeldung") ||
                            text.includes("bestätigen") ||
                            text.includes("login")) {
                            return true;
                        }
                    }
                    return false;
                });

                if (emailFound) {
                    console.log("📬 Found Kleinanzeigen email!");

                    // Click on the email
                    await this.page.evaluate(() => {
                        const emails = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], .XG5Jd, [data-convid]'));
                        for (const email of emails) {
                            const text = email.textContent?.toLowerCase() || "";
                            if (text.includes("kleinanzeigen") ||
                                text.includes("anmeldung") ||
                                text.includes("bestätigen")) {
                                (email as HTMLElement).click();
                                return;
                            }
                        }
                    });

                    await this.randomDelay(2000, 3000);

                    // Find and click verification link in email body
                    const linkClicked = await this.page.evaluate(() => {
                        const links = Array.from(document.querySelectorAll('a[href*="kleinanzeigen"], a[href*="confirm"], a[href*="verify"]'));
                        for (const link of links) {
                            const href = link.getAttribute("href") || "";
                            if (href.includes("kleinanzeigen.de")) {
                                (link as HTMLElement).click();
                                return href;
                            }
                        }

                        // Alternative: Look for any verification button/link
                        const allLinks = Array.from(document.querySelectorAll('a'));
                        for (const link of allLinks) {
                            const text = link.textContent?.toLowerCase() || "";
                            const href = link.getAttribute("href") || "";
                            if ((text.includes("bestätigen") || text.includes("confirm") || text.includes("verify")) &&
                                href.includes("kleinanzeigen")) {
                                (link as HTMLElement).click();
                                return href;
                            }
                        }

                        return null;
                    });

                    if (linkClicked) {
                        console.log("✅ Clicked verification link!");
                        await this.randomDelay(3000, 5000);

                        return {
                            success: true,
                            message: "Email verification completed successfully",
                            verificationLink: linkClicked,
                        };
                    } else {
                        // Try to find link in email source and open it manually
                        const emailLinks = await this.page.evaluate(() => {
                            const body = document.body.innerHTML;
                            const matches = body.match(/https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*/gi);
                            return matches || [];
                        });

                        if (emailLinks.length > 0) {
                            const verificationLink = emailLinks.find(link =>
                                link.includes("confirm") || link.includes("verify") || link.length > 80
                            ) || emailLinks[0];

                            if (verificationLink) {
                                console.log("🔗 Opening verification link directly...");
                                await this.page.goto(verificationLink, { waitUntil: "networkidle2", timeout: 30000 });
                                await this.randomDelay(2000, 3000);

                                return {
                                    success: true,
                                    message: "Email verification completed successfully",
                                    verificationLink,
                                };
                            }
                        }

                        return {
                            success: false,
                            message: "Found email but could not find verification link",
                            error: "LINK_NOT_FOUND",
                        };
                    }
                }

                console.log(`⏳ No email yet... (${Math.round((Date.now() - startTime) / 1000)}s)`);
                await this.randomDelay(5000, 8000);

            } catch (error) {
                console.error("Error during email search:", error);
                await this.randomDelay(3000, 5000);
            }
        }

        return {
            success: false,
            message: `Timeout: No verification email found within ${timeout / 1000} seconds`,
            error: "TIMEOUT",
        };
    }

    /**
     * Full verification flow
     */
    async verifyLogin(
        email: string,
        password: string,
        timeout: number = 60000
    ): Promise<BrowserEmailVerificationResult> {
        try {
            // Connect to Chrome
            const connected = await this.connect();
            if (!connected) {
                return {
                    success: false,
                    message: "Failed to connect to Chrome",
                    error: "CHROME_CONNECTION_FAILED",
                };
            }

            // Login to Outlook
            const loggedIn = await this.loginToOutlook(email, password);
            if (!loggedIn) {
                return {
                    success: false,
                    message: "Failed to login to Outlook",
                    error: "OUTLOOK_LOGIN_FAILED",
                };
            }

            // Find and click verification email
            const result = await this.findAndClickVerificationEmail(timeout);
            return result;

        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
                error: "UNKNOWN_ERROR",
            };
        } finally {
            // Close the page but keep browser open
            if (this.page) {
                try {
                    await this.page.close();
                } catch { }
            }
        }
    }
}

/**
 * Helper function for browser-based email verification
 */
export async function verifyEmailViaBrowser(
    email: string,
    password: string,
    timeout: number = 60000
): Promise<BrowserEmailVerificationResult> {
    const service = new BrowserEmailVerificationService();
    return service.verifyLogin(email, password, timeout);
}
