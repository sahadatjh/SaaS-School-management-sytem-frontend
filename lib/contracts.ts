import { BloodGroup, Religion } from './enums';

/* ------------------------------------------------------------------ */
/*  Shared API envelope                                                */
/* ------------------------------------------------------------------ */
export type ApiEnvelope<T> =
  | { success: true; data: T; meta?: { requestId?: string } }
  | { success: false; error: { code: string; message: string } };

/* ------------------------------------------------------------------ */
/*  Identity & auth                                                    */
/* ------------------------------------------------------------------ */
export type Institution = {
  id: string;
  name: string;
  subdomain: string;
  timezone: string;
  address?: string;
  logo_url?: string;
};

export type PortalAvatar = {
  url: string;
  path: string;
  extension: string;
};

export type PortalUserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  avatar: PortalAvatar | null;
};

export type PortalProfile = {
  institution: Institution;
  user: PortalUserProfile;
  permissions: string[];
};

export type InstitutionProfile = {
  id: string;
  name: string;
  eiin?: string | null;
  address?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  timezone: string;
  branding?: { primaryColor?: string } | null;
  logoUrl?: string | null;
  logo?: {
    url: string;
    path: string;
    extension: string;
  } | null;
};

export type InstitutionProfilePayload = {
  name?: string;
  eiin?: string | null;
  address?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  timezone?: string;
  branding?: { primaryColor?: string } | null;
};

export type InstitutionRole = {
  id: string;
  name: string;
  isSystem: boolean;
  isEditable: boolean;
  assignedUserCount: number;
  permissionCodes: string[];
};

export type PermissionCatalogItem = {
  code: string;
  module: string;
  action: string;
  displayName: string;
};

export type RoleUser = {
  id: string;
  email: string;
  roles: Array<{ id: string; name: string; isSystem: boolean }>;
};

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
export type Metric =
  | { availability: "available"; value: number }
  | { availability: "unavailable"; unavailableReason: string };

export type DashboardSummary = {
  institution: Institution;
  metrics: Record<string, Metric>;
};

