// Chrome and WebSocket related types
export interface ChromeStatus {
  isRunning: boolean;
  version?: string;
  error?: string;
}

export interface ChromeSetupResult {
  success: boolean;
  webSocketUrl?: string;
  message?: string;
  error?: string;
}

export interface ChromeSetupOptions {
  saveToEnv?: boolean;
  retryCount?: number;
}

// Authentication related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  ok: boolean;
  loggedIn: boolean;
  didSubmit: boolean;
  cookieFile?: string;
  message?: string;
  error?: string;
}

export interface LoginStatus {
  isLoggedIn: boolean;
  needsLogin: boolean;
}

export interface UserAuthStatus {
  email: string;
  isLoggedIn: boolean;
  needsLogin: boolean;
}

export interface AllUsersAuthResult {
  status: 'success' | 'no_users' | 'error';
  totalUsers?: number;
  users?: UserAuthStatus[];
  message?: string;
  error?: string;
}

// API readiness types
export interface ApiReadinessStatus {
  status: 'ready' | 'not_ready';
  chrome?: {
    isRunning: boolean;
    version?: string;
  };
  webSocket?: {
    available: boolean;
    endpoint?: string;
  };
  timestamp: string;
  error?: string;
}

// Server response types
export interface LoginResponse {
  status: 'already_logged_in' | 'needs_login' | 'error';
  message: string;
  loggedIn: boolean;
  needsLogin: boolean;
  error?: string;
}

export interface StatusResponse {
  email: string;
  isLoggedIn: boolean;
  needsLogin: boolean;
}

export interface HealthResponse {
  ok: boolean;
  message: string;
  timestamp: string;
}

// Fastify request types
export interface LoginRequestBody {
  email: string;
  password: string;
}

// Error types
export interface ApiError {
  status: 'error';
  message: string;
  error?: string;
}
