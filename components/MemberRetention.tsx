"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { DateRange, Pagination, QueryState, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber, kstDate } from "@/lib/format";

/** 표가 너무 길어지지 않게 한 페이지에 보이는 첫 이용 기록일 수 */
const PAGE_SIZE = 20;

const percent = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function MemberRetention() {
  const titleId = useId();
  const [range, setRange] = useState(() => ({ from: kstDate(59), to: kstDate() }));
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ["member-retention", range],
    queryFn: () => api.memberRetention(range),
  });

  return (
    <section className="card p-4 sm:p-5" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-sm font-semibold">고객 리텐션</h2>
          <p className="mt-1 text-sm text-ink-mute">
            한국 시간 기준. 첫 이용 기록일로부터 1일, 7일, 30일째에 다시 이용한 고객(회원 + 게스트)의 비율입니다. 게스트 활동은 2026-11-23부터 기록합니다.
          </p>
        </div>
        <DateRange
          from={range.from}
          to={range.to}
          onChange={(next) => {
            setRange(next);
            setPage(1);
          }}
        />
      </div>
      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.cohorts.length}>
        {data && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {data.summary.map(({ day, returned, eligible }) => (
                <Stat
                  key={day}
                  label={`D${day}`}
                  value={eligible ? percent.format(returned / eligible) : "—"}
                  hint={eligible
                    ? `${formatNumber(returned)} / ${formatNumber(eligible)}명`
                    : "집계 대기"}
                />
              ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm tabular-nums">
                <caption className="sr-only">첫 이용 기록일별 고객 리텐션</caption>
                <thead className="sticky top-0 bg-canvas text-xs text-ink-sub">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">첫 이용 기록일</th>
                    <th scope="col" className="px-3 py-2.5 text-right">고객</th>
                    {data.summary.map(({ day }) => (
                      <th key={day} scope="col" className="px-3 py-2.5 text-right">
                        D{day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.cohorts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(({ day, members, returned }) => (
                    <tr key={day}>
                      <th scope="row" className="px-3 py-2 font-medium">{day}</th>
                      <td className="px-3 py-2 text-right">{formatNumber(members)}</td>
                      {data.summary.map(({ day: offset }) => {
                        const count = returned[offset];
                        return (
                          <td key={offset} className="px-3 py-2 text-right">
                            {count === null
                              ? <span className="text-ink-mute" aria-label="집계 대기">—</span>
                              : percent.format(count / members)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {data.cohorts.length > PAGE_SIZE && (
                <div className="border-t border-line">
                  <Pagination
                    page={page}
                    total={data.cohorts.length}
                    limit={PAGE_SIZE}
                    onChange={setPage}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-ink-mute">
              — 집계 대기. 재방문을 관측하는 날짜가 끝나면 반영됩니다.
            </p>
          </div>
        )}
      </QueryState>
    </section>
  );
}
