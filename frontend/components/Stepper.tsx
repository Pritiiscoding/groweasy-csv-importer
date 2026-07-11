"use client";

const STEPS = ["Upload", "Preview", "Confirm", "Result"];

export default function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${
                active
                  ? "border-amber text-amber"
                  : done
                  ? "border-signal-good/50 text-signal-good"
                  : "border-ink-line text-mist-muted"
              }`}
            >
              <span>{String(step).padStart(2, "0")}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {step < STEPS.length && (
              <span className="h-px w-4 bg-ink-line sm:w-8" />
            )}
          </div>
        );
      })}
    </div>
  );
}
