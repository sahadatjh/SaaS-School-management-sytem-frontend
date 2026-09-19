import { NextResponse } from "next/server";
import { protectedBackendRequest } from "@/lib/server-api";

export async function GET() {
  const response = await protectedBackendRequest("/dashboard/summary");
  return NextResponse.json(await response.json(), { status: response.status });
}
