"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { portalApi } from "@/lib/portal-api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import type { Department, DepartmentPayload } from "@/lib/contracts";

interface DepartmentFormProps {
  initialData?: Department;
  isEdit?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function DepartmentForm({
  initialData,
  isEdit = false,
  onSaved,
  onCancel,
}: DepartmentFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please provide a department name (e.g. Science, Humanities).");
      return;
    }

    const payload: DepartmentPayload = {
      name: trimmedName,
      is_active: isActive,
    };

    setSubmitting(true);
    try {
      if (isEdit && initialData) {
        await portalApi.departments.update(initialData.id, payload);
        toast.success("Department updated successfully.");
      } else {
        await portalApi.departments.create(payload);
        toast.success("Department created successfully.");
      }
      if (onSaved) {
        onSaved();
      } else {
        router.push("/academic/departments");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to save department. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {!onCancel && (
        <nav
          aria-label="Breadcrumb"
          className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <span>Academic</span>
          <span className="text-slate-300">/</span>
          <Link href="/academic/departments" className="hover:text-slate-800 transition-colors">
            Departments
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">
            {isEdit ? "Edit Department" : "New Department"}
          </span>
        </nav>
      )}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card className={cn(
        "w-full border-slate-200/90",
        onCancel ? "overflow-visible border-0 shadow-none" : "overflow-hidden shadow-xs",
      )}>
        {!onCancel && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Link
                href="/academic/departments"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Back to Departments"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <h1 className="text-base font-bold text-slate-900">
                {isEdit ? `Edit Department: ${initialData?.name}` : "New Department"}
              </h1>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <form
          onSubmit={handleSubmit}
          className={cn("space-y-4 bg-white", onCancel ? "px-5 pb-5 pt-4" : "p-5")}
        >
          <div>
            <label
              htmlFor="department-name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Department Name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="department-name"
              placeholder="e.g. Science, Humanities, Business Studies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-sm"
              required
              disabled={submitting}
            />
          </div>

          {/* Active Status with Modern Toggle Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
            <div>
              <span className="text-sm font-semibold text-slate-800">
                Status
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-emerald-700" : "text-slate-500",
                )}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={submitting}
                aria-label="Toggle active status"
              />
            </div>
          </div>

          {/* Form Actions Footer: Cancel + Save Changes / Update */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={onCancel}
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                disabled={submitting}
              >
                <Link href="/academic/departments">Cancel</Link>
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 size-3.5" />
                  {isEdit ? "Update" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
