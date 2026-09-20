"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, Trash2, Loader2, Save, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useListQuery } from "@/hooks/use-list-query";
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
  
  const { sortState, requestSort, search, setSearch, debouncedSearch } = useListQuery();
  
  const [items, setItems] = useState<RecordItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formTarget, setFormTarget] = useState<RecordItem | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<RecordItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      if (debouncedSearch) params.set("search", debouncedSearch);
      
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
  }, [api, label.dependent, label.plural, sortState.sortBy, sortState.sortOrder, debouncedSearch]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const reset = () => {
    setFormTarget(undefined); setName(""); setCode(""); setNumericValue(""); setStartTime(""); setEndTime(""); setClassId(""); setActive(true); setError("");
  };

  const beginCreate = () => {
    setName(""); setCode(""); setNumericValue(""); setStartTime(""); setEndTime(""); setClassId(""); setActive(true); setError(""); setFormTarget(null);
  };

  const beginEdit = (item: RecordItem) => {
    setFormTarget(item); setName(item.name); setActive(item.is_active);
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
      if (formTarget) {
        await api.update(formTarget.id, payload as never);
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

  const remove = async (item: RecordItem, skipConfirmation = false): Promise<boolean> => {
    if (!skipConfirmation && !window.confirm(`Delete ${item.name}? This cannot be undone.`)) return false;
    try { 
      await api.delete(item.id); 
      toast.success(`${label.singular} deleted successfully.`);
      await load(); 
      return true;
    } catch (cause) { 
      const msg = cause instanceof Error ? cause.message : `Unable to delete ${label.singular.toLowerCase()}.`;
      setError(msg); 
      toast.error(msg);
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (await remove(deleteTarget, true)) setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const className = (id: string) => classes.find((item) => item.id === id)?.name ?? "Class unavailable";
  const timeValue = (value: string) => value.slice(0, 5);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{label.plural}</h1>
        </div>
        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder={`Search ${label.plural.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-8 text-xs bg-white border-slate-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button type="button" size="sm" onClick={beginCreate} className="h-9 shrink-0 bg-orange-600 text-xs hover:bg-orange-700">
            <Plus className="mr-1.5 size-3.5" />
            New {label.singular}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
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
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => resource === "groups" || resource === "shifts" || resource === "subjects" ? setDeleteTarget(item) : void remove(item)}
                            >
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

      </div>

      <Dialog.Root
        open={formTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) reset();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <Dialog.Title className="text-base font-bold text-slate-950">
                {formTarget ? `Edit ${label.singular}: ${formTarget.name}` : `New ${label.singular}`}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`Close ${label.singular.toLowerCase()} dialog`}
                  disabled={saving}
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="px-5 pb-5 pt-4">
              {label.dependent && !classes.length ? (
                <p className="text-sm text-slate-600">Create an active class before adding {label.plural.toLowerCase()}.</p>
              ) : (
                <form className="space-y-4" onSubmit={submit}>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Name <span className="text-rose-500">*</span></label>
                    <Input
                      className="h-10 text-sm"
                      placeholder={resource === "subjects" ? "e.g. Mathematics" : undefined}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={saving}
                      required
                    />
                  </div>

                  {resource === "subjects" && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Code <span className="font-normal normal-case text-slate-500">(optional)</span></label>
                      <Input className="h-10 text-sm" value={code} onChange={(event) => setCode(event.target.value)} disabled={saving} />
                    </div>
                  )}

                  {resource === "shifts" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Start time</label>
                        <Input className="h-10 text-sm" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={saving} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">End time</label>
                        <Input className="h-10 text-sm" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={saving} />
                      </div>
                    </div>
                  )}

                  {label.dependent && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Class <span className="text-rose-500">*</span></label>
                      <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100" value={classId} onChange={(event) => setClassId(event.target.value)} disabled={saving} required>
                        <option value="">Choose a class</option>
                        {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                    <span className="text-sm font-semibold text-slate-800">Status</span>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className={cn("text-xs font-semibold", active ? "text-emerald-700" : "text-slate-500")}>
                        {active ? "Active" : "Inactive"}
                      </span>
                      <Switch checked={active} onCheckedChange={setActive} disabled={saving} />
                    </div>
                  </div>

                  {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

                  <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                    <Button type="button" variant="outline" size="sm" onClick={reset} disabled={saving}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                      {saving ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Saving...</> : <><Save className="mr-1.5 size-3.5" />{formTarget ? "Save Changes" : `Save ${label.singular}`}</>}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {(resource === "groups" || resource === "shifts" || resource === "subjects") && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title={`Delete ${label.singular}`}
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
