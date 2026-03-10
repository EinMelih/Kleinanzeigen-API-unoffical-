import axios from "axios";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  ChromeSetupOptions,
  ChromeSetupResult,
  ChromeStatus,
} from "../../shared/types";

export class ChromeService {
  private readonly debugPort: number;
  private readonly userDataDir: string;

  constructor(
    debugPort: number = 9222,
    userDataDir: string = "C:\\temp\\chrome-debug"
  ) {
    this.debugPort = debugPort;
    this.userDataDir = userDataDir;
  }

  getChromeStartCommand(startUrl?: string): string {
    const chromePath =
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const args = [
      `--remote-debugging-port=${this.debugPort}`,
      `--user-data-dir="${this.userDataDir}"`,
      "--no-first-run",
      "--disable-default-apps",
    ];

    const quotedStartUrl = startUrl ? ` "${startUrl}"` : "";
    return `"${chromePath}" ${args.join(" ")}${quotedStartUrl}`;
  }

  async checkChromeStatus(): Promise<ChromeStatus> {
    try {
      const response = await axios.get(
        `http://localhost:${this.debugPort}/json/version`
      );

      if (response.status === 200 && response.data) {
        return {
          isRunning: true,
          version: response.data.Browser || "Unknown",
        };
      }

      return { isRunning: false };
    } catch (error) {
      return {
        isRunning: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getWebSocketEndpoint(): Promise<string | null> {
    try {
      const response = await axios.get(
        `http://localhost:${this.debugPort}/json/version`
      );

      if (response.status === 200 && response.data?.webSocketDebuggerUrl) {
        return response.data.webSocketDebuggerUrl;
      }

      return null;
    } catch (error) {
      console.log(
        "Error getting WebSocket endpoint:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return null;
    }
  }

  async waitForWebSocketEndpoint(
    timeoutMs: number = 15000,
    pollIntervalMs: number = 500
  ): Promise<string | null> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const endpoint = await this.getWebSocketEndpoint();
      if (endpoint) {
        return endpoint;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return null;
  }

  async openUrlInBrowser(webSocketUrl: string, url: string): Promise<void> {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.connect({
      browserWSEndpoint: webSocketUrl,
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  }

  async saveToEnvFile(webSocketUrl: string): Promise<boolean> {
    try {
      const envPath = path.join(process.cwd(), ".env");
      let envContent = "";

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }

      const wsLine = `CHROME_WS_ENDPOINT=${webSocketUrl}`;

      if (envContent.includes("CHROME_WS_ENDPOINT=")) {
        // Replace existing line
        envContent = envContent.replace(/CHROME_WS_ENDPOINT=.*/g, wsLine);
      } else {
        // Add new line
        envContent += (envContent ? "\n" : "") + wsLine;
      }

      fs.writeFileSync(envPath, envContent);
      return true;
    } catch (error) {
      console.log(
        "Error saving to .env file:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  async setupChrome(
    options: ChromeSetupOptions = {}
  ): Promise<ChromeSetupResult> {
    try {
      console.log("Setting up Chrome...");

      // Check if Chrome is already running
      const status = await this.checkChromeStatus();
      const wasAlreadyRunning = status.isRunning;

      if (!status.isRunning) {
        console.log("Chrome not running, starting...");

        const command = this.getChromeStartCommand(options.startUrl);
        exec(command, (error) => {
          if (error) {
            console.log("Error starting Chrome:", error.message);
          }
        });

        // Wait for Chrome to start
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Get WebSocket endpoint
      const webSocketUrl = await this.waitForWebSocketEndpoint();

      if (!webSocketUrl) {
        return {
          success: false,
          message: "Could not get WebSocket endpoint",
        };
      }

      if (options.startUrl && wasAlreadyRunning) {
        await this.openUrlInBrowser(webSocketUrl, options.startUrl);
      }

      // Save to .env if requested
      if (options.saveToEnv) {
        const saved = await this.saveToEnvFile(webSocketUrl);
        if (!saved) {
          console.log("Warning: Could not save to .env file");
        }
      }

      return {
        success: true,
        webSocketUrl,
        message: "Chrome setup completed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Alias for backward compatibility
export const ChromeHelper = ChromeService;
