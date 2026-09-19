"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PortalProfile } from "@/lib/contracts";
import { portalApi } from "@/lib/portal-api";
const PortalContext = createContext<{ profile: PortalProfile | null; loading: boolean }>({ profile: null, loading: true });
export function PortalProvider({ children }: { children: React.ReactNode }) { const router = useRouter(); const [profile, setProfile] = useState<PortalProfile | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { portalApi.profile().then(setProfile).catch(async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); }).finally(() => setLoading(false)); }, [router]); return <PortalContext.Provider value={{ profile, loading }}>{children}</PortalContext.Provider>; }
export const usePortal = () => useContext(PortalContext);
