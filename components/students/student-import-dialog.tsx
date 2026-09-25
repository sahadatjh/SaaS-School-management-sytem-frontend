"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/portal-api";
import type { StudentImportBatch, StudentImportRow } from "@/lib/contracts";

const PAGE_SIZE = 100;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

interface StudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

export function StudentImportDialog({ open, onOpenChange, onCompleted }: StudentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<StudentImportBatch | null>(null);
  const [rows, setRows] = useState<StudentImportRow[]>([]);
  const [page, setPage] = useState(1);
  const [rowTotal, setRowTotal] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notifiedBatch = useRef<string | null>(null);
  const batchId = batch?.id;
  const batchStatus = batch?.status;

  const loadRows = useCallback(async (batchId: string, nextPage: number) => {
    return portalApi.studentTransfers.importRows(batchId, nextPage, PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (!batch || !["queued", "previewing", "commit_queued", "committing"].includes(batch.status)) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const next = await portalApi.studentTransfers.importStatus(batch.id);
        if (!cancelled) setBatch(next);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load import status.");
      }
    }, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [batch]);

  useEffect(() => {
    if (!batchId || !batchStatus || !["preview_ready", "completed"].includes(batchStatus)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadRows(batchId, page).then((result) => {
        if (!cancelled) {
          setRows(result.items);
          setRowTotal(result.pagination.total);
        }
      }).catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load import rows.");
      });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [batchId, batchStatus, page, loadRows]);

  useEffect(() => {
    if (batch?.status === "completed" && notifiedBatch.current !== batch.id) {
      notifiedBatch.current = batch.id;
      onCompleted();
    }
  }, [batch?.id, batch?.status, onCompleted]);

  async function upload() {
    if (!file || !/\.(csv|xlsx|xls)$/i.test(file.name) || file.size < 1 || file.size > MAX_FILE_BYTES) {
      setError("Choose a non-empty CSV, XLSX, or XLS file up to 25 MB.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const next = await portalApi.studentTransfers.upload(file);
      setBatch(next);
      setRows([]);
      setPage(1);
      notifiedBatch.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload the spreadsheet.");
    } finally {
      setWorking(false);
    }
  }

  async function commit() {
    if (!batch || batch.status !== "preview_ready") return;
    setWorking(true);
    setError(null);
    try {
      setBatch(await portalApi.studentTransfers.commit(batch.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to commit the import.");
    } finally {
      setWorking(false);
    }
  }

  function startAnother() {
    setFile(null);
    setBatch(null);
    setRows([]);
    setPage(1);
    setRowTotal(0);
    setError(null);
  }

  const busy = batch && ["queued", "previewing", "commit_queued", "committing"].includes(batch.status);
  const lastPage = Math.max(1, Math.ceil(rowTotal / PAGE_SIZE));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-950">Import students</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Upload a spreadsheet, review each row, then commit the import.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close import dialog" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 overflow-y-auto px-5 py-4">
            {!batch ? (
              <div className="space-y-4">
                <label className="block rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <FileSpreadsheet className="mx-auto size-8 text-orange-600" />
                  <span className="mt-2 block text-sm font-semibold text-slate-800">Choose a student spreadsheet</span>
                  <span className="mt-1 block text-xs text-slate-500">CSV, XLSX, or legacy XLS · 25 MB maximum</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="mt-4 block w-full text-sm"
                    onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); }}
                  />
                </label>
                {file && <p className="text-sm text-slate-700">Selected: {file.name}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <span className="font-semibold text-slate-900">{batch.sourceFilename}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                    {batch.status.replaceAll("_", " ")}
                  </span>
                  {busy && <Loader2 className="size-4 animate-spin text-orange-600" />}
                </div>
                {batch.status === "preview_ready" && (
                  <p className="text-sm text-slate-700">
                    {batch.totalRows} rows reviewed · {batch.readyRows} ready · {batch.totalRows - batch.readyRows} with errors
                  </p>
                )}
                {batch.status === "completed" && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                    Import complete: {batch.importedRows} imported, {batch.failedRows} failed, {batch.totalRows} total.
                  </p>
                )}
                {batch.status === "failed" && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {batch.error ?? "The spreadsheet could not be previewed."}
                  </p>
                )}
                {["preview_ready", "completed"].includes(batch.status) && (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[850px] text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="p-3">Row</th>
                            <th className="p-3">Legacy name / ID</th>
                            <th className="p-3">Mapped student</th>
                            <th className="p-3">Academic mapping</th>
                            <th className="p-3">Result / validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rows.map((row) => {
                            const enrollment = row.normalised.enrollment;
                            const sourceName = [row.source.firstname, row.source.middlename, row.source.lastname].filter(Boolean).join(" ");
                            const outcome = row.status === "imported" ? "Imported" : row.status === "failed" ? "Failed" : row.validationErrors.length ? "Needs correction" : "Ready";
                            return (
                              <tr key={row.rowNumber} className="align-top">
                                <td className="p-3 font-mono">{row.rowNumber}</td>
                                <td className="p-3">
                                  <div className="font-medium">{sourceName || "—"}</div>
                                  <div className="text-slate-500">{row.normalised.sourceStudentId || "New ID"}</div>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium">{row.normalised.student.name_english || "—"}</div>
                                  <div className="text-slate-500">DOB: {row.normalised.student.date_of_birth || "—"}</div>
                                </td>
                                <td className="p-3">
                                  <div>{enrollment.academic_year_name} · {enrollment.class_name} / {enrollment.section_name}</div>
                                  <div className="text-slate-500">{enrollment.shift_name} · {enrollment.medium} · {enrollment.group_name || "No group"}</div>
                                  <div className="text-slate-500">{enrollment.class_id && enrollment.section_id && enrollment.shift_id && enrollment.academic_year_id ? "Academic records matched" : "Academic match incomplete"}</div>
                                </td>
                                <td className="p-3">
                                  <span className={row.status === "failed" || row.validationErrors.length ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>{outcome}</span>
                                  {row.validationErrors.map((message, index) => (
                                    <div key={index} className="mt-1 text-rose-700">{message}</div>
                                  ))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Showing page {page} of {lastPage} · {rowTotal} rows</span>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                        <Button type="button" size="sm" variant="outline" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Next</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
            {batch && ["completed", "failed"].includes(batch.status) && (
              <Button type="button" variant="outline" onClick={startAnother}>Start another import</Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {!batch && (
              <Button type="button" onClick={upload} disabled={!file || working}>
                {working ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
                Upload for preview
              </Button>
            )}
            {batch?.status === "preview_ready" && (
              <Button type="button" onClick={commit} disabled={working || batch.readyRows === 0}>
                {working && <Loader2 className="mr-2 size-4 animate-spin" />}
                Commit {batch.readyRows} ready rows
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
