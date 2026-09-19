"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { platformApi, type PlatformProfile } from "@/lib/platform-api";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const login = pathname === "/platform/login";
  useEffect(() => {
    if (login) return;
    platformApi.me().then(setProfile).catch(() => router.replace("/platform/login"));
  }, [login, router]);
  if (login) return children;
  if (!profile) return <main className="grid min-h-screen place-items-center text-slate-600">Loading Super Admin portal…</main>;
  return <div className="min-h-screen bg-slate-100"><header className="flex items-center justify-between border-b bg-white px-5 py-4"><Link href="/platform/institutions" className="font-bold text-slate-950">Edu Soft · Super Admin</Link><div className="flex items-center gap-4 text-sm text-slate-600"><span>{profile.email}</span><button onClick={async () => { await platformApi.logout(); router.replace("/platform/login"); }} className="font-medium text-orange-600">Sign out</button></div></header><main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main></div>;
}
