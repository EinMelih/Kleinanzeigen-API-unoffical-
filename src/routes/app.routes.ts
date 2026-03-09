import { FastifyInstance } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { emailToSlug } from "../../shared/utils";
import { CookieValidator } from "../services/cookies-validation";
import {
  AppConfigSummary,
  getAppConfigSummary,
  getConfigPath,
  saveAppConfig,
} from "../services/app-config";
import { PlatformGuardService } from "../services/platform-guard.service";
import { sendTelegramTestMessage } from "../services/telegram.service";

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
      summary: "Browserautomation, Cookie-Erzeugung und Login-Checks sind aktiv.",
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
      summary: "Live-Suche, Bulk-Scrape, lokale Trefferordner und Bild-Serving sind aktiv.",
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
      endpoint: "POST /message/send",
      summary: "Backend-Endpunkte existieren, die UI-Seite ist aber noch eine Vorschau.",
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
      status: config.hasTelegramBotToken && config.hasTelegramChatId ? "partial" : "planned",
      page: "/settings",
      endpoint: "POST /app/telegram/test",
      summary:
        config.hasTelegramBotToken && config.hasTelegramChatId
          ? "Token und Chat-ID koennen getestet werden, automatische Event-Hooks folgen spaeter."
          : "UI und Testversand sind vorbereitet, es fehlt noch die volle Automatisierung.",
    },
    {
      key: "ai_integration",
      title: "KI Integration",
      status: config.ai.configured ? "partial" : "planned",
      page: "/settings",
      summary: config.ai.configured
        ? "AI Provider ist konfiguriert, die produktive Analysekette ist als naechster Schritt vorgesehen."
        : "Provider/Key sind noch nicht gesetzt. Heuristische Analyse ist aktiv, KI folgt spaeter.",
    },
    {
      key: "database",
      title: "Persistenz / Datenbank",
      status: "planned",
      page: "/settings",
      summary: "Aktuell lokale JSON-Datei. Supabase-Schema ist vorbereitet, Migration folgt spaeter.",
    },
    {
      key: "ui_prototypes",
      title: "Ads, Items, Radar, Profil",
      status: "preview",
      page: "/items",
      summary: "Diese Seiten sind sichtbar, aber noch nicht an echte Backend-Daten angeschlossen.",
    },
  ];
}

function buildWarnings(config: AppConfigSummary): string[] {
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
      const result = await sendTelegramTestMessage(request.body?.message);
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

  app.get("/app/overview", async (_request, reply) => {
    try {
      const config = getAppConfigSummary();
      const validator = new CookieValidator();
      const platformGuard = new PlatformGuardService();
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
          isLoggedIn:
            accountCookieStatus?.isValid === true && accountCookieExists,
          cookieCount: accountCookieStatus?.cookieCount ?? 0,
          lastValidated:
            accountCookieStatus?.lastValidated?.toISOString() ?? null,
          nextExpiry: accountCookieStatus?.nextExpiry?.toISOString() ?? null,
          validityDuration: accountCookieStatus?.validityDuration ?? "Unknown",
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
        platformGuard: {
          blocked: platformStatus.blocked,
          state: platformStatus.state ?? null,
        },
        warnings: buildWarnings(config),
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
