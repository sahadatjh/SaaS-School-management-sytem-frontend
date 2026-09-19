"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/components/portal-context";

export function PortalAuthGate({ children }: { children: React.ReactNode }) {
  const { loading, profile } = usePortal();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) router.replace("/login");
  }, [loading, profile, router]);

  if (loading || !profile) return <div className="grid min-h-screen place-items-center text-slate-600">Loading your portal…</div>;
  return children;
}
