/**
 * Kleinanzeigen API Server
 *
 * Clean, modular Fastify server setup.
 * All route logic is in src/routes/*.routes.ts
 */
import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";
import { CookieValidator } from "../services/cookies-validation";
import { getAppConfigSummary } from "../services/app-config";
import { ManualModeService } from "../services/manual-mode.service";
import { PlatformGuardService } from "../services/platform-guard.service";
import { SessionProfileService } from "../services/session-profile.service";
import { serverController } from "../controllers/server-controller";

// Import all routes
import {
  appRoutes,
  authRoutes,
  cookieRoutes,
  messageRoutes,
  oauthRoutes,
  searchRoutes,
  sniperRoutes,
  tokenRoutes,
} from "../routes";

// Create Fastify instance
const app: FastifyInstance = Fastify({
  logger: true,
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", async () => {
  try {
    const validator = new CookieValidator();
    const config = getAppConfigSummary();
    const manualMode = new ManualModeService().getState();
    const platformGuard = new PlatformGuardService();
    const sessionProfiles = new SessionProfileService();
    const stats = await validator.getCookieStats();
    const platformStatus = platformGuard.isBlocked();
    const sessionProfile = config.accountEmail
      ? await sessionProfiles.getStatus(config.accountEmail)
      : null;

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
      runtime: {
        manualModeOnly: manualMode.enabled,
        message: manualMode.message,
      },
      account: {
        email: config.accountEmail,
        configured: config.accountEmail.trim().length > 0,
        isLoggedIn: sessionProfile?.state === "authenticated",
        sessionState: sessionProfile?.state ?? "not_started",
        debugPort: sessionProfile?.debugPort,
        chromeRunning: sessionProfile?.chromeRunning ?? false,
        lastVerifiedAt: sessionProfile?.lastVerifiedAt,
        lastSuccessfulLoginAt: sessionProfile?.lastSuccessfulLoginAt,
        lastError: sessionProfile?.lastError,
      },
      platformGuard: {
        blocked: platformStatus.blocked,
        state: platformStatus.state ?? null,
      },
    };
  } catch {
    return {
      ok: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
      cookies: { error: "Failed to get cookie stats" },
      chrome: { status: "running", port: 9222 },
      runtime: {
        manualModeOnly: true,
        message: "Health check fallback mode",
      },
      account: {
        email: "",
        configured: false,
        isLoggedIn: false,
        sessionState: "error",
        chromeRunning: false,
      },
      platformGuard: {
        blocked: false,
        state: null,
      },
    };
  }
});

// ============================================
// REGISTER ROUTES
// ============================================

// App overview and local settings
app.register(appRoutes);

// Auth routes: /auth/*
app.register(authRoutes);

// Cookie routes: /cookies/*
app.register(cookieRoutes);

// Message routes: /message/*
app.register(messageRoutes);

// OAuth routes: /oauth/*
app.register(oauthRoutes);

// Token routes: /tokens/*
app.register(tokenRoutes);

// Search routes: /search/*
app.register(searchRoutes);

// Sniper analysis, message generation and dry-run testing
app.register(sniperRoutes);

// Server controller (existing)
app.register(serverController);

// ============================================
// SERVER START
// ============================================

async function startServer(): Promise<void> {
  try {
    const port = parseInt(process.env["PORT"] || "87");
    const host = process.env["HOST"] || "0.0.0.0";

    await app.listen({ port, host });
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
