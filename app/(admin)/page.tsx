"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { BarChart } from "@/components/BarChart";
import {
  DateRange,
  ErrorBox,
  Loading,
  PageHeader,
  Stat,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  formatNumber,
  formatWon,
  kstDate,
  SUBSCRIPTION_STATUS,
  USER_STATUS,
} from "@/lib/format";

export default function DashboardPage() {
  const [range, setRange] = useState({ from: kstDate(29), to: kstDate() });
  const [includeTest, setIncludeTest] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", range, includeTest],
    queryFn: () => api.dashboard({ ...range, includeTest }),
  });

  const today = data?.series[data.series.length - 1];

  return (
    <>
      <PageHeader
        title="대시보드"
        description="기간 합계와 날짜별 추이 (한국 시간 기준)"
        actions={
          <>
            <label className="flex items-center gap-1.5 text-sm text-ink-sub">
              <input
                type="checkbox"
                checked={includeTest}
                onChange={(event) => setIncludeTest(event.target.checked)}
              />
              테스트 결제 포함
            </label>
            <DateRange from={range.from} to={range.to} onChange={setRange} />
          </>
        }
      />
      {isLoading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              emphasis
              label="결제 금액"
              value={formatWon(data.total.amountKrw)}
              hint={`${formatNumber(data.total.payments)}건 · 환불 ${formatWon(data.total.refundedKrw)}`}
            />
            <Stat
              label="신규 회원"
              value={formatNumber(data.total.members)}
              hint={`게스트 ${formatNumber(data.total.guests)}명`}
            />
            <Stat
              label="AI 비용"
              value={formatWon(data.total.aiCostKrw)}
              hint={`${formatNumber(data.total.aiCalls)}회 호출`}
            />
            <Link href="/inquiries" className="block">
              <Stat
                label="답변 대기 문의"
                value={formatNumber(data.pendingInquiries)}
                hint={
                  data.pendingInquiries
                    ? "문의 화면에서 답변하기"
                    : "모두 답변했어요"
                }
              />
            </Link>
          </div>

          {today && (
            <div className="card flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 text-sm">
              <span className="font-semibold">오늘 ({today.day.slice(5)})</span>
              <span className="text-ink-sub">
                결제 {formatWon(today.amountKrw)} · {today.payments}건
              </span>
              <span className="text-ink-sub">
                신규 회원 {today.members} · 게스트 {today.guests}
              </span>
              <span className="text-ink-sub">
                AI {formatWon(today.aiCostKrw)} · {today.aiCalls}회
              </span>
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-3">
            <ChartCard title="결제 금액">
              <BarChart
                data={data.series.map((d) => ({
                  label: d.day,
                  value: d.amountKrw,
                }))}
                format={formatWon}
              />
            </ChartCard>
            <ChartCard title="신규 회원">
              <BarChart
                data={data.series.map((d) => ({
                  label: d.day,
                  value: d.members,
                }))}
                format={(v) => `${v}명`}
              />
            </ChartCard>
            <ChartCard title="AI 비용">
              <BarChart
                data={data.series.map((d) => ({
                  label: d.day,
                  value: d.aiCostKrw,
                }))}
                format={formatWon}
              />
            </ChartCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <CountCard
              title="회원 현황 (지금)"
              entries={Object.entries(USER_STATUS).map(([key, [label]]) => [
                label,
                data.users[key as keyof typeof data.users] ?? 0,
              ])}
            />
            <CountCard
              title="구독 현황 (지금)"
              entries={Object.entries(SUBSCRIPTION_STATUS).map(
                ([key, [label]]) => [label, data.subscriptions[key] ?? 0],
              )}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="mb-4 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function CountCard({
  title,
  entries,
}: {
  title: string;
  entries: [string, number][];
}) {
  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-4 gap-2">
        {entries.map(([label, count]) => (
          <div key={label} className="rounded-lg bg-canvas px-3 py-2.5">
            <p className="text-xs text-ink-mute">{label}</p>
            <p className="mt-0.5 text-lg font-bold">{formatNumber(count)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
