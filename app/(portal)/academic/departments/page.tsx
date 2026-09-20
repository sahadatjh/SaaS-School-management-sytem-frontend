"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AlertCircle,
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
import { useListQuery } from "@/hooks/use-list-query";
import { SortableHeader } from "@/components/ui/sortable-header";
import { DepartmentDialog } from "@/components/academic/department-dialog";
import type { Department } from "@/lib/contracts";

const PAGE_SIZE = 15;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Department | null | undefined>(undefined);

  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const { sortState, requestSort, search, setSearch, debouncedSearch } = useListQuery();

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sortState.sortBy) params.set("sort_by", sortState.sortBy);
      if (sortState.sortOrder) params.set("sort_order", sortState.sortOrder);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const data = await portalApi.departments.list(params);
      setDepartments(data);
      setVisibleCount(PAGE_SIZE);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load departments."
      );
      toast.error("Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, [sortState.sortBy, sortState.sortOrder, debouncedSearch]);

  useEffect(() => {
    void Promise.resolve().then(loadDepartments);
  }, [loadDepartments]);

  const visibleDepartments = useMemo(() => {
    return departments.slice(0, visibleCount);
  }, [departments, visibleCount]);

  const hasMore = visibleCount < departments.length;

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await portalApi.departments.delete(deleteTarget.id);
      toast.success(`Department "${deleteTarget.name}" deleted successfully.`);
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete department.";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleFormSaved() {
    setFormTarget(undefined);
    void loadDepartments();
  }

  return (
    <div className="w-full flex flex-col h-full">
      {/* Breadcrumb Line (Acordion only /Academic/Departments) */}
      <nav
        aria-label="Breadcrumb"
        className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0"
      >
        <span>Academic</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">Departments</span>
      </nav>

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

      {error ? (
        <div className="mb-4 flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="mb-2 size-6 text-rose-600" />
          <p className="text-sm font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDepartments}
            className="mt-4 bg-white hover:bg-rose-100 hover:text-rose-900"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <Card className="w-full border-slate-200/90 shadow-xs flex flex-col min-h-0 relative overflow-hidden flex-1">
          {/* Integrated Table Toolbar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 gap-4 shrink-0 z-20">
            {/* Title & Count Badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-slate-900">
                Departments
              </h1>
              {!loading && (
                <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/60">
                  {departments.length} record{departments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Filter Input Box */}
              <div className="relative flex-1 sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="size-4 text-slate-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search departments..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="h-9 w-full rounded-lg bg-slate-50 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-orange-500 border-slate-200/80 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Add New Button */}
              <Button
                type="button"
                size="sm"
                onClick={() => setFormTarget(null)}
                className="h-9 bg-orange-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:ring-orange-500 shrink-0"
              >
                <Plus className="mr-1.5 size-4" />
                Add New
              </Button>
            </div>
          </div>

          {/* Table Container - Scrollable Canvas */}
          <div className="flex-1 overflow-auto bg-slate-50/30">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <SortableHeader columnKey="name" title="Department Name" sortState={sortState} onRequestSort={requestSort} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500" />
                  <SortableHeader columnKey="is_active" title="Status" sortState={sortState} onRequestSort={requestSort} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500" />
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-40 rounded bg-slate-100" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Skeleton className="ml-auto h-7 w-16 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : visibleDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16">
                      <EmptyState
                        title="No departments found"
                        description={
                          search
                            ? `No results match "${search}". Try clearing your filters.`
                            : "Create your first academic department to get started."
                        }
                        action={
                          search ? (
                            <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                              Clear Search
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => setFormTarget(null)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Plus className="mr-1.5 size-3.5" />
                              Add Department
                            </Button>
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  <>
                    {visibleDepartments.map((dept) => (
                      <tr
                        key={dept.id}
                        className="group transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-3">
                          <span className="font-semibold text-slate-900">
                            {dept.name}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge isActive={dept.is_active} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <ActionTooltip content="Edit">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setFormTarget(dept)}
                                className="size-7 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                                aria-label={`Edit ${dept.name}`}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </ActionTooltip>
                            <ActionTooltip content="Delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(dept)}
                                className="size-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                aria-label={`Delete ${dept.name}`}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </ActionTooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Infinite Scroll Sentinel */}
                    {hasMore && (
                      <tr ref={sentinelRef}>
                        <td colSpan={3} className="px-5 py-6 text-center">
                          <Loader2 className="mx-auto size-5 animate-spin text-slate-300" />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Department"
        description={`Are you sure you want to delete the "${deleteTarget?.name}" department? This action cannot be undone.`}
        confirmLabel="Delete Department"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <DepartmentDialog
        open={formTarget !== undefined}
        department={formTarget ?? undefined}
        onOpenChange={(open) => {
          if (!open) setFormTarget(undefined);
        }}
        onSaved={handleFormSaved}
      />
    </div>
  );
}
