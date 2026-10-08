"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Loader2,
  Save,
  RotateCcw,
  PlusCircle,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";
import styles from "./student-form.module.css";
import type {
  AcademicYear,
  Class,
  Section,
  Shift,
  Group,
  Department,
  Medium,
  StudentPayload,
  StudentPhotoField,
  StudentPhotoFiles,
} from "@/lib/contracts";

// ── Helpers ────────────────────────────────────────────────────────────────
function Select({
  id,
  label,
  required,
  value,
  onChange,
  children,
  disabled,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`h-8 w-full min-w-0 rounded-md border bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${error ? "border-red-500 focus:ring-red-100" : "border-slate-200 focus:ring-slate-900/10"}`}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  disabled,
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`h-8 text-xs ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
  bodyClassName,
}: {
  title: string;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <Card className={`${styles.section} overflow-hidden p-0`}>
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h2>
      </div>
      <div className={bodyClassName ?? styles.sectionGrid}>{children}</div>
    </Card>
  );
}

function PhotoCard({
  field,
  label,
  imageUrl,
  previewUrl,
  removed,
  error,
  embedded = false,
  onSelect,
  onRemove,
}: {
  field: StudentPhotoField;
  label: string;
  imageUrl?: string | null;
  previewUrl?: string;
  removed: boolean;
  error?: string;
  embedded?: boolean;
  onSelect: (field: StudentPhotoField, file: File) => void;
  onRemove: (field: StudentPhotoField) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `${field}-upload`;
  const visibleImage = removed ? null : (previewUrl ?? imageUrl);
  return (
    <div
      className={`mx-auto w-full max-w-36 min-w-0 self-start text-center ${embedded ? "p-0" : "rounded-xl border border-slate-200 bg-white p-3"}`}
    >
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
      <div
        className={`relative mx-auto flex aspect-[3/4] w-28 max-w-full items-center justify-center overflow-hidden rounded-xl border-2 bg-slate-50 ${visibleImage ? "border-slate-200" : "border-dashed border-blue-300"}`}
      >
        {visibleImage ? (
          <Image
            src={visibleImage}
            alt={label}
            fill
            unoptimized
            sizes="112px"
            className="object-contain object-center"
          />
        ) : (
          <div className="px-3 text-center text-slate-400">
            <Camera className="mx-auto mb-2 h-6 w-6" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">
        Max 2MB · JPG, PNG
      </p>
      <p className="text-[11px] leading-4 text-slate-400">
        Recommended: 3×4 ratio
      </p>
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1 break-words text-xs text-rose-600"
        >
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png"
        aria-label={`Select ${label.toLowerCase()}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onSelect(field, selected);
          event.currentTarget.value = "";
        }}
      />
      <div className="mt-3 flex w-full flex-col gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full min-w-0 gap-1 whitespace-nowrap px-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 shrink-0" />
          {visibleImage ? "Replace" : "Select Photo"}
        </Button>
        {visibleImage && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full min-w-0 gap-1 whitespace-nowrap px-2 text-rose-600 hover:text-rose-700"
            onClick={() => onRemove(field)}
          >
            <X className="h-3.5 w-3.5 shrink-0" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Initial form state ─────────────────────────────────────────────────────
export const EMPTY_STUDENT_PAYLOAD: StudentPayload = {
  // Enrollment
  enrollment: {
    academic_year_id: "",
    class_id: "",
    section_id: "",
    shift_id: "",
    medium_id: "",
    roll_no: 0,
  },
  // Personal
  name_english: "",
  name_bangla: "",
  date_of_birth: "",
  gender: "",
  status: "active",
  blood_group: null,
  nationality: "Bangladeshi",
  religion: null,
  admission_date: "",
  photo_url: "",
  father_photo_url: "",
  mother_photo_url: "",
  // Previous school
  prev_school_name: "",
  prev_class: "",
  prev_section: "",
  prev_roll: "",
  prev_group: "",
  prev_session: "",
  tc_number: "",
  // Address
  present_village: "",
  present_thana: "",
  present_district: "",
  present_division: "",
  present_post_code: "",
  permanent_village: "",
  permanent_thana: "",
  permanent_district: "",
  permanent_division: "",
  permanent_post_code: "",
  is_same_address: false,
  // SMS
  primary_sms_number: "",
  secondary_sms_number: "",
  sms_recipients: [],
  // Father
  father_name_bangla: "",
  father_name_english: "",
  father_occupation: "",
  father_occupation_details: "",
  father_mobile: "",
  father_nid: "",
  father_annual_income: null,
  // Mother
  mother_name_bangla: "",
  mother_name_english: "",
  mother_occupation: "",
  mother_occupation_details: "",
  mother_mobile: "",
  mother_nid: "",
  mother_annual_income: null,
  // Guardian
  local_guardian_name: "",
  local_guardian_relationship: "",
  local_guardian_contact: "",
  remarks: "",
};

// ── Props ──────────────────────────────────────────────────────────────────
export type StudentFormProps = {
  /** Pre-filled data for editing. When provided, the form is in edit mode. */
  initialData?: StudentPayload;
  /** Values restored after Reset or Save & Add Another. */
  resetData?: StudentPayload;
  /** Called when the form is submitted. Return a promise that resolves once saved. */
  onSubmit: (
    payload: StudentPayload,
    action: "save" | "save-and-add",
    photos: StudentPhotoFiles,
    removedPhotos: StudentPhotoField[],
  ) => Promise<void>;
  /** Show "Save & Add Another" button (only for create mode). */
  showSaveAndAdd?: boolean;
  /** Local draft key for the create form. */
  draftStorageKey?: string;
  /** Called when Reset Form clears the form. */
  onReset?: () => void;
  /** Whether the form is currently submitting (controlled externally). */
  submitting?: boolean;
  /** Submit button label. Defaults to "Save Student". */
  submitLabel?: string;
  showAcademicInformation?: boolean;
  lockEnrollmentDetails?: boolean;
};

export default function StudentForm({
  initialData,
  resetData,
  onSubmit,
  showSaveAndAdd = false,
  draftStorageKey,
  onReset,
  submitting: externalSubmitting,
  submitLabel = "Save Student",
  showAcademicInformation = true,
  lockEnrollmentDetails,
}: StudentFormProps) {
  const [form, setForm] = useState<StudentPayload>(
    initialData ?? EMPTY_STUDENT_PAYLOAD,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAction, setSubmitAction] = useState<"save" | "save-and-add">(
    "save",
  );
  const [photos, setPhotos] = useState<StudentPhotoFiles>({});
  const [photoPreviews, setPhotoPreviews] = useState<
    Partial<Record<StudentPhotoField, string>>
  >({});
  const [removedPhotos, setRemovedPhotos] = useState<StudentPhotoField[]>([]);
  const isSubmitting = externalSubmitting ?? submitting;
  const enrollmentDetailsLocked =
    lockEnrollmentDetails ?? !showAcademicInformation;

  useEffect(() => {
    if (!draftStorageKey) return;
    try {
      if (
        JSON.stringify(form) ===
        JSON.stringify(resetData ?? EMPTY_STUDENT_PAYLOAD)
      ) {
        localStorage.removeItem(draftStorageKey);
      } else {
        localStorage.setItem(draftStorageKey, JSON.stringify(form));
      }
    } catch {
      // Storage may be unavailable; the form remains usable.
    }
  }, [draftStorageKey, form, resetData]);

  // Lookup data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);

  // Load setup data once
  useEffect(() => {
    if (!showAcademicInformation) return;
    const p = new URLSearchParams({ limit: "100" });
    Promise.all([
      portalApi.academicYears.list(p),
      portalApi.classes.list(p),
      portalApi.shifts.list(p),
      portalApi.departments.list(p),
      portalApi.mediums.list(p),
    ]).then(([years, cls, sh, dep, mediumRows]) => {
      setAcademicYears(years ?? []);
      setClasses(cls ?? []);
      setShifts(sh ?? []);
      setDepartments(dep ?? []);
      setMediums((mediumRows ?? []).filter((medium) => medium.is_active));
    });
  }, [showAcademicInformation]);

  // Load sections when class changes
  useEffect(() => {
    if (!showAcademicInformation || !form.enrollment.class_id) return;
    const p = new URLSearchParams({
      limit: "100",
      class_id: form.enrollment.class_id,
    });
    portalApi.sections.list(p).then((r) => setSections(r ?? []));
    portalApi.groups.list(p).then((r) => setGroups(r ?? []));
  }, [form.enrollment.class_id, showAcademicInformation]);

  function clearError(key: string) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function set(key: keyof StudentPayload, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(String(key));
  }

  function setEnr(key: keyof StudentPayload["enrollment"], value: unknown) {
    setForm((prev) => ({
      ...prev,
      enrollment: { ...prev.enrollment, [key]: value },
    }));
    if (key === "class_id") {
      setSections([]);
      setGroups([]);
    }
    clearError(String(key));
  }

  function handleSameAddress(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      is_same_address: checked,
      permanent_village: checked ? prev.present_village : "",
      permanent_thana: checked ? prev.present_thana : "",
      permanent_district: checked ? prev.present_district : "",
      permanent_division: checked ? prev.present_division : "",
      permanent_post_code: checked ? prev.present_post_code : "",
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const requiredMessage = "This field is required.";
    if (showAcademicInformation) {
      if (!form.enrollment.academic_year_id)
        e.academic_year_id = requiredMessage;
      if (!form.enrollment.class_id) e.class_id = requiredMessage;
      if (!form.enrollment.shift_id) e.shift_id = requiredMessage;
      if (!form.enrollment.medium_id) e.medium_id = requiredMessage;
    }
    if (!form.name_english.trim()) e.name_english = requiredMessage;
    if ((form.local_guardian_relationship ?? "").length > 255) {
      e.local_guardian_relationship =
        "Relationship must be 255 characters or fewer.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function withoutEmptyValues(values: object) {
    return Object.fromEntries(
      Object.entries(values).filter(
        ([, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const enrollment = withoutEmptyValues(form.enrollment);
      if (!form.enrollment.roll_no) delete enrollment.roll_no;
      const payload = {
        ...withoutEmptyValues(form),
        enrollment,
        local_guardian_relationship:
          form.local_guardian_relationship?.trim() || null,
      } as StudentPayload;
      Reflect.deleteProperty(payload, "parents_sms_number");

      await onSubmit(payload, submitAction, photos, removedPhotos);

      if (submitAction === "save-and-add" && showSaveAndAdd) {
        setForm(
          resetData ?? {
            ...EMPTY_STUDENT_PAYLOAD,
            enrollment: {
              ...form.enrollment,
              roll_no: 0,
              registration_no: "",
            },
          },
        );
        setErrors({});
        setPhotos({});
        Object.values(photoPreviews).forEach((url) => URL.revokeObjectURL(url));
        setPhotoPreviews({});
        setRemovedPhotos([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(resetData ?? EMPTY_STUDENT_PAYLOAD);
    setPhotos({});
    Object.values(photoPreviews).forEach((url) => URL.revokeObjectURL(url));
    setPhotoPreviews({});
    setRemovedPhotos([]);
    setSections([]);
    setGroups([]);
    setErrors({});
    setSubmitAction("save");
    onReset?.();
  }

  function selectPhoto(field: StudentPhotoField, file: File) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((current) => ({
        ...current,
        [field]: "Select a JPG or PNG image.",
      }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        [field]: "Photo must be 2 MB or smaller.",
      }));
      return;
    }
    clearError(field);
    setPhotos((current) => ({ ...current, [field]: file }));
    setPhotoPreviews((current) => {
      if (current[field]) URL.revokeObjectURL(current[field]);
      return { ...current, [field]: URL.createObjectURL(file) };
    });
    setRemovedPhotos((current) => current.filter((value) => value !== field));
  }

  function removePhoto(field: StudentPhotoField) {
    setPhotos((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setPhotoPreviews((current) => {
      if (current[field]) URL.revokeObjectURL(current[field]);
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (initialData?.[field]) {
      setRemovedPhotos((current) =>
        current.includes(field) ? current : [...current, field],
      );
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const actionButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={handleReset}
        disabled={isSubmitting}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset Form
      </Button>
      {showSaveAndAdd && (
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          onClick={() => setSubmitAction("save-and-add")}
          disabled={isSubmitting}
        >
          {isSubmitting && submitAction === "save-and-add" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlusCircle className="h-3.5 w-3.5" />
          )}
          Save & Add Another
        </Button>
      )}
      <Button
        type="submit"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => setSubmitAction("save")}
        disabled={isSubmitting}
      >
        {isSubmitting && submitAction === "save" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5" />
        )}
        {submitLabel}
      </Button>
    </>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} flex flex-col gap-4`}
    >
      {/* Top action bar */}
      <div className={styles.actions}>{actionButtons}</div>

      {/* Student details share one continuous card. */}
      <SectionCard
        title="Student Information"
        bodyClassName={styles.studentInformation}
      >
        <div className={styles.photoLayout}>
          <PhotoCard
            embedded
            field="photo_url"
            label="Student Photo"
            imageUrl={form.photo_url}
            previewUrl={photoPreviews.photo_url}
            removed={removedPhotos.includes("photo_url")}
            error={errors.photo_url}
            onSelect={selectPhoto}
            onRemove={removePhoto}
          />
          <div className={styles.personalFields}>
            {showAcademicInformation && (
              <>
                <Select
                  id="academic_year_id"
                  label="Session / Year"
                  required
                  error={errors.academic_year_id}
                  value={form.enrollment.academic_year_id}
                  onChange={(v) => setEnr("academic_year_id", v)}
                >
                  <option value="">Select…</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="class_id"
                  label="Class"
                  required
                  error={errors.class_id}
                  value={form.enrollment.class_id}
                  onChange={(v) => {
                    setEnr("class_id", v);
                    setEnr("section_id", "");
                  }}
                >
                  <option value="">Select…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="section_id"
                  label="Section"
                  error={errors.section_id}
                  value={form.enrollment.section_id ?? ""}
                  onChange={(v) => setEnr("section_id", v || undefined)}
                  disabled={!form.enrollment.class_id}
                >
                  <option value="">Select…</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="shift_id"
                  label="Shift"
                  required
                  error={errors.shift_id}
                  value={form.enrollment.shift_id}
                  onChange={(v) => setEnr("shift_id", v)}
                >
                  <option value="">Select…</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="medium_id"
                  label="Medium / Version"
                  required
                  error={errors.medium_id}
                  value={form.enrollment.medium_id}
                  onChange={(v) => setEnr("medium_id", v)}
                >
                  <option value="">Select…</option>
                  {mediums.map((medium) => (
                    <option key={medium.id} value={medium.id}>
                      {medium.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="group_id"
                  label="Group"
                  value={form.enrollment.group_id ?? ""}
                  onChange={(v) => setEnr("group_id", v || undefined)}
                  disabled={!groups.length}
                >
                  <option value="">Select…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="department_id"
                  label="Department"
                  value={form.enrollment.department_id ?? ""}
                  onChange={(v) => setEnr("department_id", v || undefined)}
                >
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </>
            )}
            {/* <div>
              <Select
                id="gender"
                label="Gender"
                value={form.gender}
                onChange={(v) => set("gender", v)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Field
                id="nationality"
                label="Nationality"
                value={form.nationality ?? "Bangladeshi"}
                onChange={(v) => set("nationality", v)}
              />
            </div> */}
            <div className={styles.wideField}>
              <Field
                id="name_bangla"
                label="Student Full Name (Bangla)"
                value={form.name_bangla ?? ""}
                onChange={(v) => set("name_bangla", v)}
                placeholder="বাংলায় নাম লিখুন"
              />
            </div>
            <div className={styles.wideField}>
              <Field
                id="name_english"
                label="Student Full Name (English)"
                required
                error={errors.name_english}
                value={form.name_english}
                onChange={(v) => set("name_english", v)}
                placeholder="Name in English"
              />
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="date_of_birth"
                  className="text-xs font-medium text-slate-700"
                >
                  Date of Birth
                </label>
                <DateInput
                  id="date_of_birth"
                  value={form.date_of_birth}
                  onChange={(v) => set("date_of_birth", v)}
                />
              </div>
            </div>

            <div>
              <Select
                id="blood_group"
                label="Blood Group"
                value={form.blood_group ?? ""}
                onChange={(v) => set("blood_group", v || null)}
              >
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                  (bg) => (
                    <option key={bg}>{bg}</option>
                  ),
                )}
              </Select>
            </div>

            <div>
              <Select
                id="religion"
                label="Religion"
                value={form.religion ?? ""}
                onChange={(v) => set("religion", v || null)}
              >
                <option value="">Select religion</option>
                <option>Islam</option>
                <option>Hinduism</option>
                <option>Buddhism</option>
                <option>Christianity</option>
                <option>Other</option>
              </Select>
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="roll_no"
                  className="text-xs font-medium text-slate-700"
                >
                  Roll No.
                </label>
                <Input
                  id="roll_no"
                  disabled={enrollmentDetailsLocked}
                  type="number"
                  min={1}
                  value={form.enrollment.roll_no || ""}
                  onChange={(e) => setEnr("roll_no", Number(e.target.value))}
                  placeholder="e.g. 01"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="admission_date"
                className="text-xs font-medium text-slate-700"
              >
                Admission Date
              </label>
              <DateInput
                id="admission_date"
                value={form.admission_date ?? ""}
                onChange={(v) => set("admission_date", v)}
              />
            </div>
            <div className={styles.wideField}>
              <Field
                id="registration_no"
                disabled={enrollmentDetailsLocked}
                label="Registration / Board Roll No."
                value={form.enrollment.registration_no ?? ""}
                onChange={(v) => setEnr("registration_no", v)}
                placeholder="Board registration number"
              />
            </div>
            <div className={styles.wideField}>
              <Select
                id="status"
                label="Status"
                value={form.status}
                onChange={(v) => set("status", v)}
              >
                <option value="active">Active</option>
                <option value="applicant">Applicant</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </div>
        <div className={styles.informationFields}>
          <Field
            id="primary_sms_number"
            label="SMS Number"
            value={form.primary_sms_number}
            onChange={(v) => set("primary_sms_number", v)}
            placeholder="01XXXXXXXXX"
          />
          <Field
            id="secondary_sms_number"
            label="Secondary SMS Number"
            value={form.secondary_sms_number ?? ""}
            onChange={(v) => set("secondary_sms_number", v)}
            placeholder="Optional"
          />
        </div>
      </SectionCard>

      <SectionCard title="Previous School Details">
        <Field
          id="prev_school_name"
          label="School Name"
          value={form.prev_school_name ?? ""}
          onChange={(v) => set("prev_school_name", v)}
        />
        <Field
          id="prev_class"
          label="Class"
          value={form.prev_class ?? ""}
          onChange={(v) => set("prev_class", v)}
        />
        <Field
          id="prev_section"
          label="Section"
          value={form.prev_section ?? ""}
          onChange={(v) => set("prev_section", v)}
        />
        <Field
          id="prev_roll"
          label="Roll"
          value={form.prev_roll ?? ""}
          onChange={(v) => set("prev_roll", v)}
        />
        <Field
          id="prev_group"
          label="Group"
          value={form.prev_group ?? ""}
          onChange={(v) => set("prev_group", v)}
        />
        <Field
          id="prev_session"
          label="Session"
          value={form.prev_session ?? ""}
          onChange={(v) => set("prev_session", v)}
        />
        <Field
          id="tc_number"
          label="TC Number"
          value={form.tc_number ?? ""}
          onChange={(v) => set("tc_number", v)}
        />
      </SectionCard>

      <SectionCard
        title="Address Information"
        bodyClassName={`${styles.addressColumns} p-4`}
      >
        {/* Present */}
        <div>
          <p className="mb-3 text-xs font-semibold text-slate-700">
            Present Address
          </p>
          <div className={styles.addressFields}>
            <div className={styles.addressFullWidth}>
              <Field
                id="present_village"
                label="Village / House / Road"
                value={form.present_village}
                onChange={(v) => set("present_village", v)}
              />
            </div>
            <Field
              id="present_thana"
              label="Thana / Upazila"
              value={form.present_thana ?? ""}
              onChange={(v) => set("present_thana", v)}
            />
            <Field
              id="present_district"
              label="District"
              value={form.present_district ?? ""}
              onChange={(v) => set("present_district", v)}
            />
            <Field
              id="present_division"
              label="Division"
              value={form.present_division ?? ""}
              onChange={(v) => set("present_division", v)}
            />
            <Field
              id="present_post_code"
              label="Post Code"
              value={form.present_post_code ?? ""}
              onChange={(v) => set("present_post_code", v)}
            />
          </div>
        </div>
        {/* Permanent */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">
              Permanent Address
            </p>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.is_same_address}
                onChange={(e) => handleSameAddress(e.target.checked)}
                className="h-3 w-3 rounded accent-slate-900"
              />
              Same as present
            </label>
          </div>
          <div className={styles.addressFields}>
            <div className={styles.addressFullWidth}>
              <Field
                id="permanent_village"
                label="Village / House / Road"
                value={form.permanent_village ?? ""}
                onChange={(v) => set("permanent_village", v)}
              />
            </div>
            <Field
              id="permanent_thana"
              label="Thana / Upazila"
              value={form.permanent_thana ?? ""}
              onChange={(v) => set("permanent_thana", v)}
            />
            <Field
              id="permanent_district"
              label="District"
              value={form.permanent_district ?? ""}
              onChange={(v) => set("permanent_district", v)}
            />
            <Field
              id="permanent_division"
              label="Division"
              value={form.permanent_division ?? ""}
              onChange={(v) => set("permanent_division", v)}
            />
            <Field
              id="permanent_post_code"
              label="Post Code"
              value={form.permanent_post_code ?? ""}
              onChange={(v) => set("permanent_post_code", v)}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── 6. Parents ── */}
      <div className={styles.parentCards}>
        <Card className={`${styles.parentCard} overflow-hidden p-0`}>
          <div className="border-b border-slate-100 bg-blue-50 px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              Father
            </h2>
          </div>
          <div className={`${styles.photoLayout} p-4`}>
            <PhotoCard
              embedded
              field="father_photo_url"
              label="Father Photo"
              imageUrl={form.father_photo_url}
              previewUrl={photoPreviews.father_photo_url}
              removed={removedPhotos.includes("father_photo_url")}
              error={errors.father_photo_url}
              onSelect={selectPhoto}
              onRemove={removePhoto}
            />
            <div className={styles.parentFields}>
              <Field
                id="father_name_english"
                label="Name (English)"
                value={form.father_name_english ?? ""}
                onChange={(v) => set("father_name_english", v)}
              />
              <Field
                id="father_name_bangla"
                label="Name (Bangla)"
                value={form.father_name_bangla ?? ""}
                onChange={(v) => set("father_name_bangla", v)}
              />
              <Field
                id="father_occupation"
                label="Occupation"
                value={form.father_occupation ?? ""}
                onChange={(v) => set("father_occupation", v)}
              />
              <Field
                id="father_mobile"
                label="Mobile"
                value={form.father_mobile ?? ""}
                onChange={(v) => set("father_mobile", v)}
              />
              <Field
                id="father_nid"
                label="NID"
                value={form.father_nid ?? ""}
                onChange={(v) => set("father_nid", v)}
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="father_annual_income"
                  className="text-xs font-medium text-slate-700"
                >
                  Annual Income
                </label>
                <Input
                  id="father_annual_income"
                  type="number"
                  min={0}
                  value={form.father_annual_income ?? ""}
                  onChange={(e) =>
                    set(
                      "father_annual_income",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className={`${styles.parentCard} overflow-hidden p-0`}>
          <div className="border-b border-slate-100 bg-pink-50 px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-pink-600">
              Mother
            </h2>
          </div>
          <div className={`${styles.photoLayout} p-4`}>
            <PhotoCard
              embedded
              field="mother_photo_url"
              label="Mother Photo"
              imageUrl={form.mother_photo_url}
              previewUrl={photoPreviews.mother_photo_url}
              removed={removedPhotos.includes("mother_photo_url")}
              error={errors.mother_photo_url}
              onSelect={selectPhoto}
              onRemove={removePhoto}
            />
            <div className={styles.parentFields}>
              <Field
                id="mother_name_english"
                label="Name (English)"
                value={form.mother_name_english ?? ""}
                onChange={(v) => set("mother_name_english", v)}
              />
              <Field
                id="mother_name_bangla"
                label="Name (Bangla)"
                value={form.mother_name_bangla ?? ""}
                onChange={(v) => set("mother_name_bangla", v)}
              />
              <Field
                id="mother_occupation"
                label="Occupation"
                value={form.mother_occupation ?? ""}
                onChange={(v) => set("mother_occupation", v)}
              />
              <Field
                id="mother_mobile"
                label="Mobile"
                value={form.mother_mobile ?? ""}
                onChange={(v) => set("mother_mobile", v)}
              />
              <Field
                id="mother_nid"
                label="NID"
                value={form.mother_nid ?? ""}
                onChange={(v) => set("mother_nid", v)}
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="mother_annual_income"
                  className="text-xs font-medium text-slate-700"
                >
                  Annual Income
                </label>
                <Input
                  id="mother_annual_income"
                  type="number"
                  min={0}
                  value={form.mother_annual_income ?? ""}
                  onChange={(e) =>
                    set(
                      "mother_annual_income",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 7. Local Guardian ── */}
      <SectionCard title="Local Guardian (Optional)">
        <Field
          id="local_guardian_name"
          label="Name"
          value={form.local_guardian_name ?? ""}
          onChange={(v) => set("local_guardian_name", v)}
        />
        <Field
          id="local_guardian_relationship"
          label="Relationship"
          value={form.local_guardian_relationship ?? ""}
          onChange={(v) => set("local_guardian_relationship", v)}
          maxLength={255}
          error={errors.local_guardian_relationship}
          placeholder="e.g. Uncle"
        />
        <Field
          id="local_guardian_contact"
          label="Contact"
          value={form.local_guardian_contact ?? ""}
          onChange={(v) => set("local_guardian_contact", v)}
        />
      </SectionCard>

      {/* ── 8. Remarks ── */}
      <Card className="p-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="remarks"
            className="text-xs font-medium text-slate-700"
          >
            Additional Notes
          </label>
          <textarea
            id="remarks"
            rows={3}
            value={form.remarks ?? ""}
            onChange={(e) => set("remarks", e.target.value)}
            placeholder="Any additional remarks about the student…"
            className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
          />
        </div>
      </Card>

      {/* Bottom action bar */}
      <div className={`${styles.actions} pb-4`}>{actionButtons}</div>
    </form>
  );
}
