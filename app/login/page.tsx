"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError("");

		const form = new FormData(event.currentTarget);

		try {
			await portalApi.login({
				email: String(form.get("email") ?? ""),
				password: String(form.get("password") ?? ""),
			});
			router.replace("/dashboard");
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Unable to sign in. Please try again.",
			);
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

				<form className="mt-8 space-y-5" onSubmit={submit}>
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

					<label className="block text-sm font-medium text-slate-800">
						Password
						<div className="relative mt-2">
							<Input
								required
								name="password"
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								className="pr-11"
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
					</label>

					{error && (
						<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
							{error}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={busy}>
						{busy ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</section>
		</main>
	);
}
