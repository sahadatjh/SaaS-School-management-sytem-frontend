"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { platformApi } from "@/lib/platform-api";

export default function NewInstitutionPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [trialError, setTrialError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const trialDays = Number(form.get("trialDays"));

    if (!Number.isInteger(trialDays) || trialDays < 1) {
      setTrialError("Enter a positive whole number of trial days.");
      return;
    }

    setSaving(true);
    setError("");
    setTrialError("");

    try {
      const institution = await platformApi.create({
        name: String(form.get("name")).trim(),
        subdomain: String(form.get("subdomain")).trim(),
        timezone: String(form.get("timezone")).trim() || undefined,
        address: String(form.get("address")).trim() || undefined,
        trialDays,
      });
      router.replace(`/platform/institutions/${institution.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create school.");
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Platform management</p>
        <h1 className="text-2xl font-bold text-slate-950">Add school</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set up the school profile and its initial trial access period.
        </p>
      </div>

      <Card className="w-full p-5 sm:p-6 lg:p-8">
        <form className="space-y-8" onSubmit={submit}>
          <section aria-labelledby="school-profile-heading" className="space-y-5">
            <div className="border-b border-slate-200 pb-4">
              <h2 id="school-profile-heading" className="text-lg font-semibold text-slate-950">
                School profile
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                These details identify the school in the platform.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="block text-sm font-medium text-slate-800">
                School name
                <Input required name="name" className="mt-2" autoComplete="organization" />
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Subdomain
                <Input
                  required
                  name="subdomain"
                  pattern="[a-z0-9-]+"
                  className="mt-2"
                  placeholder="example-school"
                  aria-describedby="subdomain-help"
                />
                <span id="subdomain-help" className="mt-2 block text-xs font-normal text-slate-500">
                  Use lowercase letters, numbers, and hyphens only.
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Timezone
                <Input name="timezone" defaultValue="Asia/Dhaka" className="mt-2" />
              </label>
              <label className="block text-sm font-medium text-slate-800 lg:row-span-2">
                Address <span className="font-normal text-slate-500">(optional)</span>
                <textarea
                  name="address"
                  className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>
          </section>

          <section aria-labelledby="trial-period-heading" className="rounded-lg border border-orange-200 bg-orange-50 p-5">
            <div className="max-w-2xl">
              <h2 id="trial-period-heading" className="text-lg font-semibold text-slate-950">
                Trial period
              </h2>
              <p id="trial-days-help" className="mt-1 text-sm text-slate-700">
                Enter the number of inclusive trial days. The trial starts today in the school&apos;s timezone.
              </p>
              <label className="mt-5 block max-w-sm text-sm font-medium text-slate-800">
                Trial days
                <Input
                  required
                  name="trialDays"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="14"
                  className="mt-2 bg-white"
                  aria-describedby="trial-days-help trial-days-error"
                  aria-invalid={Boolean(trialError)}
                  onChange={() => setTrialError("")}
                  onInvalid={() => setTrialError("Enter a positive whole number of trial days.")}
                />
              </label>
              <p id="trial-days-error" role="alert" className="mt-2 min-h-5 text-sm text-red-700">
                {trialError}
              </p>
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={saving} onClick={() => router.back()}>
              Cancel
            </Button>
            <Button disabled={saving}>{saving ? "Creating school…" : "Create school"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
