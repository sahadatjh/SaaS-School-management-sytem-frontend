"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Pencil, RefreshCw } from "lucide-react";
import { StudentAdmissionSetup } from "@/components/students/student-admission-setup";
import StudentForm, { EMPTY_STUDENT_PAYLOAD } from "@/components/students/student-form";
import { usePortal } from "@/components/portal-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import type { StudentPayload, StudentPhotoField, StudentPhotoFiles } from "@/lib/contracts";
import { portalApi } from "@/lib/portal-api";
import {
  admissionSetupErrors,
  applyAdmissionSetup,
  clearAdmissionSetup,
  EMPTY_ADMISSION_OPTIONS,
  EMPTY_ADMISSION_SETUP,
  readAdmissionSetup,
  saveAdmissionSetup,
  type AdmissionOptions,
  type AdmissionSetup,
  type AdmissionSetupErrors,
} from "@/lib/student-admission-setup";

type AcademicOption = {
  institution_id: string;
  is_active: boolean;
};

function activeInstitutionOptions<T extends AcademicOption>(
  rows: T[],
  institutionId: string,
): T[] {
  return rows.filter(
    (row) => row.institution_id === institutionId && row.is_active,
  );
}

async function loadClassOptions(
  institutionId: string,
  classId: string,
): Promise<Pick<AdmissionOptions, "groups" | "sections">> {
  if (!classId) return { groups: [], sections: [] };
  const params = new URLSearchParams({ limit: "100", class_id: classId });
  const [groups, sections] = await Promise.all([
    portalApi.groups.list(params),
    portalApi.sections.list(params),
  ]);
  return {
    groups: activeInstitutionOptions(groups, institutionId).filter(
      (item) => item.class_id === classId,
    ),
    sections: activeInstitutionOptions(sections, institutionId).filter(
      (item) => item.class_id === classId,
    ),
  };
}

function restoreDraft(draftStorageKey: string): StudentPayload {
  try {
    const draft = localStorage.getItem(draftStorageKey);
    if (!draft) return EMPTY_STUDENT_PAYLOAD;
    const parsed = JSON.parse(draft) as StudentPayload;
    // Legacy drafts must not reintroduce retired or hidden academic fields.
    Reflect.deleteProperty(parsed, "parents_sms_number");
    return {
      ...EMPTY_STUDENT_PAYLOAD,
      ...parsed,
      enrollment: {
        ...EMPTY_STUDENT_PAYLOAD.enrollment,
        ...parsed.enrollment,
        department_id: undefined,
        group_id: undefined,
        section_id: undefined,
      },
    };
  } catch {
    return EMPTY_STUDENT_PAYLOAD;
  }
}

function resolvedName(rows: Array<{ id: string; name: string }>, id: string) {
  return rows.find((row) => row.id === id)?.name ?? "—";
}

function setupSummary(setup: AdmissionSetup, options: AdmissionOptions) {
  const gender =
    { male: "Male", female: "Female", other: "Other" }[setup.gender] ?? "—";
  return [
    `Academic Year: ${resolvedName(options.academicYears, setup.academic_year_id)}`,
    `Medium: ${resolvedName(options.mediums, setup.medium_id)}`,
    `Shift: ${resolvedName(options.shifts, setup.shift_id)}`,
    `Class: ${resolvedName(options.classes, setup.class_id)}`,
    `Group: ${resolvedName(options.groups, setup.group_id)}`,
    `Section: ${resolvedName(options.sections, setup.section_id)}`,
    `Gender: ${gender}`,
    `Nationality: ${setup.nationality || "—"}`,
  ].join(" · ");
}

export default function NewStudentPage() {
  const { profile } = usePortal();
  if (!profile) return null;
  return (
    <NewStudentFormPage
      key={profile.institution.id}
      institutionId={profile.institution.id}
      storagePrefix={`edu_student_form_${profile.institution.id}_${profile.user.id}`}
    />
  );
}

