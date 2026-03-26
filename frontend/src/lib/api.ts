import type {
  AdminUserUpdatePayload,
  AuthSession,
  AuthUser,
  CatalogData,
  GovernanceDashboardData,
  InternalUserPayload,
  LoginPayload,
  MessageResponse,
  PaginatedData,
  ReportAttachment,
  RegisterReporterPayload,
  ReporterReportDetail,
  ReporterReportSummary,
  SubmissionPayload,
  SubmissionReceipt,
  TrackingRecord,
  WorkflowAssignee,
  WorkflowCase,
  WorkflowDirectoryView,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...init } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return (payload?.data ?? payload) as T;
}

async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { body, token, headers, ...init } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Request failed");
  }

  return response.blob();
}

function buildSubmissionFormData(body: SubmissionPayload, attachments: File[]) {
  const formData = new FormData();

  formData.append("title", body.title);
  formData.append("category", body.category);
  formData.append("description", body.description);

  if (body.incident_date) {
    formData.append("incident_date", body.incident_date);
  }

  if (body.incident_location) {
    formData.append("incident_location", body.incident_location);
  }

  if (body.accused_party) {
    formData.append("accused_party", body.accused_party);
  }

  if (body.evidence_summary) {
    formData.append("evidence_summary", body.evidence_summary);
  }

  formData.append("confidentiality_level", body.confidentiality_level);
  formData.append("requested_follow_up", body.requested_follow_up ? "1" : "0");
  formData.append("witness_available", body.witness_available ? "1" : "0");

  for (const tag of body.governance_tags) {
    formData.append("governance_tags[]", tag);
  }

  for (const file of attachments) {
    formData.append("attachments[]", file);
  }

  return formData;
}

