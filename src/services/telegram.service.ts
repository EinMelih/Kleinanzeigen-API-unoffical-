import axios from "axios";
import { loadAppConfig } from "./app-config";

export interface TelegramSendResult {
  success: boolean;
  message: string;
  chatId?: string;
  timestamp: string;
  error?: string;
}

export async function sendTelegramTestMessage(
  customMessage?: string
): Promise<TelegramSendResult> {
  const config = loadAppConfig();
  const token = config.telegramBotToken.trim();
  const chatId = config.telegramChatId.trim();

  if (!token) {
    return {
      success: false,
      message: "Telegram Bot Token fehlt",
      error: "Setze TELEGRAM_BOT_TOKEN in .env oder in den Settings",
      timestamp: new Date().toISOString(),
    };
  }

  if (!chatId) {
    return {
      success: false,
      message: "Telegram Chat ID fehlt",
      error: "Trage die Chat ID in den Settings ein, bevor du einen Test sendest",
      timestamp: new Date().toISOString(),
    };
  }

  const accountEmail = config.accountEmail || "kein Account gesetzt";
  const message =
    customMessage?.trim() ||
    [
      "Kleinanzeigen API Test",
      `Account: ${accountEmail}`,
      `Zeit: ${new Date().toLocaleString("de-DE", {
        timeZone: "Europe/Berlin",
      })}`,
    ].join("\n");

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });

    return {
      success: true,
      message: "Telegram Testnachricht erfolgreich gesendet",
      chatId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: "Telegram Versand fehlgeschlagen",
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
      timestamp: new Date().toISOString(),
    };
  }
}
