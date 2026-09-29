"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/components/ui/sonner";
import { portalApi } from "@/lib/portal-api";

export default function LoginPage() {
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
//hi
		setBusy(true);

		try {
			await portalApi.login({
				email,
				password,
			});
			toast.success("Signed in successfully.");
			router.replace("/dashboard");
		} catch (cause) {
			toast.error(
				cause instanceof Error
					? cause.message
					: "Unable to sign in. Please try again.",
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="grid min-h-screen place-items-center bg-slate-100 p-5">
			<section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-950/5">
				<p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
					Edu Soft
				</p>
				<h1 className="text-3xl font-bold text-slate-950">Welcome back</h1>
				<p className="mt-2 text-slate-600">Sign in to your institution portal.</p>

				<form className="mt-8 space-y-5" noValidate onSubmit={submit}>
					<label className="block text-sm font-medium text-slate-800">
						Email
						<Input
							name="email"
							type="email"
							autoComplete="email"
							className="mt-2"
							aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
							aria-invalid={Boolean(fieldErrors.email)}
							onChange={() =>
								setFieldErrors((current) => ({ ...current, email: "" }))
							}
						/>
						{fieldErrors.email && (
							<p id="login-email-error" role="alert" className="mt-1 text-sm text-red-600">
								{fieldErrors.email}
							</p>
						)}
					</label>

					<label className="block text-sm font-medium text-slate-800">
						Password
						<div className="mt-2">
							<PasswordInput
								name="password"
								autoComplete="current-password"
								disabled={busy}
								aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
								aria-invalid={Boolean(fieldErrors.password)}
								onChange={() =>
									setFieldErrors((current) => ({ ...current, password: "" }))
								}
							/>
						</div>
						{fieldErrors.password && (
							<p id="login-password-error" role="alert" className="mt-1 text-sm text-red-600">
								{fieldErrors.password}
							</p>
						)}
					</label>

					<div className="text-right">
						<Link
							href="/forgot-password"
							className="text-sm font-medium text-orange-600 hover:text-orange-700"
						>
							Forgot password?
						</Link>
					</div>


					<Button type="submit" className="w-full" disabled={busy}>
						{busy ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</section>
		</main>
	);
}
