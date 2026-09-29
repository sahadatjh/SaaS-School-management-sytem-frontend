"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiEnvelope } from "@/lib/contracts";

const base = (process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");

export default function SetPasswordPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (!token) {
      setError("This password setup link is invalid.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`${base}/auth/password-setup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok && response.status !== 204) {
        const payload = await response.json() as ApiEnvelope<unknown>;
        throw new Error(payload.success ? "Unable to set your password." : payload.error.message);
      }
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to set your password.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-950/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Edu Soft</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Set your password</h1>
        {complete ? (
          <div className="mt-6 space-y-4">
            <p className="text-slate-600">Your password is ready. You can now sign in to your institution portal.</p>
            <Button asChild className="w-full"><Link href="/login">Go to login</Link></Button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium text-slate-800">
              New password
              <Input required name="password" type="password" minLength={8} autoComplete="new-password" className="mt-2" />
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" disabled={working}>{working ? "Saving..." : "Set password"}</Button>
          </form>
        )}
      </section>
    </main>
  );
}
