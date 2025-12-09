// Gmail OAuth2 Implementation
import { google } from "googleapis";
import { OAuth2Config, OAuth2Tokens, EmailSearchResult, extractVerificationLink } from "./types";

export class GmailOAuth2 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private oauth2Client: any;

    constructor(config: OAuth2Config["gmail"]) {
        if (!config) throw new Error("Gmail OAuth config required");

        this.oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );
    }

    /**
     * Get authorization URL for user to login
     */
    getAuthUrl(email?: string): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            prompt: "consent",
            login_hint: email,
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code: string): Promise<OAuth2Tokens> {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        return {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date || Date.now() + 3600000,
            provider: "gmail",
            email: userInfo.data.email!,
        };
    }

    /**
     * Refresh access token
     */
    async refreshTokens(tokens: OAuth2Tokens): Promise<OAuth2Tokens> {
        this.oauth2Client.setCredentials({
            refresh_token: tokens.refreshToken,
        });

        const { credentials } = await this.oauth2Client.refreshAccessToken();

        return {
            ...tokens,
            accessToken: credentials.access_token!,
            expiresAt: credentials.expiry_date || Date.now() + 3600000,
        };
    }

    /**
     * Search for Kleinanzeigen verification email using Gmail API
     */
    async searchVerificationEmail(tokens: OAuth2Tokens): Promise<EmailSearchResult> {
        try {
            this.oauth2Client.setCredentials({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
            });

            const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

            const response = await gmail.users.messages.list({
                userId: "me",
                q: "from:kleinanzeigen OR subject:anmeldung OR subject:bestätigen newer_than:15m",
                maxResults: 10,
            });

            const messages = response.data.messages || [];

            for (const msg of messages) {
                const fullMessage = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id!,
                    format: "full",
                });

                const headers = fullMessage.data.payload?.headers || [];
                const subject = headers.find(h => h.name === "Subject")?.value || "";
                const from = headers.find(h => h.name === "From")?.value || "";

                let body = "";
                const parts = fullMessage.data.payload?.parts || [];
                for (const part of parts) {
                    if (part.mimeType === "text/html" && part.body?.data) {
                        body = Buffer.from(part.body.data, "base64").toString("utf8");
                        break;
                    }
                }
                if (!body && fullMessage.data.payload?.body?.data) {
                    body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString("utf8");
                }

                if (
                    from.toLowerCase().includes("kleinanzeigen") ||
                    subject.toLowerCase().includes("anmeldung") ||
                    subject.toLowerCase().includes("bestätigen")
                ) {
                    const link = extractVerificationLink(body);

                    return {
                        found: true,
                        subject,
                        verificationLink: link || undefined,
                        messageId: msg.id!,
                    };
                }
            }

            return { found: false };
        } catch (error) {
            console.error("Error searching Gmail:", error);
            return { found: false };
        }
    }
}
