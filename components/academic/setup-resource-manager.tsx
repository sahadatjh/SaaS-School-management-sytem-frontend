"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";
import type { Class, Group, Section, Shift, Subject } from "@/lib/contracts";

type ResourceName = "shifts" | "classes" | "subjects" | "sections" | "groups";
type RecordItem = Shift | Class | Subject | Section | Group;

const labels: Record<ResourceName, { singular: string; plural: string; dependent?: boolean }> = {
  shifts: { singular: "Shift", plural: "Shifts" },
  classes: { singular: "Class", plural: "Classes" },
  subjects: { singular: "Subject", plural: "Subjects" },
  sections: { singular: "Section", plural: "Sections", dependent: true },
  groups: { singular: "Group", plural: "Groups", dependent: true },
};

export function SetupResourceManager({ resource }: { resource: ResourceName }) {
  const label = labels[resource];
  const api = portalApi[resource];
  const [items, setItems] = useState<RecordItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classId, setClassId] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [records, availableClasses] = await Promise.all([
        api.list() as Promise<RecordItem[]>,
        label.dependent ? portalApi.classes.list() : Promise.resolve([] as Class[]),
      ]);
      setItems(records);
      setClasses(availableClasses.filter((item) => item.is_active));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to load ${label.plural.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [api, label.dependent, label.plural]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const reset = () => {
    setEditing(null); setName(""); setCode(""); setNumericValue(""); setStartTime(""); setEndTime(""); setClassId(""); setActive(true); setError("");
  };

  const beginEdit = (item: RecordItem) => {
    setEditing(item); setName(item.name); setActive(item.is_active);
    setCode("code" in item ? item.code ?? "" : "");
    setNumericValue("numeric_value" in item && item.numeric_value !== undefined ? String(item.numeric_value) : "");
    setStartTime("start_time" in item ? item.start_time ?? "" : ""); setEndTime("end_time" in item ? item.end_time ?? "" : "");
    setClassId("class_id" in item ? item.class_id : ""); setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError(`${label.singular} name is required.`);
    if (label.dependent && !classId) return setError("Choose an active class first.");
    if (resource === "shifts" && startTime && endTime && startTime >= endTime) return setError("End time must be later than start time.");
    const payload: Record<string, unknown> = { name: name.trim(), is_active: active };
    if (resource === "subjects" && code.trim()) payload.code = code.trim();
    if (resource === "classes" && numericValue.trim()) payload.numeric_value = Number(numericValue);
    if (resource === "shifts") { if (startTime) payload.start_time = startTime.length === 5 ? `${startTime}:00` : startTime; if (endTime) payload.end_time = endTime.length === 5 ? `${endTime}:00` : endTime; }
    if (label.dependent) payload.class_id = classId;
    setSaving(true); setError("");
    try {
      if (editing) await api.update(editing.id, payload as never); else await api.create(payload as never);
      reset(); await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to save ${label.singular.toLowerCase()}.`);
    } finally { setSaving(false); }
  };

  const remove = async (item: RecordItem) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try { await api.delete(item.id); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : `Unable to delete ${label.singular.toLowerCase()}.`); }
  };

  const className = (id: string) => classes.find((item) => item.id === id)?.name ?? "Class unavailable";
  const timeValue = (value: string) => value.slice(0, 5);

  return <div className="space-y-6"><div><p className="text-sm font-medium text-orange-600">Academic setup</p><h1 className="text-2xl font-bold text-slate-950">{label.plural}</h1><p className="mt-1 text-sm text-slate-600">Configure {label.plural.toLowerCase()} for this institution only.</p></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]"><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Name</th>{label.dependent && <th className="p-4">Class</th>}<th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{loading ? <tr><td className="p-8 text-center" colSpan={4}>Loading…</td></tr> : items.length ? items.map((item) => <tr key={item.id} className="border-t"><td className="p-4"><p className="font-medium text-slate-900">{item.name}</p>{"code" in item && item.code && <p className="text-xs text-slate-500">{item.code}</p>}{"start_time" in item && <p className="text-xs text-slate-500">{item.start_time && item.end_time ? `${timeValue(item.start_time)} – ${timeValue(item.end_time)}` : "No times set"}</p>}</td>{label.dependent && <td className="p-4">{"class_id" in item ? className(item.class_id) : "—"}</td>}<td className="p-4"><span className={item.is_active ? "text-emerald-700" : "text-rose-700"}>{item.is_active ? "Active" : "Inactive"}</span></td><td className="p-4"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => beginEdit(item)}>Edit</Button><Button size="sm" variant="outline" onClick={() => void remove(item)}>Delete</Button></div></td></tr>) : <tr><td className="p-8 text-center text-slate-500" colSpan={4}>No {label.plural.toLowerCase()} configured yet.</td></tr>}</tbody></table></div></Card><Card className="h-fit p-5"><h2 className="font-semibold text-slate-950">{editing ? `Edit ${label.singular}` : `Add ${label.singular}`}</h2>{label.dependent && !classes.length ? <p className="mt-3 text-sm text-slate-600">Create an active class before adding {label.plural.toLowerCase()}.</p> : <form className="mt-4 space-y-4" onSubmit={submit}><label className="block text-sm font-medium">Name<Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} disabled={saving} required /></label>{resource === "subjects" && <label className="block text-sm font-medium">Code <span className="font-normal text-slate-500">(optional)</span><Input className="mt-1" value={code} onChange={(event) => setCode(event.target.value)} disabled={saving} /></label>}{resource === "classes" && <label className="block text-sm font-medium">Class order <span className="font-normal text-slate-500">(optional)</span><Input className="mt-1" type="number" value={numericValue} onChange={(event) => setNumericValue(event.target.value)} disabled={saving} /></label>}{resource === "shifts" && <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Start time<Input className="mt-1" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={saving} /></label><label className="block text-sm font-medium">End time<Input className="mt-1" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={saving} /></label></div>}{label.dependent && <label className="block text-sm font-medium">Class<select className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3" value={classId} onChange={(event) => setClassId(event.target.value)} disabled={saving} required><option value="">Choose a class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={saving} /> Active</label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={reset} disabled={saving}>Cancel</Button><Button disabled={saving}>{saving ? "Saving…" : editing ? "Update" : `Add ${label.singular}`}</Button></div></form>}</Card></div></div>;
}
