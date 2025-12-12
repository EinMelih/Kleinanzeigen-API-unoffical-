import "dotenv/config";
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import * as fs from "fs";
import * as path from "path";
import { LoginRequestBody } from "../../shared/types";

const app: FastifyInstance = Fastify({
  logger: true,
});

// Health check endpoint with detailed status
app.get("/health", async () => {
  try {
    const validator = new CookieValidator();
    const stats = await validator.getCookieStats();

    return {
      ok: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
      cookies: {
        totalFiles: stats.totalFiles,
        validFiles: stats.validFiles,
        expiredFiles: stats.expiredFiles,
        totalCookieCount: stats.totalCookieCount,
        nextExpiry: stats.nextExpiry,
        validityDuration: stats.validityDuration,
      },
      chrome: {
        status: "running",
        port: 9222,
      },
    };
  } catch (error) {
    return {
      ok: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
      cookies: {
        error: "Failed to get cookie stats",
      },
      chrome: {
        status: "running",
        port: 9222,
      },
    };
  }
});

import {
  checkAllUsersAuthStatus,
  checkLoginStatus,
} from "../services/auth-status";
import { CookieRefreshService } from "../services/cookies-auto-refresh";
import { CookieValidator } from "../services/cookies-validation";
import { EmailVerificationService } from "../services/email-verification";
import { BrowserEmailVerificationService } from "../services/email-verification-browser";
import { getOAuth2EmailService, loadTokens } from "../services/oauth2";
import { TokenAnalyzer } from "../services/tokens-analyze";
import { performLogin } from "../workers/auth-login";

app.post<{ Body: LoginRequestBody }>(
  "/auth/login",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          password: { type: "string" },
        },
        required: ["email"],
        additionalProperties: false,
      },
    },
  },
  async (
    request: FastifyRequest<{ Body: LoginRequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password } = request.body;

      console.log("Starting login process to ensure Chrome is visible...");
      const result = await performLogin({ email, password: password });

      if (result.ok) {
        return reply.send({
          status: "login_successful",
          message:
            "Login completed successfully - Chrome should be visible now",
          loggedIn: result.loggedIn,
          needsLogin: !result.loggedIn,
          cookieFile: result.cookieFile,
        });
      } else if (result.requiresEmailVerification) {
        // 2FA / Email Verification required
        return reply.status(200).send({
          status: "requires_email_verification",
          message: result.message || "Email verification required - please confirm login in your email",
          loggedIn: false,
          needsLogin: true,
          requiresEmailVerification: true,
          verificationReason: result.verificationReason,
          cookieFile: result.cookieFile,
        });
      } else {
        return reply.status(400).send({
          status: "login_failed",
          message: "Login failed",
          loggedIn: false,
          needsLogin: true,
          error: result.error,
        });
      }
    } catch (err) {
      request.log.error({ err }, "login status check failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Login status check failed",
      });
    }
  }
);

