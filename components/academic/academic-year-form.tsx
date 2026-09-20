"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { portalApi } from "@/lib/portal-api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import type { AcademicYear, AcademicYearPayload } from "@/lib/contracts";

interface AcademicYearFormProps {
  initialData?: AcademicYear;
  isEdit?: boolean;
}

function toDateInputValue(dateStr?: string | Date): string {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "";

    // Convert to Asia/Dhaka timezone to prevent UTC offsets from shifting the date backwards
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    return "";
  }
}

export function AcademicYearForm({
  initialData,
  isEdit = false,
}: AcademicYearFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [startDate, setStartDate] = useState(
    toDateInputValue(initialData?.start_date),
  );
  const [endDate, setEndDate] = useState(toDateInputValue(initialData?.end_date));
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please provide an academic year name (e.g. 2024-2025).");
      return;
    }

    if (!startDate) {
      setError("Please specify the session start date.");
      return;
    }

    if (!endDate) {
      setError("Please specify the session end date.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be later than start date.");
      return;
    }

    const payload: AcademicYearPayload = {
      name: trimmedName,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
    };

    setSubmitting(true);
    try {
      if (isEdit && initialData) {
        await portalApi.academicYears.update(initialData.id, payload);
        toast.success("Academic year updated successfully.");
      } else {
        await portalApi.academicYears.create(payload);
        toast.success("Academic year created successfully.");
      }
      router.push("/academic/years");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to save academic year. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {/* Breadcrumb Line */}
      <nav
        aria-label="Breadcrumb"
        className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        <span>Academic</span>
        <span className="text-slate-300">/</span>
        <Link href="/academic/years" className="hover:text-slate-800 transition-colors">
          Academic Years
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">
          {isEdit ? "Edit Session" : "New Session"}
        </span>
      </nav>

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

      <Card className="w-full overflow-hidden border-slate-200/90 shadow-xs">
        {/* Form Card Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Link
              href="/academic/years"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Back to Academic Years"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-base font-bold text-slate-900">
              {isEdit ? `Edit Academic Year: ${initialData?.name}` : "New Academic Year"}
            </h1>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
          <div>
            <label
              htmlFor="year-name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Academic Year Name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="year-name"
              placeholder="e.g. 2024-2025 or 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-sm"
              required
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-slate-400">
              Descriptive label identifying the academic calendar or session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start-date"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Start Date (dd/mm/yyyy) <span className="text-rose-500">*</span>
              </label>
              <DateInput
                id="start-date"
                value={startDate}
                onChange={setStartDate}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label
                htmlFor="end-date"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                End Date (dd/mm/yyyy) <span className="text-rose-500">*</span>
              </label>
              <DateInput
                id="end-date"
                value={endDate}
                onChange={setEndDate}
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Active Status with Modern Toggle Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
            <div>
              <span className="text-sm font-semibold text-slate-800">
                Status
              </span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Active academic sessions are available for enrollment, attendance, and exam management.
              </p>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={submitting}
            >
              <Link href="/academic/years">Cancel</Link>
            </Button>
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
