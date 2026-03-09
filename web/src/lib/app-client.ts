import type {
  AppConfigResponse,
  AppConfigUpdatePayload,
  AppOverview,
  HealthResponse,
  MessageHealthResponse,
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
  getHealth: () => requestJson<HealthResponse>("/health"),
  getMessageHealth: () => requestJson<MessageHealthResponse>("/message/health"),
};
