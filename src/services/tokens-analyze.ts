import * as fs from "fs";
import * as path from "path";

export interface TokenAnalysis {
  kind: "access_token" | "refresh_token" | "other";
  name: string;
  expiry: Date;
  expiresAt: number;
  isExpired: boolean;
  remainingTime: string;
  utcTime: string;
  berlinTime: string;
}

export class TokenAnalyzer {
  private readonly cookiesDir: string;

  constructor() {
    this.cookiesDir = path.join(process.cwd(), "data", "cookies");
  }

  /** Base64URL → string */
  private b64urlDecode(input: string): string {
    const pad = (s: string) => s + "===".slice((s.length + 3) % 4);
    const b64 = pad(input.replace(/-/g, "+").replace(/_/g, "/"));
    return Buffer.from(b64, "base64").toString("utf8");
  }

  /** Try to extract JWT expiry (exp) from token string */
  private getJwtExpSeconds(maybeJwt: string): number | null {
    const parts = maybeJwt.split(".");
    if (parts.length !== 3) return null;
    try {
      const payloadStr = this.b64urlDecode(parts[1] || "");
      const payload = JSON.parse(payloadStr);
      if (typeof payload.exp === "number") return payload.exp;
    } catch {}
    return null;
  }

  /** Format date in Europe/Berlin and UTC */
  private formatBoth(d: Date) {
    const fmtEU = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
    const fmtUTC = d.toISOString().replace("T", " ").replace("Z", " UTC");
    return { berlin: fmtEU, utc: fmtUTC };
  }

  /** Human-readable remaining time */
  private humanDiff(to: Date, from = new Date()): string {
    let ms = to.getTime() - from.getTime();
    const sign = ms < 0 ? -1 : 1;
    ms = Math.abs(ms);
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / (1000 * 60)) % 60;
    const hrs = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const txt = `${days}d ${hrs}h ${min}m ${sec}s`;
    return sign < 0 ? `abgelaufen vor ${txt}` : `läuft ab in ${txt}`;
  }

  /** Analyze tokens in cookie file */
  async analyzeTokens(email: string): Promise<TokenAnalysis[]> {
    const cookiePath = path.join(
      this.cookiesDir,
      `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
    );

    if (!fs.existsSync(cookiePath)) {
      throw new Error(`Cookie file not found for ${email}`);
    }

    const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
    const findings: TokenAnalysis[] = [];

    // 1) Find candidates with expires field
    for (const c of cookies) {
      if (typeof c.expires === "number" && c.expires > 0) {
        const when = new Date(c.expires * 1000);
        const lname = c.name.toLowerCase();
        const kind: TokenAnalysis["kind"] = lname.includes("access_token")
          ? "access_token"
          : lname.includes("refresh_token")
          ? "refresh_token"
          : "other";

        if (kind !== "other") {
          const { berlin, utc } = this.formatBoth(when);
          findings.push({
            kind,
            name: c.name,
            expiry: when,
            expiresAt: c.expires,
            isExpired: when < new Date(),
            remainingTime: this.humanDiff(when),
            utcTime: utc,
            berlinTime: berlin,
          });
        }
      }
    }

    // 2) Find candidates without expires but with JWT exp (fallback)
    for (const c of cookies) {
      if (typeof c.expires !== "number" || c.expires <= 0) {
        const exp = this.getJwtExpSeconds(c.value);
        if (exp) {
          const when = new Date(exp * 1000);
          const lname = c.name.toLowerCase();
          const kind: TokenAnalysis["kind"] = lname.includes("access_token")
            ? "access_token"
            : lname.includes("refresh_token")
            ? "refresh_token"
            : "other";

          if (kind !== "other") {
            const { berlin, utc } = this.formatBoth(when);
            findings.push({
              kind,
              name: c.name,
              expiry: when,
              expiresAt: exp,
              isExpired: when < new Date(),
              remainingTime: this.humanDiff(when),
              utcTime: utc,
              berlinTime: berlin,
            });
          }
        }
      }
    }

    // 3) Sort by type (Access → Refresh) and then by expiry time
    findings.sort((a, b) =>
      a.kind === b.kind
        ? a.expiry.getTime() - b.expiry.getTime()
        : a.kind === "access_token"
        ? -1
        : b.kind === "access_token"
        ? 1
        : 0
    );

    return findings;
  }

  /** Get summary of token analysis */
  async getTokenSummary(email: string): Promise<{
    email: string;
    tokens: TokenAnalysis[];
    accessTokenExpiry?: Date;
    refreshTokenExpiry?: Date;
    loginValidUntil?: string;
    refreshValidUntil?: string;
    timestamp: string;
  }> {
    const tokens = await this.analyzeTokens(email);

    const accessToken = tokens.find((t) => t.kind === "access_token");
    const refreshToken = tokens.find((t) => t.kind === "refresh_token");

    return {
      email,
      tokens,
      ...(accessToken && { accessTokenExpiry: accessToken.expiry }),
      ...(refreshToken && { refreshTokenExpiry: refreshToken.expiry }),
      ...(accessToken && { loginValidUntil: accessToken.berlinTime }),
      ...(refreshToken && { refreshValidUntil: refreshToken.berlinTime }),
      timestamp: new Date().toISOString(),
    };
  }
}
