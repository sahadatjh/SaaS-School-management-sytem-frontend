"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Building2, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { usePortal } from "@/components/portal-context";
import type {
  InstitutionProfile,
  InstitutionProfilePayload,
} from "@/lib/contracts";
import { portalApi } from "@/lib/portal-api";

type FormState = {
  name: string;
  eiin: string;
  address: string;
  phone: string;
  contactEmail: string;
  website: string;
  timezone: string;
  primaryColor: string;
};

const emptyForm: FormState = {
  name: "",
  eiin: "",
  address: "",
  phone: "",
  contactEmail: "",
  website: "",
  timezone: "Asia/Dhaka",
  primaryColor: "#ea580c",
};

function fromProfile(profile: InstitutionProfile): FormState {
  return {
    name: profile.name,
    eiin: profile.eiin ?? "",
    address: profile.address ?? "",
    phone: profile.phone ?? "",
    contactEmail: profile.contactEmail ?? "",
    website: profile.website ?? "",
    timezone: profile.timezone,
    primaryColor: profile.branding?.primaryColor ?? "#ea580c",
  };
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function InstitutionProfilePage() {
  const { profile: portalProfile, refreshProfile } = usePortal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage =
    portalProfile?.permissions.includes("institutions.manage") ?? false;

  useEffect(() => {
    if (!canManage) return;
    portalApi.institutionProfile
      .get()
      .then((nextProfile) => {
        setProfile(nextProfile);
        setForm(fromProfile(nextProfile));
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load institution profile.",
        ),
      )
      .finally(() => setLoading(false));
  }, [canManage]);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Institution name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: InstitutionProfilePayload = {
      name: form.name.trim(),
      eiin: form.eiin.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      website: form.website.trim() || null,
      timezone: form.timezone,
      branding: { primaryColor: form.primaryColor },
    };
    try {
      const updated = await portalApi.institutionProfile.update(payload);
      setProfile(updated);
      setForm(fromProfile(updated));
      await refreshProfile();
      toast.success("Institution profile updated.");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to update institution profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const logo = event.target.files?.[0];
    event.target.value = "";
    if (!logo) return;
    if (!["image/png", "image/jpeg"].includes(logo.type)) {
      setError("Upload a PNG or JPEG image.");
      return;
    }
    if (logo.size > 5 * 1024 * 1024) {
      setError("Logo must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const updated = await portalApi.institutionProfile.uploadLogo(logo);
      setProfile(updated);
      toast.success("Institution logo updated.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to upload logo.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  if (!canManage)
    return (
      <Card className="max-w-2xl p-6">
        <h1 className="text-xl font-bold text-slate-950">
          Institution Profile
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to manage institution settings.
        </p>
      </Card>
    );
  if (loading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto w-full ">
      <div className="mb-6">
        <p className="text-sm font-medium text-orange-600">Settings</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Institution Profile
        </h1>
      </div>
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center overflow-hidden rounded-xl bg-orange-50 text-orange-600">
                {profile?.logoUrl ? (
                  // The backend serves this user-uploaded local asset, which is not a configured Next image source.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logoUrl}
                    alt={`${profile.name} logo`}
                    className="size-full object-cover"
                  />
                ) : (
                  <Building2 className="size-7" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-slate-950">{profile?.name}({profile?.eiin})</h2>
                <p className="text-sm text-slate-500">{profile?.address}</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={uploadLogo}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}{" "}
              {uploading ? "Uploading" : "Change logo"}
            </Button>
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-6 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Institution name" required>
              <Input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                disabled={saving}
              />
            </Field>
            <Field label="EIIN">
              <Input
                value={form.eiin}
                onChange={(event) => setField("eiin", event.target.value)}
                inputMode="numeric"
                placeholder="e.g. 108567"
                disabled={saving}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="e.g. +8801712345678"
                disabled={saving}
              />
            </Field>
            <Field label="Contact email">
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setField("contactEmail", event.target.value)
                }
                placeholder="e.g. info@example.edu.bd"
                disabled={saving}
              />
            </Field>
            <Field label="Website">
              <Input
                type="url"
                value={form.website}
                onChange={(event) => setField("website", event.target.value)}
                placeholder="e.g. https://example.edu.bd"
                disabled={saving}
              />
            </Field>
            <Field label="Timezone">
              <Input
                value={form.timezone}
                onChange={(event) => setField("timezone", event.target.value)}
                placeholder="e.g. Asia/Dhaka"
                disabled={saving}
              />
            </Field>
            <Field label="Brand color">
              <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(event) =>
                    setField("primaryColor", event.target.value)
                  }
                  className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  disabled={saving}
                  aria-label="Brand color"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(event) =>
                    setField("primaryColor", event.target.value)
                  }
                  className="h-8 border-0 px-1 shadow-none focus-visible:ring-0"
                  disabled={saving}
                />
              </div>
            </Field>
            <Field label="Address" className="md:col-span-2">
              <textarea
                value={form.address}
                onChange={(event) => setField("address", event.target.value)}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              />
            </Field>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
