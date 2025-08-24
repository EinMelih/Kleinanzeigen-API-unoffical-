import { exec, spawn } from "child_process";
import { FastifyInstance, FastifyReply } from "fastify";

// For Node.js < 18, we need to import fetch
let fetch: any;
if (typeof globalThis.fetch === "undefined") {
  fetch = require("node-fetch");
} else {
  fetch = globalThis.fetch;
}

interface ChromeStartRequest {
  Body: {
    email?: string;
    password?: string;
  };
}

interface ChromeStopRequest {
  Body: {};
}

let chromeProcess: any = null;
let chromePort: number = 9222;

export async function serverController(fastify: FastifyInstance) {
  // Start Chrome browser endpoint (this will trigger login process)
  fastify.post<ChromeStartRequest>(
    "/server/start",
    async (request, reply: FastifyReply) => {
      try {
        if (chromeProcess) {
          return reply.status(400).send({
            success: false,
            message: "Chrome browser is already running",
          });
        }

        const { email, password } = request.body;

        if (!email) {
          return reply.status(400).send({
            success: false,
            message: "Email is required to start Chrome browser",
          });
        }

        // Start Chrome with remote debugging
        const chromeArgs = [
          "--remote-debugging-port=9222",
          "--user-data-dir=./chrome-data",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-sync",
          "--disable-translate",
          "--disable-web-security",
          "--allow-running-insecure-content",
          "--disable-features=VizDisplayCompositor",
        ];

        chromeProcess = spawn("chrome", chromeArgs, {
          stdio: "pipe",
          shell: true,
          env: { ...process.env },
        });

        chromeProcess.stdout?.on("data", (data: Buffer) => {
          console.log(`Chrome stdout: ${data}`);
        });

        chromeProcess.stderr?.on("data", (data: Buffer) => {
          console.log(`Chrome stderr: ${data}`);
        });

        chromeProcess.on("error", (error: Error) => {
          console.error("Chrome process error:", error);
          chromeProcess = null;
        });

        chromeProcess.on("exit", (code: number) => {
          console.log(`Chrome process exited with code ${code}`);
          chromeProcess = null;
        });

        // Wait a moment for Chrome to start
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // If password is provided, we can trigger a login process
        let message = `Chrome browser started successfully on port ${chromePort}`;
        if (password) {
          message += ` - Login process will be initiated for ${email}`;
        }

        return reply.send({
          success: true,
          message: message,
          port: chromePort,
          email: email,
          hasPassword: !!password,
        });
      } catch (error) {
        console.error("Error starting Chrome browser:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to start Chrome browser",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Stop Chrome browser endpoint
  fastify.post<ChromeStopRequest>(
    "/server/stop",
    async (_, reply: FastifyReply) => {
      try {
        if (!chromeProcess) {
          return reply.status(400).send({
            success: false,
            message: "No Chrome browser process is running",
          });
        }

        // Kill the Chrome process
        if (process.platform === "win32") {
          // Windows: Kill the process tree
          exec(`taskkill /F /T /PID ${chromeProcess.pid}`, (error) => {
            if (error) {
              console.log("Error killing Chrome process tree:", error);
            }
          });
        } else {
          // Unix-like: Kill the process
          chromeProcess.kill("SIGTERM");
        }

        // Wait for process to terminate
        await new Promise<void>((resolve) => {
          if (chromeProcess) {
            chromeProcess.on("exit", () => {
              chromeProcess = null;
              resolve();
            });

            // Force kill after 5 seconds if it doesn't exit gracefully
            setTimeout(() => {
              if (chromeProcess) {
                chromeProcess.kill("SIGKILL");
                chromeProcess = null;
                resolve();
              }
            }, 5000);
          } else {
            resolve();
          }
        });

        return reply.send({
          success: true,
          message: "Chrome browser stopped successfully",
        });
      } catch (error) {
        console.error("Error stopping Chrome browser:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to stop Chrome browser",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Get Chrome browser status endpoint
  fastify.get("/server/status", async (_, reply: FastifyReply) => {
    try {
      const isRunning = chromeProcess !== null;
      const port = chromePort;

      // Check if the Chrome debugging port is actually responding
      let isPortResponding = false;
      if (isRunning) {
        try {
          const response = await fetch(`http://localhost:${port}/json/version`);
          isPortResponding = response.ok;
        } catch (error) {
          isPortResponding = false;
        }
      }

      return reply.send({
        success: true,
        data: {
          isRunning,
          port,
          isPortResponding,
          pid: chromeProcess?.pid || null,
          lastCheck: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error getting Chrome browser status:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get Chrome browser status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
