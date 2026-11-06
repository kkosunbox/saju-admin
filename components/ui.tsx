"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { useEffect } from "react";
import { errorMessage } from "@/lib/api";
import type { Tone } from "@/lib/format";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-ink-mute">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

const TONES: Record<Tone, string> = {
  gray: "bg-canvas text-ink-sub",
  blue: "bg-accent-soft text-[#1e7fc0]",
  green: "bg-[#e5f6ec] text-[#2a8552]",
  amber: "bg-[#fff4de] text-[#a56b10]",
  red: "bg-[#fdecec] text-[#c43a3a]",
  navy: "bg-navy text-white",
};

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  map,
  value,
}: {
  map: Record<string, [string, Tone]>;
  value: string;
}) {
  const [label, tone] = map[value] ?? [value, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-5",
        emphasis ? "border-navy bg-navy text-white" : "border-line bg-white",
      )}
    >
      <p
        className={clsx(
          "text-xs font-semibold",
          emphasis ? "text-white/60" : "text-ink-mute",
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && (
        <p
          className={clsx(
            "mt-1 text-xs",
            emphasis ? "text-white/60" : "text-ink-mute",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function Loading({ label = "불러오는 중" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-mute">
      <LoaderCircle size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="rounded-xl border border-[#f6caca] bg-[#fdecec] px-4 py-3 text-sm text-[#c43a3a]">
      {errorMessage(error)}
    </div>
  );
}

export function Empty({
  children = "데이터가 없습니다.",
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="py-16 text-center text-sm text-ink-mute">{children}</div>
  );
}

/** Loading, error and empty states around a list. */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) return <Loading />;
  if (error)
    return (
      <div className="p-4">
        <ErrorBox error={error} />
      </div>
    );
  if (isEmpty) return <Empty />;
  return <>{children}</>;
}

export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-ink-mute">
      <span>총 {total.toLocaleString("ko-KR")}건</span>
      <div className="flex items-center gap-1">
        <button
          className="btn-outline h-8 px-2"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-2 font-semibold text-ink">
          {page} / {pages}
        </span>
        <button
          className="btn-outline h-8 px-2"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string> | [string, string][];
  placeholder?: string;
}) {
  const entries = Array.isArray(options) ? options : Object.entries(options);
  return (
    <select
      className="input pr-8"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {entries.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function labelsOf(
  map: Record<string, [string, Tone]>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(map).map(([key, [label]]) => [key, label]),
  );
}

export function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        className="input"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value, to })}
      />
      <span className="text-ink-mute">~</span>
      <input
        type="date"
        className="input"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange({ from, to: e.target.value })}
      />
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[8vh]"
      onMouseDown={onClose}
    >
      <div
        className={clsx(
          "w-full rounded-2xl bg-white shadow-2xl",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            className="rounded-md p-1 text-ink-mute hover:bg-canvas"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

export function InfoRows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4 py-2.5 text-sm">
          <dt className="w-24 shrink-0 text-ink-mute">{label}</dt>
          <dd className="min-w-0 text-ink [overflow-wrap:anywhere]">
            {value ?? "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
