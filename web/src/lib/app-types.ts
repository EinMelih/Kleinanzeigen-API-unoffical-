export type FeatureStatus = "live" | "partial" | "preview" | "planned";
export type SessionProfileState =
  | "not_started"
  | "pending_manual_login"
  | "authenticated"
  | "needs_reauth"
  | "blocked"
  | "error";

export interface SessionProfileSummary {
  email: string;
  profileDir: string;
  debugPort: number;
  cookiePath: string;
  profileExists: boolean;
  cookieFileExists: boolean;
  chromeRunning: boolean;
  state: SessionProfileState;
  wsEndpoint?: string;
  createdAt?: string;
  updatedAt?: string;
  lastManualLoginStartedAt?: string;
  lastVerifiedAt?: string;
  lastSuccessfulLoginAt?: string;
  lastError?: string;
}

export interface PlatformGuardState {
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
}

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
  manualModeOnly: boolean;
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
    sessionProfile?: SessionProfileSummary | null;
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
  runtime: {
    manualModeOnly: boolean;
    message: string;
  };
  platformGuard: {
    blocked: boolean;
    state: PlatformGuardState | null;
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
  manualModeOnly: boolean;
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
  runtime: {
    manualModeOnly: boolean;
    message: string;
  };
  account: {
    email: string;
    configured: boolean;
    isLoggedIn: boolean;
    sessionState: SessionProfileState;
    debugPort?: number;
    chromeRunning: boolean;
    lastVerifiedAt?: string;
    lastSuccessfulLoginAt?: string;
    lastError?: string;
  };
  platformGuard: {
    blocked: boolean;
    state: PlatformGuardState | null;
  };
}

export interface MessageHealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface TrackedItem {
  id: string;
  title: string;
  price: string;
  priceValue: number | null;
  location: string;
  url: string;
  imageUrl?: string;
  description?: string;
  sellerName?: string;
  sellerId?: string;
  sellerType?: string;
  category?: string;
  dateLabel?: string;
  source: string;
  localFolder?: string;
  tags: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
  messageCount: number;
  conversationId?: string;
}

export interface ConversationMessage {
  id: string;
  direction: "in" | "out" | "system";
  text: string;
  timestamp: string;
  status: "sent" | "received" | "system";
}

export interface ConversationSummary {
  id: string;
  articleId: string;
  articleTitle: string;
  sellerName: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageDate?: string;
  unread: boolean;
  conversationUrl?: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

export interface NotificationSummary {
  id: string;
  type: "success" | "warning" | "error" | "info";
  category: "system" | "search" | "messages" | "telegram" | "profile";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface SavedSearchSummary {
  id: string;
  title: string;
  query: string;
  location?: string;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  notificationsEnabled: boolean;
  lastRunAt?: string;
  lastMatchCount?: number;
  source: "live_search" | "local_folder";
  createdAt: string;
  updatedAt: string;
}

export interface ItemsResponse {
  status: string;
  count: number;
  items: TrackedItem[];
  timestamp: string;
}

export interface MessagesResponse {
  status: string;
  conversationCount: number;
  conversations: ConversationSummary[];
  timestamp: string;
}

export interface RadarResponse {
  status: string;
  notifications: NotificationSummary[];
  conversations: ConversationSummary[];
  stats: {
    notificationCount: number;
    unreadNotificationCount: number;
    conversationCount: number;
    incomingMessageCount: number;
    trackedItemCount: number;
  };
  timestamp: string;
}

export interface ProfileSummary {
  displayName: string;
  email: string;
  accountType: string;
  memberSince?: string;
  activeAds: number;
  summary: string;
  lastSyncedAt?: string;
  trackedItemCount: number;
  conversationCount: number;
  unreadNotificationCount: number;
  savedSearchCount: number;
}

export interface ProfileResponse {
  status: string;
  profile: ProfileSummary;
  savedSearches: SavedSearchSummary[];
  recentItems: TrackedItem[];
  statePath: string;
  timestamp: string;
}

export interface ProfileMutationResponse {
  status: string;
  profile: ProfileSummary;
  timestamp: string;
}

export interface SendMessageApiResponse {
  success: boolean;
  status: string;
  message: string;
  articleId: string;
  conversationUrl?: string;
  timestamp: string;
  error?: string;
}
