"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { platformApi, type Page } from "@/lib/platform-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const labels = { active: "Trial active", expired: "Trial expired", not_configured: "No trial" };
export default function InstitutionsPage() {
  const [search, setSearch] = useState(""); const [active, setActive] = useState(""); const [trial, setTrial] = useState(""); const [page, setPage] = useState(1); const [data, setData] = useState<Page | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const params = useMemo(() => { const p = new URLSearchParams({ page: String(page), limit: "20" }); if (search.trim()) p.set("search", search.trim()); if (active) p.set("isActive", active); if (trial) p.set("trialState", trial); return p; }, [search, active, trial, page]);
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    platformApi.list(params)
      .then((response) => { if (!cancelled) setData(response); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load institutions."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params]);
  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit)) : 1;
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-orange-600">Platform management</p><h1 className="text-2xl font-bold text-slate-950">Institutions</h1></div><Button asChild><Link href="/platform/institutions/new">Add school</Link></Button></div><Card className="p-4"><div className="grid gap-3 md:grid-cols-3"><Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or subdomain"/><select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }} className="rounded-md border border-slate-200 bg-white px-3"><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select><select value={trial} onChange={(e) => { setTrial(e.target.value); setPage(1); }} className="rounded-md border border-slate-200 bg-white px-3"><option value="">All trial states</option><option value="active">Trial active</option><option value="expired">Trial expired</option><option value="not_configured">No trial</option></select></div></Card>{error ? <Card className="p-6 text-red-700">{error}</Card> : <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">School</th><th className="p-4">Status</th><th className="p-4">Trial</th><th className="p-4">Ends</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading institutions…</td></tr> : data?.items.length ? data.items.map((institution) => <tr key={institution.id} className="border-t"><td className="p-4"><Link href={`/platform/institutions/${institution.id}`} className="font-semibold text-slate-900 hover:text-orange-600">{institution.name}</Link><p className="text-xs text-slate-500">{institution.subdomain}</p></td><td className="p-4"><span className={institution.is_active ? "text-emerald-700" : "text-rose-700"}>{institution.is_active ? "Active" : "Inactive"}</span></td><td className="p-4">{labels[institution.trialState]}</td><td className="p-4">{institution.trial_ends_on ?? "—"}</td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-slate-500">No institutions match these filters.</td></tr>}</tbody></table></div>{data && <div className="flex items-center justify-between border-t p-4 text-sm"><span>{data.pagination.total} institutions</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="px-2 py-1">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button></div></div>}</Card>}</div>;
}
