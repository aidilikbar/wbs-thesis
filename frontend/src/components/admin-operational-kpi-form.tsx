"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { isSystemAdministrator } from "@/lib/roles";
import type {
  OperationalKpiSettings,
  OperationalKpiSettingsPayload,
} from "@/lib/types";

type SettingsFormState = {
  timezone: string;
  workday_start: string;
  workday_end: string;
  weekend_days: number[];
  non_working_dates_text: string;
  verification_screening_hours: string;
  verification_work_hours: string;
  verification_approval_hours: string;
  investigation_delegation_hours: string;
  investigation_work_hours: string;
  investigation_approval_hours: string;
  director_approval_hours: string;
};

const weekdayOptions = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

function buildForm(settings: OperationalKpiSettings): SettingsFormState {
  return {
    timezone: settings.timezone,
    workday_start: settings.workday_start,
    workday_end: settings.workday_end,
    weekend_days: [...settings.weekend_days].sort((left, right) => left - right),
    non_working_dates_text: settings.non_working_dates.join("\n"),
    verification_screening_hours: String(settings.verification_screening_hours),
    verification_work_hours: String(settings.verification_work_hours),
    verification_approval_hours: String(settings.verification_approval_hours),
    investigation_delegation_hours: String(settings.investigation_delegation_hours),
    investigation_work_hours: String(settings.investigation_work_hours),
    investigation_approval_hours: String(settings.investigation_approval_hours),
    director_approval_hours: String(settings.director_approval_hours),
  };
}

