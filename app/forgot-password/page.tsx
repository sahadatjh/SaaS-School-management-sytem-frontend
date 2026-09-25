"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";

export default function ForgotPasswordPage() {
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      await portalApi.requestPasswordReset(email);
      setComplete(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to request a password reset.",
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
        <h1 className="text-3xl font-bold text-slate-950">Forgot password</h1>
        {complete ? (
          <div className="mt-6 space-y-4">
            <p className="text-slate-600">
              If an eligible account uses this email, a password-reset link has been sent.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <p className="text-slate-600">
              Enter your account email and we will send a password-reset link.
            </p>
            <label className="block text-sm font-medium text-slate-800">
              Email
              <Input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="mt-2"
              />
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={working}>
              {working ? "Sending..." : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-slate-600">
              <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
