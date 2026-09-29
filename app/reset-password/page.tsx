"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";

export default function ResetPasswordPage() {
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("token") ?? "",
  );
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (!token) {
      setError("This password-reset link is invalid.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setWorking(true);
    setError("");
    try {
      await portalApi.resetPassword({ token, password });
      setComplete(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to reset your password.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-950/5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
          Edu Soft
        </p>
        <h1 className="text-3xl font-bold text-slate-950">Reset password</h1>
        {complete ? (
          <div className="mt-6 space-y-4">
            <p className="text-slate-600">
              Your password has been reset. Sign in again on all devices.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium text-slate-800">
              New password
              <Input
                required
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Confirm new password
              <Input
                required
                name="confirmPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2"
              />
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={working}>
              {working ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
