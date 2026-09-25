"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { portalApi } from "@/lib/portal-api";

export default function LoginPage() {
	const router = useRouter();
	const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
	const [busy, setBusy] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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
						<div className="relative mt-2">
							<Input
								name="password"
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								className="pr-11"
								aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
								aria-invalid={Boolean(fieldErrors.password)}
								onChange={() =>
									setFieldErrors((current) => ({ ...current, password: "" }))
								}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((visible) => !visible)}
								disabled={busy}
								aria-label={showPassword ? "Hide password" : "Show password"}
								aria-pressed={showPassword}
								className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 disabled:pointer-events-none disabled:opacity-50"
							>
								{showPassword ? (
									<EyeOff className="size-4" aria-hidden="true" />
								) : (
									<Eye className="size-4" aria-hidden="true" />
								)}
							</button>
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
