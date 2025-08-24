import { getGermanDate } from "../../shared/utils";
import { performLogin } from "../workers/auth-login";
import { CookieValidator } from "./cookies-validation";

export interface RefreshResult {
  success: boolean;
  message: string;
  refreshedAt: Date;
  oldExpiry?: Date;
  newExpiry?: Date;
}

export class CookieRefreshService {
  private readonly cookieValidator: CookieValidator;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private interval: number = 0.25;
  private lastRefresh: Date = new Date();

  constructor() {
    this.cookieValidator = new CookieValidator();
  }

  // Start automatic cookie refresh
  startAutoRefresh(intervalHours: number = 12): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.isRunning = true;
    this.interval = intervalHours;
    this.lastRefresh = new Date();

    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.refreshInterval = setInterval(async () => {
      try {
        await this.refreshAllCookies();
        this.lastRefresh = new Date();
      } catch (error) {
        console.error("❌ Auto-refresh error:", error);
      }
    }, intervalMs);

    console.log(`🔄 Auto-refresh started (every ${intervalHours} hours)`);
  }

  // Stop automatic cookie refresh
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isRunning = false;
    console.log("🛑 Auto-refresh stopped");
  }

  // Get auto-refresh status
  getAutoRefreshStatus(): {
    isRunning: boolean;
    interval: number;
    lastRefresh: Date;
  } {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      lastRefresh: this.lastRefresh,
    };
  }

  // Refresh cookies for specific user
  async refreshUserCookies(email: string): Promise<RefreshResult> {
    try {
      console.log(`Refreshing cookies for ${email}...`);

      // Check current cookie status
      const currentStatus = await this.cookieValidator.checkCookieExpiry(
        this.getCookiePath(email)
      );

      if (!currentStatus.isValid) {
        return {
          success: false,
          message: `No valid cookies found for ${email}`,
          refreshedAt: getGermanDate(new Date()),
        };
      }

      // Perform login to refresh cookies
      const password = process.env["KLEINANZEIGEN_PASSWORD"];
      if (!password) {
        return {
          success: false,
          message: "Password not found in environment variables",
          refreshedAt: getGermanDate(new Date()),
        };
      }

      const loginResult = await performLogin({
        email,
        password,
      });

      if (!loginResult.ok) {
        return {
          success: false,
          message: `Failed to refresh cookies: ${loginResult.error}`,
          refreshedAt: getGermanDate(new Date()),
        };
      }

      // Check new cookie status
      const newStatus = await this.cookieValidator.checkCookieExpiry(
        this.getCookiePath(email)
      );

      console.log(`Cookies refreshed for ${email}`);

      return {
        success: true,
        message: `Cookies refreshed successfully for ${email}`,
        refreshedAt: getGermanDate(new Date()),
        ...(currentStatus.nextExpiry && {
          oldExpiry: currentStatus.nextExpiry,
        }),
        ...(newStatus.nextExpiry && { newExpiry: newStatus.nextExpiry }),
      };
    } catch (error) {
      console.error(`❌ Error refreshing cookies for ${email}:`, error);
      return {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        refreshedAt: getGermanDate(new Date()),
      };
    }
  }

  // Refresh all user cookies
  async refreshAllCookies(): Promise<RefreshResult[]> {
    try {
      const cookieFiles = await this.cookieValidator.getAllCookieFiles();
      const results: RefreshResult[] = [];

      for (const cookieFile of cookieFiles) {
        const email = this.cookieValidator.extractEmailFromFilename(cookieFile);
        const result = await this.refreshUserCookies(email);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error("❌ Error refreshing all cookies:", error);
      return [
        {
          success: false,
          message: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          refreshedAt: getGermanDate(new Date()),
        },
      ];
    }
  }

  // Check if cookies need refresh (expiring within threshold)
  async checkRefreshNeeded(thresholdHours: number = 6): Promise<{
    needsRefresh: boolean;
    users: string[];
    nextExpiry?: Date;
  }> {
    try {
      const cookieFiles = await this.cookieValidator.getAllCookieFiles();
      const usersNeedingRefresh: string[] = [];

      for (const cookieFile of cookieFiles) {
        const status = await this.cookieValidator.checkCookieExpiry(cookieFile);

        if (status.nextExpiry) {
          const hoursUntilExpiry =
            (status.nextExpiry.getTime() - Date.now()) / (1000 * 60 * 60);

          if (hoursUntilExpiry <= thresholdHours) {
            usersNeedingRefresh.push(status.email);
          }
        }
      }

      return {
        needsRefresh: usersNeedingRefresh.length > 0,
        users: usersNeedingRefresh,
      };
    } catch (error) {
      console.error("❌ Error checking refresh status:", error);
      return { needsRefresh: false, users: [] };
    }
  }

  // Get cookie path for user
  private getCookiePath(email: string): string {
    const path = require("path");
    return path.join(
      process.cwd(),
      "data",
      "cookies",
      `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`
    );
  }
}
