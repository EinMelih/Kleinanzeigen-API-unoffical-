import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

type NotificationType = "success" | "warning" | "error" | "info";
type NotificationCategory =
  | "system"
  | "search"
  | "messages"
  | "telegram"
  | "profile";
type ListingSource =
  | "search"
  | "scrape"
  | "article"
  | "message"
  | "conversation"
  | "local_search";

export interface AppStateListing {
  id: string;
  title: string;
  price: string;
  priceValue: number | null;
  location: string;
  url: string;
  imageUrl: string | undefined;
  description: string | undefined;
  sellerName: string | undefined;
  sellerId: string | undefined;
  sellerType: string | undefined;
  category: string | undefined;
  dateLabel: string | undefined;
  source: ListingSource;
  localFolder: string | undefined;
  tags: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
  messageCount: number;
  conversationId: string | undefined;
}

export interface AppStateMessage {
  id: string;
  direction: "in" | "out" | "system";
  text: string;
  timestamp: string;
  status: "sent" | "received" | "system";
}

export interface AppStateConversation {
  id: string;
  articleId: string;
  articleTitle: string;
  sellerName: string;
  sellerId: string;
  lastMessage: string | undefined;
  lastMessageDate: string | undefined;
  unread: boolean;
  conversationUrl: string | undefined;
  updatedAt: string;
  messages: AppStateMessage[];
}

export interface AppStateSavedSearch {
  id: string;
  title: string;
  query: string;
  location: string | undefined;
  radius: number | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  notificationsEnabled: boolean;
  lastRunAt: string | undefined;
  lastMatchCount: number | undefined;
  source: "live_search" | "local_folder";
  createdAt: string;
  updatedAt: string;
}

export interface AppStateNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link: string | undefined;
}

export interface AppStateProfile {
  displayName: string;
  email: string;
  accountType: string;
  memberSince: string | undefined;
  activeAds: number;
  summary: string;
  lastSyncedAt: string | undefined;
}

interface AppState {
  version: 1;
  updatedAt: string;
  profile: AppStateProfile;
  listings: AppStateListing[];
  conversations: AppStateConversation[];
  notifications: AppStateNotification[];
  savedSearches: AppStateSavedSearch[];
  searchRuns: Array<{
    id: string;
    query: string;
    location: string | undefined;
    resultCount: number;
    timestamp: string;
  }>;
}

interface SearchRunInput {
  query: string;
  location: string | undefined;
  radius: number | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  notificationsEnabled: boolean;
  resultCount: number;
  articles: unknown[];
  localFolder: string | undefined;
}

interface ListingUpsertOptions {
  source: ListingSource;
  localFolder: string | undefined;
  tag: string | undefined;
  incrementMessageCount: boolean | undefined;
  conversationId: string | undefined;
}

interface ConversationSnapshot {
  conversationId: string;
  articleId: string;
  articleTitle: string;
  sellerName: string;
  sellerId: string;
  lastMessage: string | undefined;
  lastMessageDate: string | undefined;
  unread: boolean | undefined;
  conversationUrl: string | undefined;
  articleUrl: string | undefined;
  messages: AppStateMessage[];
}

interface MessageSendRecord {
  articleId: string;
  articleTitle: string | undefined;
  sellerName: string | undefined;
  sellerId: string | undefined;
  message: string;
  conversationUrl: string | undefined;
  url: string | undefined;
}

