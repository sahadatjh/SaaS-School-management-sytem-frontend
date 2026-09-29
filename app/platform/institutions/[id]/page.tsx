"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  platformApi,
  type InstituteAdmin,
  type PlatformInstitution,
} from "@/lib/platform-api";

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [institution, setInstitution] = useState<PlatformInstitution | null>(null);
  const [admins, setAdmins] = useState<InstituteAdmin[]>([]);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [school, adminUsers] = await Promise.all([
        platformApi.get(id),
        platformApi.instituteAdmins(id),
      ]);
      setInstitution(school);
      setAdmins(adminUsers);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load school.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus() {
    if (!institution) return;
    if (!window.confirm(`${institution.is_active ? "Deactivate" : "Activate"} ${institution.name}?`)) return;
    setWorking(true);
    try {
      setInstitution(await platformApi.status(id, !institution.is_active));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update status.");
    } finally {
      setWorking(false);
    }
  }

  async function changeTrial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const days = Number(new FormData(event.currentTarget).get("trialDays"));
    if (!Number.isInteger(days) || days < 1) {
      setError("Trial period must be a positive whole number.");
      return;
    }
    if (!window.confirm("Update this trial period?")) return;
    setWorking(true);
    try {
      setInstitution(await platformApi.trial(id, days));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update trial.");
    } finally {
      setWorking(false);
    }
  }

  async function createInstituteAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;
    setWorking(true);
    try {
      const admin = await platformApi.createInstituteAdmin(id, email);
      setAdmins((current) => [admin, ...current]);
      form.reset();
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create Institute Admin.");
    } finally {
      setWorking(false);
    }
  }

  async function resendWelcome(userId: string) {
    setWorking(true);
    try {
      await platformApi.resendInstituteAdminWelcome(id, userId);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resend welcome email.");
    } finally {
      setWorking(false);
    }
  }

  if (error && !institution) return <Card className="p-6 text-red-700">{error}</Card>;
  if (!institution) return <p className="text-slate-600">Loading school…</p>;

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/platform/institutions" className="text-sm font-medium text-orange-600">
        ← Institutions
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{institution.name}</h1>
          <p className="text-slate-600">{institution.subdomain} · {institution.timezone}</p>
        </div>
        <Button variant={institution.is_active ? "destructive" : "default"} disabled={working} onClick={changeStatus}>
          {institution.is_active ? "Deactivate school" : "Activate school"}
        </Button>
      </div>

      {error && <Card className="p-4 text-red-700">{error}</Card>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatusCard label="Access status" value={institution.is_active ? "Active" : "Inactive"} />
        <StatusCard label="Trial status" value={institution.trialState.replace("_", " ")} />
        <StatusCard label="Trial ends" value={institution.trial_ends_on ?? "—"} />
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-slate-950">Institute Admins</h2>
        <form onSubmit={createInstituteAdmin} className="mt-4 flex max-w-lg flex-col gap-3 sm:flex-row">
          <Input required name="email" type="email" placeholder="admin@school.edu" autoComplete="email" />
          <Button disabled={working}>Create Institute Admin</Button>
        </form>
        <p className="mt-3 text-sm text-slate-500">
          New users receive a secure password-setup email. Existing Edu Soft users receive school access by email.
        </p>

        <div className="mt-5 overflow-x-auto border-t">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Setup</th>
                <th className="py-3 pr-4">Email status</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.length ? admins.map((admin) => (
                <tr key={admin.id} className="border-t">
                  <td className="py-3 pr-4 font-medium text-slate-900">{admin.email}</td>
                  <td className="py-3 pr-4">{admin.requiresPasswordSetup && !admin.acceptedAt ? "Pending" : "Ready"}</td>
                  <td className="py-3 pr-4 capitalize">{admin.emailStatus}</td>
                  <td className="py-3 text-right">
                    <Button variant="outline" size="sm" disabled={working} onClick={() => void resendWelcome(admin.userId)}>
                      Resend email
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-5 text-center text-slate-500">No Institute Admin has been created.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-slate-950">Change trial period</h2>
        <form onSubmit={changeTrial} className="mt-4 flex max-w-sm gap-3">
          <Input required name="trialDays" type="number" min="1" step="1" defaultValue="14" />
          <Button disabled={working}>Update trial</Button>
        </form>
      </Card>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold capitalize">{value}</p>
    </Card>
  );
}