function formatHours(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, "")} h`;
}

function parseNumericField(value: string) {
  return Number.parseFloat(value);
}

function parseNonWorkingDates(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

function workdayHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map((part) => Number.parseInt(part, 10));
  const [endHour, endMinute] = end.split(":").map((part) => Number.parseInt(part, 10));

  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) {
    return 0;
  }

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return endMinutes > startMinutes ? (endMinutes - startMinutes) / 60 : 0;
}

export function AdminOperationalKpiForm() {
  const router = useRouter();
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [settings, setSettings] = useState<OperationalKpiSettings | null>(null);
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isAdmin = isSystemAdministrator(user?.role);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token || !isAdmin) {
      setIsLoading(false);

      return;
    }

    let active = true;

    const loadSettings = async () => {
      try {
        const data = await api.fetchOperationalKpiSettings(token);

        if (!active) {
          return;
        }

        setSettings(data);
        setForm(buildForm(data));
        setMessage(null);
      } catch (error) {
        if (active) {
          setMessage({
            tone: "error",
            text:
              error instanceof Error
                ? error.message
                : "Operational KPI settings could not be loaded.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [isReady, token, isAdmin]);

  const totals = useMemo(() => {
    if (!form) {
      return {
        workday: 0,
        verification: 0,
        investigation: 0,
      };
    }

    return {
      workday: workdayHours(form.workday_start, form.workday_end),
      verification:
        parseNumericField(form.verification_screening_hours) +
        parseNumericField(form.verification_work_hours) +
        parseNumericField(form.verification_approval_hours),
      investigation:
        parseNumericField(form.investigation_delegation_hours) +
        parseNumericField(form.investigation_work_hours) +
        parseNumericField(form.investigation_approval_hours) +
        parseNumericField(form.director_approval_hours),
    };
  }, [form]);

  const updateField = <K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K],
  ) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const toggleWeekendDay = (day: number, checked: boolean) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      const nextDays = checked
        ? Array.from(new Set([...current.weekend_days, day])).sort((left, right) => left - right)
        : current.weekend_days.filter((value) => value !== day);

      return {
        ...current,
        weekend_days: nextDays,
      };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!token || !form) {
      setMessage({
        tone: "error",
        text: "System administrator authentication is required.",
      });

      return;
    }

    const payload: OperationalKpiSettingsPayload = {
      timezone: form.timezone.trim() || undefined,
      workday_start: form.workday_start,
      workday_end: form.workday_end,
      weekend_days: [...form.weekend_days].sort((left, right) => left - right),
      non_working_dates: parseNonWorkingDates(form.non_working_dates_text),
      verification_screening_hours: parseNumericField(form.verification_screening_hours),
      verification_work_hours: parseNumericField(form.verification_work_hours),
      verification_approval_hours: parseNumericField(form.verification_approval_hours),
      investigation_delegation_hours: parseNumericField(form.investigation_delegation_hours),
      investigation_work_hours: parseNumericField(form.investigation_work_hours),
      investigation_approval_hours: parseNumericField(form.investigation_approval_hours),
      director_approval_hours: parseNumericField(form.director_approval_hours),
    };

    const numericValues = [
      payload.verification_screening_hours,
      payload.verification_work_hours,
      payload.verification_approval_hours,
      payload.investigation_delegation_hours,
      payload.investigation_work_hours,
      payload.investigation_approval_hours,
      payload.director_approval_hours,
    ];

    if (numericValues.some((value) => Number.isNaN(value))) {
      setMessage({
        tone: "error",
        text: "All KPI budget fields must be valid numbers.",
      });

      return;
    }

    startTransition(async () => {
      try {
        const data = await api.updateOperationalKpiSettings(token, payload);
        setSettings(data);
        setForm(buildForm(data));
        setMessage({
          tone: "success",
          text: "Operational KPI settings saved.",
        });
        router.refresh();
      } catch (error) {
        setMessage({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "Operational KPI settings could not be saved.",
        });
      }
    });
  };

  if (!isReady || isLoading) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading operational KPI settings.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Administration</p>
          <h2 className="mt-4 text-3xl">System administrator access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            Only the system administrator may adjust the operational KPI timing model used in Governance.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Access Rule
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Only the system administrator may define working calendars and KPI step budgets.</li>
            <li>Changes here affect the Governance KPI bars for all internal roles.</li>
            <li>Reporter and workflow users do not manage these thresholds.</li>
          </ul>
        </aside>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="eyebrow">Settings Unavailable</p>
        <h2 className="mt-4 text-3xl">Operational KPI settings could not be opened</h2>
        <p className="muted mt-4 text-sm leading-7">
          {message?.text ?? "The settings record is not available right now."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
      <form className="panel rounded-[1rem] p-8" onSubmit={handleSubmit}>
        <p className="eyebrow">Operational KPI Settings</p>
        <h2 className="mt-4 text-4xl">Configure working-hour budgets</h2>
        <p className="muted mt-5 max-w-3xl text-sm leading-7">
          Governance calculates verification and investigation timeliness from this calendar and step budget model. Weekends and listed non-working dates are excluded from working-hour elapsed time.
        </p>

        <div className="mt-6 space-y-7">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Work Calendar</h3>
                <p className="muted mt-1 text-sm">
                  Define the base working window used for KPI elapsed-time calculation.
                </p>
              </div>
              <div className="rounded-[0.8rem] border border-[var(--panel-border)] bg-white/80 px-4 py-3 text-sm">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Working day length
                </p>
                <p className="mt-1 text-lg font-semibold">{formatHours(totals.workday)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Timezone</span>
                <input
                  className="field"
                  value={form.timezone}
                  onChange={(event) => updateField("timezone", event.target.value)}
                  placeholder="Asia/Jakarta"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Workday start</span>
                <input
                  className="field"
                  type="time"
                  value={form.workday_start}
                  onChange={(event) => updateField("workday_start", event.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Workday end</span>
                <input
                  className="field"
                  type="time"
                  value={form.workday_end}
                  onChange={(event) => updateField("workday_end", event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.48fr_0.52fr]">
              <fieldset className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-4">
                <legend className="px-2 text-sm font-semibold">Weekend days</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {weekdayOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.weekend_days.includes(option.value)}
                        onChange={(event) => toggleWeekendDay(option.value, event.target.checked)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Non-working dates</span>
                <textarea
                  className="field min-h-[10rem]"
                  value={form.non_working_dates_text}
                  onChange={(event) => updateField("non_working_dates_text", event.target.value)}
                  placeholder={"One date per line\n2026-04-03\n2026-05-14"}
                />
                <span className="mt-2 block text-xs text-[var(--muted)]">
                  Use `YYYY-MM-DD`. Separate each holiday or collective leave date on its own line.
                </span>
              </label>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Verification Budget</h3>
                <p className="muted mt-1 text-sm">
                  From report submission until verification supervisor approval.
                </p>
              </div>
              <div className="rounded-[0.8rem] border border-[var(--panel-border)] bg-white/80 px-4 py-3 text-sm">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Verification total
                </p>
                <p className="mt-1 text-lg font-semibold">{formatHours(totals.verification)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Screening / Delegation</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.verification_screening_hours}
                  onChange={(event) =>
                    updateField("verification_screening_hours", event.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Verification Work</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.verification_work_hours}
                  onChange={(event) =>
                    updateField("verification_work_hours", event.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Supervisory Approval</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.verification_approval_hours}
                  onChange={(event) =>
                    updateField("verification_approval_hours", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Investigation Budget</h3>
                <p className="muted mt-1 text-sm">
                  From investigation supervisor receipt until director approval.
                </p>
              </div>
              <div className="rounded-[0.8rem] border border-[var(--panel-border)] bg-white/80 px-4 py-3 text-sm">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Investigation total
                </p>
                <p className="mt-1 text-lg font-semibold">{formatHours(totals.investigation)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Delegation</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.investigation_delegation_hours}
                  onChange={(event) =>
                    updateField("investigation_delegation_hours", event.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Investigation Work</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.investigation_work_hours}
                  onChange={(event) =>
                    updateField("investigation_work_hours", event.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Supervisory Approval</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.investigation_approval_hours}
                  onChange={(event) =>
                    updateField("investigation_approval_hours", event.target.value)
                  }
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Director Approval</span>
                <input
                  className="field"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.director_approval_hours}
                  onChange={(event) =>
                    updateField("director_approval_hours", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </section>
        </div>

        {message ? (
          <p
            className={`mt-6 rounded-[0.65rem] px-4 py-3 text-sm ${
              message.tone === "success"
                ? "border border-[rgba(19,19,19,0.08)] bg-white text-[var(--foreground)]"
                : "border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="submit" disabled={isPending} className="primary-button">
            {isPending ? "Saving..." : "Save KPI Settings"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="ghost-button cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
          Settings Context
        </p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-white/72">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Applied verification target
            </p>
            <p>{formatHours(totals.verification)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Applied investigation target
            </p>
            <p>{formatHours(totals.investigation)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Last updated
            </p>
            <p>{formatDateTime(settings?.updated_at ?? null)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Updated by
            </p>
            <p>{settings?.updated_by_name ?? "Default application configuration"}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Effect
            </p>
            <p>
              Governance KPI bars, at-risk thresholds, and overdue calculations use these stored values immediately after saving.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