export const api = {
  fetchCatalog: () => request<CatalogData>("/catalog"),
  registerReporter: (body: RegisterReporterPayload) =>
    request<AuthSession>("/auth/register", {
      method: "POST",
      body,
    }),
  login: (body: LoginPayload) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body,
    }),
  fetchMe: (token: string) =>
    request<{ user: AuthUser }>("/auth/me", {
      token,
    }),
  logout: (token: string) =>
    request<MessageResponse>("/auth/logout", {
      method: "POST",
      token,
    }),
  listReporterReports: (
    token: string,
    options: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
    } = {},
  ) => {
    const params = new URLSearchParams();

    if (options.page) {
      params.set("page", String(options.page));
    }

    if (options.per_page) {
      params.set("per_page", String(options.per_page));
    }

    if (options.search) {
      params.set("search", options.search);
    }

    if (options.status) {
      params.set("status", options.status);
    }

    const query = params.toString();

    return request<PaginatedData<ReporterReportSummary>>(
      query ? `/reporter/reports?${query}` : "/reporter/reports",
      {
        token,
      },
    );
  },
  fetchReporterReport: (token: string, reportId: number) =>
    request<ReporterReportDetail>(`/reporter/reports/${reportId}`, {
      token,
    }),
  submitReport: (token: string, body: SubmissionPayload, attachments: File[] = []) =>
    request<SubmissionReceipt>("/reporter/reports", {
      method: "POST",
      token,
      body: buildSubmissionFormData(body, attachments),
    }),
  updateReporterReport: (
    token: string,
    reportId: number,
    body: SubmissionPayload,
    attachments: File[] = [],
  ) => {
    const formData = buildSubmissionFormData(body, attachments);
    formData.append("_method", "PATCH");

    return request<ReporterReportDetail>(`/reporter/reports/${reportId}`, {
      method: "POST",
      token,
      body: formData,
    });
  },
  uploadReporterAttachment: (token: string, reportId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return request<ReportAttachment>(`/reporter/reports/${reportId}/attachments`, {
      method: "POST",
      token,
      body: formData,
    });
  },
  deleteReporterAttachment: (token: string, reportId: number, attachmentId: number) =>
    request<MessageResponse>(
      `/reporter/reports/${reportId}/attachments/${attachmentId}`,
      {
        method: "DELETE",
        token,
      },
    ),
  downloadReporterAttachment: (
    token: string,
    reportId: number,
    attachmentId: number,
  ) =>
    requestBlob(`/reporter/reports/${reportId}/attachments/${attachmentId}/download`, {
      token,
    }),
  trackReport: (body: { reference: string; token: string }) =>
    request<TrackingRecord>("/tracking", {
      method: "POST",
      body,
    }),
  listWorkflowCases: (
    token: string,
    options: {
      page?: number;
      per_page?: number;
      search?: string;
      stage?: string;
      view?: WorkflowDirectoryView;
    } = {},
  ) => {
    const params = new URLSearchParams();

    if (options.page) {
      params.set("page", String(options.page));
    }

    if (options.per_page) {
      params.set("per_page", String(options.per_page));
    }

    if (options.search) {
      params.set("search", options.search);
    }

    if (options.stage) {
      params.set("stage", options.stage);
    }

    if (options.view) {
      params.set("view", options.view);
    }

    const query = params.toString();

    return request<PaginatedData<WorkflowCase>>(
      query ? `/workflow/cases?${query}` : "/workflow/cases",
      {
        token,
      },
    );
  },
  fetchWorkflowCase: (token: string, caseId: number) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}`, {
      token,
    }),
  fetchAssignees: (token: string, role: "verificator" | "investigator") =>
    request<WorkflowAssignee[]>(
      `/workflow/assignees?role=${encodeURIComponent(role)}`,
      {
        token,
      },
    ),
  delegateVerification: (
    token: string,
    caseId: number,
    body: { assignee_user_id: number; assigned_unit?: string; due_in_days?: number },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/delegate-verification`, {
      method: "PATCH",
      token,
      body,
    }),
  submitVerification: (
    token: string,
    caseId: number,
    body: { internal_note: string; publish_update?: boolean; public_message?: string },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/submit-verification`, {
      method: "PATCH",
      token,
      body,
    }),
  reviewVerification: (
    token: string,
    caseId: number,
    body: {
      decision: "approved" | "rejected";
      internal_note: string;
      publish_update?: boolean;
      public_message?: string;
    },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/review-verification`, {
      method: "PATCH",
      token,
      body,
    }),
  delegateInvestigation: (
    token: string,
    caseId: number,
    body: { assignee_user_id: number; assigned_unit?: string; due_in_days?: number },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/delegate-investigation`, {
      method: "PATCH",
      token,
      body,
    }),
  submitInvestigation: (
    token: string,
    caseId: number,
    body: { internal_note: string; publish_update?: boolean; public_message?: string },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/submit-investigation`, {
      method: "PATCH",
      token,
      body,
    }),
  reviewInvestigation: (
    token: string,
    caseId: number,
    body: {
      decision: "approved" | "rejected";
      internal_note: string;
      publish_update?: boolean;
      public_message?: string;
    },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/review-investigation`, {
      method: "PATCH",
      token,
      body,
    }),
  directorReview: (
    token: string,
    caseId: number,
    body: {
      decision: "approved" | "rejected";
      internal_note: string;
      publish_update?: boolean;
      public_message?: string;
    },
  ) =>
    request<WorkflowCase>(`/workflow/cases/${caseId}/director-review`, {
      method: "PATCH",
      token,
      body,
    }),
  downloadWorkflowAttachment: (
    token: string,
    caseId: number,
    attachmentId: number,
  ) =>
    requestBlob(`/workflow/cases/${caseId}/attachments/${attachmentId}/download`, {
      token,
    }),
  fetchGovernanceDashboard: (token: string) =>
    request<GovernanceDashboardData>("/governance/dashboard", {
      token,
    }),
  fetchUsers: (
    token: string,
    options: {
      page?: number;
      per_page?: number;
      search?: string;
      role?: string;
      status?: "active" | "inactive";
    } = {},
  ) => {
    const params = new URLSearchParams();

    if (options.page) {
      params.set("page", String(options.page));
    }

    if (options.per_page) {
      params.set("per_page", String(options.per_page));
    }

    if (options.search) {
      params.set("search", options.search);
    }

    if (options.role) {
      params.set("role", options.role);
    }

    if (options.status) {
      params.set("status", options.status);
    }

    const query = params.toString();

    return request<PaginatedData<AuthUser>>(
      query ? `/admin/users?${query}` : "/admin/users",
      {
        token,
      },
    );
  },
  createUser: (token: string, body: InternalUserPayload) =>
    request<AuthUser>("/admin/users", {
      method: "POST",
      token,
      body,
    }),
  fetchUser: (token: string, userId: number) =>
    request<AuthUser>(`/admin/users/${userId}`, {
      token,
    }),
  updateUser: (token: string, userId: number, body: AdminUserUpdatePayload) =>
    request<AuthUser>(`/admin/users/${userId}`, {
      method: "PATCH",
      token,
      body,
    }),
  deactivateUser: (token: string, userId: number) =>
    request<AuthUser>(`/admin/users/${userId}/deactivate`, {
      method: "PATCH",
      token,
    }),
  deleteUser: (token: string, userId: number) =>
    request<MessageResponse>(`/admin/users/${userId}`, {
      method: "DELETE",
      token,
    }),
};
