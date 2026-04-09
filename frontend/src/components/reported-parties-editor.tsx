"use client";

import type { ReportedParty, ReportedPartyClassification } from "@/lib/types";

type ClassificationOption = {
  value: ReportedPartyClassification | string;
  label: string;
};

export function ReportedPartiesEditor({
  parties,
  options,
  disabled = false,
  title = "Reported Parties",
  description = "List the individuals allegedly involved in the complaint.",
  onChange,
}: {
  parties: ReportedParty[];
  options: ClassificationOption[];
  disabled?: boolean;
  title?: string;
  description?: string;
  onChange: (parties: ReportedParty[]) => void;
}) {
  const updateParty = (
    index: number,
    field: keyof ReportedParty,
    value: string,
  ) => {
    onChange(
      parties.map((party, currentIndex) =>
        currentIndex === index ? { ...party, [field]: value } : party,
      ),
    );
  };

  const addParty = () => {
    onChange([
      ...parties,
      {
        full_name: "",
        position: "",
        classification: "other",
      },
    ]);
  };

  const removeParty = (index: number) => {
    if (parties.length === 1) {
      onChange([
        {
          full_name: "",
          position: "",
          classification: "other",
        },
      ]);

      return;
    }

    onChange(parties.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl">{title}</h3>
          <p className="muted mt-2 text-sm leading-7">{description}</p>
        </div>
        <button
          type="button"
          onClick={addParty}
          disabled={disabled}
          className="ghost-button disabled:opacity-60"
        >
          Add Party
        </button>
      </div>

      <div className="space-y-4">
        {parties.map((party, index) => (
          <article
            key={`${index}-${party.full_name}-${party.position}`}
            className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Full Name</span>
                <input
                  className="field"
                  value={party.full_name}
                  onChange={(event) =>
                    updateParty(index, "full_name", event.target.value)
                  }
                  placeholder="Enter the full name"
                  required
                  disabled={disabled}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Position</span>
                <input
                  className="field"
                  value={party.position}
                  onChange={(event) =>
                    updateParty(index, "position", event.target.value)
                  }
                  placeholder="Enter the role or position"
                  required
                  disabled={disabled}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">
                  Position Classification
                </span>
                <select
                  className="field"
                  value={party.classification}
                  onChange={(event) =>
                    updateParty(index, "classification", event.target.value)
                  }
                  disabled={disabled}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => removeParty(index)}
                disabled={disabled}
                className="ghost-button disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
