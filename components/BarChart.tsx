"use client";

import clsx from "clsx";

/** Daily bars with the value on hover; the tallest bar is in the accent color. */
export function BarChart({
  data,
  format,
  height = 120,
}: {
  data: { label: string; value: number }[];
  format: (value: number) => string;
  height?: number;
}) {
  const max = Math.max(...data.map((point) => point.value), 0);
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((point) => (
          <div
            key={point.label}
            className="group relative flex h-full flex-1 items-end"
          >
            <div
              className={clsx(
                "w-full rounded-t-[3px] transition-colors",
                point.value > 0 && point.value === max
                  ? "bg-accent"
                  : "bg-navy/80 group-hover:bg-navy",
              )}
              style={{
                height: max
                  ? `${Math.max((point.value / max) * 100, point.value > 0 ? 3 : 0)}%`
                  : 0,
              }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
              {point.label.slice(5)} · {format(point.value)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-mute">
        <span>{data[0]?.label.slice(5)}</span>
        <span>{data[data.length - 1]?.label.slice(5)}</span>
      </div>
    </div>
  );
}
