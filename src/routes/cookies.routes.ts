/**
 * Cookie Routes - /cookies/*
 * Handles cookie validation, refresh, and management
 */
import { FastifyInstance } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { CookieRefreshService } from "../services/cookies-auto-refresh";
import { CookieValidator } from "../services/cookies-validation";

export async function cookieRoutes(app: FastifyInstance): Promise<void> {
  // GET /cookies/status - Check cookie validation status
  app.get("/cookies/status", async (request, reply) => {
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
  });

  // GET /cookies/stats - Get cookie statistics
  app.get("/cookies/stats", async (request, reply) => {
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
  });

  // GET /cookies/expiring-soon - Get cookies expiring within specified days
  app.get("/cookies/expiring-soon", async (request, reply) => {
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
  });

  // POST /cookies/cleanup - Clean up expired cookies
  app.post("/cookies/cleanup", async (request, reply) => {
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
  });

  // POST /cookies/test/:email - Test specific user's cookies
  app.post<{ Params: { email: string } }>(
    "/cookies/test/:email",
    async (request, reply) => {
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

  // GET /cookies/details/:email - Get detailed cookie info
  app.get<{ Params: { email: string } }>(
    "/cookies/details/:email",
    async (request, reply) => {
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

  // POST /cookies/refresh/:email - Refresh cookies for specific user
  app.post<{ Params: { email: string } }>(
    "/cookies/refresh/:email",
    async (request, reply) => {
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
  app.post("/cookies/refresh-all", async (request, reply) => {
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
  });

  // GET /cookies/refresh-status - Check if cookies need refresh
  app.get("/cookies/refresh-status", async (request, reply) => {
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
  });

  // POST /cookies/auto-refresh/start - Start automatic refresh
  app.post("/cookies/auto-refresh/start", async (request, reply) => {
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
  });

  // POST /cookies/auto-refresh/stop - Stop automatic refresh
  app.post("/cookies/auto-refresh/stop", async (request, reply) => {
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
  });

  // GET /cookies/auto-refresh/status - Get auto-refresh status
  app.get("/cookies/auto-refresh/status", async (request, reply) => {
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
  });
}
