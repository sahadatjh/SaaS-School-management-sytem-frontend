"use client";

import type { ApiEnvelope } from "@/lib/contracts";

const base = (process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");
const key = "edu-soft.platform-tokens";
type Tokens = { accessToken: string; refreshToken: string };
export type PlatformProfile = { userId: string; email: string };
export type PlatformInstitution = { id: string; name: string; subdomain: string; timezone: string; address?: string; is_active: boolean; trial_started_on?: string; trial_ends_on?: string; trialState: "active" | "expired" | "not_configured" };
export type InstituteAdmin = { id: string; userId: string; email: string; requiresPasswordSetup: boolean; expiresAt?: string; acceptedAt?: string; emailStatus: "pending" | "processing" | "sent" | "failed"; createdAt: string };
export type Page = { items: PlatformInstitution[]; pagination: { page: number; limit: number; total: number } };
const get = (): Tokens | null => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as Tokens : null; } catch { return null; } };
const set = (tokens: Tokens | null) => tokens ? localStorage.setItem(key, JSON.stringify(tokens)) : localStorage.removeItem(key);
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const tokens = get(); if (!tokens) throw new Error("Your platform session has ended.");
  const response = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", Authorization: `Bearer ${tokens.accessToken}`, ...init.headers } });
  if (response.status === 401 && retry) { const refreshed = await refresh(); if (refreshed) return request<T>(path, init, false); }
  const payload = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !payload.success) throw new Error(payload.success ? "Unable to complete the request." : payload.error.message);
  return payload.data;
}
async function refresh() { const tokens = get(); if (!tokens) return false; try { const response = await fetch(`${base}/auth/platform/refresh`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: tokens.refreshToken }) }); const payload = await response.json() as ApiEnvelope<Tokens>; if (!response.ok || !payload.success) throw new Error(); set(payload.data); return true; } catch { set(null); return false; } }
export const platformApi = {
  async login(email: string, password: string) { const response = await fetch(`${base}/auth/platform/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); const payload = await response.json() as ApiEnvelope<Tokens>; if (!response.ok || !payload.success) throw new Error(payload.success ? "Unable to sign in." : payload.error.message); set(payload.data); },
  me: () => request<PlatformProfile>("/auth/platform/me"),
  list: (params: URLSearchParams) => request<Page>(`/platform/institutions?${params}`),
  get: (id: string) => request<PlatformInstitution>(`/platform/institutions/${id}`),
  create: (payload: { name: string; subdomain: string; timezone?: string; address?: string; trialDays: number }) => request<PlatformInstitution>("/platform/institutions", { method: "POST", body: JSON.stringify(payload) }),
  status: (id: string, isActive: boolean) => request<PlatformInstitution>(`/platform/institutions/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  trial: (id: string, trialDays: number) => request<PlatformInstitution>(`/platform/institutions/${id}/trial`, { method: "PATCH", body: JSON.stringify({ trialDays }) }),
  instituteAdmins: (id: string) => request<InstituteAdmin[]>(`/platform/institutions/${id}/institute-admins`),
  createInstituteAdmin: (id: string, email: string) => request<InstituteAdmin>(`/platform/institutions/${id}/institute-admins`, { method: "POST", body: JSON.stringify({ email }) }),
  resendInstituteAdminWelcome: (id: string, userId: string) => request<{ id: string; emailStatus: "pending" }>(`/platform/institutions/${id}/institute-admins/${userId}/resend-welcome`, { method: "POST" }),
  logout: async () => { const tokens = get(); if (tokens) await fetch(`${base}/auth/platform/logout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: tokens.refreshToken }) }); set(null); },
};
