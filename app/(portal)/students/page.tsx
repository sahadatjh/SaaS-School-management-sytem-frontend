"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Eye,
  Pencil,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ActionTooltip } from "@/components/ui/tooltip";
import { useListQuery } from "@/hooks/use-list-query";
import { portalApi } from "@/lib/portal-api";
import type {
  Student,
  AcademicYear,
  Class,
  Shift,
  Section,
  Group,
} from "@/lib/contracts";

const PAGE_SIZE = 100;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filter dropdowns data
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Filter selections
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const { sortState, requestSort, search, setSearch, debouncedSearch } =
    useListQuery("student_id", "asc");

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load filter dropdown data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [y, c, sh, sec, g] = await Promise.all([
          portalApi.academicYears.list(),
          portalApi.classes.list(),
          portalApi.shifts.list(),
          portalApi.sections.list(),
          portalApi.groups.list(),
        ]);
        setYears(y);
        setClasses(c);
        setShifts(sh);
        setSections(sec);
        setGroups(g);
      } catch {
        // Filter data load failure is non-critical
      }
    };
    void loadFilterData();
  }, []);

  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));
      if (sortState.sortBy) params.set("sort_by", sortState.sortBy);
      if (sortState.sortOrder) params.set("sort_order", sortState.sortOrder);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedYear) params.set("academic_year_id", selectedYear);
      if (selectedShift) params.set("shift_id", selectedShift);
      if (selectedClass) params.set("class_id", selectedClass);
      if (selectedSection) params.set("section_id", selectedSection);
      if (selectedGroup) params.set("group_id", selectedGroup);
      return params;
    },
    [
      sortState.sortBy,
      sortState.sortOrder,
      debouncedSearch,
      selectedYear,
      selectedShift,
      selectedClass,
      selectedSection,
      selectedGroup,
    ],
  );

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const params = buildParams(1);
      const result = await portalApi.students.list(params);
      setStudents(result.items);
      setHasMore(result.items.length >= PAGE_SIZE);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load students.",
      );
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const params = buildParams(nextPage);
      const result = await portalApi.students.list(params);
      setStudents((prev) => [...prev, ...result.items]);
      setHasMore(result.items.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch {
      // Silently fail on load-more; user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, buildParams]);

  // Initial load & reload on filter/sort changes
  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          void loadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleSearch = () => {
    void loadStudents();
  };

  const filteredSections = useMemo(
    () =>
      selectedClass
        ? sections.filter((s) => s.class_id === selectedClass)
        : sections,
    [selectedClass, sections],
  );

  const filteredGroups = useMemo(
    () =>
      selectedClass
        ? groups.filter((g) => g.class_id === selectedClass)
        : groups,
    [selectedClass, groups],
  );

  return (
    <div className="flex h-full w-full flex-col">
      <nav
        aria-label="Breadcrumb"
        className="mb-2.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        <span>Students</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">All Students</span>
      </nav>

      <Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-slate-200/90 shadow-xs">
        {/* Search Bar */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-slate-900">
                All Students
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {students.length}
              </span>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              {/* Search input */}
              <div className="relative w-full sm:w-52">
                <Search className="absolute left-2.5 top-[11px] size-4 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 border-slate-200 bg-slate-50/70 pl-8 pr-8 text-xs transition-colors focus:bg-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-[11px] text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Year */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>

              {/* Shift */}
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Class */}
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                  setSelectedGroup("");
                }}
                className="h-9 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Section */}
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="">All Sections</option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Group */}
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              >
                <option value="">All Groups</option>
                {filteredGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                size="sm"
                onClick={handleSearch}
                className="h-9 shrink-0 bg-orange-600 px-4 text-xs font-semibold hover:bg-orange-700"
              >
                <Search className="mr-1.5 size-3.5" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="mb-2.5 size-9 text-rose-500" />
            <p className="text-sm font-bold text-slate-900">
              Failed to load students
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStudents}
              className="mt-3.5 h-8 text-xs"
            >
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              search || selectedYear || selectedClass
                ? "No matching students"
                : "No students found"
            }
            description={
              search || selectedYear || selectedClass
                ? "Try adjusting your filters."
                : "Add your first student to get started."
            }
          />
        ) : (
          <div className="flex-1 overflow-auto bg-slate-50/30">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-xs">
                <tr>
                  <SortableHeader
                    columnKey="student_id"
                    title="Student ID"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="name"
                    title="Name"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="class"
                    title="Class"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="section"
                    title="Section"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="group"
                    title="Group"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="shift"
                    title="Shift"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="gender"
                    title="Gender"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="father_name"
                    title="Father Name"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="parents_sms_number"
                    title="Gurdian Phone"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="status"
                    title="Status"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <SortableHeader
                    columnKey="present_district"
                    title="Address"
                    sortState={sortState}
                    onRequestSort={requestSort}
                  />
                  <th scope="col" className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-900">
                      {student.student_id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                      {student.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {student.enrollment?.class_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {student.enrollment?.section_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {/* group_name not in response, show dash */}—
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      —
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs capitalize text-slate-600">
                      {student.gender || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {student.father_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {student.parents_sms_number || student.father_mobile || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <StatusBadge
                        isActive={student.status === "active"}
                        activeText={student.status || "active"}
                        inactiveText={student.status || "inactive"}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {[
                        student.present_village,
                        student.present_thana,
                        student.present_district,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <ActionTooltip content="View">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            aria-label={`View ${student.name}`}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip content="Edit">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                            aria-label={`Edit ${student.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip content="Delete">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${student.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-px" />
            {loadingMore && (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                Loading more students...
              </div>
            )}
            {!hasMore && students.length > 0 && (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                All students loaded
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
