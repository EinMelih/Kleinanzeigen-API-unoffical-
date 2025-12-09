// Unified OAuth2 Email Service
import axios from "axios";
import { OAuth2Config, OAuth2Tokens, EmailSearchResult, EmailVerificationResult, saveTokens, loadTokens } from "./types";
import { MicrosoftOAuth2 } from "./microsoft";
import { GmailOAuth2 } from "./gmail";

export class OAuth2EmailService {
    private microsoftClient?: MicrosoftOAuth2;
    private gmailClient?: GmailOAuth2;

    constructor(config: OAuth2Config) {
        if (config.microsoft) {
            this.microsoftClient = new MicrosoftOAuth2(config.microsoft);
        }
        if (config.gmail) {
            this.gmailClient = new GmailOAuth2(config.gmail);
        }
    }

    async getMicrosoftAuthUrl(email?: string): Promise<string> {
        if (!this.microsoftClient) throw new Error("Microsoft not configured");
        return this.microsoftClient.getAuthUrl(email);
    }

    getGmailAuthUrl(email?: string): string {
        if (!this.gmailClient) throw new Error("Gmail not configured");
        return this.gmailClient.getAuthUrl(email);
    }

    /**
     * Exchange authorization code for tokens
     */
    async handleCallback(
        provider: "microsoft" | "gmail",
        code: string
    ): Promise<OAuth2Tokens> {
        let tokens: OAuth2Tokens;

        if (provider === "microsoft" && this.microsoftClient) {
            tokens = await this.microsoftClient.getTokensFromCode(code);
        } else if (provider === "gmail" && this.gmailClient) {
            tokens = await this.gmailClient.getTokensFromCode(code);
        } else {
            throw new Error(`Provider ${provider} not configured`);
        }

        saveTokens(tokens);
        return tokens;
    }

    /**
     * Search and click verification email
     */
    async verifyKleinanzeigenEmail(
        email: string,
        timeout: number = 60000
    ): Promise<EmailVerificationResult> {
        const tokens = loadTokens(email);

        if (!tokens) {
            return {
                success: false,
                message: "No OAuth tokens found - user needs to authorize first",
                error: "NOT_AUTHORIZED",
            };
        }

        // Check if token needs refresh
        if (Date.now() > tokens.expiresAt - 60000) {
            try {
                const refreshed = await this.refreshTokens(tokens);
                saveTokens(refreshed);
                tokens.accessToken = refreshed.accessToken;
                tokens.expiresAt = refreshed.expiresAt;
            } catch {
                return {
                    success: false,
                    message: "Token expired and refresh failed - user needs to re-authorize",
                    error: "TOKEN_EXPIRED",
                };
            }
        }

        const startTime = Date.now();
        console.log(`⏳ Searching for verification email (max ${timeout / 1000}s)...`);

        while (Date.now() - startTime < timeout) {
            let result: EmailSearchResult;

            if (tokens.provider === "microsoft" && this.microsoftClient) {
                result = await this.microsoftClient.searchVerificationEmail(tokens.accessToken);
            } else if (tokens.provider === "gmail" && this.gmailClient) {
                result = await this.gmailClient.searchVerificationEmail(tokens);
            } else {
                return {
                    success: false,
                    message: `Provider ${tokens.provider} not configured`,
                    error: "PROVIDER_NOT_CONFIGURED",
                };
            }

            if (result.found && result.verificationLink) {
                console.log(`📬 Found verification email: "${result.subject}"`);

                const clicked = await this.clickVerificationLink(result.verificationLink);

                if (clicked) {
                    return {
                        success: true,
                        message: "Email verification completed successfully",
                        verificationLink: result.verificationLink,
                    };
                } else {
                    return {
                        success: false,
                        message: "Found link but failed to click it",
                        verificationLink: result.verificationLink,
                        error: "CLICK_FAILED",
                    };
                }
            }

            console.log(`⏳ No email yet... (${Math.round((Date.now() - startTime) / 1000)}s)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        return {
            success: false,
            message: `Timeout: No verification email found within ${timeout / 1000} seconds`,
            error: "TIMEOUT",
        };
    }

    private async refreshTokens(tokens: OAuth2Tokens): Promise<OAuth2Tokens> {
        if (tokens.provider === "microsoft" && this.microsoftClient) {
            return this.microsoftClient.refreshTokens(tokens);
        } else if (tokens.provider === "gmail" && this.gmailClient) {
            return this.gmailClient.refreshTokens(tokens);
        }
        throw new Error(`Provider ${tokens.provider} not configured`);
    }

    private async clickVerificationLink(link: string): Promise<boolean> {
        try {
            console.log("🔗 Clicking verification link...");

            const response = await axios.get(link, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Accept: "text/html,application/xhtml+xml",
                },
                maxRedirects: 5,
                timeout: 15000,
            });

            if (response.status >= 200 && response.status < 300) {
                console.log("✅ Verification link clicked successfully");
                return true;
            }
            return false;
        } catch (error) {
            console.error("❌ Failed to click link:", error);
            return false;
        }
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let oauthService: OAuth2EmailService | null = null;

export function getOAuth2EmailService(): OAuth2EmailService {
    if (!oauthService) {
        const config: OAuth2Config = {};

        if (process.env["MICROSOFT_CLIENT_ID"] && process.env["MICROSOFT_CLIENT_SECRET"]) {
            config.microsoft = {
                clientId: process.env["MICROSOFT_CLIENT_ID"],
                clientSecret: process.env["MICROSOFT_CLIENT_SECRET"],
                tenantId: process.env["MICROSOFT_TENANT_ID"] || "common",
                redirectUri: process.env["MICROSOFT_REDIRECT_URI"] || "http://localhost:87/oauth/microsoft/callback",
            };
        }

        if (process.env["GMAIL_CLIENT_ID"] && process.env["GMAIL_CLIENT_SECRET"]) {
            config.gmail = {
                clientId: process.env["GMAIL_CLIENT_ID"],
                clientSecret: process.env["GMAIL_CLIENT_SECRET"],
                redirectUri: process.env["GMAIL_REDIRECT_URI"] || "http://localhost:87/oauth/gmail/callback",
            };
        }

        oauthService = new OAuth2EmailService(config);
    }

    return oauthService;
}
