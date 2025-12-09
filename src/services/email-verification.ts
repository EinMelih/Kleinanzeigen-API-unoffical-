import { ImapFlow } from "imapflow";
import axios from "axios";

/**
 * Email provider configurations for IMAP
 */
const EMAIL_PROVIDERS: Record<string, { host: string; port: number }> = {
    // Microsoft / Outlook / Hotmail
    "hotmail.com": { host: "outlook.office365.com", port: 993 },
    "hotmail.de": { host: "outlook.office365.com", port: 993 },
    "outlook.com": { host: "outlook.office365.com", port: 993 },
    "outlook.de": { host: "outlook.office365.com", port: 993 },
    "live.com": { host: "outlook.office365.com", port: 993 },
    "live.de": { host: "outlook.office365.com", port: 993 },

    // Gmail
    "gmail.com": { host: "imap.gmail.com", port: 993 },
    "googlemail.com": { host: "imap.gmail.com", port: 993 },

    // Yahoo
    "yahoo.com": { host: "imap.mail.yahoo.com", port: 993 },
    "yahoo.de": { host: "imap.mail.yahoo.com", port: 993 },

    // GMX / Web.de
    "gmx.de": { host: "imap.gmx.net", port: 993 },
    "gmx.net": { host: "imap.gmx.net", port: 993 },
    "web.de": { host: "imap.web.de", port: 993 },

    // T-Online
    "t-online.de": { host: "secureimap.t-online.de", port: 993 },
};

/**
 * Result of email verification attempt
 */
export interface EmailVerificationResult {
    success: boolean;
    message: string;
    verificationLink?: string;
    emailSubject?: string;
    error?: string;
}

/**
 * Configuration for email verification
 */
export interface EmailVerificationConfig {
    email: string;
    password: string;
    timeout?: number;        // Max time to wait for email (ms), default 60000
    pollInterval?: number;   // How often to check for new mail (ms), default 5000
    sender?: string;         // Expected sender, default "kleinanzeigen"
}

/**
 * Service to automatically verify Kleinanzeigen login via email
 * 
 * Flow:
 * 1. Connect to user's email via IMAP
 * 2. Wait for Kleinanzeigen verification email
 * 3. Extract confirmation link
 * 4. Click the link to confirm
 */
export class EmailVerificationService {
    private client: ImapFlow | null = null;
    private config: Required<EmailVerificationConfig>;

    constructor(config: EmailVerificationConfig) {
        this.config = {
            email: config.email,
            password: config.password,
            timeout: config.timeout || 60000,
            pollInterval: config.pollInterval || 5000,
            sender: config.sender || "kleinanzeigen",
        };
    }

    /**
     * Get IMAP configuration for email provider
     */
    private getImapConfig(): { host: string; port: number } | null {
        const domain = this.config.email.split("@")[1]?.toLowerCase();
        if (!domain) return null;

        return EMAIL_PROVIDERS[domain] || null;
    }

