import { NextResponse } from "next/server";
import { login, sessionCookies } from "@/lib/server-api";

export async function POST(request: Request) {
  const credentials = await request.json() as { email?: string; password?: string };
  const response = await login({ email: credentials.email ?? "", password: credentials.password ?? "" });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json(payload, { status: response.status });
  const tokens = payload.data as { accessToken?: string; refreshToken?: string };
  if (!tokens.accessToken || !tokens.refreshToken) return NextResponse.json({ success: false, error: { code: "AUTHENTICATION_FAILED", message: "Unable to start your session." } }, { status: 401 });
  await sessionCookies.set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  return NextResponse.json({ success: true, data: { authenticated: true } });
}
