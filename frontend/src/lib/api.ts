import type {
  AuthSession,
  AuthUser,
  CatalogData,
  GovernanceDashboardData,
  InternalUserPayload,
  LoginPayload,
  MessageResponse,
  RegisterReporterPayload,
  ReporterReportSummary,
  SubmissionPayload,
  SubmissionReceipt,
  TrackingRecord,
  WorkflowAssignee,
  WorkflowCase,
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
  listReporterReports: (token: string) =>
    request<ReporterReportSummary[]>("/reporter/reports", {
      token,
    }),
  submitReport: (token: string, body: SubmissionPayload) =>
    request<SubmissionReceipt>("/reporter/reports", {
      method: "POST",
      token,
      body,
    }),
  trackReport: (body: { reference: string; token: string }) =>
    request<TrackingRecord>("/tracking", {
      method: "POST",
      body,
    }),
  fetchWorkflowCases: (token: string, stage?: string) =>
    request<WorkflowCase[]>(
      stage ? `/workflow/cases?stage=${encodeURIComponent(stage)}` : "/workflow/cases",
      {
        token,
      },
    ),
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
  fetchGovernanceDashboard: (token: string) =>
    request<GovernanceDashboardData>("/governance/dashboard", {
      token,
    }),
  fetchUsers: (token: string) =>
    request<AuthUser[]>("/admin/users", {
      token,
    }),
  createUser: (token: string, body: InternalUserPayload) =>
    request<AuthUser>("/admin/users", {
      method: "POST",
      token,
      body,
    }),
};
