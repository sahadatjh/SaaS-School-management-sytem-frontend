"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { usePortal } from "@/components/portal-context";
import { portalApi } from "@/lib/portal-api";
import type {
  AcademicYear,
  Class,
  Department,
  Group,
  PromotionBatchResult,
  PromotionCandidate,
  PromotionFilters,
  PromotionPreview,
  PromotionStudent,
  PromotionTarget,
  Medium,
  Section,
  Shift,
} from "@/lib/contracts";

type Overrides = Record<string, Partial<PromotionTarget>>;
const selectClass =
  "h-9 rounded-md border border-slate-200 bg-white px-2 text-sm";
const blankTarget = (): PromotionTarget => ({
  academic_year_id: "",
  class_id: "",
  shift_id: "",
  medium_id: "",
});
function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={selectClass}
    >
      {children}
    </select>
  );
}

export default function StudentPromotionsPage() {
  const { profile, loading: profileLoading } = usePortal();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sourceSections, setSourceSections] = useState<Section[]>([]);
  const [sourceGroups, setSourceGroups] = useState<Group[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [source, setSource] = useState<PromotionFilters>({
    academic_year_id: "",
  });
  const [target, setTarget] = useState<PromotionTarget>(blankTarget());
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Overrides>({});
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [batch, setBatch] = useState<PromotionBatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const permitted = profile?.permissions.includes("students.promote") ?? false;
  const promotionBatch = batch?.batch;
  const students = useMemo<PromotionStudent[]>(
    () =>
      [...selected].map((student_id) => ({
        student_id,
        target_overrides: overrides[student_id],
      })),
    [selected, overrides],
  );
  const pages = Math.max(1, Math.ceil(total / 50));
  useEffect(() => {
    void Promise.all([
      portalApi.academicYears.list(),
      portalApi.classes.list(),
      portalApi.shifts.list(),
      portalApi.departments.list(),
      portalApi.mediums.list(),
    ])
      .then(([y, c, s, d, mediumRows]) => {
        setYears(y);
        setClasses(c);
        setShifts(s);
        setDepartments(d);
        setMediums(mediumRows.filter((medium) => medium.is_active));
      })
      .catch(() => toast.error("Unable to load academic setup."));
  }, []);
  useEffect(() => {
    if (!source.class_id) return;
    void Promise.all([
      portalApi.sections.list(
        new URLSearchParams({ class_id: source.class_id }),
      ),
      portalApi.groups.list(new URLSearchParams({ class_id: source.class_id })),
    ])
      .then(([s, g]) => {
        setSourceSections(s);
        setSourceGroups(g);
      })
      .catch(() => toast.error("Unable to load source sections and groups."));
  }, [source.class_id]);
  useEffect(() => {
    if (!target.class_id) return;
    void Promise.all([
      portalApi.sections.list(
        new URLSearchParams({ class_id: target.class_id }),
      ),
      portalApi.groups.list(new URLSearchParams({ class_id: target.class_id })),
    ])
      .then(([s, g]) => {
        setSections(s);
        setGroups(g);
      })
      .catch(() => toast.error("Unable to load target sections and groups."));
  }, [target.class_id]);
  async function loadCandidates(nextPage = 1) {
    if (!source.academic_year_id) {
      toast.error("Select the source academic year.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        academic_year_id: source.academic_year_id,
        page: String(nextPage),
        limit: "50",
      });
      Object.entries(source).forEach(([key, value]) => {
        if (value && key !== "academic_year_id") params.set(key, value);
      });
      const result = await portalApi.studentPromotions.candidates(params);
      setCandidates(result.items);
      setTotal(result.pagination.total);
      setPage(nextPage);
      setSelected(new Set());
      setOverrides({});
      setPreview(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load students.",
      );
    } finally {
      setLoading(false);
    }
  }
  function toggle(studentId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
    setPreview(null);
  }
  function updateOverride(
    studentId: string,
    key: keyof PromotionTarget,
    value: string,
  ) {
    setOverrides((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [key]:
          key === "roll_no"
            ? value
              ? Number(value)
              : undefined
            : value || undefined,
      },
    }));
    setPreview(null);
  }
  async function createPreview() {
    if (
      !target.academic_year_id ||
      !target.class_id ||
      !target.shift_id ||
      !target.medium_id ||
      !selected.size
    ) {
      toast.error("Select target placement and at least one student.");
      return;
    }
    setLoading(true);
    try {
      setPreview(
        await portalApi.studentPromotions.preview({ source, target, students }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Promotion preview failed.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function commit() {
    if (!preview || preview.invalid_count || !preview.ready_count) return;
    setLoading(true);
    try {
      const result = await portalApi.studentPromotions.commit({
        source,
        target,
        students,
        idempotency_key: crypto.randomUUID(),
      });
      const status = await portalApi.studentPromotions.get(
        result.id,
        new URLSearchParams({ page: "1", limit: "50" }),
      );
      setBatch(status);
      setPreview(null);
      toast.success(
        result.total_count === 1
          ? "Student promoted successfully."
          : "Promotion batch queued.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Promotion could not be committed.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (
      !promotionBatch ||
      !["queued", "processing"].includes(promotionBatch.status)
    )
      return;
    const batchId = promotionBatch.id;
    const timer = window.setInterval(() => {
      void portalApi.studentPromotions
        .get(batchId, new URLSearchParams({ page: "1", limit: "50" }))
        .then((next) => {
          setBatch(next);
          if (!["queued", "processing"].includes(next.batch.status))
            toast.success("Promotion batch processing finished.");
        })
        .catch(() => toast.error("Unable to refresh promotion progress."));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [promotionBatch]);
  if (profileLoading)
    return (
      <div className="p-4 text-sm text-slate-500">Loading permissions…</div>
    );
  if (!permitted)
    return (
      <div className="p-4 text-sm text-red-600">
        You do not have permission to promote students.
      </div>
    );
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Student Promotion</h1>
          <p className="text-sm text-slate-500">
            Select source students, preview the target placement, then confirm.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/academic/students">Back to students</Link>
        </Button>
      </div>
      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Source filters</h2>
        <div className="flex flex-wrap gap-2">
          <Select
            value={source.academic_year_id}
            onChange={(v) => setSource({ ...source, academic_year_id: v })}
          >
            <option value="">Academic year</option>
            {years.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={source.class_id ?? ""}
            onChange={(v) =>
              setSource({
                ...source,
                class_id: v || undefined,
                section_id: undefined,
                group_id: undefined,
              })
            }
          >
            <option value="">All classes</option>
            {classes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={source.section_id ?? ""}
            onChange={(v) =>
              setSource({ ...source, section_id: v || undefined })
            }
          >
            <option value="">All sections</option>
            {sourceSections.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={source.group_id ?? ""}
            onChange={(v) => setSource({ ...source, group_id: v || undefined })}
          >
            <option value="">All groups</option>
            {sourceGroups.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={source.department_id ?? ""}
            onChange={(v) =>
              setSource({ ...source, department_id: v || undefined })
            }
          >
            <option value="">All departments</option>
            {departments.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={source.shift_id ?? ""}
            onChange={(v) => setSource({ ...source, shift_id: v || undefined })}
          >
            <option value="">All shifts</option>
            {shifts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Button onClick={() => void loadCandidates()} disabled={loading}>
            {loading ? "Loading…" : "Find students"}
          </Button>
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Default target placement</h2>
        <div className="flex flex-wrap gap-2">
          <Select
            value={target.academic_year_id}
            onChange={(v) => {
              setTarget({ ...target, academic_year_id: v });
              setPreview(null);
            }}
          >
            <option value="">Target year</option>
            {years.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={target.class_id}
            onChange={(v) => {
              if (!v) {
                setSections([]);
                setGroups([]);
              }
              setTarget({
                ...target,
                class_id: v,
                section_id: undefined,
                group_id: undefined,
              });
              setPreview(null);
            }}
          >
            <option value="">Target class</option>
            {classes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={target.section_id ?? ""}
            onChange={(v) => {
              setTarget({ ...target, section_id: v || undefined });
              setPreview(null);
            }}
          >
            <option value="">No section</option>
            {sections.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={target.group_id ?? ""}
            onChange={(v) => {
              setTarget({ ...target, group_id: v || undefined });
              setPreview(null);
            }}
          >
            <option value="">No group</option>
            {groups.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={target.department_id ?? ""}
            onChange={(v) => {
              setTarget({ ...target, department_id: v || undefined });
              setPreview(null);
            }}
          >
            <option value="">No department</option>
            {departments.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={target.shift_id}
            onChange={(v) => {
              setTarget({ ...target, shift_id: v });
              setPreview(null);
            }}
          >
            <option value="">Target shift</option>
            {shifts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            value={target.medium_id}
            onChange={(v) => {
              setTarget({ ...target, medium_id: v });
              setPreview(null);
            }}
          >
            <option value="">Target Medium / Version</option>
            {mediums.map((medium) => (
              <option key={medium.id} value={medium.id}>
                {medium.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              Students ({selected.size} selected)
            </h2>
            <p className="text-xs text-slate-500">
              Page {page} of {pages}; {total} matching students.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSelected(new Set(candidates.map((x) => x.student_id)))
              }
            >
              Select page
            </Button>
            <Button
              size="sm"
              onClick={() => void createPreview()}
              disabled={loading || !selected.size}
            >
              Preview
            </Button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="p-2">Select</th>
                <th className="p-2">Student</th>
                <th className="p-2">Section</th>
                <th className="p-2">Group</th>
                <th className="p-2">Roll</th>
                <th className="p-2">Registration</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((s) => (
                <tr key={s.student_id} className="border-t">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(s.student_id)}
                      onChange={() => toggle(s.student_id)}
                    />
                  </td>
                  <td className="p-2">
                    <b>{s.name_english}</b>
                    <div className="text-xs text-slate-500">
                      {s.student_code} · Source roll: {s.roll_no ?? "—"}
                    </div>
                  </td>
                  <td className="p-2">
                    <Select
                      value={overrides[s.student_id]?.section_id ?? ""}
                      onChange={(v) =>
                        updateOverride(s.student_id, "section_id", v)
                      }
                    >
                      <option value="">Default</option>
                      {sections.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select
                      value={overrides[s.student_id]?.group_id ?? ""}
                      onChange={(v) =>
                        updateOverride(s.student_id, "group_id", v)
                      }
                    >
                      <option value="">Default</option>
                      {groups.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-2">
                    <input
                      className={selectClass}
                      type="number"
                      min="1"
                      value={overrides[s.student_id]?.roll_no ?? ""}
                      onChange={(e) =>
                        updateOverride(s.student_id, "roll_no", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={selectClass}
                      value={overrides[s.student_id]?.registration_no ?? ""}
                      onChange={(e) =>
                        updateOverride(
                          s.student_id,
                          "registration_no",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!candidates.length && (
            <p className="p-4 text-sm text-slate-500">
              Choose source filters and find students.
            </p>
          )}
        </div>
        {total > 50 && (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1 || loading}
              onClick={() => void loadCandidates(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === pages || loading}
              onClick={() => void loadCandidates(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
      {preview && (
        <Card className="space-y-3 p-4">
          <div>
            <h2 className="font-semibold">Review promotion</h2>
            <p className="text-sm text-slate-600">
              {preview.ready_count} ready, {preview.invalid_count} conflicts.
              Invalid rows cannot be submitted.
            </p>
          </div>
          <div className="max-h-56 overflow-auto text-sm">
            {preview.items.map((item) => (
              <div key={item.student_id} className="border-t p-2">
                <span
                  className={
                    item.status === "ready"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {item.status === "ready" ? "Ready" : item.reason_code}
                </span>
                {item.reason_message && (
                  <span className="ml-2 text-slate-600">
                    {item.reason_message}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => void commit()}
              disabled={
                loading || !!preview.invalid_count || !preview.ready_count
              }
            >
              Confirm promotion ({preview.ready_count})
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cancel preview
            </Button>
          </div>
        </Card>
      )}
      {batch && (
        <Card className="space-y-3 p-4">
          <div>
            <h2 className="font-semibold">Batch progress</h2>
            <p className="text-sm text-slate-600">
              {batch.batch.status}: {batch.batch.succeeded_count} succeeded,{" "}
              {batch.batch.failed_count} failed, {batch.batch.skipped_count}{" "}
              skipped of {batch.batch.total_count}.
            </p>
          </div>
          {batch.items.items.map((item) => (
            <div key={item.id} className="border-t p-2 text-sm">
              <span
                className={
                  item.status === "failed" ? "text-red-700" : "text-slate-700"
                }
              >
                {item.status}
              </span>
              {item.reason_message && (
                <span className="ml-2 text-slate-600">
                  {item.reason_message}
                </span>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
