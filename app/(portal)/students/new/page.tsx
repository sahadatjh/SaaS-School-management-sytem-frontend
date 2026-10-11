"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type {
  AcademicYear,
  Class,
  Shift,
  Section,
  Group,
  Department,
  Medium,
  CreateStudentPayload,
  StudentGender,
  StudentStatus,
} from "@/lib/contracts";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "student_add_step1";

const GENDER_OPTIONS: { value: StudentGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const RELIGION_OPTIONS = [
  "Islam",
  "Hinduism",
  "Christianity",
  "Buddhism",
  "Other",
];

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "applicant", label: "Applicant" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
  { value: "graduated", label: "Graduated" },
  { value: "withdrawn", label: "Withdrawn" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Step1Data = {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  session: string;
  shift_id: string;
  medium_id: string;
  gender: string;
  religion: string;
  nationality: string;
  group_id: string;
  department_id: string;
  status: string;
};

type ImageField = {
  file: File | null;
  preview: string | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function readFromStorage(): Step1Data | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Step1Data;
  } catch {
    return null;
  }
}

function saveToStorage(data: Step1Data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/*  Select component (simple)                                          */
/* ------------------------------------------------------------------ */
function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="w-[300px] shrink-0">
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Text input component                                               */
/* ------------------------------------------------------------------ */
function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="w-[300px] shrink-0">
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 border-slate-200 bg-slate-50/70 text-xs transition-colors focus:bg-white"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image upload component                                             */
/* ------------------------------------------------------------------ */
function ImageUpload({
  label,
  image,
  onSelect,
  onRemove,
}: {
  label: string;
  image: ImageField;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  };

  return (
    <div className="w-[300px] shrink-0">
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative flex h-[180px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 transition-colors hover:border-orange-300 hover:bg-orange-50/30">
        {image.preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.preview}
              alt={label}
              className="h-full w-full rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <label className="cursor-pointer rounded-md bg-white/90 p-1.5 text-slate-600 shadow-sm hover:bg-white">
                <Upload className="size-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-md bg-white/90 p-1.5 text-rose-500 shadow-sm hover:bg-white"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 p-4">
            <ImagePlus className="size-8 text-slate-300" />
            <span className="text-xs text-slate-400">Click to upload</span>
            <span className="text-[10px] text-slate-300">JPG, PNG (max 2MB)</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */
export default function AddStudentPage() {
  // Academic data for dropdowns
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);

  // Step state — check localStorage on init
  const [currentStep, setCurrentStep] = useState<1 | 2>(() => {
    if (typeof window === "undefined") return 1;
    return readFromStorage() ? 2 : 1;
  });

  // Step 1 data
  const [step1, setStep1] = useState<Step1Data>(() => {
    const cached = typeof window !== "undefined" ? readFromStorage() : null;
    return (
      cached || {
        academic_year_id: "",
        class_id: "",
        section_id: "",
        session: "",
        shift_id: "",
        medium_id: "",
        gender: "male",
        religion: "Islam",
        nationality: "Bangladeshi",
        group_id: "",
        department_id: "",
        status: "active",
      }
    );
  });

  // Step 2 form fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState(() => step1.gender || "male");
  const [nationality, setNationality] = useState(
    () => step1.nationality || "Bangladeshi",
  );
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");

  // Previous school
  const [prevSchoolName, setPrevSchoolName] = useState("");
  const [prevClass, setPrevClass] = useState("");
  const [prevSection, setPrevSection] = useState("");
  const [prevRoll, setPrevRoll] = useState("");
  const [prevGroup, setPrevGroup] = useState("");
  const [prevSession, setPrevSession] = useState("");
  const [tcNumber, setTcNumber] = useState("");

  // Address
  const [presentVillage, setPresentVillage] = useState("");
  const [presentThana, setPresentThana] = useState("");
  const [presentDistrict, setPresentDistrict] = useState("");
  const [presentDivision, setPresentDivision] = useState("");
  const [presentPostCode, setPresentPostCode] = useState("");
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [permanentVillage, setPermanentVillage] = useState("");
  const [permanentThana, setPermanentThana] = useState("");
  const [permanentDistrict, setPermanentDistrict] = useState("");
  const [permanentDivision, setPermanentDivision] = useState("");
  const [permanentPostCode, setPermanentPostCode] = useState("");

  // Contact
  const [primarySms, setPrimarySms] = useState("");
  const [secondarySms, setSecondarySms] = useState("");
  const [parentsSms, setParentsSms] = useState("");

  // Father info
  const [fatherName, setFatherName] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherOccupationDetails, setFatherOccupationDetails] = useState("");
  const [fatherMobile, setFatherMobile] = useState("");
  const [fatherNid, setFatherNid] = useState("");
  const [fatherIncome, setFatherIncome] = useState("");

  // Mother info
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [motherOccupationDetails, setMotherOccupationDetails] = useState("");
  const [motherMobile, setMotherMobile] = useState("");
  const [motherNid, setMotherNid] = useState("");
  const [motherIncome, setMotherIncome] = useState("");

  // Guardian info
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianContact, setGuardianContact] = useState("");

  // Remarks
  const [remarks, setRemarks] = useState("");

  // Images
  const [studentImage, setStudentImage] = useState<ImageField>({
    file: null,
    preview: null,
  });
  const [fatherImage, setFatherImage] = useState<ImageField>({
    file: null,
    preview: null,
  });
  const [motherImage, setMotherImage] = useState<ImageField>({
    file: null,
    preview: null,
  });

  const [submitting, setSubmitting] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [y, c, sh, d, m] = await Promise.all([
          portalApi.academicYears.list(),
          portalApi.classes.list(),
          portalApi.shifts.list(),
          portalApi.departments.list(),
          portalApi.mediums.list(),
        ]);
        setYears(y.filter((i) => i.is_active));
        setClasses(c.filter((i) => i.is_active));
        setShifts(sh.filter((i) => i.is_active));
        setDepartments(d.filter((i) => i.is_active));
        setMediums(m.filter((i) => i.is_active));
      } catch {
        toast.error("Failed to load form data.");
      }
    };
    void loadData();
  }, []);

  // Dynamic fetch for Sections and Groups based on Class
  const [isClassDependentLoading, setIsClassDependentLoading] = useState(false);

  useEffect(() => {
    if (!step1.class_id) {
      setTimeout(() => {
        setSections([]);
        setGroups([]);
      }, 0);
      return;
    }

    const loadDependentData = async () => {
      setIsClassDependentLoading(true);
      try {
        const params = new URLSearchParams({ class_id: step1.class_id });
        const [sec, grp] = await Promise.all([
          portalApi.sections.list(params),
          portalApi.groups.list(params),
        ]);
        setSections(sec.filter((s) => s.is_active));
        setGroups(grp.filter((g) => g.is_active));
      } catch {
        toast.error("Failed to load sections and groups for the selected class.");
      } finally {
        setIsClassDependentLoading(false);
      }
    };
    void loadDependentData();
  }, [step1.class_id]);

  // Lookup helpers for display
  const lookupName = useCallback(
    (list: { id: string; name: string }[], id: string) =>
      list.find((item) => item.id === id)?.name || "—",
    [],
  );

  // Image handlers
  const handleImageSelect = (
    setter: React.Dispatch<React.SetStateAction<ImageField>>,
  ) => {
    return (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
  };

  const handleImageRemove = (
    setter: React.Dispatch<React.SetStateAction<ImageField>>,
  ) => {
    return () => {
      setter({ file: null, preview: null });
    };
  };

  // Step 1 update helper
  const updateStep1 = (key: keyof Step1Data, value: string) => {
    setStep1((prev) => {
      const next = { ...prev, [key]: value };
      // Reset dependent fields when class changes
      if (key === "class_id") {
        next.group_id = "";
        next.section_id = "";
      }
      return next;
    });
  };

  // Go to next step
  const handleGoToNext = () => {
    saveToStorage(step1);
    setGender(step1.gender || "male");
    setNationality(step1.nationality || "Bangladeshi");
    setCurrentStep(2);
  };

  // Go back to step 1
  const handleGoBack = () => {
    setCurrentStep(1);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: CreateStudentPayload = {
        enrollment: {
          academic_year_id: step1.academic_year_id,
          class_id: step1.class_id,
          shift_id: step1.shift_id,
          medium_id: step1.medium_id,
          section_id: step1.section_id || undefined,
          group_id: step1.group_id || undefined,
          department_id: step1.department_id || undefined,
          roll_no: rollNo ? Number(rollNo) : undefined,
          registration_no: registrationNo || undefined,
        },
        name: name || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: (gender as StudentGender) || (step1.gender as StudentGender) || undefined,
        blood_group: bloodGroup || undefined,
        nationality: nationality || step1.nationality || undefined,
        religion: step1.religion || undefined,
        admission_date: admissionDate || undefined,
        status: (step1.status as StudentStatus) || "active",

        prev_school_name: prevSchoolName || undefined,
        prev_class: prevClass || undefined,
        prev_section: prevSection || undefined,
        prev_roll: prevRoll || undefined,
        prev_group: prevGroup || undefined,
        prev_session: prevSession || undefined,
        tc_number: tcNumber || undefined,

        present_village: presentVillage || undefined,
        present_thana: presentThana || undefined,
        present_district: presentDistrict || undefined,
        present_division: presentDivision || undefined,
        present_post_code: presentPostCode || undefined,
        is_same_address: isSameAddress,
        permanent_village: isSameAddress ? presentVillage : permanentVillage || undefined,
        permanent_thana: isSameAddress ? presentThana : permanentThana || undefined,
        permanent_district: isSameAddress ? presentDistrict : permanentDistrict || undefined,
        permanent_division: isSameAddress ? presentDivision : permanentDivision || undefined,
        permanent_post_code: isSameAddress ? presentPostCode : permanentPostCode || undefined,

        primary_sms_number: primarySms || undefined,
        secondary_sms_number: secondarySms || undefined,
        parents_sms_number: parentsSms || undefined,

        father_name: fatherName || undefined,
        father_occupation: fatherOccupation || undefined,
        father_occupation_details: fatherOccupationDetails || undefined,
        father_mobile: fatherMobile || undefined,
        father_nid: fatherNid || undefined,
        father_annual_income: fatherIncome ? Number(fatherIncome) : undefined,

        mother_name: motherName || undefined,
        mother_occupation: motherOccupation || undefined,
        mother_occupation_details: motherOccupationDetails || undefined,
        mother_mobile: motherMobile || undefined,
        mother_nid: motherNid || undefined,
        mother_annual_income: motherIncome ? Number(motherIncome) : undefined,

        local_guardian_name: guardianName || undefined,
        local_guardian_relationship: guardianRelationship || undefined,
        local_guardian_contact: guardianContact || undefined,

        remarks: remarks || undefined,
      };

      const files: {
        student_photo?: File;
        father_photo?: File;
        mother_photo?: File;
      } = {};
      if (studentImage.file) files.student_photo = studentImage.file;
      if (fatherImage.file) files.father_photo = fatherImage.file;
      if (motherImage.file) files.mother_photo = motherImage.file;

      await portalApi.students.create(payload, files);
      toast.success("Student created successfully!");

      // Reset form (but keep step 1 data in localStorage for next student)
      resetStep2Form();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Failed to create student.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetStep2Form = () => {
    setName("");
    setGender(step1.gender || "male");
    setNationality(step1.nationality || "Bangladeshi");
    setDateOfBirth("");
    setBloodGroup("");
    setAdmissionDate("");
    setRollNo("");
    setRegistrationNo("");
    setPrevSchoolName("");
    setPrevClass("");
    setPrevSection("");
    setPrevRoll("");
    setPrevGroup("");
    setPrevSession("");
    setTcNumber("");
    setPresentVillage("");
    setPresentThana("");
    setPresentDistrict("");
    setPresentDivision("");
    setPresentPostCode("");
    setIsSameAddress(false);
    setPermanentVillage("");
    setPermanentThana("");
    setPermanentDistrict("");
    setPermanentDivision("");
    setPermanentPostCode("");
    setPrimarySms("");
    setSecondarySms("");
    setParentsSms("");
    setFatherName("");
    setFatherOccupation("");
    setFatherOccupationDetails("");
    setFatherMobile("");
    setFatherNid("");
    setFatherIncome("");
    setMotherName("");
    setMotherOccupation("");
    setMotherOccupationDetails("");
    setMotherMobile("");
    setMotherNid("");
    setMotherIncome("");
    setGuardianName("");
    setGuardianRelationship("");
    setGuardianContact("");
    setRemarks("");
    setStudentImage({ file: null, preview: null });
    setFatherImage({ file: null, preview: null });
    setMotherImage({ file: null, preview: null });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <nav
        aria-label="Breadcrumb"
        className="mb-2.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        <span>Students</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">Add Student</span>
      </nav>

      {/* ============================================================= */}
      {/*  STEP 1: Common / repeatable data                              */}
      {/* ============================================================= */}
      {currentStep === 1 && (
        <Card className="border-slate-200/90 shadow-xs">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h1 className="text-base font-bold text-slate-900">
              Step 1 — Common Settings
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              These values will be saved and reused for adding multiple students
              quickly.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 px-5 py-5">
            <FormSelect
              label="Academic Year"
              value={step1.academic_year_id}
              onChange={(v) => updateStep1("academic_year_id", v)}
              options={years.map((y) => ({ value: y.id, label: y.name }))}
            />
            <FormInput
              label="Session"
              value={step1.session}
              onChange={(v) => updateStep1("session", v)}
              placeholder="e.g. 2026"
            />
            <FormSelect
              label="Medium/Version"
              value={step1.medium_id}
              onChange={(v) => updateStep1("medium_id", v)}
              options={mediums.map((m) => ({ value: m.id, label: m.name }))}
            />
            <FormSelect
              label="Shift"
              value={step1.shift_id}
              onChange={(v) => updateStep1("shift_id", v)}
              options={shifts.map((s) => ({ value: s.id, label: s.name }))}
            />
            <FormSelect
              label="Class"
              value={step1.class_id}
              onChange={(v) => updateStep1("class_id", v)}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FormSelect
              label="Section"
              value={step1.section_id}
              onChange={(v) => updateStep1("section_id", v)}
              disabled={!step1.class_id || isClassDependentLoading}
              options={sections.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
            <FormSelect
              label="Group"
              value={step1.group_id}
              onChange={(v) => updateStep1("group_id", v)}
              disabled={!step1.class_id || isClassDependentLoading}
              options={groups.map((g) => ({
                value: g.id,
                label: g.name,
              }))}
            />
            <FormSelect
              label="Gender"
              value={step1.gender}
              onChange={(v) => updateStep1("gender", v)}
              options={GENDER_OPTIONS}
            />
            <FormSelect
              label="Religion"
              value={step1.religion}
              onChange={(v) => updateStep1("religion", v)}
              options={RELIGION_OPTIONS.map((r) => ({ value: r, label: r }))}
            />
            <FormInput
              label="Nationality"
              value={step1.nationality}
              onChange={(v) => updateStep1("nationality", v)}
              placeholder="Bangladeshi"
            />
            <FormSelect
              label="Department"
              value={step1.department_id}
              onChange={(v) => updateStep1("department_id", v)}
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
            <FormSelect
              label="Status"
              value={step1.status}
              onChange={(v) => updateStep1("status", v)}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <Button
              type="button"
              onClick={handleGoToNext}
              disabled={!step1.academic_year_id || !step1.class_id || !step1.shift_id || !step1.medium_id}
              className="bg-orange-600 px-5 text-sm font-semibold hover:bg-orange-700"
            >
              Go to Next
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ============================================================= */}
      {/*  STEP 2: Full form                                             */}
      {/* ============================================================= */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit}>
          {/* Context summary row */}
          <Card className="mb-4 border-orange-200/80 bg-orange-50/40 shadow-xs">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500">Year:</span>
                <span className="font-bold text-slate-800">
                  {lookupName(years, step1.academic_year_id)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500">Class:</span>
                <span className="font-bold text-slate-800">
                  {lookupName(classes, step1.class_id)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500">Shift:</span>
                <span className="font-bold text-slate-800">
                  {lookupName(shifts, step1.shift_id)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500">Medium:</span>
                <span className="font-bold text-slate-800">
                  {lookupName(mediums, step1.medium_id)}
                </span>
              </div>
              {step1.section_id && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Section:</span>
                  <span className="font-bold text-slate-800">
                    {lookupName(sections, step1.section_id)}
                  </span>
                </div>
              )}
              {step1.group_id && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Group:</span>
                  <span className="font-bold text-slate-800">
                    {lookupName(groups, step1.group_id)}
                  </span>
                </div>
              )}
              {gender && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Gender:</span>
                  <span className="font-bold capitalize text-slate-800">
                    {gender}
                  </span>
                </div>
              )}
              {step1.status && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="font-bold capitalize text-slate-800">
                    {step1.status}
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="h-8 text-xs font-semibold text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                >
                  <ArrowLeft className="mr-1 size-3.5" />
                  Change
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="h-8 bg-orange-600 px-4 text-xs font-semibold hover:bg-orange-700"
                >
                  {submitting ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 size-3.5" />
                  )}
                  {submitting ? "Saving..." : "Save Student"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200/90 shadow-xs">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <h1 className="text-base font-bold text-slate-900">
                Step 2 — Student Details
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Fill in the student&apos;s personal, family, and address
                information.
              </p>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Personal Information */}
              <fieldset>
                {/* <legend className="mb-3 text-sm font-bold text-slate-800">
                  Personal Information
                </legend> */}
                <div className="flex flex-wrap gap-3">
                  <FormInput
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    placeholder="Student full name"
                  />
                  <FormSelect
                    label="Gender"
                    value={gender}
                    onChange={setGender}
                    options={GENDER_OPTIONS}
                  />
                  <FormInput
                    label="Date of Birth"
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                    type="date"
                  />
                  <FormSelect
                    label="Blood Group"
                    value={bloodGroup}
                    onChange={setBloodGroup}
                    options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
                  />
                  <FormInput
                    label="Nationality"
                    value={nationality}
                    onChange={setNationality}
                    placeholder="Bangladeshi"
                  />
                  <FormInput
                    label="Admission Date"
                    value={admissionDate}
                    onChange={setAdmissionDate}
                    type="date"
                  />
                  <FormInput
                    label="Roll No"
                    value={rollNo}
                    onChange={setRollNo}
                    type="number"
                    placeholder="Roll number"
                  />
                  <FormInput
                    label="Registration No"
                    value={registrationNo}
                    onChange={setRegistrationNo}
                    placeholder="REG-12345"
                  />
                  <FormInput
                    label="Notification Number"
                    value={primarySms}
                    onChange={setPrimarySms}
                    placeholder="01711223344"
                  />
                  <FormInput
                    label="Secondary SMS Number"
                    value={secondarySms}
                    onChange={setSecondarySms}
                    placeholder="01811223344"
                  />
                  <FormInput
                    label="Father Name"
                    value={fatherName}
                    onChange={setFatherName}
                    placeholder="Father's name"
                  />
                  <FormInput
                    label="Father Occupation"
                    value={fatherOccupation}
                    onChange={setFatherOccupation}
                    placeholder="Business"
                  />
                  <FormInput
                    label="Father Mobile"
                    value={fatherMobile}
                    onChange={setFatherMobile}
                    placeholder="01711223344"
                  />
                  <FormInput
                    label="Father NID"
                    value={fatherNid}
                    onChange={setFatherNid}
                    placeholder="NID number"
                  />
                  <FormInput
                    label="Father Annual Income"
                    value={fatherIncome}
                    onChange={setFatherIncome}
                    type="number"
                    placeholder="600000"
                  />
                  <FormInput
                    label="Mother Name"
                    value={motherName}
                    onChange={setMotherName}
                    placeholder="Mother's name"
                  />
                  <FormInput
                    label="Mother Occupation"
                    value={motherOccupation}
                    onChange={setMotherOccupation}
                    placeholder="Teacher"
                  />
                  <FormInput
                    label="Mother Mobile"
                    value={motherMobile}
                    onChange={setMotherMobile}
                    placeholder="01811223344"
                  />
                  <FormInput
                    label="Mother NID"
                    value={motherNid}
                    onChange={setMotherNid}
                    placeholder="NID number"
                  />
                  <FormInput
                    label="Mother Annual Income"
                    value={motherIncome}
                    onChange={setMotherIncome}
                    type="number"
                    placeholder="480000"
                  />
                  <FormInput
                    label="Local Guardian Name"
                    value={guardianName}
                    onChange={setGuardianName}
                    placeholder="Guardian name"
                  />
                  <FormInput
                    label="Local Guardian Relationship"
                    value={guardianRelationship}
                    onChange={setGuardianRelationship}
                    placeholder="Uncle"
                  />
                  <FormInput
                    label="Local Guardian Contact"
                    value={guardianContact}
                    onChange={setGuardianContact}
                    placeholder="01911223344"
                  />

                </div>

              </fieldset>

              {/* Present Address */}
              <fieldset>
                <div className="mb-3 flex items-center gap-4">
                  <h2 className="text-sm font-bold text-slate-800">
                    Present Address
                  </h2>
                  <label
                    htmlFor="same-address"
                    className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-800 select-none"
                  >
                    <input
                      type="checkbox"
                      id="same-address"
                      checked={isSameAddress}
                      onChange={(e) => setIsSameAddress(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Permanent address is same as present address</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <FormInput
                    label="Village/House"
                    value={presentVillage}
                    onChange={setPresentVillage}
                    placeholder="House/Village"
                  />
                  <FormInput
                    label="Thana"
                    value={presentThana}
                    onChange={setPresentThana}
                    placeholder="Thana"
                  />
                  <FormInput
                    label="District"
                    value={presentDistrict}
                    onChange={setPresentDistrict}
                    placeholder="District"
                  />
                  <FormInput
                    label="Division"
                    value={presentDivision}
                    onChange={setPresentDivision}
                    placeholder="Division"
                  />
                  <FormInput
                    label="Post Code"
                    value={presentPostCode}
                    onChange={setPresentPostCode}
                    placeholder="1216"
                  />
                </div>
              </fieldset>

              {/* Permanent Address */}
              {!isSameAddress && (
                <fieldset>
                  <legend className="mb-3 text-sm font-bold text-slate-800">
                    Permanent Address
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    <FormInput
                      label="Village/House"
                      value={permanentVillage}
                      onChange={setPermanentVillage}
                      placeholder="House/Village"
                    />
                    <FormInput
                      label="Thana"
                      value={permanentThana}
                      onChange={setPermanentThana}
                      placeholder="Thana"
                    />
                    <FormInput
                      label="District"
                      value={permanentDistrict}
                      onChange={setPermanentDistrict}
                      placeholder="District"
                    />
                    <FormInput
                      label="Division"
                      value={permanentDivision}
                      onChange={setPermanentDivision}
                      placeholder="Division"
                    />
                    <FormInput
                      label="Post Code"
                      value={permanentPostCode}
                      onChange={setPermanentPostCode}
                      placeholder="3410"
                    />
                  </div>
                </fieldset>
              )}


              {/* Previous School */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">
                  Previous School
                </legend>
                <div className="flex flex-wrap gap-3">
                  <FormInput
                    label="School Name"
                    value={prevSchoolName}
                    onChange={setPrevSchoolName}
                    placeholder="Previous school"
                  />
                  <FormInput
                    label="Class"
                    value={prevClass}
                    onChange={setPrevClass}
                    placeholder="Class 5"
                  />
                  <FormInput
                    label="Section"
                    value={prevSection}
                    onChange={setPrevSection}
                    placeholder="A"
                  />
                  <FormInput
                    label="Roll"
                    value={prevRoll}
                    onChange={setPrevRoll}
                    placeholder="12"
                  />
                  <FormInput
                    label="Group"
                    value={prevGroup}
                    onChange={setPrevGroup}
                    placeholder="Science"
                  />
                  <FormInput
                    label="Session"
                    value={prevSession}
                    onChange={setPrevSession}
                    placeholder="2025"
                  />
                  <FormInput
                    label="TC Number"
                    value={tcNumber}
                    onChange={setTcNumber}
                    placeholder="TC-2026-001"
                  />
                </div>
              </fieldset>

              {/* Remarks */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">
                  Remarks
                </legend>
                <div className="w-full">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Any additional notes..."
                    className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                </div>
              </fieldset>

              {/* Photo Uploads */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">
                  Photos
                </legend>
                <div className="flex flex-wrap gap-4">
                  <ImageUpload
                    label="Student Photo"
                    image={studentImage}
                    onSelect={handleImageSelect(setStudentImage)}
                    onRemove={handleImageRemove(setStudentImage)}
                  />
                  <ImageUpload
                    label="Father Photo"
                    image={fatherImage}
                    onSelect={handleImageSelect(setFatherImage)}
                    onRemove={handleImageRemove(setFatherImage)}
                  />
                  <ImageUpload
                    label="Mother Photo"
                    image={motherImage}
                    onSelect={handleImageSelect(setMotherImage)}
                    onRemove={handleImageRemove(setMotherImage)}
                  />
                </div>
              </fieldset>
            </div>
          </Card>
        </form >
      )
      }
    </div >
  );
}
