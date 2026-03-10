import { FastifyInstance } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { emailToSlug } from "../../shared/utils";
import { CookieValidator } from "../services/cookies-validation";
import { AppStateService } from "../services/app-state.service";
import {
  AppConfigSummary,
  getAppConfigSummary,
  getConfigPath,
  saveAppConfig,
} from "../services/app-config";
import { ManualModeService } from "../services/manual-mode.service";
import { PlatformGuardService } from "../services/platform-guard.service";
import { PlatformProfileService } from "../services/platform-profile.service";
import { SessionProfileService } from "../services/session-profile.service";
import { sendTelegramTestMessage } from "../services/telegram.service";
import { SessionProfileStatus } from "../services/session-profile.service";

type FeatureStatus = "live" | "partial" | "preview" | "planned";

interface FeatureItem {
  key: string;
  title: string;
  status: FeatureStatus;
  page: string;
  endpoint?: string;
  summary: string;
}

function getCookieFilePath(email: string): string {
  return path.join(
    process.cwd(),
    "data",
    "cookies",
    `cookies-${emailToSlug(email)}.json`
  );
}

function buildFeatureItems(config: AppConfigSummary): FeatureItem[] {
  return [
    {
      key: "dashboard_overview",
      title: "Dashboard / Systemstatus",
      status: "live",
      page: "/",
      endpoint: "GET /app/overview",
      summary: "Zeigt echten API-, Cookie- und Konfigurationsstatus statt Mock-Zahlen.",
    },
    {
      key: "auth_login",
      title: "Kleinanzeigen Login",
      status: "live",
      page: "/auth/login",
      endpoint: "POST /auth/login",
      summary: config.manualModeOnly
        ? "Manual-only mode ist aktiv. Nutze den manuellen Profil-Login und Session-Reuse."
        : "Automatischer Login, manueller Profil-Login und Session-Reuse mit persistentem Browserprofil sind aktiv.",
    },
    {
      key: "cookie_management",
      title: "Cookie Management",
      status: "live",
      page: "/cookies",
      endpoint: "GET /cookies/*",
      summary: "Status, Refresh, Cleanup und Auto-Refresh sind nutzbar.",
    },
    {
      key: "search_scraping",
      title: "Search / Scraping",
      status: "live",
      page: "/search",
      endpoint: "POST /search, POST /scrape",
      summary: config.manualModeOnly
        ? "Search-Endpunkte sind vorhanden, aber im Manual-only mode fuer Live-Requests gesperrt."
        : "Live-Suche, Bulk-Scrape, lokale Trefferordner und Bild-Serving sind aktiv.",
    },
    {
      key: "sniper_analysis",
      title: "Sniper Analyse / Testfunktion",
      status: "live",
      page: "/",
      endpoint: "POST /sniper/analyze, POST /sniper/test",
      summary:
        "Heuristische Filter-, Preis- und Fake-Analyse sowie Dry-Run-/Live-Test fuer Nachrichten sind verfuegbar.",
    },
    {
      key: "messaging",
      title: "Nachrichten an Anbieter",
      status: "live",
      page: "/messages",
      endpoint: "POST /message/send, GET /app/messages",
      summary: config.manualModeOnly
        ? "Messaging-Endpunkte sind vorhanden, aber im Manual-only mode fuer Live-Requests gesperrt."
        : "Nachrichtenversand, Conversation-Refresh und die Messages-UI laufen ueber echte lokale und Live-Daten.",
    },
    {
      key: "oauth_verification",
      title: "Email/OAuth Verifikation",
      status:
        config.oauth.microsoftConfigured || config.oauth.gmailConfigured
          ? "live"
          : "partial",
      page: "/auth/login",
      endpoint: "GET /oauth/*, POST /oauth/verify-email",
      summary:
        config.oauth.microsoftConfigured || config.oauth.gmailConfigured
          ? "OAuth-Provider sind konfiguriert."
          : "Endpunkte sind da, aber Microsoft/Gmail OAuth ist noch nicht hinterlegt.",
    },
    {
      key: "telegram_notifications",
      title: "Telegram Benachrichtigungen",
      status:
        config.hasTelegramBotToken && config.hasTelegramChatId
          ? "live"
          : config.hasTelegramBotToken
          ? "partial"
          : "planned",
      page: "/settings",
      endpoint: "POST /app/telegram/test",
      summary:
        config.hasTelegramBotToken && config.hasTelegramChatId
          ? "Testversand und Event-Hooks fuer Search/Message stehen bereit."
          : "UI und Event-Hooks sind vorbereitet, es fehlt noch mindestens die Chat-ID.",
    },
    {
      key: "ai_integration",
      title: "KI Integration",
      status: config.ai.configured ? "partial" : "partial",
      page: "/settings",
      summary: config.ai.configured
        ? "Heuristische Analyse ist live und kann mit einem externen Provider erweitert werden."
        : "Heuristische Analyse ist aktiv. Ein externer Provider wird aktiv, sobald der API-Key gesetzt ist.",
    },
    {
      key: "database",
      title: "Persistenz / Datenbank",
      status: "partial",
      page: "/settings",
      summary:
        "Lokale JSON-Persistenz fuer Listings, Messages, Notifications und Profil ist aktiv. Supabase-Migration folgt spaeter.",
    },
    {
      key: "items_tracking",
      title: "Items / Tracking",
      status: "live",
      page: "/items",
      endpoint: "GET /app/items",
      summary: "Tracked Listings aus Search, Scrape und Messaging werden lokal gespeichert und in der UI angezeigt.",
    },
    {
      key: "radar_notifications",
      title: "Radar / Notifications",
      status: "live",
      page: "/radar",
      endpoint: "GET /app/radar",
      summary: "Notifications und Message-Highlights kommen aus dem lokalen Event-Store statt aus Mock-Daten.",
    },
    {
      key: "profile_runtime",
      title: "Profil / Account Runtime",
      status: "live",
      page: "/profile",
      endpoint: "GET /app/profile, POST /app/profile/sync",
      summary: "Profil-UI zeigt lokalen App-Status plus optionalen Sync gegen das eingeloggte Kleinanzeigen-Profil.",
    },
  ];
}

