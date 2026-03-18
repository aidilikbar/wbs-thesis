import type {
  GovernanceDashboardData,
  InvestigatorCase,
  SubmissionPayload,
  SubmissionReceipt,
  TrackingRecord,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
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
  submitReport: (body: SubmissionPayload) =>
    request<SubmissionReceipt>("/reports", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  trackReport: (body: { reference: string; token: string }) =>
    request<TrackingRecord>("/tracking", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  fetchInvestigatorCases: () => request<InvestigatorCase[]>("/investigator/cases"),
  fetchGovernanceDashboard: () =>
    request<GovernanceDashboardData>("/governance/dashboard"),
};
