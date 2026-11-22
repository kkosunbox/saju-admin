"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { DateRange, QueryState } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber, kstDate } from "@/lib/format";

const percent = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const ratio = (count: number, total: number) =>
  total ? percent.format(count / total) : "—";

/** 서버가 몇 분 전에 집계한 값인지 (서버에서 10분 동안 캐시합니다). */
function computedLabel(computedAt: string) {
  const minutes = Math.floor((Date.now() - Date.parse(computedAt)) / 60_000);
  return minutes < 1 ? "방금 집계" : `${minutes}분 전 집계`;
}

/** 한 줄: 이름 · 비율 막대 · 비율과 수 */
function RatioRow({
  label,
  count,
  total,
  sub,
}: {
  label: string;
  count: number;
  total: number;
  sub?: boolean;
}) {
  return (
    <li className="grid grid-cols-[6.5rem_1fr_7.5rem] items-center gap-3 text-sm">
      <span className={sub ? "pl-3 text-ink-mute" : "text-ink-sub"}>{label}</span>
      <div className="h-3 overflow-hidden rounded bg-canvas" aria-hidden>
        <div
          className={sub ? "h-full bg-accent/50" : "h-full bg-navy/80"}
          style={{ width: total ? `${(count / total) * 100}%` : 0 }}
        />
      </div>
      <span className="text-right tabular-nums">
        <span className={sub ? "text-ink-sub" : "font-semibold"}>{ratio(count, total)}</span>
        <span className="text-ink-mute"> · {formatNumber(count)}명</span>
      </span>
    </li>
  );
}

/** 가입일 범위로 고른 회원의 나이대와 컨텐츠 이용률 (고객 메뉴 상단). */
export function UserInsightsCard() {
  const titleId = useId();
  const [range, setRange] = useState(() => ({ from: kstDate(29), to: kstDate() }));
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-insights", range],
    queryFn: () => api.userInsights(range),
  });

  return (
    <section className="card p-4 sm:p-5" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-sm font-semibold">
            가입 회원 분석
            {data && (
              <span className="ml-2 font-normal text-ink-sub">
                {formatNumber(data.members)}명
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-ink-mute">
            가입일(게스트 승격은 승격일)이 기간 안인 지금 활성 회원. 이용률은 한 번이라도 써 본 회원의 비율입니다.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <DateRange from={range.from} to={range.to} onChange={setRange} />
          {data && (
            <span className="text-xs text-ink-mute">{computedLabel(data.computedAt)}</span>
          )}
        </div>
      </div>
      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.members}>
        {data && (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-medium text-ink-sub">
                나이대 (대표 프로필 생일 기준 만 나이)
              </h3>
              <ul className="space-y-2">
                {data.ages.map(({ label, members }) => (
                  <RatioRow key={label} label={label} count={members} total={data.members} />
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-medium text-ink-sub">컨텐츠 이용률</h3>
              <ul className="space-y-2">
                {data.contents.flatMap((content) => [
                  <RatioRow
                    key={content.key}
                    label={content.label}
                    count={content.users}
                    total={data.members}
                  />,
                  ...(content.items ?? []).map((item) => (
                    <RatioRow
                      key={`${content.key}:${item.key}`}
                      label={item.label}
                      count={item.users}
                      total={data.members}
                      sub
                    />
                  )),
                ])}
              </ul>
              <p className="mt-3 text-xs text-ink-mute">
                가입 전 게스트 때 이용도 셉니다. 유료는 연 열람권 기준(어드민 지급 제외)이고, 무료 컨텐츠는 결과까지 연 기록이 2026-11-20부터 남아 그 전 이용은 빠집니다.
              </p>
            </div>
          </div>
        )}
      </QueryState>
    </section>
  );
}
