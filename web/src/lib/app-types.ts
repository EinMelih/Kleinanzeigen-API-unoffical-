export type FeatureStatus = "live" | "partial" | "preview" | "planned";

export interface FeatureItem {
  key: string;
  title: string;
  status: FeatureStatus;
  page: string;
  endpoint?: string;
  summary: string;
}

export interface AppConfigSummary {
  accountEmail: string;
  accountPassword: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramNotificationsEnabled: boolean;
  notifyOnSuccessfulLogin: boolean;
  notifyOnSearchRuns: boolean;
  updatedAt: string;
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

export interface AppOverview {
  status: string;
  generatedAt: string;
  config: AppConfigSummary;
  account: {
    email: string;
    configured: boolean;
    cookieFileExists: boolean;
    cookiePath?: string;
    isLoggedIn: boolean;
    cookieCount: number;
    lastValidated: string | null;
    nextExpiry: string | null;
    validityDuration: string;
  };
  cookies: {
    totalFiles: number;
    validFiles: number;
    expiredFiles: number;
    totalCookieCount: number;
    nextExpiry: string | null;
    validityDuration?: string;
  };
  localSearches: {
    folderCount: number;
    articleFolders: number;
  };
  database: {
    mode: string;
    target: string;
    schemaPath: string;
    configPath: string;
  };
  platformGuard: {
    blocked: boolean;
    state: {
      platform: "kleinanzeigen";
      isBlocked: boolean;
      reason: string;
      source: string;
      detectedAt: string;
      blockedUntil: string;
      refCode?: string;
      ipAddress?: string;
      pageTitle?: string;
      excerpt?: string;
    } | null;
  };
  warnings: string[];
  features: FeatureItem[];
}

export interface AppConfigResponse {
  status: string;
  config: AppConfigSummary;
  timestamp: string;
}

export interface AppConfigUpdatePayload {
  accountEmail: string;
  accountPassword: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramNotificationsEnabled: boolean;
  notifyOnSuccessfulLogin: boolean;
  notifyOnSearchRuns: boolean;
}

export interface TelegramTestResponse {
  success: boolean;
  message: string;
  chatId?: string;
  error?: string;
  timestamp: string;
}

export interface HealthResponse {
  ok: boolean;
  message: string;
  timestamp: string;
  cookies: {
    totalFiles?: number;
    validFiles?: number;
    expiredFiles?: number;
    totalCookieCount?: number;
    nextExpiry?: string;
    validityDuration?: string;
    error?: string;
  };
  chrome: {
    status: string;
    port: number;
  };
}

export interface MessageHealthResponse {
  status: string;
  service: string;
  timestamp: string;
}
