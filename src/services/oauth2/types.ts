// OAuth2 Types and Token Storage
import * as fs from "fs";
import * as path from "path";

// ============================================
// TYPES
// ============================================

export interface OAuth2Config {
    microsoft?: {
        clientId: string;
        clientSecret: string;
        tenantId?: string;
        redirectUri: string;
    };
    gmail?: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };
}

export interface OAuth2Tokens {
    accessToken: string;
    refreshToken?: string | undefined;
    expiresAt: number;
    provider: "microsoft" | "gmail";
    email: string;
}

export interface EmailSearchResult {
    found: boolean;
    subject?: string | undefined;
    verificationLink?: string | undefined;
    messageId?: string | undefined;
}

export interface EmailVerificationResult {
    success: boolean;
    message: string;
    verificationLink?: string | undefined;
    error?: string | undefined;
}

// ============================================
// TOKEN STORAGE
// ============================================

const TOKENS_DIR = path.join(process.cwd(), "data", "oauth-tokens");

function ensureTokensDir(): void {
    if (!fs.existsSync(TOKENS_DIR)) {
        fs.mkdirSync(TOKENS_DIR, { recursive: true });
    }
}

function getTokenPath(email: string): string {
    const slug = email.replace(/[^a-zA-Z0-9]/g, "_");
    return path.join(TOKENS_DIR, `tokens-${slug}.json`);
}

export function saveTokens(tokens: OAuth2Tokens): void {
    ensureTokensDir();
    const tokenPath = getTokenPath(tokens.email);
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    console.log(`✅ Tokens saved for ${tokens.email}`);
}

export function loadTokens(email: string): OAuth2Tokens | null {
    const tokenPath = getTokenPath(email);
    if (!fs.existsSync(tokenPath)) {
        return null;
    }
    try {
        const data = fs.readFileSync(tokenPath, "utf8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function deleteTokens(email: string): void {
    const tokenPath = getTokenPath(email);
    if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function extractVerificationLink(html: string): string | null {
    const patterns = [
        /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*confirm[^\s"<>]*/gi,
        /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*verify[^\s"<>]*/gi,
        /https?:\/\/[^\s"<>]*kleinanzeigen\.de[^\s"<>]*token=[^\s"<>]*/gi,
        /https?:\/\/[^\s"<>]*kleinanzeigen\.de\/m-[^\s"<>]*/gi,
    ];

    for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
            let link = matches[0];
            link = link.replace(/["'>].*$/, "");
            link = link.replace(/&amp;/g, "&");
            return link;
        }
    }

    return null;
}
