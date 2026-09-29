"use client";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";
import { platformApi } from "@/lib/platform-api";

export default function PlatformLogin() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const errors = {
      email: email ? "" : "Email is required.",
      password: password ? "" : "Password is required.",
    };

    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      await platformApi.login(email, password);
      toast.success("Signed in successfully.");
      router.replace("/platform/institutions");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <form
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow"
        noValidate
        onSubmit={submit}
      >
        <h1 className="text-xl font-bold">Super Admin</h1>

        <div>
          <label htmlFor="platform-login-email" className="sr-only">
            Email
          </label>
          <input
            id="platform-login-email"
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            disabled={busy}
            aria-describedby={fieldErrors.email ? "platform-login-email-error" : undefined}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={() =>
              setFieldErrors((current) => ({ ...current, email: "" }))
            }
            className="w-full rounded border p-2"
          />
          {fieldErrors.email && (
            <p id="platform-login-email-error" role="alert" className="mt-1 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="platform-login-password" className="sr-only">
            Password
          </label>
          <input
            id="platform-login-password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            disabled={busy}
            aria-describedby={fieldErrors.password ? "platform-login-password-error" : undefined}
            aria-invalid={Boolean(fieldErrors.password)}
            onChange={() =>
              setFieldErrors((current) => ({ ...current, password: "" }))
            }
            className="w-full rounded border p-2"
          />
          {fieldErrors.password && (
            <p id="platform-login-password-error" role="alert" className="mt-1 text-sm text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-orange-600 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
