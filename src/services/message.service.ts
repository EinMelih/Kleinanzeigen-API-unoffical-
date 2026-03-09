/**
 * Message Service - Handles sending messages to sellers on Kleinanzeigen
 * Used by n8n for automated negotiations
 */
import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import {
    SendMessageRequest,
    SendMessageResponse,
    ConversationInfo,
} from "../types/message.types";
import { PlatformGuardService } from "./platform-guard.service";

export class MessageService {
    private browser: Browser | null = null;
    private readonly debugPort: number;
    private readonly cookieDir: string;
    private readonly platformGuard: PlatformGuardService;

    constructor(debugPort: number = 9222) {
        this.debugPort = debugPort;
        this.cookieDir = path.join(process.cwd(), "data", "cookies");
        this.platformGuard = new PlatformGuardService();
    }

    private wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async connectToBrowser(): Promise<Browser> {
        try {
            const response = await fetch(
                `http://localhost:${this.debugPort}/json/version`
            );
            const data = await response.json();

            if (data.webSocketDebuggerUrl) {
                console.log("🔗 Connecting to existing Chrome instance...");
                return await puppeteer.connect({
                    browserWSEndpoint: data.webSocketDebuggerUrl,
                });
            }

            throw new Error("No WebSocket URL found");
        } catch (error) {
            console.log("⚠️ Could not connect to existing Chrome, launching new...");
            return await puppeteer.launch({
                headless: false,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ],
            });
        }
    }

    private async loadCookies(email: string): Promise<boolean> {
        const slug = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const cookieFile = path.join(this.cookieDir, `cookies-${slug}.json`);

        if (!fs.existsSync(cookieFile)) {
            console.error(`❌ No cookies found for ${email}`);
            return false;
        }

        return true;
    }

    private getCookiePath(email: string): string {
        const slug = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        return path.join(this.cookieDir, `cookies-${slug}.json`);
    }

    /**
     * Send a message to a seller for a specific article
     */
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        const { email, articleId, message } = request;

        console.log(`📤 Sending message for article ${articleId}`);
        const guardStatus = this.platformGuard.isBlocked();

        if (guardStatus.blocked) {
            return {
                success: false,
                status: "failed",
                message: this.platformGuard.getBlockMessage(guardStatus.state),
                articleId,
                timestamp: new Date().toISOString(),
                error: "PLATFORM_BLOCKED",
            };
        }

        // Check if cookies exist
        if (!(await this.loadCookies(email))) {
            return {
                success: false,
                status: "failed",
                message: "No valid cookies found. Please login first.",
                articleId,
                timestamp: new Date().toISOString(),
                error: "NOT_LOGGED_IN",
            };
        }

        let page: Page | null = null;

        try {
            this.browser = await this.connectToBrowser();
            page = await this.browser.newPage();

            // Set viewport and user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Load cookies
            const cookiePath = this.getCookiePath(email);
            const cookiesData = fs.readFileSync(cookiePath, "utf8");
            const cookies = JSON.parse(cookiesData);
            await page.setCookie(...cookies);

            // Navigate to article page
            const articleUrl = `https://www.kleinanzeigen.de/s-anzeige/${articleId}`;
            console.log(`🌐 Navigating to article: ${articleUrl}`);

            await page.goto(articleUrl, {
                waitUntil: "networkidle2",
                timeout: 30000,
            });

            const blockState = await this.platformGuard.inspectKleinanzeigenPage(
                page,
                "message:article"
            );
            if (blockState) {
                await page.close();
                return {
                    success: false,
                    status: "failed",
                    message: this.platformGuard.getBlockMessage(blockState),
                    articleId,
                    timestamp: new Date().toISOString(),
                    error: "PLATFORM_BLOCKED",
                };
            }

            // Handle cookie consent
            await this.handleCookieConsent(page);

            // Wait for page to load
            await this.wait(2000);

            // Check if we're logged in
            const isLoggedIn = await this.checkLoginStatus(page);
            if (!isLoggedIn) {
                await page.close();
                return {
                    success: false,
                    status: "failed",
                    message: "Not logged in. Please refresh cookies.",
                    articleId,
                    timestamp: new Date().toISOString(),
                    error: "SESSION_EXPIRED",
                };
            }

            // Find and click the "Nachricht schreiben" button
            const messageButtonClicked = await this.clickMessageButton(page);
            if (!messageButtonClicked) {
                await page.close();
                return {
                    success: false,
                    status: "failed",
                    message: "Could not find message button on article page.",
                    articleId,
                    timestamp: new Date().toISOString(),
                    error: "NO_MESSAGE_BUTTON",
                };
            }

            // Wait for message form to appear
            await this.wait(2000);

            // Type the message
            const messageSent = await this.typeAndSendMessage(page, message);

            if (messageSent) {
                const currentUrl = page.url();
                await page.close();

                return {
                    success: true,
                    status: "sent",
                    message: "Message sent successfully",
                    articleId,
                    conversationUrl: currentUrl,
                    timestamp: new Date().toISOString(),
                };
            } else {
                await page.close();
                return {
                    success: false,
                    status: "failed",
                    message: "Failed to send message",
                    articleId,
                    timestamp: new Date().toISOString(),
                    error: "SEND_FAILED",
                };
            }
        } catch (error) {
            console.error("❌ Error sending message:", error);

            if (page) {
                await page.close().catch(() => { });
            }

            return {
                success: false,
                status: "failed",
                message: "Error sending message",
                articleId,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    private async handleCookieConsent(page: Page): Promise<void> {
        try {
            const acceptButton = await page.$(
                '#gdpr-banner-accept, [data-testid="gdpr-banner-accept"], button[id*="accept"]'
            );
            if (acceptButton) {
                console.log("🍪 Accepting cookies...");
                await acceptButton.click();
                await this.wait(1000);
            }
        } catch {
            // Cookie banner may not exist
        }
    }

    private async checkLoginStatus(page: Page): Promise<boolean> {
        try {
            const userEmail = await page.$("#user-email");
            return userEmail !== null;
        } catch {
            return false;
        }
    }

    private async clickMessageButton(page: Page): Promise<boolean> {
        try {
            // Multiple selectors for the message button
            const selectors = [
                'a[href*="nachricht-schreiben"]',
                'button[data-testid="message-button"]',
                '[class*="contactbox"] a',
                'a[class*="messagebutton"]',
                'a:has-text("Nachricht schreiben")',
                '#viewad-contact a',
            ];

            for (const selector of selectors) {
                try {
                    const button = await page.$(selector);
                    if (button) {
                        console.log(`📨 Found message button with selector: ${selector}`);
                        await button.click();
                        return true;
                    }
                } catch {
                    continue;
                }
            }

            // Try via evaluate as fallback
            const clicked = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll("a"));
                for (const link of links) {
                    if (
                        link.textContent?.includes("Nachricht") ||
                        link.href?.includes("nachricht")
                    ) {
                        link.click();
                        return true;
                    }
                }
                return false;
            });

            return clicked;
        } catch (error) {
            console.error("Error clicking message button:", error);
            return false;
        }
    }

    private async typeAndSendMessage(
        page: Page,
        message: string
    ): Promise<boolean> {
        try {
            // Wait for message textarea to appear
            await page.waitForSelector(
                'textarea[name="message"], textarea[id*="message"], #message-text-field, textarea',
                { timeout: 10000 }
            );

            // Find the textarea
            const textarea = await page.$(
                'textarea[name="message"], textarea[id*="message"], #message-text-field'
            );

            if (!textarea) {
                console.error("❌ Could not find message textarea");
                return false;
            }

            // Clear and type message
            await textarea.click({ clickCount: 3 });
            await textarea.type(message, { delay: 50 });

            console.log(`✍️ Typed message: "${message.substring(0, 50)}..."`);

            // Wait a bit before sending
            await this.wait(1000);

            // Find and click send button
            const sendSelectors = [
                'button[type="submit"]',
                'button[data-testid="send-button"]',
                'button:has-text("Senden")',
                'button:has-text("Nachricht senden")',
                'input[type="submit"]',
                '[class*="submit"] button',
            ];

            for (const selector of sendSelectors) {
                try {
                    const sendButton = await page.$(selector);
                    if (sendButton) {
                        console.log(`📤 Found send button with selector: ${selector}`);
                        await sendButton.click();
                        await this.wait(3000);
                        return true;
                    }
                } catch {
                    continue;
                }
            }

            // Fallback: try to find any submit button
            const sent = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll("button"));
                for (const btn of buttons) {
                    if (
                        btn.textContent?.includes("Senden") ||
                        btn.textContent?.includes("Absenden")
                    ) {
                        btn.click();
                        return true;
                    }
                }
                // Try form submit
                const form = document.querySelector("form");
                if (form) {
                    form.submit();
                    return true;
                }
                return false;
            });

            if (sent) {
                await this.wait(3000);
            }

            return sent;
        } catch (error) {
            console.error("Error typing/sending message:", error);
            return false;
        }
    }

    /**
     * Get list of active conversations
     */
    async getConversations(email: string): Promise<ConversationInfo[]> {
        // Implementation for listing conversations
        // This would navigate to the messages page and scrape conversation list
        console.log(`📋 Getting conversations for ${email}`);
        return [];
    }

    async disconnect(): Promise<void> {
        if (this.browser) {
            try {
                await this.browser.disconnect();
                this.browser = null;
            } catch (error) {
                console.error("Error disconnecting browser:", error);
            }
        }
    }
}

// Singleton instance
export const messageService = new MessageService();
