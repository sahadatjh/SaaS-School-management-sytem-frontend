"use client";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const STORAGE_KEY = "edu-soft.auth-tokens";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getAuthTokens(): AuthTokens | null {
  const value = storage()?.getItem(STORAGE_KEY);
  if (!value) return null;

  try {
    const tokens: unknown = JSON.parse(value);
    if (
      typeof tokens === "object" && tokens !== null &&
      "accessToken" in tokens && "refreshToken" in tokens &&
      typeof tokens.accessToken === "string" && tokens.accessToken.length > 0 &&
      typeof tokens.refreshToken === "string" && tokens.refreshToken.length > 0
    ) return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  } catch {
    // Invalid local state is treated as an ended session.
  }

  clearAuthTokens();
  return null;
}

export function setAuthTokens(tokens: AuthTokens): void {
  if (!tokens.accessToken || !tokens.refreshToken) return clearAuthTokens();
  storage()?.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
  storage()?.removeItem(STORAGE_KEY);
}
