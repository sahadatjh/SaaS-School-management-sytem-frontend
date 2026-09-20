"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type { Class } from "@/lib/contracts";

interface ClassDialogProps {
  open: boolean;
  classRecord?: Class;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ClassDialog({ open, classRecord, onOpenChange, onSaved }: ClassDialogProps) {
  const [name, setName] = useState(() => classRecord?.name ?? "");
  const [numericValue, setNumericValue] = useState(() =>
    classRecord?.numeric_value === undefined || classRecord.numeric_value === null
      ? ""
      : String(classRecord.numeric_value),
  );
  const [isActive, setIsActive] = useState(() => classRecord?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Class name is required.");
      return;
    }

    const parsedNumericValue = numericValue.trim() ? Number(numericValue) : undefined;
    if (parsedNumericValue !== undefined && !Number.isInteger(parsedNumericValue)) {
      setError("Class order must be a whole number.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { name: trimmedName, numeric_value: parsedNumericValue, is_active: isActive };
      if (classRecord) {
        await portalApi.classes.update(classRecord.id, payload);
        toast.success("Class updated successfully.");
      } else {
        await portalApi.classes.create(payload);
        toast.success("Class created successfully.");
      }
      onSaved();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to save class. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl focus:outline-none animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-950">
                {classRecord ? `Edit Class: ${classRecord.name}` : "New Class"}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close class dialog" disabled={saving}>
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 pt-4">
            <div>
              <label htmlFor="class-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Class Name <span className="text-rose-500">*</span>
              </label>
              <Input id="class-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Six" className="h-10 text-sm" disabled={saving} required />
            </div>

            <div>
              <label htmlFor="class-order" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Class Order / Value <span className="font-normal normal-case text-slate-500">(optional)</span>
              </label>
              <Input id="class-order" type="number" step="1" value={numericValue} onChange={(event) => setNumericValue(event.target.value)} placeholder="e.g. 6" className="h-10 text-sm" disabled={saving} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div>
                <span className="text-sm font-semibold text-slate-800">Status</span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className={isActive ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-slate-500"}>{isActive ? "Active" : "Inactive"}</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} disabled={saving} aria-label="Toggle class status" />
              </div>
            </div>

            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                {saving ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Saving...</> : <><Save className="mr-1.5 size-3.5" />{classRecord ? "Save Changes" : "Create Class"}</>}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
