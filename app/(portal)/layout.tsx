import { PortalProvider } from "@/components/portal-context";
import { PortalShell } from "@/components/portal-shell";
import { PortalAuthGate } from "@/components/portal-auth-gate";
export default function PortalLayout({ children }: { children: React.ReactNode }) { return <PortalProvider><PortalAuthGate><PortalShell>{children}</PortalShell></PortalAuthGate></PortalProvider>; }