/* ------------------------------------------------------------------ */
/*  Academic – shared base                                             */
/* ------------------------------------------------------------------ */
type AcademicBase = {
  id: string;
  institution_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/*  Academic Years                                                     */
/* ------------------------------------------------------------------ */
export type AcademicYear = AcademicBase & {
  name: string;
  start_date: string;
  end_date: string;
};

export type AcademicYearPayload = {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Classes                                                            */
/* ------------------------------------------------------------------ */
export type Class = AcademicBase & {
  name: string;
  numeric_value?: number;
};

export type ClassPayload = {
  name: string;
  numeric_value?: number;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Departments                                                        */
/* ------------------------------------------------------------------ */
export type Department = AcademicBase & {
  name: string;
};

export type DepartmentPayload = {
  name: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Shifts                                                             */
/* ------------------------------------------------------------------ */
export type Shift = AcademicBase & {
  name: string;
  start_time?: string;
  end_time?: string;
};

export type ShiftPayload = {
  name: string;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */
export type Section = AcademicBase & {
  class_id: string;
  name: string;
};

export type SectionPayload = {
  class_id: string;
  name: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Groups                                                             */
/* ------------------------------------------------------------------ */
export type Group = AcademicBase & {
  class_id: string;
  name: string;
};

export type GroupPayload = {
  class_id: string;
  name: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Subjects                                                           */
/* ------------------------------------------------------------------ */
export type Subject = AcademicBase & {
  name: string;
  code?: string;
};

export type SubjectPayload = {
  name: string;
  code?: string;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Teacher Assignments                                                */
/* ------------------------------------------------------------------ */
export type TeacherAssignment = AcademicBase & {
  teacher_id: string;
  academic_year_id: string;
  class_id: string;
  section_id?: string;
  group_id?: string;
  subject_id?: string;
  is_class_teacher: boolean;
};

export type TeacherAssignmentPayload = {
  teacher_id: string;
  academic_year_id: string;
  class_id: string;
  section_id?: string;
  group_id?: string;
  subject_id?: string;
  is_class_teacher?: boolean;
  is_active?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Students                                                           */
/* ------------------------------------------------------------------ */
export type Enrollment = {
  id: string;
  institution_id: string;
  student_id: string;
  academic_year_id: string;
  academic_year_name: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  shift_id: string;
  shift_name: string;
  medium: string;
  group_id: string | null;
  group_name: string | null;
  department_id: string | null;
  department_name: string | null;
  roll_no: number;
  registration_no: string | null;
  enrollment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  institution_id: string;
  student_id: string;
  name_english: string;
  name_bangla: string | null;
  date_of_birth: string;
  gender: string;
  blood_group: BloodGroup | null;
  nationality: string | null;
  religion: Religion | null;
  photo_url: string | null;
  admission_date: string | null;
  is_imported: boolean;
  status: string;

  prev_school_name: string | null;
  prev_class: string | null;
  prev_section: string | null;
  prev_roll: string | null;
  prev_group: string | null;
  prev_session: string | null;
  tc_number: string | null;

  present_village: string;
  present_thana: string | null;
  present_district: string | null;
  present_division: string | null;
  present_post_code: string | null;

  permanent_village: string | null;
  permanent_thana: string | null;
  permanent_district: string | null;
  permanent_division: string | null;
  permanent_post_code: string | null;
  is_same_address: boolean;

  primary_sms_number: string;
  secondary_sms_number: string | null;
  sms_recipients: string[] | null;

  parents_sms_number: string;
  father_name_bangla: string | null;
  father_name_english: string | null;
  father_occupation: string | null;
  father_occupation_details: string | null;
  father_mobile: string | null;
  father_nid: string | null;
  father_annual_income: number | null;

  mother_name_bangla: string | null;
  mother_name_english: string | null;
  mother_occupation: string | null;
  mother_occupation_details: string | null;
  mother_mobile: string | null;
  mother_nid: string | null;
  mother_annual_income: number | null;

  local_guardian_name: string | null;
  local_guardian_contact: string | null;

  remarks: string | null;
  created_at: string;
  updated_at: string;

  // Joined from enrollments on list/detail views
  current_enrollment: Enrollment | null;
};

export type StudentPayload = Omit<Student,
  'id' | 'institution_id' | 'student_id' | 'is_imported' |
  'created_at' | 'updated_at' | 'current_enrollment'
> & {
  enrollment: {
    academic_year_id: string;
    class_id: string;
    section_id: string;
    shift_id: string;
    medium: string;
    roll_no: number;
    group_id?: string;
    department_id?: string;
    major_subject_group?: string;
    year?: string;
    registration_no?: string;
  };
};

export type StudentListResponse = {
  items: Student[];
  pagination: { page: number; limit: number; total: number };
};

export type StudentImportBatch = {
  id: string;
  status: "queued" | "previewing" | "preview_ready" | "commit_queued" | "committing" | "completed" | "failed";
  sourceFilename: string | null;
  totalRows: number;
  readyRows: number;
  processedRows: number;
  importedRows: number;
  failedRows: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type StudentImportRow = {
  rowNumber: number;
  status: "pending" | "imported" | "failed";
  source: Record<string, string>;
  normalised: {
    sourceStudentId?: string;
    student: { name_english: string; date_of_birth?: string };
    enrollment: {
      academic_year_name: string;
      academic_year_id?: string;
      class_name: string;
      class_id?: string;
      section_name: string;
      section_id?: string;
      shift_name: string;
      shift_id?: string;
      medium: string;
      group_name?: string;
      group_id?: string;
      roll_no?: number;
    };
  };
  validationErrors: string[];
  studentId: string | null;
  enrollmentId: string | null;
};

export type StudentImportRowsResponse = {
  items: StudentImportRow[];
  pagination: { page: number; limit: number; total: number };
};

export type StudentExportJob = {
  id: string;
  status: "queued" | "exporting" | "completed" | "failed";
  totalRows: number;
  error: string | null;
  downloadReady: boolean;
  createdAt: string;
  completedAt: string | null;
};
