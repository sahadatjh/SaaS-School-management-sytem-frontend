"use client";

import {
  clearAuthTokens,
  getAuthTokens,
  setAuthTokens,
  type AuthTokens,
} from "@/lib/auth-tokens";
import type {
  ApiEnvelope,
  DashboardSummary,
  PortalProfile,
  PortalUserProfile,
  InstitutionProfile,
  InstitutionProfilePayload,
  InstitutionRole,
  PermissionCatalogItem,
  RoleUser,
  AcademicYear,
  AcademicYearPayload,
  Class,
  ClassPayload,
  Department,
  DepartmentPayload,
  Shift,
  ShiftPayload,
  Section,
  SectionPayload,
  Group,
  GroupPayload,
  Subject,
  SubjectPayload,
  TeacherAssignment,
  TeacherAssignmentPayload,
} from "@/lib/contracts";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

export class PortalApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function backend(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!headers.has("content-type") && !isFormData)
    headers.set("content-type", "application/json");
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new PortalApiError(
      response.status,
      payload.success
        ? "Unable to complete the request."
        : payload.error.message,
    );
  }
  return payload.data;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const tokens = getAuthTokens();
    if (!tokens) return null;
    try {
      const response = await backend("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      const replacement = await parseEnvelope<AuthTokens>(response);
      if (!replacement.accessToken || !replacement.refreshToken)
        throw new Error("Incomplete token response");
      setAuthTokens(replacement);
      return replacement;
    } catch {
      clearAuthTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function authenticatedRequest<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const tokens = getAuthTokens();
  if (!tokens) throw new PortalApiError(401, "Your session has ended.");
  const response = await backend(path, {
    ...init,
    headers: { Authorization: `Bearer ${tokens.accessToken}`, ...init.headers },
  });
  if (response.status === 401 && !retried && (await refreshTokens()))
    return authenticatedRequest<T>(path, init, true);
  return parseEnvelope<T>(response);
}

/* ------------------------------------------------------------------ */
/*  Generic CRUD resource factory                                      */
/* ------------------------------------------------------------------ */
type CrudResource<TEntity, TPayload> = {
  list: (params?: URLSearchParams) => Promise<TEntity[]>;
  get: (id: string) => Promise<TEntity>;
  create: (payload: TPayload) => Promise<TEntity>;
  update: (id: string, payload: Partial<TPayload>) => Promise<TEntity>;
  delete: (id: string) => Promise<void>;
};

type PaginatedList<TEntity> = {
  items: TEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

function crudResource<TEntity, TPayload>(
  basePath: string,
): CrudResource<TEntity, TPayload> {
  return {
    list: async (params) => {
      const result = await authenticatedRequest<
        TEntity[] | PaginatedList<TEntity>
      >(params ? `${basePath}?${params.toString()}` : basePath);
      return Array.isArray(result) ? result : result.items;
    },
    get: (id) => authenticatedRequest<TEntity>(`${basePath}/${id}`),
    create: (payload) =>
      authenticatedRequest<TEntity>(basePath, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id, payload) =>
      authenticatedRequest<TEntity>(`${basePath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    delete: (id) =>
      authenticatedRequest<void>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

/* ------------------------------------------------------------------ */
/*  Public API surface                                                 */
/* ------------------------------------------------------------------ */
export const portalApi = {
  /* Auth */
  async login(credentials: { email: string; password: string }): Promise<void> {
    const response = await backend("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    const tokens = await parseEnvelope<AuthTokens>(response);
    if (!tokens.accessToken || !tokens.refreshToken)
      throw new PortalApiError(401, "Unable to start your session.");
    setAuthTokens(tokens);
  },
  async requestPasswordReset(email: string): Promise<void> {
    const response = await backend("/auth/password-reset-requests", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (response.status === 204) return;
    await parseEnvelope<never>(response);
  },
  async resetPassword(payload: {
    token: string;
    password: string;
  }): Promise<void> {
    const response = await backend("/auth/password-resets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response.status === 204) return;
    await parseEnvelope<never>(response);
  },
  profile: () => authenticatedRequest<PortalProfile>("/auth/me"),
  userProfile: {
    update: (payload: { displayName: string }) =>
      authenticatedRequest<PortalUserProfile>("/auth/me/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    uploadAvatar: (avatar: File) => {
      const body = new FormData();
      body.append("avatar", avatar);
      return authenticatedRequest<PortalUserProfile>("/auth/me/avatar", {
        method: "POST",
        body,
      });
    },
    removeAvatar: () =>
      authenticatedRequest<PortalUserProfile>("/auth/me/avatar", {
        method: "DELETE",
      }),
  },
  institutionProfile: {
    get: () => authenticatedRequest<InstitutionProfile>("/institution-profile"),
    update: (payload: InstitutionProfilePayload) =>
      authenticatedRequest<InstitutionProfile>("/institution-profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    uploadLogo: (logo: File) => {
      const body = new FormData();
      body.append("logo", logo);
      return authenticatedRequest<InstitutionProfile>(
        "/institution-profile/logo",
        {
          method: "POST",
          body,
        },
      );
    },
  },
  roles: {
    list: () => authenticatedRequest<InstitutionRole[]>("/roles"),
    permissions: () => authenticatedRequest<PermissionCatalogItem[]>("/roles/permissions"),
    create: (payload: { name: string; permissionCodes: string[] }) => authenticatedRequest<InstitutionRole>("/roles", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: { name: string; permissionCodes: string[] }) => authenticatedRequest<InstitutionRole>(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (id: string) => authenticatedRequest<void>(`/roles/${id}`, { method: "DELETE" }),
    users: (params: URLSearchParams) => authenticatedRequest<{ items: RoleUser[]; pagination: { page: number; limit: number; total: number } }>(`/roles/users?${params.toString()}`),
    assign: (userId: string, roleIds: string[]) => authenticatedRequest<{ userId: string; roleIds: string[] }>(`/roles/users/${userId}/roles`, { method: "PUT", body: JSON.stringify({ roleIds }) }),
  },
  dashboard: () => authenticatedRequest<DashboardSummary>("/dashboard/summary"),
  async logout(): Promise<void> {
    const tokens = getAuthTokens();
    try {
      if (tokens)
        await backend("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
    } finally {
      clearAuthTokens();
    }
  },

  /* Academic resources */
  academicYears: crudResource<AcademicYear, AcademicYearPayload>(
    "/academic-years",
  ),
  classes: crudResource<Class, ClassPayload>("/classes"),
  departments: crudResource<Department, DepartmentPayload>("/departments"),
  shifts: crudResource<Shift, ShiftPayload>("/shifts"),
  sections: crudResource<Section, SectionPayload>("/sections"),
  groups: crudResource<Group, GroupPayload>("/groups"),
  subjects: crudResource<Subject, SubjectPayload>("/subjects"),
  teacherAssignments: crudResource<TeacherAssignment, TeacherAssignmentPayload>(
    "/teacher-assignments",
  ),
};