    /**
     * Connect to IMAP server
     */
    async connect(): Promise<boolean> {
        const imapConfig = this.getImapConfig();

        if (!imapConfig) {
            console.error(`❌ Unknown email provider for: ${this.config.email}`);
            console.error(`   Supported providers: ${Object.keys(EMAIL_PROVIDERS).join(", ")}`);
            return false;
        }

        try {
            console.log(`📧 Connecting to ${imapConfig.host}:${imapConfig.port}...`);
            console.log(`   Email: ${this.config.email}`);

            this.client = new ImapFlow({
                host: imapConfig.host,
                port: imapConfig.port,
                secure: true,
                auth: {
                    user: this.config.email,
                    pass: this.config.password,
                },
                logger: false, // Disable verbose logging
                tls: {
                    rejectUnauthorized: false, // Allow self-signed certs
                },
            });

            await this.client.connect();
            console.log("✅ Connected to IMAP server");
            return true;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("❌ IMAP connection failed:", errorMsg);

            // Provide helpful hints
            if (errorMsg.includes("Invalid credentials") || errorMsg.includes("authentication")) {
                console.error("   💡 Hint: For Microsoft/Hotmail accounts:");
                console.error("      1. Go to https://account.microsoft.com/security");
                console.error("      2. Enable 'App passwords' (requires 2FA)");
                console.error("      3. Generate and use an app password");
                console.error("   💡 Or enable 'Less secure apps' if available");
            }
            if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ETIMEDOUT")) {
                console.error("   💡 Hint: Check firewall settings or try a different network");
            }

            return false;
        }
    }

    /**
     * Disconnect from IMAP server
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.logout();
                console.log("📧 Disconnected from IMAP");
            } catch {
                // Ignore logout errors
            }
            this.client = null;
        }
    }

    /**
     * Search for Kleinanzeigen verification email
     */
    private async findVerificationEmail(): Promise<{ uid: number; subject: string; html: string } | null> {
        if (!this.client) return null;

        try {
            // Open INBOX
            await this.client.mailboxOpen("INBOX");

            // Search for recent emails from Kleinanzeigen
            const searchResult = await this.client.search({
                // Last 10 minutes
                since: new Date(Date.now() - 10 * 60 * 1000),
            }, { uid: true });

            // Handle case where search returns false or empty array
            const messages = Array.isArray(searchResult) ? searchResult : [];

            if (messages.length === 0) {
                return null;
            }

            // Check each message for Kleinanzeigen verification
            for (const uid of [...messages].reverse()) { // Check newest first
                const message = await this.client.fetchOne(String(uid), {
                    envelope: true,
                    source: true,
                }, { uid: true });

                if (!message) continue;

                const fromAddress = message.envelope?.from?.[0]?.address?.toLowerCase() || "";
                const subject = message.envelope?.subject || "";

                // Check if from Kleinanzeigen
                if (fromAddress.includes(this.config.sender) ||
                    fromAddress.includes("kleinanzeigen.de") ||
                    subject.toLowerCase().includes("anmeldung") ||
                    subject.toLowerCase().includes("bestätigen")) {

                    // Get email content
                    const source = message.source?.toString() || "";

                    return {
                        uid,
                        subject,
                        html: source,
                    };
                }
            }

            return null;
        } catch (error) {
            console.error("Error searching emails:", error);
            return null;
        }
    }

    /**
     * Extract verification link from email HTML
     */
    private extractVerificationLink(html: string): string | null {
        // Look for Kleinanzeigen verification links
        const patterns = [
            /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*confirm[^\s"<>]*/gi,
            /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*verify[^\s"<>]*/gi,
            /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*bestät[^\s"<>]*/gi,
            /https?:\/\/[^\s"<>]*kleinanzeigen\.de\/m-[^\s"<>]*/gi,
            // Generic link with token
            /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*token=[^\s"<>]*/gi,
        ];

        for (const pattern of patterns) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
                // Clean up the link
                let link = matches[0];
                // Remove trailing quotes or HTML entities
                link = link.replace(/["'>].*$/, "");
                link = link.replace(/&amp;/g, "&");
                return link;
            }
        }

        // Fallback: Find any Kleinanzeigen link with token/id
        const allLinks = html.match(/https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*/gi);
        if (allLinks) {
            // Find the longest link (likely has parameters)
            const sortedLinks = allLinks.sort((a, b) => b.length - a.length);
            if (sortedLinks[0] && sortedLinks[0].length > 50) {
                return sortedLinks[0].replace(/["'>].*$/, "");
            }
        }

        return null;
    }

    /**
     * Click the verification link
     */
    private async clickVerificationLink(link: string): Promise<boolean> {
        try {
            console.log(`🔗 Clicking verification link...`);

            const response = await axios.get(link, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                },
                maxRedirects: 5,
                timeout: 15000,
            });

            // Success if we get a 2xx response
            if (response.status >= 200 && response.status < 300) {
                console.log("✅ Verification link clicked successfully");
                return true;
            }

            console.log(`⚠️ Unexpected status: ${response.status}`);
            return false;
        } catch (error) {
            console.error("❌ Failed to click verification link:", error instanceof Error ? error.message : error);
            return false;
        }
    }

    /**
     * Wait for and process verification email
     */
    async waitForVerification(): Promise<EmailVerificationResult> {
        const startTime = Date.now();

        console.log(`⏳ Waiting for verification email (max ${this.config.timeout / 1000}s)...`);

        while (Date.now() - startTime < this.config.timeout) {
            const email = await this.findVerificationEmail();

            if (email) {
                console.log(`📬 Found verification email: "${email.subject}"`);

                // Extract verification link
                const link = this.extractVerificationLink(email.html);

                if (link) {
                    console.log(`🔗 Found verification link`);

                    // Click the link
                    const clicked = await this.clickVerificationLink(link);

                    if (clicked) {
                        return {
                            success: true,
                            message: "Email verification completed successfully",
                            verificationLink: link,
                            emailSubject: email.subject,
                        };
                    } else {
                        return {
                            success: false,
                            message: "Found verification link but failed to click it",
                            verificationLink: link,
                            emailSubject: email.subject,
                            error: "CLICK_FAILED",
                        };
                    }
                } else {
                    return {
                        success: false,
                        message: "Found verification email but could not extract link",
                        emailSubject: email.subject,
                        error: "LINK_NOT_FOUND",
                    };
                }
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
            console.log(`⏳ Still waiting... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        }

        return {
            success: false,
            message: `Timeout: No verification email received within ${this.config.timeout / 1000} seconds`,
            error: "TIMEOUT",
        };
    }

    /**
     * Full verification flow: connect, wait for email, verify, disconnect
     */
    async verifyLogin(): Promise<EmailVerificationResult> {
        try {
            // Connect to IMAP
            const connected = await this.connect();
            if (!connected) {
                return {
                    success: false,
                    message: "Failed to connect to email server",
                    error: "CONNECTION_FAILED",
                };
            }

            // Wait for and process verification
            const result = await this.waitForVerification();

            return result;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error during verification",
                error: "UNKNOWN_ERROR",
            };
        } finally {
            // Always disconnect
            await this.disconnect();
        }
    }
}

/**
 * Helper function to verify login with email
 */
export async function verifyLoginWithEmail(
    email: string,
    emailPassword: string,
    timeout: number = 60000
): Promise<EmailVerificationResult> {
    const service = new EmailVerificationService({
        email,
        password: emailPassword,
        timeout,
    });

    return service.verifyLogin();
}
