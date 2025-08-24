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

const PORT = process.env["PORT"] || 87;
app
  .listen({ port: Number(PORT), host: "0.0.0.0" })
  .then(() => console.log(`API listening on http://localhost:${PORT}`))
  .catch((e) => {
    console.error("Failed to start server", e);
    process.exit(1);
  });