// POST /auth/verify-email - Automatically verify login via email
app.post<{ Body: { email: string; emailPassword: string; timeout?: number } }>(
  "/auth/verify-email",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          emailPassword: { type: "string" },
          timeout: { type: "number" },
        },
        required: ["email", "emailPassword"],
        additionalProperties: false,
      },
    },
  },
  async (
    request: FastifyRequest<{ Body: { email: string; emailPassword: string; timeout?: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, emailPassword, timeout = 60000 } = request.body;

      console.log(`📧 Starting email verification for ${email}...`);

      const verificationService = new EmailVerificationService({
        email,
        password: emailPassword,
        timeout,
      });

      const result = await verificationService.verifyLogin();

      if (result.success) {
        return reply.send({
          status: "verification_successful",
          message: result.message,
          verificationLink: result.verificationLink,
          emailSubject: result.emailSubject,
          timestamp: new Date().toISOString(),
        });
      } else {
        return reply.status(400).send({
          status: "verification_failed",
          message: result.message,
          error: result.error,
          verificationLink: result.verificationLink,
          emailSubject: result.emailSubject,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      request.log.error({ err }, "email verification failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Email verification failed",
      });
    }
  }
);

// POST /auth/verify-email-browser - Verify login via browser (for Microsoft/Outlook)
app.post<{ Body: { email: string; emailPassword: string; timeout?: number } }>(
  "/auth/verify-email-browser",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          emailPassword: { type: "string" },
          timeout: { type: "number" },
        },
        required: ["email", "emailPassword"],
        additionalProperties: false,
      },
    },
  },
  async (
    request: FastifyRequest<{ Body: { email: string; emailPassword: string; timeout?: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, emailPassword, timeout = 60000 } = request.body;

      console.log(`🌐 Starting browser-based email verification for ${email}...`);

      const verificationService = new BrowserEmailVerificationService();
      const result = await verificationService.verifyLogin(email, emailPassword, timeout);

      if (result.success) {
        return reply.send({
          status: "verification_successful",
          message: result.message,
          verificationLink: result.verificationLink,
          timestamp: new Date().toISOString(),
        });
      } else {
        return reply.status(400).send({
          status: "verification_failed",
          message: result.message,
          error: result.error,
          verificationLink: result.verificationLink,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      request.log.error({ err }, "browser email verification failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Browser email verification failed",
      });
    }
  }
);

// GET /auth/status/:email - Check login status for specific user
app.get<{ Params: { email: string } }>(
  "/auth/status/:email",
  async (
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.params;
      const result = await checkLoginStatus(email);
      return reply.send(result);
    } catch (err) {
      request.log.error({ err }, "status check failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Status check failed",
      });
    }
  }
);

// POST /auth/check-login - Test if user is currently logged in (real-time check)
app.post<{ Body: { email: string } }>(
  "/auth/check-login",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
        },
        required: ["email"],
        additionalProperties: false,
      },
    },
  },
  async (
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.body;

      // Use CookieValidator to perform real-time login check
      const validator = new CookieValidator();
      const cookiePath = path.join(
        process.cwd(),
        "data",
        "cookies",
        `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
      );

      if (!fs.existsSync(cookiePath)) {
        return reply.send({
          status: "not_logged_in",
          message: "No cookies found - user not logged in",
          loggedIn: false,
          timestamp: new Date().toISOString(),
        });
      }

      // Perform real-time login test
      const result = await validator.testCookieLogin(cookiePath);

      return reply.send({
        status: result.isValid ? "logged_in" : "not_logged_in",
        message: result.isValid
          ? "User is currently logged in"
          : "User is not logged in",
        loggedIn: result.isValid,
        cookieFiles: 1, // Number of cookie files (always 1 per user)
        cookiesInFile: result.cookieCount, // Number of cookies within the file
        lastValidated: result.lastValidated,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "login check failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Login check failed",
      });
    }
  }
);

// GET /auth/users - Check all users authentication status
app.get("/auth/users", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await checkAllUsersAuthStatus();
    return reply.send(result);
  } catch (err) {
    request.log.error({ err }, "users status check failed");
    return reply.status(500).send({
      status: "error",
      message: err instanceof Error ? err.message : "Users status check failed",
    });
  }
});

// GET /cookies/status - Check cookie validation status
app.get(
  "/cookies/status",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validator = new CookieValidator();
      const results = await validator.validateAllCookies();
      return reply.send({
        status: "success",
        cookies: results,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie validation failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Cookie validation failed",
      });
    }
  }
);

// GET /cookies/stats - Get cookie statistics
app.get(
  "/cookies/stats",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validator = new CookieValidator();
      const stats = await validator.getCookieStats();
      return reply.send({
        status: "success",
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie stats failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Cookie stats failed",
      });
    }
  }
);

// GET /cookies/expiring-soon - Get cookies expiring within specified days
app.get(
  "/cookies/expiring-soon",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { days = "7" } = request.query as { days?: string };
      const daysThreshold = parseInt(days) || 7;

      const validator = new CookieValidator();
      const expiringSoon = await validator.getCookiesExpiringSoon(
        daysThreshold
      );

      return reply.send({
        status: "success",
        daysThreshold,
        expiringSoon,
        count: expiringSoon.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "expiring cookies failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to get expiring cookies",
      });
    }
  }
);

// POST /cookies/cleanup - Clean up expired cookies
app.post(
  "/cookies/cleanup",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validator = new CookieValidator();
      const result = await validator.cleanupExpiredCookies();
      return reply.send({
        status: "success",
        message: `Cleanup completed: ${result.deleted} deleted, ${result.kept} kept`,
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie cleanup failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Cookie cleanup failed",
      });
    }
  }
);

// POST /cookies/test/:email - Test specific user's cookies
app.post<{ Params: { email: string } }>(
  "/cookies/test/:email",
  async (
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.params;
      const validator = new CookieValidator();
      const cookiePath = path.join(
        process.cwd(),
        "data",
        "cookies",
        `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
      );

      if (!fs.existsSync(cookiePath)) {
        return reply.status(404).send({
          status: "error",
          message: "No cookies found for this user",
        });
      }

      const result = await validator.testCookieLogin(cookiePath);
      return reply.send({
        status: "success",
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie test failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Cookie test failed",
      });
    }
  }
);

