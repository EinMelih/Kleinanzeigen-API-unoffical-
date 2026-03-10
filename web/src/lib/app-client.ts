import type {
  AppConfigResponse,
  AppConfigUpdatePayload,
  AppOverview,
  HealthResponse,
  ItemsResponse,
  MessageHealthResponse,
  MessagesResponse,
  ProfileMutationResponse,
  ProfileResponse,
  RadarResponse,
  SendMessageApiResponse,
  TelegramTestResponse,
} from "./app-types";

async function requestJson<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const rawBody = await response.text();
  const data = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const appClient = {
  getOverview: () => requestJson<AppOverview>("/app/overview"),
  getConfig: () => requestJson<AppConfigResponse>("/app/config"),
  updateConfig: (payload: AppConfigUpdatePayload) =>
    requestJson<AppConfigResponse>("/app/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  sendTelegramTest: (message?: string) =>
    requestJson<TelegramTestResponse>("/app/telegram/test", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getItems: () => requestJson<ItemsResponse>("/app/items"),
  getMessages: () => requestJson<MessagesResponse>("/app/messages"),
  refreshMessages: (email?: string) =>
    requestJson<MessagesResponse>("/app/messages/refresh", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  getRadar: () => requestJson<RadarResponse>("/app/radar"),
  markNotificationRead: (id: string) =>
    requestJson<{ status: string }>(`/app/notifications/${id}/read`, {
      method: "POST",
    }),
  deleteNotification: (id: string) =>
    requestJson<{ status: string; message: string }>(`/app/notifications/${id}`, {
      method: "DELETE",
    }),
  clearNotifications: () =>
    requestJson<{ status: string; message: string }>("/app/notifications", {
      method: "DELETE",
    }),
  getProfile: () => requestJson<ProfileResponse>("/app/profile"),
  updateProfile: (payload: { displayName?: string; summary?: string }) =>
    requestJson<ProfileMutationResponse>("/app/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  syncProfile: (email?: string) =>
    requestJson<ProfileMutationResponse>("/app/profile/sync", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  sendMessage: (payload: { email: string; articleId: string; message: string; receiverId?: string }) =>
    requestJson<SendMessageApiResponse>("/message/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getHealth: () => requestJson<HealthResponse>("/health"),
  getMessageHealth: () => requestJson<MessageHealthResponse>("/message/health"),
};
