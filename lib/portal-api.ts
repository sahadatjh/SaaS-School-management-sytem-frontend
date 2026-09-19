import type { ApiEnvelope, DashboardSummary, PortalProfile } from "@/lib/contracts";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const payload = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !payload.success) throw new Error("Unable to load portal data.");
  return payload.data;
}

export const portalApi = {
  profile: () => request<PortalProfile>("/api/portal/profile"),
  dashboard: () => request<DashboardSummary>("/api/portal/dashboard"),
};