function buildWarnings(
  config: AppConfigSummary,
  sessionProfile: SessionProfileStatus | null,
  platformStatus: ReturnType<PlatformGuardService["isBlocked"]>
): string[] {
  const warnings: string[] = [];

  if (!config.accountEmail.trim()) {
    warnings.push("Kein Standard-Account gesetzt.");
  }

  if (!config.hasAccountPassword) {
    warnings.push("Kein Kleinanzeigen-Passwort gespeichert.");
  }

  if (!config.hasTelegramBotToken) {
    warnings.push("Telegram Bot Token fehlt.");
  } else if (!config.hasTelegramChatId) {
    warnings.push("Telegram Chat ID fehlt fuer Testnachrichten.");
  }

  if (!config.oauth.microsoftConfigured && !config.oauth.gmailConfigured) {
    warnings.push("OAuth Email-Verifikation ist noch nicht konfiguriert.");
  }

  if (!config.ai.configured) {
    warnings.push("AI Provider ist noch nicht konfiguriert.");
  }

  if (config.manualModeOnly) {
    warnings.push(
      "Manual-only mode ist aktiv. Automatische Live-Requests gegen Kleinanzeigen sind serverseitig gesperrt."
    );
  }

  if (platformStatus.blocked && platformStatus.state) {
    warnings.push(
      `Kleinanzeigen blockiert aktuell Live-Zugriffe bis ${platformStatus.state.blockedUntil}.`
    );
  }

  if (sessionProfile?.state === "needs_reauth") {
    warnings.push("Das persistente Browser-Profil braucht einen neuen Login.");
  }

  if (sessionProfile?.state === "pending_manual_login") {
    warnings.push(
      "Ein manueller Profil-Login wurde gestartet, aber noch nicht verifiziert."
    );
  }

  if (sessionProfile?.state === "error" && sessionProfile.lastError) {
    warnings.push(`Session-Profilfehler: ${sessionProfile.lastError}`);
  }

  warnings.push("Persistenz laeuft aktuell ueber lokale Dateien statt Datenbank.");

  return warnings;
}

function getLocalSearchStats(): { folderCount: number; articleFolders: number } {
  const searchRoot = path.join(process.cwd(), "data", "images", "search");

  if (!fs.existsSync(searchRoot)) {
    return { folderCount: 0, articleFolders: 0 };
  }

  const folders = fs
    .readdirSync(searchRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  const articleFolders = folders.reduce((total, folder) => {
    const folderPath = path.join(searchRoot, folder.name);
    const count = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory()).length;

    return total + count;
  }, 0);

  return {
    folderCount: folders.length,
    articleFolders,
  };
}

