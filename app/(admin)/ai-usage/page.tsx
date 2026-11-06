"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { BarChart } from "@/components/BarChart";
import {
  DateRange,
  ErrorBox,
  Loading,
  PageHeader,
  Pagination,
  QueryState,
  Select,
  Stat,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  AI_FEATURE,
  AI_STATUS,
  contentTitle,
  formatDateTime,
  stepTitle,
  formatNumber,
  formatWon,
  kstDate,
} from "@/lib/format";
import type { AiUsageRow } from "@/lib/types";

const LIMIT = 50;

export default function AiUsagePage() {
  const [filter, setFilter] = useState({
    feature: "",
    userId: "",
    from: kstDate(29),
    to: kstDate(),
  });
  const [page, setPage] = useState(1);
  const update = (patch: Partial<typeof filter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const summary = useQuery({
    queryKey: ["ai-summary", filter],
    queryFn: () => api.aiUsageSummary(filter),
  });
  const calls = useQuery({
    queryKey: ["ai-usage", filter, page],
    queryFn: () => api.aiUsage({ ...filter, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const groups = useMemo(
    () => groupUsageCalls(calls.data?.items ?? []),
    [calls.data?.items],
  );
  const hasGroups = groups.some((group) => group.rows.length > 1);

  const { daily, byContent } = useMemo(() => {
    const days = new Map<string, number>();
    const contents = new Map<
      string,
      {
        key: string;
        feature: string;
        calls: number;
        failed: number;
        costKrw: number;
      }
    >();
    for (const row of summary.data?.rows ?? []) {
      days.set(row.day, (days.get(row.day) ?? 0) + row.costKrw);
      const key = `${row.feature}|${row.contentKey ?? ""}`;
      const entry = contents.get(key) ?? {
        key: row.contentKey ?? "-",
        feature: row.feature,
        calls: 0,
        failed: 0,
        costKrw: 0,
      };
      entry.calls += row.calls;
      entry.failed += row.failedCalls;
      entry.costKrw += row.costKrw;
      contents.set(key, entry);
    }
    const daily: { label: string; value: number }[] = [];
    if (filter.from && filter.to) {
      for (let day = filter.from; day <= filter.to; day = nextDay(day)) {
        daily.push({ label: day, value: Math.round(days.get(day) ?? 0) });
      }
    }
    return {
      daily,
      byContent: [...contents.values()].sort((a, b) => b.costKrw - a.costKrw),
    };
  }, [summary.data, filter.from, filter.to]);

  const total = summary.data?.total;

  return (
    <>
      <PageHeader
        title="AI 비용"
        description="Claude API 호출 1건마다 기록됩니다 (재시도 · 실패 포함). 원화는 호출 시점 환율로 계산합니다."
        actions={
          <>
            <Select
              value={filter.feature}
              onChange={(feature) => update({ feature })}
              options={AI_FEATURE}
              placeholder="전체 기능"
            />
            <input
              className="input w-28"
              placeholder="회원 번호"
              inputMode="numeric"
              value={filter.userId}
              onChange={(event) =>
                update({ userId: event.target.value.replace(/[^\d]/g, "") })
              }
            />
            <DateRange from={filter.from} to={filter.to} onChange={update} />
          </>
        }
      />
      {summary.isLoading && <Loading />}
      {summary.error && <ErrorBox error={summary.error} />}
      {total && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              emphasis
              label="비용"
              value={formatWon(total.costKrw)}
              hint={`$${total.costUsd.toFixed(2)}`}
            />
            <Stat
              label="호출"
              value={formatNumber(total.calls)}
              hint={`실패 ${formatNumber(total.failedCalls)}회`}
            />
            <Stat
              label="입력 토큰"
              value={formatNumber(total.inputTokens)}
              hint={`캐시 읽기 ${formatNumber(total.cacheReadTokens)}`}
            />
            <Stat label="출력 토큰" value={formatNumber(total.outputTokens)} />
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="card p-5 lg:col-span-3">
              <p className="mb-4 text-sm font-semibold">날짜별 비용</p>
              <BarChart data={daily} format={formatWon} height={160} />
            </div>
            <div className="card overflow-hidden lg:col-span-2">
              <p className="border-b border-line px-5 py-3.5 text-sm font-semibold">
                콘텐츠별 비용
              </p>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <tbody>
                    {byContent.map((row) => (
                      <tr key={`${row.feature}|${row.key}`}>
                        <td className="td">
                          <span className="text-xs text-ink-mute">
                            {AI_FEATURE[row.feature] ?? row.feature}
                          </span>
                          <span className="ml-1.5 text-sm">
                            {contentTitle(row.feature, row.key)}
                          </span>
                        </td>
                        <td className="td text-right text-ink-sub">
                          {formatNumber(row.calls)}회
                        </td>
                        <td className="td text-right font-semibold">
                          {formatWon(row.costKrw)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3.5">
          <p className="text-sm font-semibold">호출 기록</p>
          <p className="text-xs text-ink-mute">
            이 페이지에서 같은 풀이·상담·운세의 호출은 한 줄로 묶었습니다. 행을
            누르면 개별 호출이 펼쳐집니다.
          </p>
        </div>
        <QueryState
          isLoading={calls.isLoading}
          error={calls.error}
          isEmpty={!calls.data?.items.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {hasGroups && <th className="th w-8" />}
                  <th className="th">일시</th>
                  <th className="th">회원</th>
                  <th className="th">기능</th>
                  <th className="th">콘텐츠 · 단계</th>
                  <th className="th">모델</th>
                  <th className="th">결과</th>
                  <th className="th text-right">입력 / 출력</th>
                  <th className="th text-right">캐시 읽기</th>
                  <th className="th text-right">걸린 시간</th>
                  <th className="th text-right">비용</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const multiple = group.rows.length > 1;
                  const open = !!openGroups[group.key];
                  const toggle = () =>
                    setOpenGroups((current) => ({
                      ...current,
                      [group.key]: !current[group.key],
                    }));
                  if (!multiple) {
                    return (
                      <tr key={group.key}>
                        {hasGroups && <td className="td w-8" />}
                        <CallCells row={group.rows[0]} />
                      </tr>
                    );
                  }
                  return (
                    <Fragment key={group.key}>
                      <GroupRow
                        group={group}
                        open={open}
                        onToggle={toggle}
                      />
                      {open &&
                        group.rows.map((row) => (
                          <tr key={row.id} className="bg-canvas">
                            <td className="td w-8" />
                            <CallCells row={row} />
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </QueryState>
        {calls.data && (
          <Pagination
            page={page}
            total={calls.data.total}
            limit={LIMIT}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}

function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86400_000)
    .toISOString()
    .slice(0, 10);
}

type UsageGroup = { key: string; rows: AiUsageRow[] };

function groupUsageCalls(items: AiUsageRow[]): UsageGroup[] {
  const map = new Map<string, AiUsageRow[]>();
  for (const row of items) {
    const key =
      row.refId != null
        ? JSON.stringify(["ref", row.feature, row.refId])
        : row.contentKey
          ? JSON.stringify([row.userId, row.feature, row.contentKey])
          : `row:${row.id}`;
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }
  return [...map.entries()]
    .map(([key, rows]) => ({
      key,
      rows: rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .sort((a, b) => b.rows[0].createdAt.localeCompare(a.rows[0].createdAt));
}

function CallCells({ row }: { row: AiUsageRow }) {
  return (
    <>
      <td className="td text-ink-sub">{formatDateTime(row.createdAt)}</td>
      <td className="td">
        {row.userId ? (
          <Link
            className="text-link hover:underline"
            href={`/users/${row.userId}`}
            onClick={(event) => event.stopPropagation()}
          >
            #{row.userId}
          </Link>
        ) : (
          "-"
        )}
      </td>
      <td className="td">{AI_FEATURE[row.feature] ?? row.feature}</td>
      <td className="td">
        {contentTitle(row.feature, row.contentKey)}
        {row.step && (
          <span className="text-ink-mute">
            {" · "}
            {stepTitle(row.feature, row.contentKey, row.step)}
          </span>
        )}
      </td>
      <td className="td text-xs text-ink-sub">{row.model ?? "-"}</td>
      <td className="td" title={row.errorMessage ?? undefined}>
        <StatusBadge map={AI_STATUS} value={row.status} />
      </td>
      <td className="td text-right text-ink-sub">
        {formatNumber(row.inputTokens)} / {formatNumber(row.outputTokens)}
      </td>
      <td className="td text-right text-ink-sub">
        {formatNumber(row.cacheReadTokens)}
      </td>
      <td className="td text-right text-ink-sub">
        {(row.latencyMs / 1000).toFixed(1)}초
      </td>
      <td className="td text-right font-semibold">{formatWon(row.costKrw)}</td>
    </>
  );
}

function GroupRow({
  group,
  open,
  onToggle,
}: {
  group: UsageGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const { rows } = group;
  const head = rows[0];
  const steps = unique(
    rows
      .map((row) => row.step)
      .filter((step): step is string => !!step),
  );
  const models = unique(rows.map((row) => row.model).filter(Boolean));
  const statuses = statusCounts(rows);
  const newest = formatDateTime(head.createdAt);
  const oldest = formatDateTime(rows[rows.length - 1].createdAt);
  const errors = rows
    .map((row) => row.errorMessage)
    .filter((message): message is string => !!message);

  return (
    <tr
      className={clsx(
        "cursor-pointer hover:bg-canvas",
        open && "bg-accent-soft/70",
      )}
      onClick={onToggle}
    >
      <td className="td w-8">
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-mute"
          aria-expanded={open}
          aria-label={open ? "개별 호출 접기" : `${rows.length}건 펼치기`}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          <ChevronRight
            size={14}
            className={clsx("transition-transform", open && "rotate-90")}
          />
        </button>
      </td>
      <td className="td text-ink-sub">
        {newest}
        {oldest !== newest && (
          <span className="mt-0.5 block text-xs text-ink-mute">~ {oldest}</span>
        )}
      </td>
      <td className="td">
        {head.userId ? (
          <Link
            className="text-link hover:underline"
            href={`/users/${head.userId}`}
            onClick={(event) => event.stopPropagation()}
          >
            #{head.userId}
          </Link>
        ) : (
          "-"
        )}
      </td>
      <td className="td">{AI_FEATURE[head.feature] ?? head.feature}</td>
      <td className="td">
        {contentTitle(head.feature, head.contentKey)}
        {steps.length > 0 && (
          <span className="text-ink-mute">
            {" · "}
            {steps
              .map((step) => stepTitle(head.feature, head.contentKey, step))
              .join(" · ")}
          </span>
        )}
      </td>
      <td className="td text-xs text-ink-sub">
        {models.length === 0
          ? "-"
          : models.length === 1
            ? models[0]
            : `${models[0]} 외 ${models.length - 1}`}
      </td>
      <td className="td" title={errors.length ? errors.join("\n") : undefined}>
        {statuses.length === 1 ? (
          <StatusBadge map={AI_STATUS} value={statuses[0][0]} />
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {statuses.map(([status, count]) => (
              <span key={status} className="inline-flex items-center gap-1">
                <StatusBadge map={AI_STATUS} value={status} />
                <span className="text-xs text-ink-mute">{count}</span>
              </span>
            ))}
          </span>
        )}
      </td>
      <td className="td text-right text-ink-sub">
        {formatNumber(sum(rows, (row) => row.inputTokens))} /{" "}
        {formatNumber(sum(rows, (row) => row.outputTokens))}
      </td>
      <td className="td text-right text-ink-sub">
        {formatNumber(sum(rows, (row) => row.cacheReadTokens))}
      </td>
      <td className="td text-right text-ink-sub">
        {(sum(rows, (row) => row.latencyMs) / 1000).toFixed(1)}초
      </td>
      <td className="td text-right font-semibold">{formatWon(sumCost(rows))}</td>
    </tr>
  );
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sum(rows: AiUsageRow[], pick: (row: AiUsageRow) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function sumCost(rows: AiUsageRow[]): number | null {
  const values = rows
    .map((row) => (row.costKrw == null ? null : Number(row.costKrw)))
    .filter((value): value is number => value != null && Number.isFinite(value));
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0);
}

function statusCounts(rows: AiUsageRow[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return [...counts.entries()];
}
