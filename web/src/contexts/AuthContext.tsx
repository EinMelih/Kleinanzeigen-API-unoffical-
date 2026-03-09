import { appClient } from "@/lib/app-client";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  isLoggedIn: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createUser(email: string, isLoggedIn: boolean): User {
  return {
    id: email || "default-account",
    email,
    isLoggedIn,
    name: email ? email.split("@")[0] : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const overview = await appClient.getOverview();

      if (overview.account.configured && overview.account.email) {
        setUser(createUser(overview.account.email, overview.account.isLoggedIn));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as {
      loggedIn?: boolean;
      message?: string;
    };

    if (!response.ok && !data.loggedIn) {
      throw new Error(data.message || "Login failed");
    }

    await checkAuth();
  };

  const logout = async () => {
    setUser(null);
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user?.isLoggedIn),
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
