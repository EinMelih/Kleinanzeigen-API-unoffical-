import * as fs from "fs";
import * as path from "path";
import {
  AllUsersAuthResult,
  LoginStatus,
  UserAuthStatus,
} from "../../shared/types";

// Check if user is logged in
export async function checkLoginStatus(email: string): Promise<LoginStatus> {
  if (!email) return { isLoggedIn: false, needsLogin: true };

  const cookieFileName = `cookies-${email.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
  const cookiePath = path.join(process.cwd(), "data", "cookies", cookieFileName);

  if (!fs.existsSync(cookiePath)) {
    return { isLoggedIn: false, needsLogin: true };
  }

  try {
    const cookies = JSON.parse(fs.readFileSync(cookiePath, "utf8"));
    console.log(`Checking cookies for ${email}: found ${cookies.length} cookies in ${cookiePath}`);
    // Simple check: if cookies exist, we assume the user is logged in
    return { isLoggedIn: cookies.length > 0, needsLogin: cookies.length === 0 };
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
