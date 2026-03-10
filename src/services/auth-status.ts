import * as fs from "fs";
import * as path from "path";
import {
  AllUsersAuthResult,
  LoginStatus,
  UserAuthStatus,
} from "../../shared/types";
import { CookieValidator } from "./cookies-validation";
import { ManualModeService } from "./manual-mode.service";
import { SessionProfileService } from "./session-profile.service";

// Check if user is logged in
export async function checkLoginStatus(email: string): Promise<LoginStatus> {
  if (!email) return { isLoggedIn: false, needsLogin: true };

  const cookieFileName = `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
  const cookiePath = path.join(process.cwd(), "data", "cookies", cookieFileName);
  const sessionProfiles = new SessionProfileService();
  const manualMode = new ManualModeService();
  const profileStatus = await sessionProfiles.getStatus(email);

  if (manualMode.isEnabled()) {
    return {
      isLoggedIn: profileStatus.state === "authenticated",
      needsLogin: profileStatus.state !== "authenticated",
    };
  }

  if (profileStatus.profileExists) {
    const sessionStatus = await sessionProfiles.verifySession(email, {
      startIfNeeded: true,
      saveCookies: true,
      source: "auth:status-check",
    });

    if (sessionStatus.loggedIn) {
      return { isLoggedIn: true, needsLogin: false };
    }
  }

  if (!fs.existsSync(cookiePath)) {
    return { isLoggedIn: false, needsLogin: true };
  }

  try {
    const validator = new CookieValidator();
    const expiryStatus = await validator.checkCookieExpiry(cookiePath);

    if (!expiryStatus.isValid || expiryStatus.cookieCount === 0) {
      return { isLoggedIn: false, needsLogin: true };
    }

    const liveStatus = await validator.testCookieLogin(cookiePath);
    return {
      isLoggedIn: liveStatus.isValid,
      needsLogin: !liveStatus.isValid,
    };
  } catch (error) {
    console.log(`Error reading cookies for ${email}:`, error);
    return { isLoggedIn: false, needsLogin: true };
  }
}

// Check authentication status for all users
export async function checkAllUsersAuthStatus(): Promise<AllUsersAuthResult> {
  try {
    const cookiesDir = path.join(process.cwd(), "data", "cookies");
    if (!fs.existsSync(cookiesDir)) {
      return { status: "no_users", message: "No users found" };
    }

    const cookieFiles = fs
      .readdirSync(cookiesDir)
      .filter((file) => file.endsWith(".json"));
    const users: UserAuthStatus[] = [];

    for (const cookieFile of cookieFiles) {
      const email = cookieFile.replace("cookies-", "").replace(".json", "");
      const loginStatus = await checkLoginStatus(email);

      users.push({
        email,
        isLoggedIn: loginStatus.isLoggedIn,
        needsLogin: loginStatus.needsLogin,
      });
    }

    return {
      status: "success",
      totalUsers: users.length,
      users: users,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
