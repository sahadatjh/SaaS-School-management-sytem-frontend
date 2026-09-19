import { redirect } from "next/navigation";
import { sessionCookies } from "@/lib/server-api";
import { PortalProvider } from "@/components/portal-context";
import { PortalShell } from "@/components/portal-shell";
export default async function PortalLayout({ children }: { children: React.ReactNode }) { if (!(await sessionCookies.hasAccess())) redirect("/login"); return <PortalProvider><PortalShell>{children}</PortalShell></PortalProvider>; }
