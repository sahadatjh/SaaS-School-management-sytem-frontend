"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Save, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type {
  AcademicYear, Class, Section, Shift, Group, Department, StudentPayload,
} from "@/lib/contracts";

// ── Helpers ────────────────────────────────────────────────────────────────
function Select({
  id, label, required, value, onChange, children, disabled,
}: {
  id: string; label: string; required?: boolean; value: string;
  onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        {children}
      </select>
    </div>
  );
}

function Field({
  id, label, required, type = "text", value, onChange, placeholder,
}: {
  id: string; label: string; required?: boolean; type?: string;
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </Card>
  );
}

// ── Initial form state ─────────────────────────────────────────────────────
const EMPTY: StudentPayload = {
  // Enrollment
  enrollment: {
    academic_year_id: "", class_id: "", section_id: "", shift_id: "",
    medium: "", roll_no: 0,
  },
  // Personal
  name_english: "", name_bangla: "", date_of_birth: "", gender: "",
  status: "active", blood_group: "", nationality: "", religion: "",
  admission_date: "", photo_url: "",
  // Previous school
  prev_school_name: "", prev_class: "", prev_section: "", prev_roll: "",
  prev_group: "", prev_session: "", tc_number: "",
  // Address
  present_village: "", present_thana: "", present_district: "",
  present_division: "", present_post_code: "",
  permanent_village: "", permanent_thana: "", permanent_district: "",
  permanent_division: "", permanent_post_code: "", is_same_address: false,
  // SMS
  primary_sms_number: "", secondary_sms_number: "", sms_recipients: [],
  parents_sms_number: "",
  // Father
  father_name_bangla: "", father_name_english: "", father_occupation: "",
  father_occupation_details: "", father_mobile: "", father_nid: "",
  father_annual_income: null,
  // Mother
  mother_name_bangla: "", mother_name_english: "", mother_occupation: "",
  mother_occupation_details: "", mother_mobile: "", mother_nid: "",
  mother_annual_income: null,
  // Guardian
  local_guardian_name: "", local_guardian_contact: "",
  remarks: "",
};

