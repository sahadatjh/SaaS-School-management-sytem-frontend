import { NextResponse } from "next/server";
import { protectedBackendRequest } from "@/lib/server-api";

export async function POST() {
  const response = await protectedBackendRequest("/auth/me");
  if (!response.ok) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Your session has ended." } }, { status: 401 });
  return NextResponse.json({ success: true, data: { refreshed: true } });
}
