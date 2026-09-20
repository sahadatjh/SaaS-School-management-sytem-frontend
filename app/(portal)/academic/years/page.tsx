"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ActionTooltip } from "@/components/ui/tooltip";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/lib/date";
import type { AcademicYear } from "@/lib/contracts";

const PAGE_SIZE = 15;

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  async function loadAcademicYears() {
    setLoading(true);
    setError(null);
    try {
      const data = await portalApi.academicYears.list();
      // Sort: active first, then newest start date
      const sorted = [...data].sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      });
      setYears(sorted);
      setVisibleCount(PAGE_SIZE);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load academic years. Please check your connection.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const filteredYears = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return years;
    return years.filter((y) => y.name.toLowerCase().includes(q));
  }, [years, search]);

  const visibleYears = useMemo(() => {
    return filteredYears.slice(0, visibleCount);
  }, [filteredYears, visibleCount]);

  const hasMore = visibleCount < filteredYears.length;

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredYears.length));
        }
      },
      { threshold: 0.1 },
    );

    const target = sentinelRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, filteredYears.length]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await portalApi.academicYears.delete(deleteTarget.id);
      setYears((prev) => prev.filter((y) => y.id !== deleteTarget.id));
      toast.success(`Academic year "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to delete academic year. It may be linked to active records.";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full flex flex-col h-full">
      {/* Compact breadcrumb trail */}
      <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0">
        <span>Academic</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">Academic Years</span>
      </nav>

      {/* Delete error notification */}
      {deleteError && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="w-full border-slate-200/90 shadow-xs flex flex-col min-h-0 relative overflow-hidden flex-1">
        {/* Integrated Table Toolbar Header: Title + Filter Search + Add Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0 z-20">
          {/* Left: Title and Record Count */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <h1 className="text-base font-bold text-slate-900">Academic Years</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {filteredYears.length}
            </span>
          </div>

          {/* Right: Filter Input + Add New Button */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Filter academic years..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="h-9 pl-8 pr-8 text-xs bg-slate-50/70 border-slate-200 focus:bg-white transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear filter"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              size="sm"
              asChild
              className="h-9 px-3.5 text-xs shrink-0 bg-orange-600 hover:bg-orange-700 font-semibold"
            >
              <Link href="/academic/years/new">
                <Plus className="mr-1.5 size-3.5" />
                New Academic Year
              </Link>
            </Button>
          </div>
        </div>

        {/* Content Area with Sticky Header and Infinite Scroll */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="size-9 text-rose-500 mb-2.5" />
            <p className="text-sm font-bold text-slate-900">
              Failed to load academic years
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAcademicYears}
              className="mt-3.5 h-8 text-xs"
            >
              Retry
            </Button>
          </div>
        ) : years.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No academic years configured"
            description="Create your first academic year to establish sessions, enroll students, and schedule classes."
            action={
              <Button size="sm" asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/academic/years/new">
                  <Plus className="mr-1.5 size-3.5" />
                  Create Academic Year
                </Link>
              </Button>
            }
          />
        ) : filteredYears.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No academic years matching &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-slate-50/30">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-xs">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Academic Year
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Start Date
                  </th>
                  <th scope="col" className="px-5 py-3">
                    End Date
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visibleYears.map((year) => (
                  <tr
                    key={year.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {year.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {formatDate(year.start_date)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {formatDate(year.end_date)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge isActive={year.is_active} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <ActionTooltip content="Edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-7 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                          >
                            <Link
                              href={`/academic/years/${year.id}/edit`}
                              aria-label={`Edit ${year.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip content="Delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(year)}
                            className="size-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            aria-label={`Delete ${year.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Sentinel for Infinite Scrolling */}
                {hasMore && (
                  <tr ref={sentinelRef}>
                    <td colSpan={5} className="py-3 text-center text-xs text-slate-400 bg-slate-50/50">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="size-3.5 animate-spin text-orange-500" />
                        <span>Loading more records...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Academic Year"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Any classes, sessions, or records tied to this year may be affected. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