// ── Page ───────────────────────────────────────────────────────────────────
export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState<StudentPayload>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lookup data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Load setup data once
  useEffect(() => {
    const p = new URLSearchParams({ limit: "100" });
    Promise.all([
      portalApi.academicYears.list(p),
      portalApi.classes.list(p),
      portalApi.shifts.list(p),
      portalApi.departments.list(p),
    ]).then(([years, cls, sh, dep]) => {
      setAcademicYears(years ?? []);
      setClasses(cls ?? []);
      setShifts(sh ?? []);
      setDepartments(dep ?? []);
    });
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!form.enrollment.class_id) { setSections([]); setGroups([]); return; }
    const p = new URLSearchParams({ limit: "100", class_id: form.enrollment.class_id });
    portalApi.sections.list(p).then((r) => setSections(r ?? []));
    portalApi.groups.list(p).then((r) => setGroups(r ?? []));
  }, [form.enrollment.class_id]);

  function set(key: keyof StudentPayload, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setEnr(key: keyof StudentPayload["enrollment"], value: unknown) {
    setForm((prev) => ({ ...prev, enrollment: { ...prev.enrollment, [key]: value } }));
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
    if (!form.enrollment.academic_year_id) e.academic_year_id = "Required";
    if (!form.enrollment.class_id) e.class_id = "Required";
    if (!form.enrollment.section_id) e.section_id = "Required";
    if (!form.enrollment.shift_id) e.shift_id = "Required";
    if (!form.enrollment.medium) e.medium = "Required";
    if (!form.enrollment.roll_no) e.roll_no = "Required";
    if (!form.name_english.trim()) e.name_english = "Required";
    if (!form.date_of_birth) e.date_of_birth = "Required";
    if (!form.gender) e.gender = "Required";
    if (!form.present_village.trim()) e.present_village = "Required";
    if (!form.primary_sms_number.trim()) e.primary_sms_number = "Required";
    if (!form.parents_sms_number.trim()) e.parents_sms_number = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await portalApi.students.create(form);
      toast.success("Student admitted successfully.");
      router.push("/academic/students");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save student.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setErrors({});
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href="/academic/students">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-base font-bold text-slate-900">Add New Student</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset Form
          </Button>
          <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs" disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Student
          </Button>
        </div>
      </div>

      {/* ── 1. Academic Information ── */}
      <SectionCard title="Academic Information">
        <Select id="academic_year_id" label="Session / Year" required value={form.enrollment.academic_year_id} onChange={(v) => setEnr("academic_year_id", v)}>
          <option value="">Select…</option>
          {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </Select>
        <Select id="class_id" label="Class" required value={form.enrollment.class_id} onChange={(v) => { setEnr("class_id", v); setEnr("section_id", ""); }}>
          <option value="">Select…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select id="section_id" label="Section" required value={form.enrollment.section_id} onChange={(v) => setEnr("section_id", v)} disabled={!form.enrollment.class_id}>
          <option value="">Select…</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select id="shift_id" label="Shift" required value={form.enrollment.shift_id} onChange={(v) => setEnr("shift_id", v)}>
          <option value="">Select…</option>
          {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select id="medium" label="Medium" required value={form.enrollment.medium} onChange={(v) => setEnr("medium", v)}>
          <option value="">Select…</option>
          <option value="Bangla">Bangla</option>
          <option value="English">English</option>
        </Select>
        <Select id="group_id" label="Group" value={form.enrollment.group_id ?? ""} onChange={(v) => setEnr("group_id", v || undefined)} disabled={!groups.length}>
          <option value="">None</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
        <Select id="department_id" label="Department" value={form.enrollment.department_id ?? ""} onChange={(v) => setEnr("department_id", v || undefined)}>
          <option value="">None</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <div className="flex flex-col gap-1">
          <label htmlFor="roll_no" className="text-xs font-medium text-slate-700">
            Roll No<span className="ml-0.5 text-red-500">*</span>
          </label>
          <Input
            id="roll_no" type="number" min={1}
            value={form.enrollment.roll_no || ""}
            onChange={(e) => setEnr("roll_no", Number(e.target.value))}
            className={`h-8 text-xs ${errors.roll_no ? "border-red-400" : ""}`}
          />
        </div>
        <Field id="registration_no" label="Registration No" value={form.enrollment.registration_no ?? ""} onChange={(v) => setEnr("registration_no", v)} placeholder="Optional" />
        <Select id="status" label="Status" required value={form.status} onChange={(v) => set("status", v)}>
          <option value="active">Active</option>
          <option value="applicant">Applicant</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Field id="admission_date" label="Admission Date" type="date" value={form.admission_date ?? ""} onChange={(v) => set("admission_date", v)} />
      </SectionCard>

      {/* ── 2. Personal Information ── */}
      <SectionCard title="Personal Information">
        <Field id="name_english" label="Full Name (English)" required value={form.name_english} onChange={(v) => set("name_english", v)} placeholder="e.g. Rahim Uddin Ahmed" />
        <Field id="name_bangla" label="Full Name (Bangla)" value={form.name_bangla ?? ""} onChange={(v) => set("name_bangla", v)} placeholder="বাংলায় নাম" />
        <Field id="date_of_birth" label="Date of Birth" required type="date" value={form.date_of_birth} onChange={(v) => set("date_of_birth", v)} />
        <Select id="gender" label="Gender" required value={form.gender} onChange={(v) => set("gender", v)}>
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
        <Select id="blood_group" label="Blood Group" value={form.blood_group ?? ""} onChange={(v) => set("blood_group", v)}>
          <option value="">Select…</option>
          {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((bg) => <option key={bg}>{bg}</option>)}
        </Select>
        <Field id="nationality" label="Nationality" value={form.nationality ?? ""} onChange={(v) => set("nationality", v)} placeholder="Bangladeshi" />
        <Select id="religion" label="Religion" value={form.religion ?? ""} onChange={(v) => set("religion", v)}>
          <option value="">Select…</option>
          <option>Islam</option><option>Hinduism</option><option>Buddhism</option><option>Christianity</option><option>Other</option>
        </Select>
      </SectionCard>

      {/* ── 3. Previous School ── */}
      <SectionCard title="Previous School Details">
        <Field id="prev_school_name" label="School Name" value={form.prev_school_name ?? ""} onChange={(v) => set("prev_school_name", v)} />
        <Field id="prev_class" label="Class" value={form.prev_class ?? ""} onChange={(v) => set("prev_class", v)} />
        <Field id="prev_section" label="Section" value={form.prev_section ?? ""} onChange={(v) => set("prev_section", v)} />
        <Field id="prev_roll" label="Roll" value={form.prev_roll ?? ""} onChange={(v) => set("prev_roll", v)} />
        <Field id="prev_group" label="Group" value={form.prev_group ?? ""} onChange={(v) => set("prev_group", v)} />
        <Field id="prev_session" label="Session" value={form.prev_session ?? ""} onChange={(v) => set("prev_session", v)} />
        <Field id="tc_number" label="TC Number" value={form.tc_number ?? ""} onChange={(v) => set("tc_number", v)} />
      </SectionCard>

      {/* ── 4. Address ── */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Address Information</h2>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {/* Present */}
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-700">Present Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field id="present_village" label="Village / House / Road" required value={form.present_village} onChange={(v) => set("present_village", v)} />
              </div>
              <Field id="present_thana" label="Thana / Upazila" value={form.present_thana ?? ""} onChange={(v) => set("present_thana", v)} />
              <Field id="present_district" label="District" value={form.present_district ?? ""} onChange={(v) => set("present_district", v)} />
              <Field id="present_division" label="Division" value={form.present_division ?? ""} onChange={(v) => set("present_division", v)} />
              <Field id="present_post_code" label="Post Code" value={form.present_post_code ?? ""} onChange={(v) => set("present_post_code", v)} />
            </div>
          </div>
          {/* Permanent */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Permanent Address</p>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={form.is_same_address} onChange={(e) => handleSameAddress(e.target.checked)} className="h-3 w-3 rounded accent-slate-900" />
                Same as present
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field id="permanent_village" label="Village / House / Road" value={form.permanent_village ?? ""} onChange={(v) => set("permanent_village", v)} />
              </div>
              <Field id="permanent_thana" label="Thana / Upazila" value={form.permanent_thana ?? ""} onChange={(v) => set("permanent_thana", v)} />
              <Field id="permanent_district" label="District" value={form.permanent_district ?? ""} onChange={(v) => set("permanent_district", v)} />
              <Field id="permanent_division" label="Division" value={form.permanent_division ?? ""} onChange={(v) => set("permanent_division", v)} />
              <Field id="permanent_post_code" label="Post Code" value={form.permanent_post_code ?? ""} onChange={(v) => set("permanent_post_code", v)} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── 5. SMS & Notifications ── */}
      <SectionCard title="SMS & Notification Numbers">
        <Field id="primary_sms_number" label="Primary SMS Number" required value={form.primary_sms_number} onChange={(v) => set("primary_sms_number", v)} placeholder="01XXXXXXXXX" />
        <Field id="secondary_sms_number" label="Secondary SMS Number" value={form.secondary_sms_number ?? ""} onChange={(v) => set("secondary_sms_number", v)} placeholder="Optional" />
        <Field id="parents_sms_number" label="Parents SMS Number" required value={form.parents_sms_number} onChange={(v) => set("parents_sms_number", v)} placeholder="01XXXXXXXXX" />
      </SectionCard>

      {/* ── 6. Parents ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-blue-50 px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Father</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            <Field id="father_name_english" label="Name (English)" value={form.father_name_english ?? ""} onChange={(v) => set("father_name_english", v)} />
            <Field id="father_name_bangla" label="Name (Bangla)" value={form.father_name_bangla ?? ""} onChange={(v) => set("father_name_bangla", v)} />
            <Field id="father_occupation" label="Occupation" value={form.father_occupation ?? ""} onChange={(v) => set("father_occupation", v)} />
            <Field id="father_mobile" label="Mobile" value={form.father_mobile ?? ""} onChange={(v) => set("father_mobile", v)} />
            <Field id="father_nid" label="NID" value={form.father_nid ?? ""} onChange={(v) => set("father_nid", v)} />
            <div className="flex flex-col gap-1">
              <label htmlFor="father_annual_income" className="text-xs font-medium text-slate-700">Annual Income</label>
              <Input id="father_annual_income" type="number" min={0}
                value={form.father_annual_income ?? ""}
                onChange={(e) => set("father_annual_income", e.target.value ? Number(e.target.value) : undefined)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-pink-50 px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-pink-600">Mother</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            <Field id="mother_name_english" label="Name (English)" value={form.mother_name_english ?? ""} onChange={(v) => set("mother_name_english", v)} />
            <Field id="mother_name_bangla" label="Name (Bangla)" value={form.mother_name_bangla ?? ""} onChange={(v) => set("mother_name_bangla", v)} />
            <Field id="mother_occupation" label="Occupation" value={form.mother_occupation ?? ""} onChange={(v) => set("mother_occupation", v)} />
            <Field id="mother_mobile" label="Mobile" value={form.mother_mobile ?? ""} onChange={(v) => set("mother_mobile", v)} />
            <Field id="mother_nid" label="NID" value={form.mother_nid ?? ""} onChange={(v) => set("mother_nid", v)} />
            <div className="flex flex-col gap-1">
              <label htmlFor="mother_annual_income" className="text-xs font-medium text-slate-700">Annual Income</label>
              <Input id="mother_annual_income" type="number" min={0}
                value={form.mother_annual_income ?? ""}
                onChange={(e) => set("mother_annual_income", e.target.value ? Number(e.target.value) : undefined)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ── 7. Local Guardian ── */}
      <SectionCard title="Local Guardian (Optional)">
        <Field id="local_guardian_name" label="Name" value={form.local_guardian_name ?? ""} onChange={(v) => set("local_guardian_name", v)} />
        <Field id="local_guardian_contact" label="Contact" value={form.local_guardian_contact ?? ""} onChange={(v) => set("local_guardian_contact", v)} />
      </SectionCard>

      {/* ── 8. Remarks ── */}
      <Card className="p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="remarks" className="text-xs font-medium text-slate-700">Additional Notes</label>
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

      {/* Validation summary */}
      {Object.keys(errors).length > 0 && (
        <p className="text-xs text-red-600">
          Please fill in all required fields before saving.
        </p>
      )}

      {/* Bottom action bar */}
      <div className="flex justify-end gap-2 pb-4">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset Form
        </Button>
        <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs" disabled={submitting}>
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Student
        </Button>
      </div>
    </form>
  );
}
