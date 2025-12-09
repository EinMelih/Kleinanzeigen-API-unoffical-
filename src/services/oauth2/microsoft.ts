// Microsoft OAuth2 Implementation
import { ConfidentialClientApplication, Configuration, AuthorizationCodeRequest, AuthorizationUrlRequest } from "@azure/msal-node";
import axios from "axios";
import { OAuth2Config, OAuth2Tokens, EmailSearchResult, extractVerificationLink } from "./types";

export class MicrosoftOAuth2 {
    private msalClient: ConfidentialClientApplication;
    private config: NonNullable<OAuth2Config["microsoft"]>;

    constructor(config: OAuth2Config["microsoft"]) {
        if (!config) throw new Error("Microsoft OAuth config required");
        this.config = config;

        const msalConfig: Configuration = {
            auth: {
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                authority: `https://login.microsoftonline.com/${config.tenantId || "common"}`,
            },
        };

        this.msalClient = new ConfidentialClientApplication(msalConfig);
    }

    /**
     * Get authorization URL for user to login
     */
    async getAuthUrl(email?: string): Promise<string> {
        const authCodeUrlParams: AuthorizationUrlRequest = {
            scopes: [
                "https://graph.microsoft.com/Mail.Read",
                "https://graph.microsoft.com/User.Read",
                "offline_access",
            ],
            redirectUri: this.config.redirectUri,
            ...(email ? { loginHint: email } : {}),
        };

        return this.msalClient.getAuthCodeUrl(authCodeUrlParams);
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code: string): Promise<OAuth2Tokens> {
        const tokenRequest: AuthorizationCodeRequest = {
            code,
            scopes: [
                "https://graph.microsoft.com/Mail.Read",
                "https://graph.microsoft.com/User.Read",
                "offline_access",
            ],
            redirectUri: this.config.redirectUri,
        };

        const response = await this.msalClient.acquireTokenByCode(tokenRequest);

        if (!response) {
            throw new Error("Failed to acquire token");
        }

        const userInfo = await axios.get("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${response.accessToken}` },
        });

        return {
            accessToken: response.accessToken,
            refreshToken: undefined,
            expiresAt: response.expiresOn?.getTime() || Date.now() + 3600000,
            provider: "microsoft",
            email: userInfo.data.mail || userInfo.data.userPrincipalName,
        };
    }

    /**
     * Refresh access token
     */
    async refreshTokens(tokens: OAuth2Tokens): Promise<OAuth2Tokens> {
        const account = (await this.msalClient.getTokenCache().getAllAccounts())[0];

        if (!account) {
            throw new Error("No cached account found - user needs to re-authenticate");
        }

        const response = await this.msalClient.acquireTokenSilent({
            scopes: [
                "https://graph.microsoft.com/Mail.Read",
                "https://graph.microsoft.com/User.Read",
            ],
            account,
        });

        if (!response) {
            throw new Error("Failed to refresh token");
        }

        return {
            ...tokens,
            accessToken: response.accessToken,
            expiresAt: response.expiresOn?.getTime() || Date.now() + 3600000,
        };
    }

    /**
     * Search for Kleinanzeigen verification email using MS Graph
     */
    async searchVerificationEmail(accessToken: string): Promise<EmailSearchResult> {
        try {
            const response = await axios.get(
                "https://graph.microsoft.com/v1.0/me/messages",
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: {
                        $filter: "receivedDateTime ge " + new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                        $orderby: "receivedDateTime desc",
                        $top: 20,
                        $select: "id,subject,from,body,receivedDateTime",
                    },
                }
            );

            const messages = response.data.value || [];

            for (const message of messages) {
                const from = message.from?.emailAddress?.address?.toLowerCase() || "";
                const subject = message.subject?.toLowerCase() || "";
                const body = message.body?.content || "";

                if (
                    from.includes("kleinanzeigen") ||
                    subject.includes("anmeldung") ||
                    subject.includes("bestätigen") ||
                    subject.includes("login")
                ) {
                    const link = extractVerificationLink(body);

                    return {
                        found: true,
                        subject: message.subject,
                        verificationLink: link || undefined,
                        messageId: message.id,
                    };
                }
            }

            return { found: false };
        } catch (error) {
            console.error("Error searching Microsoft emails:", error);
            return { found: false };
        }
    }
}
