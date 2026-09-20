"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/status-badge";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { cn } from "@/lib/utils";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
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
  
  const { sortState, requestSort } = useTableSort();
  
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
      const params = new URLSearchParams();
      if (sortState.sortBy) params.set("sort_by", sortState.sortBy);
      if (sortState.sortOrder) params.set("sort_order", sortState.sortOrder);
      
      const [records, availableClasses] = await Promise.all([
        api.list(params) as Promise<RecordItem[]>,
        label.dependent ? portalApi.classes.list() : Promise.resolve([] as Class[]),
      ]);
      setItems(records);
      setClasses(availableClasses.filter((item) => item.is_active));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to load ${label.plural.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [api, label.dependent, label.plural, sortState.sortBy, sortState.sortOrder]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const reset = () => {
    setEditing(null); setName(""); setCode(""); setNumericValue(""); setStartTime(""); setEndTime(""); setClassId(""); setActive(true); setError("");
  };

  const beginEdit = (item: RecordItem) => {
    setEditing(item); setName(item.name); setActive(item.is_active);
    setCode("code" in item ? item.code ?? "" : "");
    setNumericValue("numeric_value" in item && item.numeric_value !== undefined && item.numeric_value !== null ? String(item.numeric_value) : "");
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
    if (resource === "shifts") { 
      if (startTime) payload.start_time = startTime.length === 5 ? `${startTime}:00` : startTime; 
      if (endTime) payload.end_time = endTime.length === 5 ? `${endTime}:00` : endTime; 
    }
    if (label.dependent) payload.class_id = classId;
    
    setSaving(true); setError("");
    try {
      if (editing) {
        await api.update(editing.id, payload as never);
        toast.success(`${label.singular} updated successfully.`);
      } else {
        await api.create(payload as never);
        toast.success(`${label.singular} created successfully.`);
      }
      reset(); await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to save ${label.singular.toLowerCase()}.`);
      toast.error(cause instanceof Error ? cause.message : `Unable to save ${label.singular.toLowerCase()}.`);
    } finally { setSaving(false); }
  };

  const remove = async (item: RecordItem) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try { 
      await api.delete(item.id); 
      toast.success(`${label.singular} deleted successfully.`);
      await load(); 
    } catch (cause) { 
      const msg = cause instanceof Error ? cause.message : `Unable to delete ${label.singular.toLowerCase()}.`;
      setError(msg); 
      toast.error(msg);
    }
  };

  const className = (id: string) => classes.find((item) => item.id === id)?.name ?? "Class unavailable";
  const timeValue = (value: string) => value.slice(0, 5);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{label.plural}</h1>
        <p className="mt-1 text-sm text-slate-600">Configure {label.plural.toLowerCase()} for this institution.</p>
      </div>

      <div className="flex-1 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] min-h-0">
        <Card className="flex flex-col overflow-hidden shadow-xs border-slate-200/90">
          <div className="flex-1 overflow-auto bg-slate-50/30">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <SortableHeader columnKey="name" title="Name" sortState={sortState} onRequestSort={requestSort} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500" />
                  {label.dependent && <SortableHeader columnKey="class_id" title="Class" sortState={sortState} onRequestSort={requestSort} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500" />}
                  <SortableHeader columnKey="is_active" title="Status" sortState={sortState} onRequestSort={requestSort} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500" />
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td className="p-8 text-center" colSpan={4}><Loader2 className="mx-auto size-6 animate-spin text-slate-300" /></td></tr>
                ) : items.length ? (
                  items.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        {"code" in item && item.code && <p className="text-xs text-slate-500">{item.code}</p>}
                        {"start_time" in item && (
                          <p className="text-xs text-slate-500">
                            {item.start_time && item.end_time ? `${timeValue(item.start_time)} – ${timeValue(item.end_time)}` : "No times set"}
                          </p>
                        )}
                      </td>
                      {label.dependent && <td className="px-5 py-3 text-slate-600">{"class_id" in item ? className(item.class_id) : "—"}</td>}
                      <td className="px-5 py-3"><StatusBadge isActive={item.is_active} /></td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-1 justify-end">
                          <ActionTooltip content="Edit">
                            <Button size="icon" variant="ghost" className="size-7 text-slate-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => beginEdit(item)}>
                              <Pencil className="size-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip content="Delete">
                            <Button size="icon" variant="ghost" className="size-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => void remove(item)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="p-12 text-center text-xs text-slate-500" colSpan={4}>No {label.plural.toLowerCase()} configured yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit flex flex-col border-slate-200/90 shadow-xs w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
            <h2 className="text-base font-bold text-slate-900">{editing ? `Edit ${label.singular}` : `Add ${label.singular}`}</h2>
          </div>
          
          <div className="p-5 bg-white">
            {label.dependent && !classes.length ? (
              <p className="text-sm text-slate-600">Create an active class before adding {label.plural.toLowerCase()}.</p>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Name <span className="text-rose-500">*</span></label>
                  <Input className="h-10 text-sm" value={name} onChange={(event) => setName(event.target.value)} disabled={saving} required />
                </div>
                
                {resource === "subjects" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Code <span className="font-normal normal-case text-slate-500">(optional)</span></label>
                    <Input className="h-10 text-sm" value={code} onChange={(event) => setCode(event.target.value)} disabled={saving} />
                  </div>
                )}
                
                {resource === "classes" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Class Order / Value <span className="font-normal normal-case text-slate-500">(optional)</span></label>
                    <Input className="h-10 text-sm" type="number" value={numericValue} onChange={(event) => setNumericValue(event.target.value)} disabled={saving} />
                  </div>
                )}
                
                {resource === "shifts" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Start time</label>
                      <Input className="h-10 text-sm" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={saving} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">End time</label>
                      <Input className="h-10 text-sm" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={saving} />
                    </div>
                  </div>
                )}
                
                {label.dependent && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                    <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100" value={classId} onChange={(event) => setClassId(event.target.value)} disabled={saving} required>
                      <option value="">Choose a class</option>
                      {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Status</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={cn("text-xs font-semibold", active ? "text-emerald-700" : "text-slate-500")}>
                      {active ? "Active" : "Inactive"}
                    </span>
                    <Switch checked={active} onCheckedChange={setActive} disabled={saving} />
                  </div>
                </div>
                
                {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
                
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={reset} disabled={saving}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                    {saving ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Saving...</> : <><Save className="mr-1.5 size-3.5" /> {editing ? "Save Changes" : `Save ${label.singular}`}</>}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
