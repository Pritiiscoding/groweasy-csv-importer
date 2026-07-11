"use client";

import { useMemo, useState } from "react";
import Dropzone from "@/components/Dropzone";
import DataTable from "@/components/DataTable";
import Stepper from "@/components/Stepper";
import PatchboardHero from "@/components/PatchboardHero";
import {
  uploadCsv,
  extractRecords,
  type ParsePreview,
  type ExtractResult,
} from "@/lib/api";

type Stage = "upload" | "preview" | "processing" | "results";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  GOOD_LEAD_FOLLOW_UP: {
    label: "Follow up",
    className: "bg-amber/10 text-amber",
  },
  DID_NOT_CONNECT: {
    label: "Did not connect",
    className: "bg-white/5 text-mist-muted",
  },
  BAD_LEAD: {
    label: "Bad lead",
    className: "bg-signal-bad/10 text-signal-bad",
  },
  SALE_DONE: {
    label: "Sale done",
    className: "bg-signal-good/10 text-signal-good",
  },
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string>("");

  const stepNumber = useMemo(() => {
    if (stage === "upload") return 1;
    if (stage === "preview") return 2;
    if (stage === "processing") return 3;
    return 4;
  }, [stage]);

  async function handleFile(file: File) {
    setError("");
    setFileName(file.name);
    try {
      const data = await uploadCsv(file);
      setPreview(data);
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse that file.");
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setStage("processing");
    setError("");
    try {
      const data = await extractRecords(preview.rows);
      setResult(data);
      setStage("results");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "AI extraction failed. Try again."
      );
      setStage("preview");
    }
  }

  function reset() {
    setStage("upload");
    setPreview(null);
    setResult(null);
    setError("");
    setFileName("");
  }

  const resultColumns = [
    "name",
    "email",
    "mobile_without_country_code",
    "company",
    "city",
    "crm_status",
    "data_source",
    "crm_note",
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
      <header className="mb-10 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-amber">
              GrowEasy
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-mist">
              Lead Importer
            </h1>
          </div>
          <Stepper current={stepNumber} />
        </div>

        {stage === "upload" && (
          <div className="rounded-xl border border-ink-line bg-ink-soft/60 p-6">
            <PatchboardHero />
            <p className="mt-4 max-w-2xl text-sm text-mist-muted">
              Every export names its columns differently. Drop a CSV below —
              the importer reads the raw headers on the left and routes them
              into GrowEasy's fixed CRM schema on the right, no matter how the
              source file is structured.
            </p>
          </div>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-signal-bad/30 bg-signal-bad/10 px-4 py-3 text-sm text-signal-bad">
          {error}
        </div>
      )}

      {stage === "upload" && <Dropzone onFile={handleFile} />}

      {stage === "preview" && preview && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-medium text-mist">
                {fileName}
              </p>
              <p className="text-sm text-mist-muted">
                {preview.totalRows} rows detected · {preview.headers.length}{" "}
                columns · nothing sent to AI yet
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="rounded-lg border border-ink-line px-4 py-2 text-sm text-mist-muted transition-colors hover:border-mist-muted"
              >
                Choose a different file
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-lg bg-amber px-5 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Confirm &amp; extract with AI
              </button>
            </div>
          </div>
          <DataTable columns={preview.headers} rows={preview.rows} />
        </section>
      )}

      {stage === "processing" && (
        <section className="flex flex-col items-center justify-center gap-4 rounded-xl border border-ink-line bg-ink-soft/60 py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          <p className="font-display text-base text-mist">
            Mapping columns into CRM fields…
          </p>
          <p className="max-w-sm text-sm text-mist-muted">
            Sending {preview?.totalRows ?? 0} rows to the AI in batches.
            Larger files take longer.
          </p>
        </section>
      )}

      {stage === "results" && result && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Imported"
              value={result.totalImported}
              tone="good"
            />
            <StatCard
              label="Skipped"
              value={result.totalSkipped}
              tone="bad"
            />
            <StatCard label="Source rows" value={preview?.totalRows ?? 0} />
            <StatCard
              label="Success rate"
              value={
                preview?.totalRows
                  ? `${Math.round(
                      (result.totalImported / preview.totalRows) * 100
                    )}%`
                  : "—"
              }
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-medium text-mist">
                Imported records
              </h2>
              <button
                onClick={reset}
                className="rounded-lg border border-ink-line px-4 py-2 text-sm text-mist-muted transition-colors hover:border-mist-muted"
              >
                Import another file
              </button>
            </div>
            <DataTable
              columns={resultColumns}
              rows={result.records as unknown as Record<string, string>[]}
              badgeColumn="crm_status"
              badgeMap={STATUS_BADGES}
            />
          </div>

          {result.skipped.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-base font-medium text-mist">
                Skipped rows
              </h2>
              <div className="scrollbar-thin max-h-64 overflow-auto rounded-lg border border-signal-bad/20">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-ink-soft">
                    <tr>
                      <th className="border-b border-ink-line px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-mist-muted">
                        #
                      </th>
                      <th className="border-b border-ink-line px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-mist-muted">
                        Reason
                      </th>
                      <th className="border-b border-ink-line px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-mist-muted">
                        Original row
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skipped.map((s, i) => (
                      <tr key={i} className="even:bg-white/[0.02]">
                        <td className="px-4 py-2 font-mono text-xs text-mist-muted">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 text-signal-bad">
                          {s.reason}
                        </td>
                        <td className="max-w-md truncate px-4 py-2 font-mono text-xs text-mist-muted">
                          {JSON.stringify(s.row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-signal-good"
      : tone === "bad"
      ? "text-signal-bad"
      : "text-mist";
  return (
    <div className="rounded-xl border border-ink-line bg-ink-soft px-4 py-4">
      <p className="font-mono text-xs uppercase tracking-wide text-mist-muted">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