function NewStudentFormPage({
  institutionId,
  storagePrefix,
}: {
  institutionId: string;
  storagePrefix: string;
}) {
  const router = useRouter();
  const draftStorageKey = `${storagePrefix}_draft`;
  const legacyAcademicStorageKey = `${storagePrefix}_academic`;
  const dependencyRequest = useRef(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [options, setOptions] = useState<AdmissionOptions>(
    EMPTY_ADMISSION_OPTIONS,
  );
  const [setup, setSetup] = useState<AdmissionSetup>({
    ...EMPTY_ADMISSION_SETUP,
  });
  const [setupErrors, setSetupErrors] = useState<AdmissionSetupErrors>({});
  const [confirmedSetup, setConfirmedSetup] = useState<AdmissionSetup | null>(
    null,
  );
  const [dependentOptionsLoading, setDependentOptionsLoading] = useState(false);
  const [dependentOptionsError, setDependentOptionsError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    dependencyRequest.current += 1;

    async function load() {
      const params = new URLSearchParams({ limit: "100" });
      try {
        const [academicYears, mediums, shifts, classes] = await Promise.all([
          portalApi.academicYears.list(params),
          portalApi.mediums.list(params),
          portalApi.shifts.list(params),
          portalApi.classes.list(params),
        ]);
        if (cancelled) return;

        const baseOptions: AdmissionOptions = {
          academicYears: activeInstitutionOptions(academicYears, institutionId),
          mediums: activeInstitutionOptions(mediums, institutionId),
          shifts: activeInstitutionOptions(shifts, institutionId),
          classes: activeInstitutionOptions(classes, institutionId),
          groups: [],
          sections: [],
        };
        const saved = readAdmissionSetup(institutionId);
        const dependent = saved?.class_id
          ? await loadClassOptions(institutionId, saved.class_id)
          : { groups: [], sections: [] };
        if (cancelled) return;

        const hydratedOptions = { ...baseOptions, ...dependent };
        if (
          saved &&
          Object.keys(
            admissionSetupErrors(saved, hydratedOptions, institutionId),
          ).length === 0
        ) {
          setOptions(hydratedOptions);
          setSetup(saved);
          setConfirmedSetup(saved);
        } else {
          if (saved) clearAdmissionSetup(institutionId);
          setOptions(baseOptions);
          setSetup({ ...EMPTY_ADMISSION_SETUP });
          setConfirmedSetup(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load the academic setup options.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [institutionId, reloadToken]);

  async function changeClass(classId: string) {
    const request = ++dependencyRequest.current;
    setSetup((current) => ({
      ...current,
      class_id: classId,
      group_id: "",
      section_id: "",
    }));
    setOptions((current) => ({ ...current, groups: [], sections: [] }));
    setDependentOptionsError(undefined);
    setSetupErrors((current) => {
      const next = { ...current };
      delete next.class_id;
      delete next.group_id;
      delete next.section_id;
      return next;
    });
    if (!classId) return;

    setDependentOptionsLoading(true);
    try {
      const dependent = await loadClassOptions(institutionId, classId);
      if (dependencyRequest.current !== request) return;
      setOptions((current) => ({ ...current, ...dependent }));
    } catch {
      if (dependencyRequest.current !== request) return;
      setDependentOptionsError(
        "Groups and sections could not be loaded. You can continue without them.",
      );
    } finally {
      if (dependencyRequest.current === request) {
        setDependentOptionsLoading(false);
      }
    }
  }

  function changeSetup(field: keyof AdmissionSetup, value: string) {
    if (field === "class_id") {
      void changeClass(value);
      return;
    }
    setSetup((current) => ({ ...current, [field]: value }));
    setSetupErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function confirmSetup() {
    const errors = admissionSetupErrors(setup, options, institutionId);
    setSetupErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const confirmed = { ...setup };
    if (!saveAdmissionSetup(institutionId, confirmed)) {
      toast.error(
        "The setup will work for this admission, but the browser could not remember it.",
      );
    }
    setConfirmedSetup(confirmed);
  }

  const initialData = useMemo(
    () =>
      confirmedSetup
        ? applyAdmissionSetup(restoreDraft(draftStorageKey), confirmedSetup)
        : EMPTY_STUDENT_PAYLOAD,
    [confirmedSetup, draftStorageKey],
  );
  const resetData = useMemo(
    () =>
      confirmedSetup
        ? applyAdmissionSetup(EMPTY_STUDENT_PAYLOAD, confirmedSetup)
        : EMPTY_STUDENT_PAYLOAD,
    [confirmedSetup],
  );

  async function handleCreate(
    payload: StudentPayload,
    action: "save" | "save-and-add",
    photos: StudentPhotoFiles,
    removedPhotos: StudentPhotoField[],
  ) {
    if (!confirmedSetup) throw new Error("Admission setup is required.");
    const admissionPayload = applyAdmissionSetup(payload, confirmedSetup);
    await portalApi.students.create(admissionPayload, photos, removedPhotos);
    try {
      localStorage.removeItem(draftStorageKey);
      localStorage.removeItem(legacyAcademicStorageKey);
    } catch {
      // A successful admission does not depend on browser storage cleanup.
    }
    if (action === "save-and-add") {
      toast.success("Student admitted successfully. Add another one.");
    } else {
      toast.success("Student admitted successfully.");
      router.push("/academic/students");
    }
  }

  function handleReset() {
    try {
      localStorage.removeItem(draftStorageKey);
      localStorage.removeItem(legacyAcademicStorageKey);
      localStorage.removeItem("edu_last_academic_selection");
    } catch {
      // The visible form still resets if storage is unavailable.
    }
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-4 p-2 sm:p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href="/academic/students">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-base font-bold text-slate-900">Add New Student</h1> 
      </div>

      {loading ? (
        <Card className="flex min-h-36 items-center justify-center gap-2 p-6 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Loading admission setup…
        </Card>
      ) : loadError ? (
        <Card className="p-5">
          <p role="alert" className="text-sm text-rose-600">
            {loadError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => {
              setLoading(true);
              setLoadError(undefined);
              setSetupErrors({});
              setDependentOptionsError(undefined);
              setReloadToken((current) => current + 1);
            }}
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </Card>
      ) : !confirmedSetup ? (
        <StudentAdmissionSetup
          value={setup}
          options={options}
          errors={setupErrors}
          dependentOptionsLoading={dependentOptionsLoading}
          dependentOptionsError={dependentOptionsError}
          nextDisabled={dependentOptionsLoading}
          onChange={changeSetup}
          onSubmit={confirmSetup}
        />
      ) : (
        <>
          <Card className="flex min-w-0 items-center gap-3 px-4 py-3">
            <p className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-slate-600">
              {setupSummary(confirmedSetup, options)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setConfirmedSetup(null)}
            >
              <Pencil className="size-3.5" />
              Change setup
            </Button>
          </Card>

          <StudentForm
            initialData={initialData}
            resetData={resetData}
            onSubmit={handleCreate}
            showSaveAndAdd
            draftStorageKey={draftStorageKey}
            onReset={handleReset}
            submitLabel="Save Student"
            showAcademicInformation={false}
            lockEnrollmentDetails={false}
          />
        </>
      )}
    </div>
  );
}
