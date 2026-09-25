"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, Download, FileDown, Loader2, Pencil, Plus, Upload,
  Search, Trash2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ActionTooltip } from "@/components/ui/tooltip";
import { SortableHeader } from "@/components/ui/sortable-header";
import { portalApi } from "@/lib/portal-api";
import { usePortal } from "@/components/portal-context";
import { StudentImportDialog } from "@/components/students/student-import-dialog";
import { toast } from "@/components/ui/sonner";
import { useListQuery } from "@/hooks/use-list-query";
import type { Student, StudentExportJob } from "@/lib/contracts";

const PAGE_SIZE = 20;

export default function StudentsPage() {
  const { profile } = usePortal();
  const canImport = profile?.permissions.includes("students.create") ?? false;
  const canExport = profile?.permissions.includes("students.read") ?? false;
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportJob, setExportJob] = useState<StudentExportJob | null>(null);
  const [exportWorking, setExportWorking] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLTableRowElement | null>(null);
  const { sortState, requestSort, search, setSearch, debouncedSearch } = useListQuery();

  const loadStudents = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sortState.sortBy) params.set("sort_by", sortState.sortBy);
      if (sortState.sortOrder) params.set("sort_order", sortState.sortOrder);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(nextPage));
      params.set("limit", String(PAGE_SIZE));

      const result = await portalApi.students.list(params);
      setStudents((prev) => append ? [...prev, ...result.items] : result.items);
      setTotal(result.pagination.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [sortState.sortBy, sortState.sortOrder, debouncedSearch]);

  // Reload on sort/search change
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStudents(1, false); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  const hasMore = students.length < total;

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadStudents(page + 1, true);
      },
      { threshold: 0.1 },
    );
    const target = sentinelRef.current;
    if (target) observer.observe(target);
    return () => { if (target) observer.unobserve(target); };
  }, [hasMore, loading, page, loadStudents]);

  useEffect(() => {
    if (!exportJob || !["queued", "exporting"].includes(exportJob.status)) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const next = await portalApi.studentTransfers.exportStatus(exportJob.id);
        if (!cancelled) setExportJob(next);
      } catch (cause) {
        if (!cancelled) setExportError(cause instanceof Error ? cause.message : "Unable to load export status.");
      }
    }, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [exportJob]);

  async function requestExport() {
    setExportWorking(true);
    setExportError(null);
    try {
      const filters = new URLSearchParams();
      if (debouncedSearch) filters.set("search", debouncedSearch);
      setExportJob(await portalApi.studentTransfers.requestExport(filters));
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : "Unable to request export.");
    } finally {
      setExportWorking(false);
    }
  }

  async function downloadExport() {
    if (!exportJob?.downloadReady) return;
    setExportWorking(true);
    setExportError(null);
    try {
      const blob = await portalApi.studentTransfers.downloadExport(exportJob.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `students-${exportJob.id}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : "Unable to download export.");
    } finally {
      setExportWorking(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await portalApi.students.delete(deleteTarget.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      toast.success(`Student "${deleteTarget.name_english}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete student.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-slate-900">Students</h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {total}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-8 w-56 pl-8 text-xs"
              placeholder="Search name, ID, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canImport && (
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" /> Import
            </Button>
          )}
          {canExport && (
            exportJob?.downloadReady ? (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={downloadExport} disabled={exportWorking}>
                <Download className="size-3.5" /> Download export
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={requestExport} disabled={exportWorking || exportJob?.status === "queued" || exportJob?.status === "exporting"}>
                {exportWorking || exportJob?.status === "queued" || exportJob?.status === "exporting" ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                {exportJob?.status === "queued" || exportJob?.status === "exporting" ? "Preparing export" : "Export"}
              </Button>
            )
          )}
          <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
            <Link href="/academic/students/new">
              <Plus className="h-3.5 w-3.5" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {deleteError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{deleteError}</p>}
      {exportError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{exportError}</p>}
      {exportJob?.status === "failed" && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{exportJob.error ?? "Export failed. Try again."}</p>}

      {/* Table */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <SortableHeader title="Student ID" columnKey="student_id" sortState={sortState} onRequestSort={requestSort} className="pl-4" />
                <SortableHeader title="Name" columnKey="name_english" sortState={sortState} onRequestSort={requestSort} />
                <th className="py-2.5 pr-3 text-left font-semibold text-slate-600">Class / Section</th>
                <th className="py-2.5 pr-3 text-left font-semibold text-slate-600">Roll</th>
                <th className="py-2.5 pr-3 text-left font-semibold text-slate-600">Mobile</th>
                <SortableHeader title="Status" columnKey="status" sortState={sortState} onRequestSort={requestSort} />
                <th className="py-2.5 pr-4 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && students.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="h-10">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-3 py-2">
                          <Skeleton className="h-3.5 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : students.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/60">
                      <td className="py-2.5 pl-4 pr-3 font-mono text-slate-500">{s.student_id}</td>
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-slate-900">{s.name_english}</div>
                        {s.name_bangla && (
                          <div className="text-[11px] text-slate-500">{s.name_bangla}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {s.current_enrollment
                          ? `${s.current_enrollment.class_name} / ${s.current_enrollment.section_name}`
                          : <span className="italic text-slate-400">No enrollment</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {s.current_enrollment?.roll_no ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-slate-600">{s.primary_sms_number}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border
                          ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            s.status === 'applicant' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            s.status === 'graduated' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          <span className={`size-1.5 rounded-full shrink-0
                            ${s.status === 'active' ? 'bg-emerald-500' :
                              s.status === 'applicant' ? 'bg-blue-500' :
                              s.status === 'graduated' ? 'bg-purple-500' :
                              'bg-slate-400'}`} />
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <ActionTooltip content="Edit">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Link href={`/academic/students/${s.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip content="Delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      </td>
                    </tr>
                  ))}

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <tr ref={sentinelRef} className="h-10">
                  <td colSpan={7} className="text-center">
                    {loading && <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-400" />}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Empty state */}
          {!loading && students.length === 0 && (
            <EmptyState
              icon={Users}
              title="No students found"
              description={debouncedSearch ? `No results for "${debouncedSearch}".` : "Add your first student."}
              action={
                <Button asChild size="sm">
                  <Link href="/academic/students/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Student
                  </Link>
                </Button>
              }
            />
          )}
        </div>
      </Card>

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}
        title="Delete student?"
        description={`This will permanently remove "${deleteTarget?.name_english}" and their enrollment records.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
      <StudentImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onCompleted={() => { void loadStudents(1, false); }}
      />
    </div>
  );
}
