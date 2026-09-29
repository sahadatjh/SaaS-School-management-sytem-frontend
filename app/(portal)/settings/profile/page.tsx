"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePortal } from "@/components/portal-context";
import { portalApi } from "@/lib/portal-api";

function initial(name: string | null, email: string): string {
  return (name?.trim() || email.trim()).charAt(0).toUpperCase() || "U";
}

export default function MyProfilePage() {
  const { profile, refreshProfile } = usePortal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile?.user.displayName ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!profile) return null;
  const user = profile.user;

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await portalApi.userProfile.update({ displayName });
      await refreshProfile();
      setMessage("Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const avatar = event.target.files?.[0];
    event.target.value = "";
    if (!avatar) return;
    if (!['image/png', 'image/jpeg'].includes(avatar.type)) {
      setError("Upload a PNG or JPEG image.");
      return;
    }
    if (avatar.size > 5 * 1024 * 1024) {
      setError("Profile photo must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      await portalApi.userProfile.uploadAvatar(avatar);
      await refreshProfile();
      setMessage("Profile photo updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload profile photo.");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setError("");
    setMessage("");
    try {
      await portalApi.userProfile.removeAvatar();
      await refreshProfile();
      setMessage("Profile photo removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove profile photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Settings</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">My Profile</h1>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-orange-100 text-3xl font-bold text-orange-700">
            {user.avatar?.url ? (
              // The backend serves this uploaded asset from its public avatar path.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar.url} alt={`${user.displayName ?? user.email} profile photo`} className="size-full object-cover" />
            ) : (
              initial(user.displayName, user.email)
            )}
          </div>
          <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={uploadAvatar} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Camera className="mr-2 size-4" />{user.avatar ? "Replace photo" : "Upload photo"}
              </Button>
              {user.avatar && <Button type="button" variant="outline" onClick={removeAvatar} disabled={uploading}><Trash2 className="mr-2 size-4" />Remove</Button>}
            </div>
            <p className="text-sm text-slate-500">PNG or JPEG, up to 5 MB.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form className="space-y-5" onSubmit={saveProfile}>
          <label className="block text-sm font-medium text-slate-800">
            Display name
            <Input required maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2" placeholder="Your name" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Email
            <Input value={user.email} readOnly className="mt-2 bg-slate-50" />
          </label>
          <div className="flex justify-end">
            <Button disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