interface ProfileSyncPayload {
  displayName: string | undefined;
  email: string | undefined;
  accountType: string | undefined;
  memberSince: string | undefined;
  activeAds: number | undefined;
  summary: string | undefined;
}

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function parsePriceValue(price: string): number | null {
  const normalized = price.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!normalized) {
    return null;
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickFirstString(values: unknown[]): string | undefined {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export class AppStateService {
  private readonly dataDir = path.join(process.cwd(), "data");
  private readonly statePath = path.join(this.dataDir, "app-state.json");
  private readonly localSearchRoot = path.join(
    process.cwd(),
    "data",
    "images",
    "search"
  );

  constructor() {
    ensureDirectory(this.dataDir);
    if (!fs.existsSync(this.statePath)) {
      this.writeState(this.createDefaultState());
    }
  }

  private createDefaultState(): AppState {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      profile: {
        displayName: "Thomas",
        email: "",
        accountType: "unknown",
        memberSince: undefined,
        activeAds: 0,
        summary: "Lokales Profil fuer Search-, Message- und Notification-Daten.",
        lastSyncedAt: undefined,
      },
      listings: [],
      conversations: [],
      notifications: [],
      savedSearches: [],
      searchRuns: [],
    };
  }

  private readState(): AppState {
    const content = fs.readFileSync(this.statePath, "utf8");
    const parsed = JSON.parse(content) as Partial<AppState>;
    const defaultState = this.createDefaultState();

    return {
      ...defaultState,
      ...parsed,
      profile: {
        ...defaultState.profile,
        ...(parsed.profile ?? {}),
      },
      listings: safeArray<AppStateListing>(parsed.listings),
      conversations: safeArray<AppStateConversation>(parsed.conversations),
      notifications: safeArray<AppStateNotification>(parsed.notifications),
      savedSearches: safeArray<AppStateSavedSearch>(parsed.savedSearches),
      searchRuns: safeArray<AppState["searchRuns"][number]>(parsed.searchRuns),
      updatedAt: normalizeText(parsed.updatedAt) || defaultState.updatedAt,
    };
  }

  private writeState(state: AppState): void {
    fs.writeFileSync(
      this.statePath,
      JSON.stringify(
        {
          ...state,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );
  }

  private mutate(mutator: (state: AppState) => void): AppState {
    const state = this.readState();
    mutator(state);
    state.updatedAt = new Date().toISOString();
    this.writeState(state);
    return state;
  }

  private buildSearchId(input: {
    query: string;
    location: string | undefined;
    radius: number | undefined;
    minPrice: number | undefined;
    maxPrice: number | undefined;
  }): string {
    return [
      input.query.trim().toLowerCase(),
      normalizeText(input.location).toLowerCase(),
      input.radius ?? "",
      input.minPrice ?? "",
      input.maxPrice ?? "",
    ].join("|");
  }

  private ensureSavedSearch(
    state: AppState,
    input: {
      query: string;
      location: string | undefined;
      radius: number | undefined;
      minPrice: number | undefined;
      maxPrice: number | undefined;
      notificationsEnabled: boolean;
      source: "live_search" | "local_folder";
      title: string | undefined;
      lastMatchCount: number | undefined;
    }
  ): AppStateSavedSearch {
    const id = this.buildSearchId(input);
    const now = new Date().toISOString();
    const existing = state.savedSearches.find((entry) => entry.id === id);
    const title = input.title || input.query;

    if (existing) {
      existing.title = title;
      existing.query = input.query;
      existing.location = input.location;
      existing.radius = input.radius;
      existing.minPrice = input.minPrice;
      existing.maxPrice = input.maxPrice;
      existing.notificationsEnabled = input.notificationsEnabled;
      existing.lastRunAt = now;
      existing.lastMatchCount = input.lastMatchCount ?? existing.lastMatchCount;
      existing.updatedAt = now;
      return existing;
    }

    const next: AppStateSavedSearch = {
      id,
      title,
      query: input.query,
      location: input.location,
      radius: input.radius,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      notificationsEnabled: input.notificationsEnabled,
      lastRunAt: now,
      lastMatchCount: input.lastMatchCount,
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };
    state.savedSearches.unshift(next);
    return next;
  }

  private upsertListing(
    state: AppState,
    article: unknown,
    options: ListingUpsertOptions
  ): AppStateListing | null {
    const record = asRecord(article);
    const seller = asRecord(record["seller"]);
    const articleId = pickFirstString([
      record["id"],
      record["articleId"],
      record["adId"],
      record["listingId"],
    ]);

    if (!articleId) {
      return null;
    }

    const now = new Date().toISOString();
    const title =
      pickFirstString([record["title"], record["articleTitle"]]) || `Artikel ${articleId}`;
    const price = pickFirstString([record["price"], record["priceLabel"]]) || "n/a";
    const location = pickFirstString([record["location"], record["city"]]) || "Unbekannt";
    const url =
      pickFirstString([record["url"], record["sourceUrl"]]) ||
      `https://www.kleinanzeigen.de/s-anzeige/${articleId}`;
    const imageUrl =
      pickFirstString([
        record["thumbnail"],
        safeArray<string>(record["localImages"])[0],
        safeArray<string>(record["images"])[0],
      ]) || undefined;
    const description = pickFirstString([record["description"]]);
    const sellerName = pickFirstString([seller["name"], record["sellerName"]]);
    const sellerId = pickFirstString([seller["id"], record["sellerId"]]);
    const sellerType = pickFirstString([seller["type"], record["sellerType"]]);
    const dateLabel = pickFirstString([record["date"], record["createdAt"]]);
    const existing = state.listings.find((entry) => entry.id === articleId);

    if (existing) {
      existing.title = title;
      existing.price = price;
      existing.priceValue = parsePriceValue(price);
      existing.location = location;
      existing.url = url;
      existing.imageUrl = imageUrl ?? existing.imageUrl;
      existing.description = description ?? existing.description;
      existing.sellerName = sellerName ?? existing.sellerName;
      existing.sellerId = sellerId ?? existing.sellerId;
      existing.sellerType = sellerType ?? existing.sellerType;
      existing.dateLabel = dateLabel ?? existing.dateLabel;
      existing.source = options.source;
      existing.localFolder = options.localFolder ?? existing.localFolder;
      existing.lastSeenAt = now;
      existing.updatedAt = now;
      if (options.tag && !existing.tags.includes(options.tag)) {
        existing.tags.push(options.tag);
      }
      if (options.incrementMessageCount) {
        existing.messageCount += 1;
      }
      if (options.conversationId) {
        existing.conversationId = options.conversationId;
      }
      return existing;
    }

    const next: AppStateListing = {
      id: articleId,
      title,
      price,
      priceValue: parsePriceValue(price),
      location,
      url,
      imageUrl,
      description,
      sellerName,
      sellerId,
      sellerType,
      category: pickFirstString([record["category"]]),
      dateLabel,
      source: options.source,
      localFolder: options.localFolder,
      tags: options.tag ? [options.tag] : [],
      firstSeenAt: now,
      lastSeenAt: now,
      updatedAt: now,
      messageCount: options.incrementMessageCount ? 1 : 0,
      conversationId: options.conversationId,
    };

    state.listings.unshift(next);
    return next;
  }

  private addNotification(
    state: AppState,
    input: Omit<AppStateNotification, "id" | "timestamp" | "read">
  ): AppStateNotification {
    const notification: AppStateNotification = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      ...input,
    };
    state.notifications.unshift(notification);
    state.notifications = state.notifications.slice(0, 250);
    return notification;
  }

  private mergeMessages(
    existing: AppStateMessage[],
    incoming: AppStateMessage[]
  ): { messages: AppStateMessage[]; newInboundCount: number } {
    const merged = [...existing];
    let newInboundCount = 0;

    for (const message of incoming) {
      const duplicate = merged.some(
        (entry) =>
          entry.direction === message.direction &&
          entry.text === message.text &&
          entry.timestamp === message.timestamp
      );

      if (!duplicate) {
        merged.push(message);
        if (message.direction === "in") {
          newInboundCount += 1;
        }
      }
    }

    merged.sort((left, right) =>
      left.timestamp.localeCompare(right.timestamp)
    );

    return {
      messages: merged,
      newInboundCount,
    };
  }

  private hydrateLocalSearches(state: AppState): void {
    if (!fs.existsSync(this.localSearchRoot)) {
      return;
    }

    const folders = fs
      .readdirSync(this.localSearchRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory());

    for (const folder of folders) {
      const folderPath = path.join(this.localSearchRoot, folder.name);
      const articleFolders = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory());

      this.ensureSavedSearch(state, {
        query: folder.name,
        location: undefined,
        radius: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        title: folder.name.replace(/_/g, " "),
        notificationsEnabled: true,
        source: "local_folder",
        lastMatchCount: articleFolders.length,
      });

      for (const articleFolder of articleFolders) {
        const infoPath = path.join(folderPath, articleFolder.name, "article-info.json");
        if (!fs.existsSync(infoPath)) {
          continue;
        }

        try {
          const article = JSON.parse(fs.readFileSync(infoPath, "utf8")) as unknown;
          this.upsertListing(state, article, {
            source: "local_search",
            localFolder: folder.name,
            tag: "local_search",
            incrementMessageCount: undefined,
            conversationId: undefined,
          });
        } catch {
          // Ignore malformed local files and keep the state readable.
        }
      }
    }
  }

  getItems(): AppStateListing[] {
    const state = this.mutate((draft) => {
      this.hydrateLocalSearches(draft);
    });

    return [...state.listings].sort((left, right) =>
      right.lastSeenAt.localeCompare(left.lastSeenAt)
    );
  }

  getMessages(): AppStateConversation[] {
    const state = this.readState();
    return [...state.conversations].sort((left, right) =>
      (right.lastMessageDate || right.updatedAt).localeCompare(
        left.lastMessageDate || left.updatedAt
      )
    );
  }

  getNotifications(): AppStateNotification[] {
    const state = this.readState();
    return [...state.notifications].sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp)
    );
  }

  getSavedSearches(): AppStateSavedSearch[] {
    const state = this.mutate((draft) => {
      this.hydrateLocalSearches(draft);
    });
    return [...state.savedSearches].sort((left, right) =>
      (right.lastRunAt || right.updatedAt).localeCompare(
        left.lastRunAt || left.updatedAt
      )
    );
  }

  getProfile(): AppStateProfile & {
    trackedItemCount: number;
    conversationCount: number;
    unreadNotificationCount: number;
    savedSearchCount: number;
  } {
    const state = this.mutate((draft) => {
      this.hydrateLocalSearches(draft);
    });

    return {
      ...state.profile,
      trackedItemCount: state.listings.length,
      conversationCount: state.conversations.length,
      unreadNotificationCount: state.notifications.filter((entry) => !entry.read)
        .length,
      savedSearchCount: state.savedSearches.length,
    };
  }

  updateProfile(payload: {
    displayName: string | undefined;
    summary: string | undefined;
  }): AppStateProfile {
    const state = this.mutate((draft) => {
      draft.profile = {
        ...draft.profile,
        displayName: payload.displayName ?? draft.profile.displayName,
        summary: payload.summary ?? draft.profile.summary,
        lastSyncedAt: draft.profile.lastSyncedAt,
      };
    });

    return state.profile;
  }

  syncProfile(payload: ProfileSyncPayload): AppStateProfile {
    const state = this.mutate((draft) => {
      draft.profile = {
        ...draft.profile,
        ...payload,
        displayName: payload.displayName || draft.profile.displayName,
        email: payload.email || draft.profile.email,
        accountType: payload.accountType || draft.profile.accountType,
        memberSince: payload.memberSince || draft.profile.memberSince,
        activeAds: payload.activeAds ?? draft.profile.activeAds,
        summary: payload.summary || draft.profile.summary,
        lastSyncedAt: new Date().toISOString(),
      };

      this.addNotification(draft, {
        type: "info",
        category: "profile",
        title: "Profil synchronisiert",
        message: `Profil fuer ${draft.profile.email || "den Account"} wurde aktualisiert.`,
        link: undefined,
      });
    });

    return state.profile;
  }

  markNotificationRead(notificationId: string): AppStateNotification | null {
    let updated: AppStateNotification | null = null;
    this.mutate((state) => {
      const target = state.notifications.find((entry) => entry.id === notificationId);
      if (!target) {
        return;
      }

      target.read = true;
      updated = target;
    });
    return updated;
  }

  clearNotifications(): void {
    this.mutate((state) => {
      state.notifications = [];
    });
  }

  deleteNotification(notificationId: string): boolean {
    let removed = false;
    this.mutate((state) => {
      const before = state.notifications.length;
      state.notifications = state.notifications.filter(
        (entry) => entry.id !== notificationId
      );
      removed = state.notifications.length !== before;
    });
    return removed;
  }

  recordSearchRun(input: SearchRunInput): void {
    this.mutate((draft) => {
      this.hydrateLocalSearches(draft);

      const now = new Date().toISOString();
      draft.searchRuns.unshift({
        id: randomUUID(),
        query: input.query,
        location: input.location,
        resultCount: input.resultCount,
        timestamp: now,
      });
      draft.searchRuns = draft.searchRuns.slice(0, 100);

      this.ensureSavedSearch(draft, {
        query: input.query,
        location: input.location,
        radius: input.radius,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        notificationsEnabled: input.notificationsEnabled,
        source: "live_search",
        title: input.query,
        lastMatchCount: input.resultCount,
      });

      for (const article of input.articles) {
        this.upsertListing(draft, article, {
          source: "search",
          localFolder: input.localFolder,
          tag: "search",
          incrementMessageCount: undefined,
          conversationId: undefined,
        });
      }

      this.addNotification(draft, {
        type: input.resultCount > 0 ? "success" : "info",
        category: "search",
        title: `Suchlauf: ${input.query}`,
        message:
          input.resultCount > 0
            ? `${input.resultCount} Treffer gespeichert${input.location ? ` fuer ${input.location}` : ""}.`
            : "Keine Treffer gefunden.",
        link: undefined,
      });
    });
  }

  recordScrapedArticles(input: {
    articles: unknown[];
    localFolder: string | undefined;
    source: "scrape" | "article";
  }): void {
    this.mutate((state) => {
      this.hydrateLocalSearches(state);
      for (const article of input.articles) {
        this.upsertListing(state, article, {
          source: input.source,
          localFolder: input.localFolder,
          tag: input.source,
          incrementMessageCount: undefined,
          conversationId: undefined,
        });
      }

      this.addNotification(state, {
        type: "info",
        category: "search",
        title:
          input.source === "article"
            ? "Artikel geladen"
            : "Scrape abgeschlossen",
        message: `${input.articles.length} Artikel in den lokalen Store uebernommen.`,
        link: undefined,
      });
    });
  }

  recordMessageSend(record: MessageSendRecord): void {
    this.mutate((state) => {
      const conversationId =
        record.sellerId && record.articleId
          ? `${record.sellerId}:${record.articleId}`
          : record.articleId;
      const now = new Date().toISOString();
      let conversation = state.conversations.find(
        (entry) => entry.id === conversationId
      );

      if (!conversation) {
        conversation = {
          id: conversationId,
          articleId: record.articleId,
          articleTitle: record.articleTitle || `Artikel ${record.articleId}`,
          sellerName: record.sellerName || "Unbekannter Anbieter",
          sellerId: record.sellerId || "",
          lastMessage: undefined,
          lastMessageDate: undefined,
          unread: false,
          conversationUrl: record.conversationUrl,
          updatedAt: now,
          messages: [],
        };
        state.conversations.unshift(conversation);
      }

      const message: AppStateMessage = {
        id: randomUUID(),
        direction: "out",
        text: record.message,
        timestamp: now,
        status: "sent",
      };

      const duplicate = conversation.messages.some(
        (entry) =>
          entry.direction === "out" &&
          entry.text === message.text &&
          entry.timestamp === message.timestamp
      );

      if (!duplicate) {
        conversation.messages.push(message);
      }

      conversation.articleId = record.articleId;
      conversation.articleTitle =
        record.articleTitle || conversation.articleTitle || `Artikel ${record.articleId}`;
      conversation.sellerName =
        record.sellerName || conversation.sellerName || "Unbekannter Anbieter";
      conversation.sellerId = record.sellerId || conversation.sellerId;
      conversation.lastMessage = record.message;
      conversation.lastMessageDate = now;
      conversation.conversationUrl =
        record.conversationUrl || conversation.conversationUrl;
      conversation.updatedAt = now;
      conversation.unread = false;

      this.upsertListing(
        state,
        {
          id: record.articleId,
          title: conversation.articleTitle,
          seller: {
            name: conversation.sellerName,
            id: conversation.sellerId,
          },
          url: record.url,
        },
        {
          source: "message",
          localFolder: undefined,
          tag: "message",
          incrementMessageCount: true,
          conversationId,
        }
      );

      this.addNotification(state, {
        type: "success",
        category: "messages",
        title: "Nachricht gesendet",
        message: `${conversation.sellerName} wurde zu "${conversation.articleTitle}" kontaktiert.`,
        link: record.conversationUrl,
      });
    });
  }

  recordConversationSnapshots(snapshots: ConversationSnapshot[]): void {
    this.mutate((state) => {
      for (const snapshot of snapshots) {
        let conversation = state.conversations.find(
          (entry) => entry.id === snapshot.conversationId
        );

        if (!conversation) {
          conversation = {
            id: snapshot.conversationId,
            articleId: snapshot.articleId,
            articleTitle: snapshot.articleTitle,
            sellerName: snapshot.sellerName,
            sellerId: snapshot.sellerId,
            lastMessage: snapshot.lastMessage,
            lastMessageDate: snapshot.lastMessageDate,
            unread: snapshot.unread ?? false,
            conversationUrl: snapshot.conversationUrl,
            updatedAt: new Date().toISOString(),
            messages: [],
          };
          state.conversations.unshift(conversation);
        }

        const merged = this.mergeMessages(conversation.messages, snapshot.messages);
        conversation.messages = merged.messages;
        conversation.articleId = snapshot.articleId;
        conversation.articleTitle = snapshot.articleTitle;
        conversation.sellerName = snapshot.sellerName;
        conversation.sellerId = snapshot.sellerId;
        conversation.lastMessage =
          snapshot.lastMessage ||
          merged.messages[merged.messages.length - 1]?.text ||
          conversation.lastMessage;
        conversation.lastMessageDate =
          snapshot.lastMessageDate ||
          merged.messages[merged.messages.length - 1]?.timestamp ||
          conversation.lastMessageDate;
        conversation.unread =
          snapshot.unread ??
          merged.messages.some((message) => message.direction === "in");
        conversation.conversationUrl =
          snapshot.conversationUrl || conversation.conversationUrl;
        conversation.updatedAt = new Date().toISOString();

        this.upsertListing(
          state,
          {
            id: snapshot.articleId,
            title: snapshot.articleTitle,
            seller: {
              name: snapshot.sellerName,
              id: snapshot.sellerId,
            },
            url:
              snapshot.articleUrl ||
              `https://www.kleinanzeigen.de/s-anzeige/${snapshot.articleId}`,
          },
          {
            source: "conversation",
            localFolder: undefined,
            tag: "conversation",
            incrementMessageCount: undefined,
            conversationId: snapshot.conversationId,
          }
        );

        if (merged.newInboundCount > 0) {
          this.addNotification(state, {
            type: "info",
            category: "messages",
            title: "Neue eingehende Nachricht",
            message: `${snapshot.sellerName} hat in "${snapshot.articleTitle}" geschrieben.`,
            link: snapshot.conversationUrl,
          });
        }
      }
    });
  }

  recordTelegramEvent(result: { success: boolean; message: string; error?: string }): void {
    this.mutate((state) => {
      this.addNotification(state, {
        type: result.success ? "success" : "error",
        category: "telegram",
        title: result.success ? "Telegram Test erfolgreich" : "Telegram Test fehlgeschlagen",
        message: result.success
          ? result.message
          : `${result.message}${result.error ? `: ${result.error}` : ""}`,
        link: undefined,
      });
    });
  }

  getRadarSnapshot(): {
    notifications: AppStateNotification[];
    conversations: AppStateConversation[];
    stats: {
      notificationCount: number;
      unreadNotificationCount: number;
      conversationCount: number;
      incomingMessageCount: number;
      trackedItemCount: number;
    };
  } {
    const state = this.mutate((draft) => {
      this.hydrateLocalSearches(draft);
    });

    const conversations = [...state.conversations].sort((left, right) =>
      (right.lastMessageDate || right.updatedAt).localeCompare(
        left.lastMessageDate || left.updatedAt
      )
    );

    return {
      notifications: [...state.notifications].sort((left, right) =>
        right.timestamp.localeCompare(left.timestamp)
      ),
      conversations,
      stats: {
        notificationCount: state.notifications.length,
        unreadNotificationCount: state.notifications.filter((entry) => !entry.read)
          .length,
        conversationCount: state.conversations.length,
        incomingMessageCount: state.conversations.reduce(
          (count, conversation) =>
            count +
            conversation.messages.filter((message) => message.direction === "in")
              .length,
          0
        ),
        trackedItemCount: state.listings.length,
      },
    };
  }

  getStatePath(): string {
    return this.statePath;
  }
}
