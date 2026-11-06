"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  formatDateTime,
  formatNumber,
  formatWon,
  kstDate,
} from "@/lib/format";

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
                          <span className="ml-1.5 font-mono text-xs">
                            {row.key}
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
        <p className="border-b border-line px-5 py-3.5 text-sm font-semibold">
          호출 기록
        </p>
        <QueryState
          isLoading={calls.isLoading}
          error={calls.error}
          isEmpty={!calls.data?.items.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
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
                {calls.data?.items.map((row) => (
                  <tr key={row.id}>
                    <td className="td text-ink-sub">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="td">
                      {row.userId ? (
                        <Link
                          className="text-link hover:underline"
                          href={`/users/${row.userId}`}
                        >
                          #{row.userId}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="td">
                      {AI_FEATURE[row.feature] ?? row.feature}
                    </td>
                    <td className="td font-mono text-xs">
                      {row.contentKey ?? "-"}
                      {row.step && (
                        <span className="text-ink-mute"> · {row.step}</span>
                      )}
                    </td>
                    <td className="td text-xs text-ink-sub">
                      {row.model ?? "-"}
                    </td>
                    <td className="td" title={row.errorMessage ?? undefined}>
                      <StatusBadge map={AI_STATUS} value={row.status} />
                    </td>
                    <td className="td text-right text-ink-sub">
                      {formatNumber(row.inputTokens)} /{" "}
                      {formatNumber(row.outputTokens)}
                    </td>
                    <td className="td text-right text-ink-sub">
                      {formatNumber(row.cacheReadTokens)}
                    </td>
                    <td className="td text-right text-ink-sub">
                      {(row.latencyMs / 1000).toFixed(1)}초
                    </td>
                    <td className="td text-right font-semibold">
                      {formatWon(row.costKrw)}
                    </td>
                  </tr>
                ))}
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
