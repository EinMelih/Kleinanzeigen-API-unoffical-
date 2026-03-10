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
import { AppStateService } from "./app-state.service";
import { ManualModeService } from "./manual-mode.service";
import { PlatformGuardService } from "./platform-guard.service";
import { SessionProfileService } from "./session-profile.service";
import { sendTelegramNotification } from "./telegram.service";

export class MessageService {
    private browser: Browser | null = null;
    private readonly debugPort: number;
    private readonly cookieDir: string;
    private readonly platformGuard: PlatformGuardService;
    private readonly sessionProfiles: SessionProfileService;
    private readonly manualMode: ManualModeService;
    private readonly appState: AppStateService;

    constructor(debugPort: number = 9222) {
        this.debugPort = debugPort;
        this.cookieDir = path.join(process.cwd(), "data", "cookies");
        this.platformGuard = new PlatformGuardService();
        this.sessionProfiles = new SessionProfileService();
        this.manualMode = new ManualModeService();
        this.appState = new AppStateService();
    }

    private wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async connectToBrowser(email?: string): Promise<Browser> {
        if (email) {
            const profileStatus = await this.sessionProfiles.getStatus(email);
            if (profileStatus.profileExists) {
                const profileBrowser = await this.sessionProfiles.ensureProfileBrowser(email);
                return await puppeteer.connect({
                    browserWSEndpoint: profileBrowser.webSocketUrl,
                    defaultViewport: null,
                });
            }
        }

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
        if (this.manualMode.isEnabled()) {
            return {
                success: false,
                status: "failed",
                message: this.manualMode.getBlockedMessage(
                    "Automated seller messaging",
                    "Messaging stays disabled until you leave manual-only mode."
                ),
                articleId,
                timestamp: new Date().toISOString(),
                error: "MANUAL_MODE_ONLY",
            };
        }

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
        const profileStatus = await this.sessionProfiles.getStatus(email);
        if (profileStatus.profileExists) {
            await this.sessionProfiles.verifySession(email, {
                startIfNeeded: true,
                saveCookies: true,
                source: "message:session-check",
            });
        }

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
            this.browser = await this.connectToBrowser(email);
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

            await this.navigateWithFallback(page, articleUrl);

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
            const messageSent = await this.typeAndSendMessage(page, email, message);

            if (messageSent) {
                const currentUrl = page.url();
                const context = await this.extractConversationContext(page, articleId);
                this.appState.recordMessageSend({
                    articleId,
                    articleTitle: context.articleTitle,
                    sellerName: context.sellerName,
                    sellerId: request.receiverId || context.sellerId,
                    message,
                    conversationUrl: currentUrl,
                    url: context.articleUrl || articleUrl,
                });

                const telegramResult = await sendTelegramNotification(
                    [
                        "Neue Kleinanzeigen-Nachricht gesendet",
                        `Artikel: ${context.articleTitle || articleId}`,
                        `Anbieter: ${context.sellerName || "unbekannt"}`,
                        `Zeit: ${new Date().toLocaleString("de-DE", {
                            timeZone: "Europe/Berlin",
                        })}`,
                    ].join("\n")
                );
                if (telegramResult.success || telegramResult.error) {
                    this.appState.recordTelegramEvent(telegramResult);
                }

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
                this.appState.recordTelegramEvent({
                    success: false,
                    message: "Nachricht konnte nicht gesendet werden",
                    error: "SEND_FAILED",
                });
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
        await this.wait(1500);
    }

    private async checkLoginStatus(page: Page): Promise<boolean> {
        try {
            const loggedIn = await page.evaluate(() => {
                if (document.querySelector("#user-email")) {
                    return true;
                }

                const bodyText = document.body.innerText || "";
                return bodyText.includes("angemeldet als:");
            });
            return loggedIn;
        } catch {
            return false;
        }
    }

    private async hasVisibleMessageComposer(page: Page): Promise<boolean> {
        try {
            return await page.evaluate(() => {
                const candidates = Array.from(
                    document.querySelectorAll(
                        "#message-textarea-input, #viewad-contact-message, textarea[name='message']"
                    )
                );

                return candidates.some((candidate) => {
                    const element = candidate as HTMLElement;
                    return element.offsetParent !== null;
                });
            });
        } catch {
            return false;
        }
    }

    private deriveContactName(email: string, message: string): string {
        const lines = message
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        const lastLine = lines[lines.length - 1];

        if (
            lastLine &&
            /^[\p{L} .'-]{2,40}$/u.test(lastLine) &&
            !/^(viele gr[uü]ße|danke)/iu.test(lastLine)
        ) {
            return lastLine;
        }

        const localPart = email.split("@")[0] || "Interessent";
        const cleaned = localPart
            .replace(/[0-9]+/g, " ")
            .replace(/[._-]+/g, " ")
            .trim()
            .split(/\s+/)[0];

        if (!cleaned) {
            return "Interessent";
        }

        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    private async fillVisibleContactName(
        page: Page,
        email: string,
        message: string
    ): Promise<void> {
        const selector = await page.evaluate(() => {
            const selectors = [
                "#contact-contactName-input",
                "input[name='contactName']",
                "input[id*='contactName']",
            ];

            for (const candidate of selectors) {
                const element = document.querySelector(candidate) as HTMLInputElement | null;
                if (element && element.offsetParent !== null) {
                    return candidate;
                }
            }

            return null;
        });

        if (!selector) {
            return;
        }

        const input = await page.$(selector);
        if (!input) {
            return;
        }

        const existingValue = await page.evaluate((element) => {
            return ((element as HTMLInputElement).value || "").trim();
        }, input);

        if (existingValue) {
            return;
        }

        const contactName = this.deriveContactName(email, message);
        await input.click({ clickCount: 3 });
        await input.type(contactName, { delay: 50 });
    }

    private async clickMessageButton(page: Page): Promise<boolean> {
        try {
            if (await this.hasVisibleMessageComposer(page)) {
                return true;
            }

            const clicked = await page.evaluate(() => {
                const candidates = Array.from(
                    document.querySelectorAll("button, a")
                ).filter((element) => {
                    const htmlElement = element as HTMLElement;
                    if (htmlElement.offsetParent === null) {
                        return false;
                    }

                    const text = (htmlElement.textContent || "")
                        .trim()
                        .toLowerCase();
                    const href = element.getAttribute("href") || "";
                    const insideContactSection = Boolean(
                        element.closest(
                            "form[action*='anbieter-kontaktieren'], #viewad-contact, .viewad-contact"
                        )
                    );

                    if (!insideContactSection) {
                        return false;
                    }

                    return (
                        text === "nachricht schreiben" ||
                        text === "nachricht senden" ||
                        href.includes("anbieter-kontaktieren")
                    );
                });

                const button = candidates[0] as HTMLElement | undefined;
                if (!button) {
                    return false;
                }

                button.click();
                return true;
            });

            if (clicked) {
                await this.wait(1500);
            }

            return clicked;
        } catch (error) {
            console.error("Error clicking message button:", error);
            return false;
        }
    }

    private async typeAndSendMessage(
        page: Page,
        email: string,
        message: string
    ): Promise<boolean> {
        try {
            await page.waitForFunction(() => {
                const candidates = Array.from(
                    document.querySelectorAll(
                        "#message-textarea-input, #viewad-contact-message, textarea[name='message']"
                    )
                );

                return candidates.some((candidate) => {
                    const element = candidate as HTMLElement;
                    return element.offsetParent !== null;
                });
            }, { timeout: 10000 });

            const textareaSelector = await page.evaluate(() => {
                const selectors = [
                    "#message-textarea-input",
                    "#viewad-contact-message",
                    "textarea[name='message']",
                ];

                for (const selector of selectors) {
                    const elements = Array.from(document.querySelectorAll(selector));
                    const visible = elements.find((element) => {
                        const htmlElement = element as HTMLElement;
                        return htmlElement.offsetParent !== null;
                    });

                    if (visible) {
                        if ((visible as HTMLElement).id) {
                            return `#${(visible as HTMLElement).id}`;
                        }

                        return selector;
                    }
                }

                return null;
            });

            if (!textareaSelector) {
                console.error("❌ Could not find message textarea");
                return false;
            }

            // Clear and type message
            const textarea = await page.$(textareaSelector);
            if (!textarea) {
                console.error("❌ Could not resolve visible message textarea");
                return false;
            }

            await textarea.click({ clickCount: 3 });
            await textarea.type(message, { delay: 50 });
            await this.fillVisibleContactName(page, email, message);

            console.log(`✍️ Typed message: "${message.substring(0, 50)}..."`);

            // Wait a bit before sending
            await this.wait(1000);

            const sent = await page.evaluate(() => {
                const forms = Array.from(
                    document.querySelectorAll("form[action*='anbieter-kontaktieren']")
                ).filter((form) => {
                    const textarea = form.querySelector(
                        "#message-textarea-input, #viewad-contact-message, textarea[name='message']"
                    ) as HTMLElement | null;
                    return Boolean(textarea && textarea.offsetParent !== null);
                });

                const form = forms[0] as HTMLFormElement | undefined;
                if (form) {
                    const submitElement = Array.from(
                        form.querySelectorAll("button, input[type='submit']")
                    ).find((element) => {
                        const htmlElement = element as HTMLElement;
                        const text =
                            (htmlElement.textContent || "") ||
                            (element as HTMLInputElement).value ||
                            "";
                        return (
                            htmlElement.offsetParent !== null &&
                            /^(senden|nachricht senden)$/i.test(text.trim())
                        );
                    }) as HTMLElement | undefined;

                    if (submitElement) {
                        submitElement.click();
                        return true;
                    }
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

    private async extractConversationContext(
        page: Page,
        articleId: string
    ): Promise<{
        articleTitle?: string | undefined;
        sellerName?: string | undefined;
        sellerId?: string | undefined;
        conversationUrl?: string | undefined;
        articleUrl?: string | undefined;
    }> {
        try {
            return await page.evaluate((targetArticleId) => {
                const title =
                    document.querySelector(".ConversationHeader a")
                        ?.textContent
                        ?.trim() ||
                    document.querySelector("#viewad-title")?.textContent?.trim() ||
                    undefined;
                const conversationUrl = window.location.href;
                const articleUrl =
                    (document.querySelector(".ConversationHeader a") as HTMLAnchorElement | null)
                        ?.href ||
                    document.querySelector("a[href*='/zur-anzeige/']")
                        ?.getAttribute("href") ||
                    `https://www.kleinanzeigen.de/s-anzeige/${targetArticleId}`;
                const aboutHeading = Array.from(document.querySelectorAll("div"))
                    .map((element) => element.textContent?.trim() || "")
                    .find((text) => text.startsWith("Über "));
                const sellerName =
                    aboutHeading
                        ?.replace(/^Über\s+/, "")
                        .replace(/Aktiv seit.*$/i, "")
                        .trim() ||
                    document
                        .querySelector(
                            "#viewad-contact .text-body-regular-strong, #viewad-contact .userprofile-vip a"
                        )
                        ?.textContent
                        ?.trim() ||
                    undefined;
                const sellerLink =
                    (document.querySelector(
                        "#viewad-contact a[href*='userId='], a[href*='userId=']"
                    ) as HTMLAnchorElement | null)?.href || "";
                const sellerIdMatch = sellerLink.match(/userId=(\d+)/);

                return {
                    articleTitle: title,
                    sellerName,
                    sellerId: sellerIdMatch && sellerIdMatch[1] ? sellerIdMatch[1] : undefined,
                    conversationUrl,
                    articleUrl,
                };
            }, articleId);
        } catch {
            return {
                articleUrl: `https://www.kleinanzeigen.de/s-anzeige/${articleId}`,
            };
        }
    }

    private async scrapeConversationSnapshots(
        page: Page
    ): Promise<ConversationInfo[]> {
        const itemCount = await page.$$eval(
            "#conversation-list article",
            (elements) => elements.length
        );

        if (itemCount === 0) {
            return [];
        }

        const conversations: ConversationInfo[] = [];

        for (let index = 0; index < itemCount; index += 1) {
            await page.evaluate((targetIndex) => {
                const items = Array.from(
                    document.querySelectorAll("#conversation-list article")
                ) as HTMLElement[];
                const item = items[targetIndex];
                if (item) {
                    item.scrollIntoView({ block: "center" });
                    item.click();
                }
            }, index);

            await this.wait(1200);

            const snapshot = await page.evaluate((targetIndex) => {
                const items = Array.from(
                    document.querySelectorAll("#conversation-list article")
                );
                const item = items[targetIndex] as HTMLElement | undefined;
                if (!item) {
                    return null;
                }

                const extractText = (selector: string, root: ParentNode = document): string => {
                    return (
                        (root.querySelector(selector)?.textContent || "")
                            .replace(/\s+/g, " ")
                            .trim()
                    );
                };

                const articleTitle =
                    extractText("h3", item) ||
                    extractText(".ConversationHeader a") ||
                    "Unbekannter Artikel";
                const sellerName =
                    extractText("header span span", item) ||
                    extractText("div[class*='text-bodyRegularStrong']", document)
                        .replace(/^Über\s+/, "") ||
                    "Unbekannter Anbieter";
                const preview = extractText("section span", item);
                const previewDate = extractText("header span:last-child", item);
                const articleLink =
                    (document.querySelector(".ConversationHeader a") as HTMLAnchorElement | null)
                        ?.href ||
                    (item.querySelector("a[href*='/zur-anzeige/']") as HTMLAnchorElement | null)
                        ?.href ||
                    "";
                const articleIdMatch = articleLink.match(/(\d+)/);
                const articleId =
                    articleIdMatch && articleIdMatch[1] ? articleIdMatch[1] : "";
                const sellerSection = Array.from(document.querySelectorAll("div"))
                    .map((element) => element.textContent?.trim() || "")
                    .find((text) => text.startsWith("Über "));
                const sellerNameFromDetail = sellerSection
                    ? sellerSection
                        .replace(/^Über\s+/, "")
                        .replace(/Aktiv seit.*$/i, "")
                        .trim()
                    : "";
                const sellerIdMatch = articleLink.match(/userId=(\d+)/);
                const messages = Array.from(
                    document.querySelectorAll(".MessageList > li")
                ).map((messageNode, messageIndex) => {
                    const messageElement = messageNode as HTMLElement;
                    const outbound = Boolean(
                        messageElement.querySelector("[data-testid='OUTBOUND'], .Message-outbound")
                    );
                    const system = Boolean(
                        messageElement.querySelector("[data-testid='SYSTEM']")
                    );
                    const text =
                        extractText(".Message--Text", messageElement) ||
                        extractText(".MessageListItem--Message", messageElement) ||
                        messageElement.innerText.replace(/\s+/g, " ").trim();
                    const timestamp = extractText(".MessageListItem-Date", messageElement) || previewDate;

                    return {
                        id:
                            messageElement.getAttribute("data-testid") ||
                            `${articleId || "conversation"}-${messageIndex}`,
                        direction: system ? "system" : outbound ? "out" : "in",
                        text,
                        timestamp,
                        status: system ? "system" : outbound ? "sent" : "received",
                    };
                });

                return {
                    conversationId:
                        `${sellerIdMatch && sellerIdMatch[1] ? sellerIdMatch[1] : sellerName}:${articleId || targetIndex}`,
                    articleId: articleId || `${targetIndex}`,
                    articleTitle,
                    sellerName: sellerNameFromDetail || sellerName,
                    sellerId: sellerIdMatch && sellerIdMatch[1] ? sellerIdMatch[1] : "",
                    lastMessage:
                        messages[messages.length - 1]?.text || preview || undefined,
                    lastMessageDate:
                        messages[messages.length - 1]?.timestamp || previewDate || undefined,
                    unread: item.className.includes("is-unread"),
                    conversationUrl: window.location.href,
                    articleUrl:
                        articleLink ||
                        `https://www.kleinanzeigen.de/s-anzeige/${articleId}`,
                    messages,
                };
            }, index);

            if (snapshot && snapshot.articleId) {
                conversations.push({
                    ...snapshot,
                    unread: snapshot.unread,
                    messages: (snapshot.messages || []).map((message) => ({
                        id: message.id,
                        direction: message.direction as "in" | "out" | "system",
                        text: message.text,
                        timestamp: message.timestamp,
                        status: message.status as "sent" | "received" | "system",
                    })),
                });
            }
        }

        return conversations;
    }

    /**
     * Get list of active conversations
     */
    async getConversations(email: string): Promise<ConversationInfo[]> {
        if (this.manualMode.isEnabled()) {
            throw new Error(
                this.manualMode.getBlockedMessage(
                    "Automated conversation retrieval",
                    "Messaging-related live requests stay disabled until you leave manual-only mode."
                )
            );
        }

        console.log(`📋 Getting conversations for ${email}`);
        const guardStatus = this.platformGuard.isBlocked();

        if (guardStatus.blocked) {
            throw new Error(this.platformGuard.getBlockMessage(guardStatus.state));
        }

        const profileStatus = await this.sessionProfiles.getStatus(email);
        if (profileStatus.profileExists) {
            const sessionResult = await this.sessionProfiles.verifySession(email, {
                startIfNeeded: true,
                saveCookies: true,
                source: "message:conversation-check",
            });

            if (!sessionResult.loggedIn) {
                throw new Error(sessionResult.error || "Session is not authenticated");
            }
        }

        let page: Page | null = null;

        try {
            this.browser = await this.connectToBrowser(email);
            page = await this.browser.newPage();
            await page.setViewport({ width: 1600, height: 1100 });

            await this.navigateWithFallback(
                page,
                "https://www.kleinanzeigen.de/m-nachrichten.html"
            );
            await this.handleCookieConsent(page);

            const blockState = await this.platformGuard.inspectKleinanzeigenPage(
                page,
                "message:conversations"
            );
            if (blockState) {
                throw new Error(this.platformGuard.getBlockMessage(blockState));
            }

            const isLoggedIn = await this.checkLoginStatus(page);
            if (!isLoggedIn) {
                throw new Error("Not logged in. Please refresh cookies.");
            }

            const conversations = await this.scrapeConversationSnapshots(page);
            this.appState.recordConversationSnapshots(
                conversations.map((conversation) => ({
                    conversationId: conversation.conversationId,
                    articleId: conversation.articleId,
                    articleTitle: conversation.articleTitle,
                    sellerName: conversation.sellerName,
                    sellerId: conversation.sellerId,
                    lastMessage: conversation.lastMessage,
                    lastMessageDate: conversation.lastMessageDate,
                    unread: conversation.unread,
                    conversationUrl: conversation.conversationUrl,
                    articleUrl:
                        `https://www.kleinanzeigen.de/s-anzeige/${conversation.articleId}`,
                    messages: conversation.messages || [],
                }))
            );

            return conversations;
        } finally {
            if (page) {
                await page.close().catch(() => undefined);
            }
        }
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
