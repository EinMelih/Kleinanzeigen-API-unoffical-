import * as fs from "fs";
import * as path from "path";

export interface StoredAppConfig {
  accountEmail: string;
  accountPassword: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramNotificationsEnabled: boolean;
  notifyOnSuccessfulLogin: boolean;
  notifyOnSearchRuns: boolean;
  updatedAt: string;
}

export interface AppConfigSummary extends StoredAppConfig {
  envFilePresent: boolean;
  hasAccountPassword: boolean;
  hasTelegramBotToken: boolean;
  hasTelegramChatId: boolean;
  ai: {
    enabled: boolean;
    provider: string;
    model: string;
    configured: boolean;
  };
  oauth: {
    microsoftConfigured: boolean;
    gmailConfigured: boolean;
  };
  persistence: "local_files";
  configPath: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "app-config.json");
const ENV_PATH = path.join(process.cwd(), ".env");

function createDefaultConfig(): StoredAppConfig {
  const accountEmail = process.env["KLEINANZEIGEN_EMAIL"] ?? "";
  const accountPassword = process.env["KLEINANZEIGEN_PASSWORD"] ?? "";
  const telegramBotToken = process.env["TELEGRAM_BOT_TOKEN"] ?? "";
  const telegramChatId = process.env["TELEGRAM_CHAT_ID"] ?? "";

  return {
    accountEmail,
    accountPassword,
    telegramBotToken,
    telegramChatId,
    telegramNotificationsEnabled: Boolean(telegramBotToken && telegramChatId),
    notifyOnSuccessfulLogin: true,
    notifyOnSearchRuns: true,
    updatedAt: new Date().toISOString(),
  };
}

function ensureConfigFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    const initialConfig = createDefaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initialConfig, null, 2), "utf8");
  }
}

export function loadAppConfig(): StoredAppConfig {
  ensureConfigFile();

  const configContent = fs.readFileSync(CONFIG_PATH, "utf8");
  const parsedConfig = JSON.parse(configContent) as Partial<StoredAppConfig>;
  const defaultConfig = createDefaultConfig();

  return {
    ...defaultConfig,
    ...parsedConfig,
    updatedAt: parsedConfig.updatedAt ?? defaultConfig.updatedAt,
  };
}

export function saveAppConfig(
  updates: Partial<StoredAppConfig>
): StoredAppConfig {
  const currentConfig = loadAppConfig();
  const nextConfig: StoredAppConfig = {
    ...currentConfig,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2), "utf8");
  return nextConfig;
}

export function getAppConfigSummary(): AppConfigSummary {
  const config = loadAppConfig();

  return {
    ...config,
    envFilePresent: fs.existsSync(ENV_PATH),
    hasAccountPassword: config.accountPassword.trim().length > 0,
    hasTelegramBotToken: config.telegramBotToken.trim().length > 0,
    hasTelegramChatId: config.telegramChatId.trim().length > 0,
    ai: {
      enabled: process.env["AI_ENABLED"] === "true",
      provider: process.env["AI_PROVIDER"] || "openai",
      model: process.env["AI_MODEL"] || "gpt-4o-mini",
      configured: Boolean(process.env["OPENAI_API_KEY"]),
    },
    oauth: {
      microsoftConfigured: Boolean(
        process.env["MICROSOFT_CLIENT_ID"] &&
          process.env["MICROSOFT_CLIENT_SECRET"]
      ),
      gmailConfigured: Boolean(
        process.env["GMAIL_CLIENT_ID"] && process.env["GMAIL_CLIENT_SECRET"]
      ),
    },
    persistence: "local_files",
    configPath: CONFIG_PATH,
  };
}

export function getConfigPath(): string {
  ensureConfigFile();
  return CONFIG_PATH;
}
