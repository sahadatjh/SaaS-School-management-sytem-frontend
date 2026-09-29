"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { PortalProfile } from "@/lib/contracts";
import { portalApi } from "@/lib/portal-api";
const PortalContext = createContext<{
  profile: PortalProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}>({ profile: null, loading: true, refreshProfile: async () => undefined });
export function PortalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshProfile = useCallback(async () => {
    const nextProfile = await portalApi.profile();
    setProfile(nextProfile);
  }, []);
  useEffect(() => {
    portalApi
      .profile()
      .then(setProfile)
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);
  return (
    <PortalContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </PortalContext.Provider>
  );
}
export const usePortal = () => useContext(PortalContext);
