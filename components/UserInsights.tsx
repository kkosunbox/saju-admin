"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { DateRange, QueryState, Select } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber, kstDate } from "@/lib/format";
import type { UserInsights } from "@/lib/types";

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

function MbtiDistribution({
  entries,
}: {
  entries: NonNullable<UserInsights["mbti"]>;
}) {
  const types = entries.filter(({ label }) => label !== "미입력");
  const missing = entries.find(({ label }) => label === "미입력");
  const total = entries.reduce((sum, { members }) => sum + members, 0);

  return (
    <div className="@container mt-5 border-t border-line pt-4">
      <h3 className="mb-2 text-xs font-medium text-ink-sub">
        MBTI 분포 (대표 프로필이 있는 고객 기준)
      </h3>
      {total ? (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line @xs:grid-cols-4">
          {types.map(({ label, members }) => (
            <div key={label} className="min-w-0 bg-white px-2 py-1.5">
              <dt className="text-xs font-semibold">{label}</dt>
              <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-1 text-xs tabular-nums">
                <span className="font-medium">{ratio(members, total)}</span>
                <span className="text-ink-mute">{formatNumber(members)}명</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-ink-mute">대표 프로필을 등록한 고객이 없습니다.</p>
      )}
      {total > 0 && missing && (
        <p className="mt-2 text-xs text-ink-mute">
          <span className="font-medium text-ink-sub tabular-nums">
            미입력 {ratio(missing.members, total)} · {formatNumber(missing.members)}명
          </span>
          {" (사주 추정 포함)"}
        </p>
      )}
    </div>
  );
}

/** 가입일 범위로 고른 고객의 나이대, MBTI, 컨텐츠 이용률. */
export function UserInsightsCard() {
  const titleId = useId();
  const [range, setRange] = useState(() => ({ from: kstDate(6), to: kstDate() }));
  const [status, setStatus] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-insights", range, status],
    queryFn: () => api.userInsights({ ...range, status: status || undefined }),
  });

  return (
    <section className="card p-4 sm:p-5" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-sm font-semibold">
            가입 고객 분석
            {data && (
              <span className="ml-2 font-normal text-ink-sub">
                {formatNumber(data.members)}명
                {!status &&
                  ` (회원 ${formatNumber(data.members - data.guests)} · 게스트 ${formatNumber(data.guests)})`}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-ink-mute">
            회원은 가입일(게스트 승격은 승격일), 게스트는 게스트가 된 날이 기간 안인 고객. 이용률은 한 번이라도 써 본 사람의 비율입니다.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-2">
            <Select
              value={status}
              onChange={setStatus}
              options={{ active: "회원", guest: "게스트" }}
              placeholder="회원 + 게스트"
            />
            <DateRange from={range.from} to={range.to} onChange={setRange} />
          </div>
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
              {data.mbti && <MbtiDistribution entries={data.mbti} />}
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
