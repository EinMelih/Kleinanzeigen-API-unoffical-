/**
 * OAuth Routes - /oauth/*
 * Handles Microsoft and Gmail OAuth2 authentication
 */
import { FastifyInstance } from "fastify";
import { getOAuth2EmailService, loadTokens } from "../services/oauth2";

export async function oauthRoutes(app: FastifyInstance): Promise<void> {
  // GET /oauth/microsoft/auth - Get Microsoft authorization URL
  app.get("/oauth/microsoft/auth", async (request, reply) => {
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
  });

  // GET /oauth/microsoft/callback - Handle Microsoft OAuth callback
  app.get("/oauth/microsoft/callback", async (request, reply) => {
    try {
      const { code, error } = request.query as {
        code?: string;
        error?: string;
      };

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
  });

  // GET /oauth/gmail/auth - Get Gmail authorization URL
  app.get("/oauth/gmail/auth", async (request, reply) => {
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
  });

  // GET /oauth/gmail/callback - Handle Gmail OAuth callback
  app.get("/oauth/gmail/callback", async (request, reply) => {
    try {
      const { code, error } = request.query as {
        code?: string;
        error?: string;
      };

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
  });

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
    async (request, reply) => {
      try {
        const { email, timeout = 60000 } = request.body;
        const tokens = loadTokens(email);

        if (!tokens) {
          return reply.status(400).send({
            status: "not_authorized",
            message:
              "Email not authorized. Please authorize via /oauth/microsoft/auth or /oauth/gmail/auth first",
            authUrls: {
              microsoft:
                "/oauth/microsoft/auth?email=" + encodeURIComponent(email),
              gmail: "/oauth/gmail/auth?email=" + encodeURIComponent(email),
            },
          });
        }

        const oauth2Service = getOAuth2EmailService();
        const result = await oauth2Service.verifyKleinanzeigenEmail(
          email,
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
        request.log.error({ err }, "OAuth email verification failed");
        return reply.status(500).send({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "OAuth email verification failed",
        });
      }
    }
  );

  // GET /oauth/status/:email - Check OAuth authorization status
  app.get<{ Params: { email: string } }>(
    "/oauth/status/:email",
    async (request, reply) => {
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

        const isExpired = tokens.expiresAt < Date.now();

        return reply.send({
          status: "authorized",
          email,
          authorized: true,
          provider: tokens.provider,
          expiresAt: new Date(tokens.expiresAt).toISOString(),
          isExpired,
          message: isExpired
            ? "Token expired, may need to re-authorize"
            : "Token valid",
        });
      } catch (err) {
        request.log.error({ err }, "OAuth status check failed");
        return reply.status(500).send({
          status: "error",
          message:
            err instanceof Error ? err.message : "OAuth status check failed",
        });
      }
    }
  );
}
