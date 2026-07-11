"use client";

type Props = {
  columns: string[];
  rows: Record<string, string>[];
  maxHeight?: string;
  badgeColumn?: string;
  badgeMap?: Record<string, { label: string; className: string }>;
};

export default function DataTable({
  columns,
  rows,
  maxHeight = "420px",
  badgeColumn,
  badgeMap,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-line px-6 py-10 text-center text-sm text-mist-muted">
        No rows to show yet.
      </div>
    );
  }

  return (
    <div
      className="scrollbar-thin overflow-auto rounded-lg border border-ink-line"
      style={{ maxHeight }}
    >
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-ink-soft">
          <tr>
            <th className="border-b border-ink-line px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-mist-muted">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap border-b border-ink-line px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-mist-muted"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="odd:bg-transparent even:bg-white/[0.02] hover:bg-amber/5"
            >
              <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-mist-muted">
                {i + 1}
              </td>
              {columns.map((col) => {
                const value = row[col] ?? "";
                if (col === badgeColumn && badgeMap && badgeMap[value]) {
                  const badge = badgeMap[value];
                  return (
                    <td key={col} className="whitespace-nowrap px-4 py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-xs ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                  );
                }
                return (
                  <td
                    key={col}
                    className="max-w-xs truncate whitespace-nowrap px-4 py-2 text-mist"
                    title={value}
                  >
                    {value || (
                      <span className="text-mist-muted">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
