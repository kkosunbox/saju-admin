"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DateRange, PageHeader, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber, formatPercent, kstDate } from "@/lib/format";

export default function PromoPage() {
  const [filter, setFilter] = useState({
    screen: "",
    from: kstDate(29),
    to: kstDate(),
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["promo", filter],
    queryFn: () => api.promoSummary(filter),
  });
  // The screen list comes from the unfiltered rows so picking one screen keeps the others selectable.
  const all = useQuery({
    queryKey: ["promo", { ...filter, screen: "" }],
    queryFn: () => api.promoSummary({ ...filter, screen: "" }),
  });
  const screens = useMemo(
    () =>
      [...new Set((all.data?.rows ?? []).map((row) => row.screen))]
        .sort()
        .map((screen) => [screen, screen] as [string, string]),
    [all.data],
  );

  return (
    <>
      <PageHeader
        title="콘텐츠 성과"
        description="앱의 유료 콘텐츠 카드별 노출 · 클릭, 그리고 클릭한 사람 중 24시간 안에 그 콘텐츠를 연 사람(상담은 상담 시작)."
        actions={
          <>
            <Select
              value={filter.screen}
              onChange={(screen) => setFilter({ ...filter, screen })}
              options={screens}
              placeholder="전체 화면"
            />
            <DateRange
              from={filter.from}
              to={filter.to}
              onChange={(range) => setFilter({ ...filter, ...range })}
            />
          </>
        }
      />
      <div className="card overflow-hidden">
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.rows.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">화면</th>
                  <th className="th">카드</th>
                  <th className="th text-right">노출</th>
                  <th className="th text-right">클릭</th>
                  <th className="th text-right">클릭률</th>
                  <th className="th text-right">클릭한 사람</th>
                  <th className="th text-right">구매 · 이용</th>
                  <th className="th text-right">전환율</th>
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((row) => (
                  <tr key={`${row.screen}|${row.item}`}>
                    <td className="td text-ink-sub">{row.screen}</td>
                    <td className="td font-mono text-xs">{row.item}</td>
                    <td className="td text-right">{formatNumber(row.views)}</td>
                    <td className="td text-right">
                      {formatNumber(row.clicks)}
                    </td>
                    <td className="td text-right">
                      <RateBar rate={row.clickRate} />
                    </td>
                    <td className="td text-right">
                      {formatNumber(row.clickers)}
                    </td>
                    <td className="td text-right font-semibold">
                      {formatNumber(row.converted)}
                    </td>
                    <td className="td text-right">
                      <RateBar rate={row.conversionRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
      </div>
    </>
  );
}

function RateBar({ rate }: { rate: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: `${Math.min(rate, 1) * 100}%` }}
        />
      </span>
      <span className="w-12 text-right">{formatPercent(rate)}</span>
    </span>
  );
}
