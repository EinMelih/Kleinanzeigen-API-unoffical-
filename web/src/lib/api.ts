// Typed API layer for data fetching
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchParams {
  query?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface AnalyticsOverview {
  totalAds: number;
  activeAds: number;
  views: number;
  clicks: number;
  conversionRate: number;
}

// Base API configuration
const API_BASE = "/api";

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
}

// Ads API
export const adsApi = {
  getAll: () => apiFetch<Ad[]>("/ads"),
  getById: (id: string) => apiFetch<Ad>(`/ads/${id}`),
  update: (id: string, data: Partial<Ad>) =>
    apiFetch<Ad>(`/ads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/ads/${id}`, {
      method: "DELETE",
    }),
};

// Search API
export const searchApi = {
  search: (params: SearchParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return apiFetch<Ad[]>(`/search?${searchParams.toString()}`);
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: () => apiFetch<AnalyticsOverview>("/analytics/overview"),
};

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiFetch<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  checkStatus: () =>
    apiFetch<{ isAuthenticated: boolean; user?: any }>("/auth/status"),
};
