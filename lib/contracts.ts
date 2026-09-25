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
