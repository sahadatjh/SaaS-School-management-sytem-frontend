"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthTokens } from "@/lib/auth-tokens";
export default function Home() { const router = useRouter(); useEffect(() => { router.replace(getAuthTokens() ? "/dashboard" : "/login"); }, [router]); return <div className="grid min-h-screen place-items-center text-slate-600">Loading…</div>; }
