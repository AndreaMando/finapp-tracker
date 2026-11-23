"use client";

import type { DebtPoint } from "@/lib/mortgage-math";

// Debt-over-time line for a mortgage: the part already paid is a solid accent
// line over a faint filled area, the projected remainder is a dashed line, and
// a dot marks "today". Inline SVG stretched to its box (the strokes use
// non-scaling-stroke so they stay crisp); the marker is an HTML dot because a
// stretched SVG circle would turn into an ellipse.
export function MortgageDebtChart({
  points,
  paid,
  startLabel,
  endLabel,
  maxLabel,
  ariaLabel,
  legendPaid,
  legendProjected,
  className = "h-36 sm:h-48",
}: {
  points: DebtPoint[];
  /** Payments already made — where "today" sits on the curve. */
  paid: number;
  startLabel: string;
  endLabel: string;
  /** Text for the top-left corner, e.g. the starting debt. */
  maxLabel: string;
  ariaLabel: string;
  legendPaid: string;
  legendProjected: string;
  className?: string;
}) {
  const W = 1000;
  const H = 200;
  const padTop = 8;
  const padBottom = 4;
  const count = points.length - 1;
  const max = Math.max(...points.map((p) => p.debt), 1);
  const k = Math.max(0, Math.min(count, paid));

  const x = (i: number) => (count > 0 ? (i / count) * W : 0);
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const path = (from: number, to: number) =>
    points
      .slice(from, to + 1)
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${x(from + idx).toFixed(1)},${y(p.debt).toFixed(1)}`)
      .join(" ");

  const paidPath = k > 0 ? path(0, k) : "";
  const projectedPath = k < count ? path(k, count) : "";
  const areaPath = k > 0 ? `${paidPath} L${x(k).toFixed(1)},${H} L0,${H} Z` : "";

  const dotLeft = count > 0 ? (k / count) * 100 : 0;
  const dotTop = (y(points[k]?.debt ?? 0) / H) * 100;

  return (
    <figure>
      <div className="flex items-center justify-between gap-4 mb-2 text-xs text-ink-muted">
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-accent" aria-hidden="true" />
            {legendPaid}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 border-t-2 border-dashed border-ink-faint" aria-hidden="true" />
            {legendProjected}
          </span>
        </span>
        <span className="font-mono tabular-nums text-ink-faint">{maxLabel}</span>
      </div>

      <div className={`relative w-full ${className}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label={ariaLabel}
        >
          <line x1="0" y1={H - 1} x2={W} y2={H - 1} style={{ stroke: "var(--hairline)" }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {areaPath && <path d={areaPath} style={{ fill: "var(--accent)", opacity: 0.1 }} />}
          {projectedPath && (
            <path
              d={projectedPath}
              fill="none"
              style={{ stroke: "var(--ink-faint)" }}
              strokeWidth="2"
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {paidPath && (
            <path d={paidPath} fill="none" style={{ stroke: "var(--accent)" }} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        <span
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent border-2 border-surface"
          style={{ left: `${dotLeft}%`, top: `${dotTop}%` }}
          aria-hidden="true"
        />
      </div>

      <figcaption className="flex justify-between mt-2 text-[10px] sm:text-xs font-mono text-ink-faint capitalize">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </figcaption>
    </figure>
  );
}
