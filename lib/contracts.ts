export type ApiEnvelope<T> = { success: true; data: T; meta?: { requestId?: string } } | { success: false; error: { code: string; message: string } };
export type Institution = { id: string; name: string; subdomain: string; timezone: string };
export type PortalProfile = { institution: Institution; permissions: string[] };
export type Metric = { availability: "available"; value: number } | { availability: "unavailable"; unavailableReason: string };
export type DashboardSummary = { institution: Institution; metrics: Record<string, Metric> };
