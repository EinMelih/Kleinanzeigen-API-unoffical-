/**
 * Auth Routes - /auth/*
 * Handles login, status checks, and email verification
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { LoginRequestBody } from "../../shared/types";
import {
  checkAllUsersAuthStatus,
  checkLoginStatus,
} from "../services/auth-status";
import { CookieValidator } from "../services/cookies-validation";
import { EmailVerificationService } from "../services/email-verification";
import { BrowserEmailVerificationService } from "../services/email-verification-browser";
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

        if (result.ok) {
          return reply.send({
            status: "login_successful",
            message: "Login completed successfully",
            loggedIn: result.loggedIn,
            needsLogin: !result.loggedIn,
            cookieFile: result.cookieFile,
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
        request.log.error({ err }, "login failed");
        return reply.status(500).send({
          status: "error",
          message: err instanceof Error ? err.message : "Login failed",
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
