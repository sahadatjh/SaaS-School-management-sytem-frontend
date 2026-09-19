import "server-only";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.BACKEND_API_BASE_URL ?? "http://localhost:8000/api/v1";
const ACCESS_COOKIE = "portal_access";
const REFRESH_COOKIE = "portal_refresh";
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export const sessionCookies = {
  async set(tokens: { accessToken: string; refreshToken: string }) {
    const store = await cookies();
    store.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: 60 * 15 });
    store.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  },
  async clear() {
    const store = await cookies();
    store.delete(ACCESS_COOKIE);
    store.delete(REFRESH_COOKIE);
  },
  async hasAccess() { return Boolean((await cookies()).get(ACCESS_COOKIE)?.value); },
};

async function backend(path: string, init: RequestInit = {}, accessToken?: string) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
    cache: "no-store",
  });
}

export async function login(credentials: { email: string; password: string }) {
  return backend("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
}

export async function logout() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) await backend("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
  await sessionCookies.clear();
}

export async function protectedBackendRequest(path: string) {
  const store = await cookies();
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  const response = await backend(path, {}, accessToken);
  if (response.status !== 401) return response;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) { await sessionCookies.clear(); return response; }
  const refresh = await backend("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
  if (!refresh.ok) { await sessionCookies.clear(); return response; }
  const payload = await refresh.json() as { data?: { accessToken?: string; refreshToken?: string } };
  if (!payload.data?.accessToken || !payload.data.refreshToken) { await sessionCookies.clear(); return response; }
  await sessionCookies.set({ accessToken: payload.data.accessToken, refreshToken: payload.data.refreshToken });
  accessToken = payload.data.accessToken;
  return backend(path, {}, accessToken);
}
