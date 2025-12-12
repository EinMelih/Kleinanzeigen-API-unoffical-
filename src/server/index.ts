/**
 * Kleinanzeigen API Server
 *
 * Clean, modular Fastify server setup.
 * All route logic is in src/routes/*.routes.ts
 */
import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";
import { CookieValidator } from "../services/cookies-validation";
import { serverController } from "../controllers/server-controller";

// Import all routes
import {
  authRoutes,
  cookieRoutes,
  oauthRoutes,
  searchRoutes,
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
  } catch {
    return {
      ok: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
      cookies: { error: "Failed to get cookie stats" },
      chrome: { status: "running", port: 9222 },
    };
  }
});

// ============================================
// REGISTER ROUTES
// ============================================

// Auth routes: /auth/*
app.register(authRoutes);

// Cookie routes: /cookies/*
app.register(cookieRoutes);

// OAuth routes: /oauth/*
app.register(oauthRoutes);

// Token routes: /tokens/*
app.register(tokenRoutes);

// Search routes: /search/*
app.register(searchRoutes);

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
