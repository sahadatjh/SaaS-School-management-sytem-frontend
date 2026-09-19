"use client";

import { clearAuthTokens, getAuthTokens, setAuthTokens, type AuthTokens } from "@/lib/auth-tokens";
import type { ApiEnvelope, DashboardSummary, PortalProfile } from "@/lib/contracts";

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");

export class PortalApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function backend(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new PortalApiError(response.status, payload.success ? "Unable to complete the request." : payload.error.message);
  }
  return payload.data;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const tokens = getAuthTokens();
    if (!tokens) return null;
    try {
      const response = await backend("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: tokens.refreshToken }) });
      const replacement = await parseEnvelope<AuthTokens>(response);
      if (!replacement.accessToken || !replacement.refreshToken) throw new Error("Incomplete token response");
      setAuthTokens(replacement);
      return replacement;
    } catch {
      clearAuthTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function authenticatedRequest<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const tokens = getAuthTokens();
  if (!tokens) throw new PortalApiError(401, "Your session has ended.");
  const response = await backend(path, { ...init, headers: { Authorization: `Bearer ${tokens.accessToken}`, ...init.headers } });
  if (response.status === 401 && !retried && await refreshTokens()) return authenticatedRequest<T>(path, init, true);
  return parseEnvelope<T>(response);
}

export const portalApi = {
  async login(credentials: { email: string; password: string }): Promise<void> {
    const response = await backend("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    const tokens = await parseEnvelope<AuthTokens>(response);
    if (!tokens.accessToken || !tokens.refreshToken) throw new PortalApiError(401, "Unable to start your session.");
    setAuthTokens(tokens);
  },
  profile: () => authenticatedRequest<PortalProfile>("/auth/me"),
  dashboard: () => authenticatedRequest<DashboardSummary>("/dashboard/summary"),
  async logout(): Promise<void> {
    const tokens = getAuthTokens();
    try {
      if (tokens) await backend("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: tokens.refreshToken }) });
    } finally {
      clearAuthTokens();
    }
  },
};
