"use client";

const LEFT = [
  "Lead Full Name",
  "phone_1",
  "E-mail Address",
  "Enquiry Date",
  "project_name",
  "Remarks / Notes",
];

const RIGHT = [
  "name",
  "mobile_without_country_code",
  "email",
  "created_at",
  "data_source",
  "crm_note",
];

// Hand-picked so lines cross the board rather than running in neat parallel
// rows — it should read as "routing", not a static list.
const ROUTES = [
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
];

export default function PatchboardHero() {
  const leftX = 20;
  const rightX = 500;
  const width = 660;
  const rowGap = 34;
  const top = 16;

  const yFor = (i: number) => top + i * rowGap + 10;

  return (
    <svg
      viewBox={`0 0 ${width} ${top * 2 + LEFT.length * rowGap}`}
      className="w-full"
      role="img"
      aria-label="Diagram showing raw CSV columns being routed into GrowEasy CRM fields"
    >
      {ROUTES.map(([li, ri], idx) => {
        const y1 = yFor(li);
        const y2 = yFor(ri);
        const midX = (leftX + rightX) / 2;
        return (
          <path
            key={idx}
            d={`M ${leftX + 128} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${
              rightX - 4
            } ${y2}`}
            fill="none"
            stroke="#E8A33D"
            strokeWidth="1.5"
            className="route-line"
            style={{ animationDelay: `${idx * 0.18}s` }}
          />
        );
      })}

      {LEFT.map((label, i) => (
        <g key={label} transform={`translate(${leftX}, ${yFor(i) - 12})`}>
          <rect
            width="132"
            height="24"
            rx="4"
            fill="#171A21"
            stroke="#262B36"
          />
          <text
            x="10"
            y="16"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="#8B92A5"
          >
            {label.length > 18 ? label.slice(0, 17) + "…" : label}
          </text>
          <circle cx="132" cy="12" r="3" fill="#E8A33D" />
        </g>
      ))}

      {RIGHT.map((label, i) => (
        <g key={label} transform={`translate(${rightX - 4}, ${yFor(i) - 12})`}>
          <circle cx="0" cy="12" r="3" fill="#4FD1C5" />
          <rect
            x="8"
            width="132"
            height="24"
            rx="4"
            fill="#171A21"
            stroke="#4FD1C5"
            strokeOpacity="0.35"
          />
          <text
            x="18"
            y="16"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="#E7E9EE"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}
