/**
 * Auth Routes - /auth/*
 * Handles login, status checks, and email verification
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { LoginRequestBody } from "../../shared/types";
import { AppStateService } from "../services/app-state.service";
import { loadAppConfig } from "../services/app-config";
import {
  checkAllUsersAuthStatus,
  checkLoginStatus,
} from "../services/auth-status";
import { CookieValidator } from "../services/cookies-validation";
import { EmailVerificationService } from "../services/email-verification";
import { BrowserEmailVerificationService } from "../services/email-verification-browser";
import { ManualModeService } from "../services/manual-mode.service";
import { SessionProfileService } from "../services/session-profile.service";
import { sendTelegramNotification } from "../services/telegram.service";
import { performLogin } from "../workers/auth-login";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/login - Login to Kleinanzeigen
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
        console.log("Starting login process...");
        const result = await performLogin({ email, password });

        if (result.ok && result.loggedIn) {
          const config = loadAppConfig();
          if (config.telegramNotificationsEnabled && config.notifyOnSuccessfulLogin) {
            const appState = new AppStateService();
            const telegramResult = await sendTelegramNotification(
              [
                "Kleinanzeigen Login erfolgreich",
                `Account: ${email}`,
                `Zeit: ${new Date().toLocaleString("de-DE", {
                  timeZone: "Europe/Berlin",
                })}`,
              ].join("\n")
            );
            appState.recordTelegramEvent(telegramResult);
          }

          return reply.send({
            status: "login_successful",
            message: "Login completed successfully",
            loggedIn: result.loggedIn,
            needsLogin: !result.loggedIn,
            cookieFile: result.cookieFile,
            ...(result.debugPort !== undefined
              ? { debugPort: result.debugPort }
              : {}),
            ...(result.profileDir ? { profileDir: result.profileDir } : {}),
            ...(result.sessionMode ? { sessionMode: result.sessionMode } : {}),
          });
        } else if (result.manualLoginRequired) {
          return reply.status(409).send({
            status: "manual_login_required",
            message:
              result.message ||
              "No active session found. Start the manual login flow.",
            loggedIn: false,
            needsLogin: true,
            manualLoginRequired: true,
            cookieFile: result.cookieFile,
            ...(result.debugPort !== undefined
              ? { debugPort: result.debugPort }
              : {}),
            ...(result.profileDir ? { profileDir: result.profileDir } : {}),
            ...(result.sessionMode ? { sessionMode: result.sessionMode } : {}),
            error: result.error || "MANUAL_LOGIN_REQUIRED",
          });
        } else if (result.requiresEmailVerification) {
          return reply.status(200).send({
            status: "requires_email_verification",
            message: result.message || "Email verification required",
            loggedIn: false,
            needsLogin: true,
            requiresEmailVerification: true,
            verificationReason: result.verificationReason,
            cookieFile: result.cookieFile,
            ...(result.debugPort !== undefined
              ? { debugPort: result.debugPort }
              : {}),
            ...(result.profileDir ? { profileDir: result.profileDir } : {}),
            ...(result.sessionMode ? { sessionMode: result.sessionMode } : {}),
          });
        } else if (result.didSubmit) {
          return reply.status(401).send({
            status: "login_not_verified",
            message:
              result.message ||
              "Login form was submitted, but no authenticated session was detected",
            loggedIn: false,
            needsLogin: true,
            didSubmit: true,
            cookieFile: result.cookieFile,
            ...(result.debugPort !== undefined
              ? { debugPort: result.debugPort }
              : {}),
            ...(result.profileDir ? { profileDir: result.profileDir } : {}),
            ...(result.sessionMode ? { sessionMode: result.sessionMode } : {}),
            error:
              result.error ||
              "Kleinanzeigen session could not be verified after submitting credentials",
          });
        } else {
          return reply.status(400).send({
            status: "login_failed",
            message: "Login failed",
            loggedIn: false,
            needsLogin: true,
            ...(result.debugPort !== undefined
              ? { debugPort: result.debugPort }
              : {}),
            ...(result.profileDir ? { profileDir: result.profileDir } : {}),
            ...(result.sessionMode ? { sessionMode: result.sessionMode } : {}),
            error: result.error,
          });
        }
      } catch (err) {
        request.log.error({ err }, "login failed");
        return reply.status(500).send({
          status: "error",
          message: err instanceof Error ? err.message : "Login failed",
        });
      }
    }
  );

  app.post<{ Body: { email: string } }>(
    "/auth/manual-login/start",
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
    async (request, reply) => {
      try {
        const { email } = request.body;
        const sessionProfiles = new SessionProfileService();
        const result = await sessionProfiles.startManualLogin(email);

        return reply.send({
          status: "manual_login_started",
          message:
            "Chrome mit persistentem Profil wurde geoeffnet. Bitte im Browser manuell einloggen und danach die Session verifizieren.",
          email,
          loginUrl: result.loginUrl,
          alreadyRunning: result.alreadyRunning,
          profile: result.status,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        request.log.error({ err }, "manual login start failed");
        return reply.status(400).send({
          status: "manual_login_start_failed",
          message:
            err instanceof Error
              ? err.message
              : "Manual login flow could not be started",
        });
      }
    }
  );

  app.post<{ Body: { email: string } }>(
    "/auth/manual-login/complete",
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
    async (request, reply) => {
      try {
        const { email } = request.body;
        const sessionProfiles = new SessionProfileService();
        const result = await sessionProfiles.verifySession(email, {
          startIfNeeded: true,
          saveCookies: true,
          source: "auth:manual-complete",
        });

        if (result.loggedIn) {
          const config = loadAppConfig();
          if (config.telegramNotificationsEnabled && config.notifyOnSuccessfulLogin) {
            const appState = new AppStateService();
            const telegramResult = await sendTelegramNotification(
              [
                "Kleinanzeigen Session verifiziert",
                `Account: ${email}`,
                `Zeit: ${new Date().toLocaleString("de-DE", {
                  timeZone: "Europe/Berlin",
                })}`,
              ].join("\n")
            );
            appState.recordTelegramEvent(telegramResult);
          }
        }

        return reply.status(result.loggedIn ? 200 : 400).send({
          status: result.loggedIn
            ? "manual_login_verified"
            : "manual_login_pending",
          message: result.loggedIn
            ? "Session wurde verifiziert und Cookies wurden exportiert."
            : result.error || "Session ist noch nicht authentifiziert.",
          email,
          loggedIn: result.loggedIn,
          cookiesInFile: result.cookieCount,
          profile: result.status,
          ...(result.error ? { error: result.error } : {}),
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        request.log.error({ err }, "manual login completion failed");
        return reply.status(500).send({
          status: "manual_login_error",
          message:
            err instanceof Error
              ? err.message
              : "Manual login verification failed",
        });
      }
    }
  );

  app.get<{ Params: { email: string } }>(
    "/auth/manual-login/status/:email",
    async (request, reply) => {
      try {
        const { email } = request.params;
        const sessionProfiles = new SessionProfileService();
        const status = await sessionProfiles.getStatus(email);

        return reply.send({
          status: "success",
          email,
          profile: status,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        request.log.error({ err }, "manual login status failed");
        return reply.status(500).send({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Manual login status failed",
        });
      }
    }
  );

  // POST /auth/verify-email - Verify via IMAP
  app.post<{
    Body: { email: string; emailPassword: string; timeout?: number };
  }>(
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
    async (request, reply) => {
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

  // POST /auth/verify-email-browser - Verify via browser (Microsoft/Outlook)
  app.post<{
    Body: { email: string; emailPassword: string; timeout?: number };
  }>(
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
    async (request, reply) => {
      try {
        const { email, emailPassword, timeout = 60000 } = request.body;
        console.log(
          `🌐 Starting browser-based email verification for ${email}...`
        );

        const verificationService = new BrowserEmailVerificationService();
        const result = await verificationService.verifyLogin(
          email,
          emailPassword,
          timeout
        );

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
        request.log.error({ err }, "browser email verification failed");
        return reply.status(500).send({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Browser email verification failed",
        });
      }
    }
  );

  // GET /auth/status/:email - Check login status
  app.get<{ Params: { email: string } }>(
    "/auth/status/:email",
    async (request, reply) => {
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

  // POST /auth/check-login - Real-time login check
  app.post<{ Body: { email: string } }>(
    "/auth/check-login",
    {
      schema: {
        body: {
          type: "object",
          properties: { email: { type: "string" } },
          required: ["email"],
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const { email } = request.body;
        const manualMode = new ManualModeService();
        const sessionProfiles = new SessionProfileService();
        const profileStatus = await sessionProfiles.getStatus(email);

        if (manualMode.isEnabled()) {
          const validator = new CookieValidator();
          const cookiePath = path.join(
            process.cwd(),
            "data",
            "cookies",
            `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
          );
          const cookieDetails = fs.existsSync(cookiePath)
            ? await validator.checkCookieExpiry(cookiePath)
            : null;

          return reply.send({
            status:
              profileStatus.state === "authenticated"
                ? "logged_in"
                : "manual_mode_only",
            message:
              profileStatus.state === "authenticated"
                ? "Manual-only mode aktiv. Letzter bekannter Profilstatus ist eingeloggt."
                : "Manual-only mode aktiv. Es wurde kein Live-Check gegen Kleinanzeigen ausgefuehrt.",
            loggedIn: profileStatus.state === "authenticated",
            cookiesInFile: cookieDetails?.cookieCount ?? 0,
            lastValidated:
              profileStatus.lastVerifiedAt ??
              cookieDetails?.lastValidated?.toISOString(),
            profile: profileStatus,
            error:
              profileStatus.state === "authenticated"
                ? undefined
                : "MANUAL_MODE_ONLY",
            timestamp: new Date().toISOString(),
          });
        }

        if (profileStatus.profileExists) {
          const sessionResult = await sessionProfiles.verifySession(email, {
            startIfNeeded: true,
            saveCookies: true,
            source: "auth:check-login",
          });

          return reply.send({
            status: sessionResult.loggedIn ? "logged_in" : "not_logged_in",
            message: sessionResult.loggedIn
              ? "User is currently logged in via persistent profile"
              : sessionResult.error || "User is not logged in",
            loggedIn: sessionResult.loggedIn,
            cookiesInFile: sessionResult.cookieCount,
            lastValidated: sessionResult.status.lastVerifiedAt,
            profile: sessionResult.status,
            ...(sessionResult.error ? { error: sessionResult.error } : {}),
            timestamp: new Date().toISOString(),
          });
        }

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

        const result = await validator.testCookieLogin(cookiePath);
        return reply.send({
          status: result.isValid ? "logged_in" : "not_logged_in",
          message: result.isValid
            ? "User is currently logged in"
            : "User is not logged in",
          loggedIn: result.isValid,
          cookiesInFile: result.cookieCount,
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

  // GET /auth/users - Check all users status
  app.get("/auth/users", async (request, reply) => {
    try {
      const result = await checkAllUsersAuthStatus();
      return reply.send(result);
    } catch (err) {
      request.log.error({ err }, "users status check failed");
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Users status check failed",
      });
    }
  });
}
