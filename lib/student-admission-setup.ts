import type {
  AcademicYear,
  Class,
  Group,
  Medium,
  Section,
  Shift,
  StudentPayload,
} from "./contracts";

export type AdmissionSetup = {
  academic_year_id: string;
  medium_id: string;
  shift_id: string;
  class_id: string;
  group_id: string;
  section_id: string;
  gender: string;
  nationality: string;
};

export type AdmissionOptions = {
  academicYears: AcademicYear[];
  mediums: Medium[];
  shifts: Shift[];
  classes: Class[];
  groups: Group[];
  sections: Section[];
};

export type AdmissionSetupErrors = Partial<
  Record<keyof AdmissionSetup, string>
>;

export const EMPTY_ADMISSION_SETUP: AdmissionSetup = {
  academic_year_id: "",
  medium_id: "",
  shift_id: "",
  class_id: "",
  group_id: "",
  section_id: "",
  gender: "",
  nationality: "Bangladeshi",
};

export const EMPTY_ADMISSION_OPTIONS: AdmissionOptions = {
  academicYears: [],
  mediums: [],
  shifts: [],
  classes: [],
  groups: [],
  sections: [],
};

export function parseAdmissionSetup(value: unknown): AdmissionSetup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(EMPTY_ADMISSION_SETUP).some(
      (key) => typeof record[key] !== "string",
    )
  ) {
    return null;
  }
  if (!["", "male", "female", "other"].includes(record.gender as string)) {
    return null;
  }
  return Object.fromEntries(
    Object.keys(EMPTY_ADMISSION_SETUP).map((key) => [key, record[key]]),
  ) as AdmissionSetup;
}

export function admissionSetupErrors(
  setup: AdmissionSetup,
  options: AdmissionOptions,
  institutionId: string,
): AdmissionSetupErrors {
  const errors: AdmissionSetupErrors = {};
  const fields = [
    ["academic_year_id", options.academicYears, true],
    ["medium_id", options.mediums, true],
    ["shift_id", options.shifts, true],
    ["class_id", options.classes, true],
    ["group_id", options.groups, false],
    ["section_id", options.sections, false],
  ] as const;
  for (const [field, rows, required] of fields) {
    if (!setup[field]) {
      if (required) errors[field] = "This field is required.";
      continue;
    }
    if (
      !rows.some(
        (row) =>
          row.id === setup[field] &&
          row.institution_id === institutionId &&
          row.is_active &&
          (!("class_id" in row) || row.class_id === setup.class_id),
      )
    ) {
      errors[field] = "Select an available option.";
    }
  }
  return errors;
}

function storageKey(institutionId: string) {
  return `student-admission-setup:v1:${institutionId}`;
}

export function readAdmissionSetup(
  institutionId: string,
): AdmissionSetup | null {
  const key = storageKey(institutionId);
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const parsed = parseAdmissionSetup(JSON.parse(stored));
    if (!parsed) localStorage.removeItem(key);
    return parsed;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage is optional.
    }
    return null;
  }
}

export function saveAdmissionSetup(
  institutionId: string,
  setup: AdmissionSetup,
): boolean {
  try {
    localStorage.setItem(storageKey(institutionId), JSON.stringify(setup));
    return true;
  } catch {
    return false;
  }
}

export function clearAdmissionSetup(institutionId: string) {
  try {
    localStorage.removeItem(storageKey(institutionId));
  } catch {
    // Storage is optional.
  }
}

export function applyAdmissionSetup(
  payload: StudentPayload,
  setup: AdmissionSetup,
): StudentPayload {
  const { gender, nationality, group_id, section_id, ...required } = setup;
  return {
    ...payload,
    gender,
    nationality,
    enrollment: {
      ...payload.enrollment,
      ...required,
      group_id: group_id || undefined,
      section_id: section_id || undefined,
    },
  };
}