// GET /cookies/details/:email - Get detailed cookie information for specific user
app.get<{ Params: { email: string } }>(
  "/cookies/details/:email",
  async (
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.params;
      const validator = new CookieValidator();
      const cookiePath = path.join(
        process.cwd(),
        "data",
        "cookies",
        `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
      );

      if (!fs.existsSync(cookiePath)) {
        return reply.status(404).send({
          status: "error",
          message: "No cookies found for this user",
        });
      }

      const result = await validator.checkCookieExpiry(cookiePath);
      return reply.send({
        status: "success",
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie details failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Cookie details failed",
      });
    }
  }
);

// Cookie refresh endpoints
// POST /cookies/refresh/:email - Refresh cookies for specific user
app.post<{ Params: { email: string } }>(
  "/cookies/refresh/:email",
  async (
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.params;
      const refreshService = new CookieRefreshService();
      const result = await refreshService.refreshUserCookies(email);

      return reply.send({
        status: "success",
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie refresh failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Cookie refresh failed",
      });
    }
  }
);

// POST /cookies/refresh-all - Refresh all user cookies
app.post(
  "/cookies/refresh-all",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const refreshService = new CookieRefreshService();
      const results = await refreshService.refreshAllCookies();

      return reply.send({
        status: "success",
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie refresh all failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Cookie refresh all failed",
      });
    }
  }
);

// GET /cookies/refresh-status - Check if cookies need refresh
app.get(
  "/cookies/refresh-status",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { threshold = "6" } = request.query as { threshold?: string };
      const thresholdHours = parseInt(threshold) || 6;

      const refreshService = new CookieRefreshService();
      const status = await refreshService.checkRefreshNeeded(thresholdHours);

      return reply.send({
        status: "success",
        refreshStatus: status,
        thresholdHours,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "cookie refresh status failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Cookie refresh status failed",
      });
    }
  }
);

// POST /cookies/auto-refresh/start - Start automatic cookie refresh
app.post(
  "/cookies/auto-refresh/start",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { interval?: string | number };
      const interval = body?.interval;
      const intervalHours =
        typeof interval === "string"
          ? parseFloat(interval)
          : typeof interval === "number"
            ? interval
            : 0.25;

      const refreshService = new CookieRefreshService();
      refreshService.startAutoRefresh(intervalHours);

      const intervalText =
        intervalHours < 1
          ? `${Math.round(intervalHours * 60)} minutes`
          : `${intervalHours} hours`;

      return reply.send({
        status: "success",
        message: `Auto-refresh started (every ${intervalText})`,
        intervalHours,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "auto-refresh start failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Auto-refresh start failed",
      });
    }
  }
);

// POST /cookies/auto-refresh/stop - Stop automatic cookie refresh
app.post(
  "/cookies/auto-refresh/stop",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const refreshService = new CookieRefreshService();
      refreshService.stopAutoRefresh();

      return reply.send({
        status: "success",
        message: "Auto-refresh stopped",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "auto-refresh stop failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Auto-refresh stop failed",
      });
    }
  }
);

// GET /cookies/auto-refresh/status - Get auto-refresh status
app.get(
  "/cookies/auto-refresh/status",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const refreshService = new CookieRefreshService();
      const status = refreshService.getAutoRefreshStatus();

      return reply.send({
        status: "success",
        isRunning: status.isRunning,
        interval: status.interval,
        lastRefresh: status.lastRefresh,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "auto-refresh status failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Auto-refresh status failed",
      });
    }
  }
);

// GET /tokens/analyze/:email - Analyze JWT tokens and expiry times
app.get<{ Params: { email: string } }>(
  "/tokens/analyze/:email",
  async (
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.params;
      const analyzer = new TokenAnalyzer();
      const summary = await analyzer.getTokenSummary(email);

      return reply.send({
        status: "success",
        summary,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      request.log.error({ err }, "token analysis failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Token analysis failed",
      });
    }
  }
);

// ============================================
// OAUTH2 EMAIL VERIFICATION ENDPOINTS
// ============================================

// GET /oauth/microsoft/auth - Get Microsoft authorization URL
app.get(
  "/oauth/microsoft/auth",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.query as { email?: string };
      const oauth2Service = getOAuth2EmailService();
      const authUrl = await oauth2Service.getMicrosoftAuthUrl(email);

      return reply.send({
        status: "success",
        authUrl,
        message: "Open this URL in a browser to authorize",
        provider: "microsoft",
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to get auth URL",
        hint: "Make sure MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are set in .env",
      });
    }
  }
);

// GET /oauth/microsoft/callback - Handle Microsoft OAuth callback
app.get(
  "/oauth/microsoft/callback",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, error } = request.query as { code?: string; error?: string };

      if (error) {
        return reply.status(400).send({
          status: "error",
          message: `Authorization failed: ${error}`,
        });
      }

      if (!code) {
        return reply.status(400).send({
          status: "error",
          message: "No authorization code received",
        });
      }

      const oauth2Service = getOAuth2EmailService();
      const tokens = await oauth2Service.handleCallback("microsoft", code);

      return reply.send({
        status: "success",
        message: "Microsoft authorization successful!",
        email: tokens.email,
        expiresAt: new Date(tokens.expiresAt).toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Callback failed",
      });
    }
  }
);

// GET /oauth/gmail/auth - Get Gmail authorization URL
app.get(
  "/oauth/gmail/auth",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.query as { email?: string };
      const oauth2Service = getOAuth2EmailService();
      const authUrl = oauth2Service.getGmailAuthUrl(email);

      return reply.send({
        status: "success",
        authUrl,
        message: "Open this URL in a browser to authorize",
        provider: "gmail",
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to get auth URL",
        hint: "Make sure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set in .env",
      });
    }
  }
);

// GET /oauth/gmail/callback - Handle Gmail OAuth callback
app.get(
  "/oauth/gmail/callback",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, error } = request.query as { code?: string; error?: string };

      if (error) {
        return reply.status(400).send({
          status: "error",
          message: `Authorization failed: ${error}`,
        });
      }

      if (!code) {
        return reply.status(400).send({
          status: "error",
          message: "No authorization code received",
        });
      }

      const oauth2Service = getOAuth2EmailService();
      const tokens = await oauth2Service.handleCallback("gmail", code);

      return reply.send({
        status: "success",
        message: "Gmail authorization successful!",
        email: tokens.email,
        expiresAt: new Date(tokens.expiresAt).toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Callback failed",
      });
    }
  }
);

// POST /oauth/verify-email - Verify Kleinanzeigen email using OAuth2
app.post<{ Body: { email: string; timeout?: number } }>(
  "/oauth/verify-email",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          timeout: { type: "number" },
        },
        required: ["email"],
        additionalProperties: false,
      },
    },
  },
  async (
    request: FastifyRequest<{ Body: { email: string; timeout?: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, timeout = 60000 } = request.body;

      // Check if user has authorized
      const tokens = loadTokens(email);
      if (!tokens) {
        return reply.status(400).send({
          status: "not_authorized",
          message: "Email not authorized - user needs to complete OAuth flow first",
          microsoftAuthUrl: "/oauth/microsoft/auth?email=" + encodeURIComponent(email),
          gmailAuthUrl: "/oauth/gmail/auth?email=" + encodeURIComponent(email),
        });
      }

      console.log(`🔐 Starting OAuth2 email verification for ${email}...`);

      const oauth2Service = getOAuth2EmailService();
      const result = await oauth2Service.verifyKleinanzeigenEmail(email, timeout);

      if (result.success) {
        return reply.send({
          status: "verification_successful",
          message: result.message,
          verificationLink: result.verificationLink,
          timestamp: new Date().toISOString(),
        });
      } else {
        return reply.status(400).send({
          status: "verification_failed",
          message: result.message,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      request.log.error({ err }, "OAuth email verification failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "OAuth email verification failed",
      });
    }
  }
);

// GET /oauth/status/:email - Check OAuth authorization status
app.get<{ Params: { email: string } }>(
  "/oauth/status/:email",
  async (
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email } = request.params;
      const tokens = loadTokens(email);

      if (!tokens) {
        return reply.send({
          status: "not_authorized",
          email,
          authorized: false,
          message: "No OAuth tokens found for this email",
        });
      }

      return reply.send({
        status: "authorized",
        email,
        authorized: true,
        provider: tokens.provider,
        expiresAt: new Date(tokens.expiresAt).toISOString(),
        isExpired: Date.now() > tokens.expiresAt,
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to check status",
      });
    }
  }
);

// ============================================
// SEARCH & SCRAPING ENDPOINTS
// ============================================

import { SearchScraper } from "../services/search-scraper";

// POST /search - Search and scrape Kleinanzeigen articles
app.post<{
  Body: {
    query: string;
    count?: number;
    scrapeAll?: boolean;
    location?: string;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "SORTING_DATE" | "PRICE_AMOUNT" | "RELEVANCE";
    includeDetails?: boolean;
  };
}>(
  "/search",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          query: { type: "string" },
          count: { type: "number", minimum: 1 },
          scrapeAll: { type: "boolean" },
          location: { type: "string" },
          radius: { type: "number" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          sortBy: {
            type: "string",
            enum: ["SORTING_DATE", "PRICE_AMOUNT", "RELEVANCE"],
          },
          includeDetails: { type: "boolean" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  async (request, reply) => {
    try {
      const {
        query,
        count = 10,
        scrapeAll = false,
        location,
        radius,
        minPrice,
        maxPrice,
        sortBy,
        includeDetails = false,
      } = request.body;

      console.log(`🔍 Search request: "${query}" (${scrapeAll ? "ALL" : count} articles)`);

      const scraper = new SearchScraper();
      const result = await scraper.search({
        query,
        count,
        scrapeAll,
        location,
        radius,
        minPrice,
        maxPrice,
        sortBy,
        includeDetails,
      });

      await scraper.disconnect();

      if (result.success) {
        return reply.send({
          status: "success",
          ...result,
        });
      } else {
        return reply.status(400).send({
          status: "error",
          ...result,
        });
      }
    } catch (err) {
      request.log.error({ err }, "search failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Search failed",
      });
    }
  }
);

// GET /search - Quick search with query parameters
app.get<{
  Querystring: {
    q: string;
    count?: string;
    location?: string;
  };
}>(
  "/search",
  async (request, reply) => {
    try {
      const { q, count = "10", location } = request.query;

      if (!q) {
        return reply.status(400).send({
          status: "error",
          message: "Query parameter 'q' is required",
        });
      }

      console.log(`🔍 Quick search: "${q}" (${count} articles)`);

      const scraper = new SearchScraper();
      const result = await scraper.search({
        query: q,
        count: parseInt(count) || 10,
        location,
      });

      await scraper.disconnect();

      if (result.success) {
        return reply.send({
          status: "success",
          ...result,
        });
      } else {
        return reply.status(400).send({
          status: "error",
          ...result,
        });
      }
    } catch (err) {
      request.log.error({ err }, "search failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Search failed",
      });
    }
  }
);

// Import and register server controller
import { serverController } from "../controllers/server-controller";

// Start server function
async function startServer() {
  try {
    // Register server controller routes
    await serverController(app);

    const PORT = process.env["PORT"] || 87;
    await app.listen({ port: Number(PORT), host: "0.0.0.0" });
    console.log(`API listening on http://localhost:${PORT}`);
  } catch (e) {
    console.error("Failed to start server", e);
    process.exit(1);
  }
}

// Start the server
startServer();