export async function appRoutes(app: FastifyInstance): Promise<void> {
  app.get("/app/config", async (_request, reply) => {
    try {
      return reply.send({
        status: "success",
        config: getAppConfigSummary(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Konfiguration konnte nicht geladen werden",
      });
    }
  });

  app.put<{
    Body: {
      accountEmail?: string;
      accountPassword?: string;
      telegramBotToken?: string;
      telegramChatId?: string;
      telegramNotificationsEnabled?: boolean;
      notifyOnSuccessfulLogin?: boolean;
      notifyOnSearchRuns?: boolean;
      manualModeOnly?: boolean;
    };
  }>("/app/config", async (request, reply) => {
    try {
      const nextConfig = saveAppConfig(request.body);

      return reply.send({
        status: "success",
        message: "Konfiguration gespeichert",
        config: {
          ...getAppConfigSummary(),
          ...nextConfig,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Konfiguration konnte nicht gespeichert werden",
      });
    }
  });

  app.post<{
    Body: {
      message?: string;
    };
  }>("/app/telegram/test", async (request, reply) => {
    try {
      const appState = new AppStateService();
      const result = await sendTelegramTestMessage(request.body?.message);
      appState.recordTelegramEvent(result);
      return reply.status(result.success ? 200 : 400).send(result);
    } catch (err) {
      return reply.status(500).send({
        success: false,
        message: "Telegram Test fehlgeschlagen",
        error: err instanceof Error ? err.message : "Unbekannter Fehler",
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/app/items", async (_request, reply) => {
    try {
      const appState = new AppStateService();
      const items = appState.getItems();

      return reply.send({
        status: "success",
        count: items.length,
        items,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Items konnten nicht geladen werden",
      });
    }
  });

  app.get("/app/messages", async (_request, reply) => {
    try {
      const appState = new AppStateService();
      const conversations = appState.getMessages();

      return reply.send({
        status: "success",
        conversationCount: conversations.length,
        conversations,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Messages konnten nicht geladen werden",
      });
    }
  });

  app.post<{
    Body: {
      email?: string;
    };
  }>("/app/messages/refresh", async (request, reply) => {
    try {
      const config = getAppConfigSummary();
      const email = request.body?.email || config.accountEmail;
      const manualMode = new ManualModeService();

      if (manualMode.isEnabled()) {
        return reply.status(403).send({
          status: "manual_mode_only",
          message: manualMode.getState().message,
        });
      }

      if (!email.trim()) {
        return reply.status(400).send({
          status: "error",
          message: "Kein Account fuer den Conversation-Refresh gesetzt.",
        });
      }

      const messageService = (
        await import("../services/message.service")
      ).messageService;
      const conversations = await messageService.getConversations(email);

      return reply.send({
        status: "success",
        conversationCount: conversations.length,
        conversations,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Conversation-Refresh ist fehlgeschlagen",
      });
    }
  });

  app.get("/app/radar", async (_request, reply) => {
    try {
      const appState = new AppStateService();
      const radar = appState.getRadarSnapshot();

      return reply.send({
        status: "success",
        ...radar,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Radar konnte nicht geladen werden",
      });
    }
  });

  app.post<{ Params: { id: string } }>(
    "/app/notifications/:id/read",
    async (request, reply) => {
      try {
        const appState = new AppStateService();
        const notification = appState.markNotificationRead(request.params.id);

        if (!notification) {
          return reply.status(404).send({
            status: "error",
            message: "Notification nicht gefunden",
          });
        }

        return reply.send({
          status: "success",
          notification,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        return reply.status(500).send({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Notification konnte nicht aktualisiert werden",
        });
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/app/notifications/:id",
    async (request, reply) => {
      try {
        const appState = new AppStateService();
        const removed = appState.deleteNotification(request.params.id);

        return reply.status(removed ? 200 : 404).send({
          status: removed ? "success" : "error",
          message: removed ? "Notification geloescht" : "Notification nicht gefunden",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        return reply.status(500).send({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Notification konnte nicht geloescht werden",
        });
      }
    }
  );

  app.delete("/app/notifications", async (_request, reply) => {
    try {
      const appState = new AppStateService();
      appState.clearNotifications();

      return reply.send({
        status: "success",
        message: "Notifications geleert",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Notifications konnten nicht geleert werden",
      });
    }
  });

  app.get("/app/profile", async (_request, reply) => {
    try {
      const appState = new AppStateService();
      const profile = appState.getProfile();
      const savedSearches = appState.getSavedSearches();
      const recentItems = appState.getItems().slice(0, 8);

      return reply.send({
        status: "success",
        profile,
        savedSearches,
        recentItems,
        statePath: appState.getStatePath(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Profil konnte nicht geladen werden",
      });
    }
  });

  app.put<{
    Body: {
      displayName?: string;
      summary?: string;
    };
  }>("/app/profile", async (request, reply) => {
    try {
      const appState = new AppStateService();
      const profile = appState.updateProfile({
        displayName: request.body.displayName,
        summary: request.body.summary,
      });

      return reply.send({
        status: "success",
        profile,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Profil konnte nicht gespeichert werden",
      });
    }
  });

  app.post<{
    Body: {
      email?: string;
    };
  }>("/app/profile/sync", async (request, reply) => {
    try {
      const config = getAppConfigSummary();
      const email = request.body?.email || config.accountEmail;
      const manualMode = new ManualModeService();

      if (manualMode.isEnabled()) {
        return reply.status(403).send({
          status: "manual_mode_only",
          message: manualMode.getState().message,
        });
      }

      if (!email.trim()) {
        return reply.status(400).send({
          status: "error",
          message: "Kein Account fuer den Profil-Sync gesetzt.",
        });
      }

      const profileService = new PlatformProfileService();
      const appState = new AppStateService();
      const snapshot = await profileService.syncProfile(email);
      const profile = appState.syncProfile({
        displayName: snapshot.displayName,
        email: snapshot.email,
        accountType: snapshot.accountType,
        memberSince: snapshot.memberSince,
        activeAds: snapshot.activeAds,
        summary: snapshot.summary,
      });

      return reply.send({
        status: "success",
        profile,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Profil-Sync ist fehlgeschlagen",
      });
    }
  });

  app.get("/app/overview", async (_request, reply) => {
    try {
      const config = getAppConfigSummary();
      const validator = new CookieValidator();
      const manualMode = new ManualModeService().getState();
      const platformGuard = new PlatformGuardService();
      const sessionProfiles = new SessionProfileService();
      const platformStatus = platformGuard.isBlocked();
      const cookieStats = await validator.getCookieStats();
      const cookiePath = config.accountEmail
        ? getCookieFilePath(config.accountEmail)
        : "";
      const accountCookieExists = cookiePath ? fs.existsSync(cookiePath) : false;
      const accountCookieStatus =
        accountCookieExists && cookiePath
          ? await validator.checkCookieExpiry(cookiePath)
          : null;
      const sessionProfile =
        config.accountEmail.trim().length > 0
          ? await sessionProfiles.getStatus(config.accountEmail)
          : null;
      const localSearchStats = getLocalSearchStats();

      return reply.send({
        status: "success",
        generatedAt: new Date().toISOString(),
        config,
        account: {
          email: config.accountEmail,
          configured: config.accountEmail.trim().length > 0,
          cookieFileExists: accountCookieExists,
          cookiePath: accountCookieExists ? cookiePath : undefined,
          isLoggedIn: sessionProfile
            ? sessionProfile.state === "authenticated"
            : accountCookieStatus?.isValid === true && accountCookieExists,
          cookieCount: accountCookieStatus?.cookieCount ?? 0,
          lastValidated:
            accountCookieStatus?.lastValidated?.toISOString() ?? null,
          nextExpiry: accountCookieStatus?.nextExpiry?.toISOString() ?? null,
          validityDuration: accountCookieStatus?.validityDuration ?? "Unknown",
          sessionProfile,
        },
        cookies: {
          ...cookieStats,
          nextExpiry: cookieStats.nextExpiry?.toISOString() ?? null,
        },
        localSearches: localSearchStats,
        database: {
          mode: "local_files",
          target: "supabase",
          schemaPath: path.join(process.cwd(), "docs", "SUPABASE_APP_SCHEMA.sql"),
          configPath: getConfigPath(),
        },
        runtime: {
          manualModeOnly: manualMode.enabled,
          message: manualMode.message,
        },
        platformGuard: {
          blocked: platformStatus.blocked,
          state: platformStatus.state ?? null,
        },
        warnings: buildWarnings(config, sessionProfile, platformStatus),
        features: buildFeatureItems(config),
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Overview konnte nicht geladen werden",
      });
    }
  });
}
