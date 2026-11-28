import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { CampaignChannel } from "@/lib/types";

const CHANNELS = [
  ["instagram_profile", "인스타그램 프로필"],
  ["youtube_profile", "유튜브 프로필"],
  ["instagram_ads", "인스타그램 광고"],
] as const satisfies ReadonlyArray<readonly [CampaignChannel, string]>;

export function CampaignTraffic({
  range,
}: {
  range: { from: string; to: string };
}) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["campaign-visits", range],
    queryFn: () => api.campaignVisits(range),
  });
  const totals: Partial<Record<CampaignChannel, number>> = {};
  const days = new Map<string, Partial<Record<CampaignChannel, number>>>();

  for (const { day, channel, visits } of data ?? []) {
    const counts = days.get(day) ?? {};
    counts[channel] = visits;
    days.set(day, counts);
    totals[channel] = (totals[channel] ?? 0) + visits;
  }

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="campaign-traffic-title">
      <h2 id="campaign-traffic-title" className="text-sm font-semibold">
        웹 유입 채널
      </h2>
      <p className="mt-1 text-sm text-ink-mute">
        대시보드 기간 기준. 태그가 있는 링크의 방문을 세며, 같은 탭에서 같은 채널로 30분 안에 다시 들어오면 1건으로 집계합니다.
      </p>
      <QueryState isLoading={isLoading} error={error} isEmpty={false}>
        <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-line">
          <table className="w-full min-w-[30rem] text-sm tabular-nums">
            <caption className="sr-only">채널별 기간 합계와 날짜별 방문 건수</caption>
            <thead className="sticky top-0 bg-canvas text-xs text-ink-sub">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left">날짜 (KST)</th>
                {CHANNELS.map(([channel, label]) => (
                  <th key={channel} scope="col" className="px-3 py-2.5 text-right">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="font-semibold">
                <th scope="row" className="px-3 py-2.5 text-left">기간 합계</th>
                {CHANNELS.map(([channel]) => (
                  <td key={channel} className="px-3 py-2.5 text-right">
                    {formatNumber(totals[channel] ?? 0)}
                  </td>
                ))}
              </tr>
              {Array.from(days, ([day, counts]) => (
                <tr key={day}>
                  <th scope="row" className="px-3 py-2 text-left font-medium">{day}</th>
                  {CHANNELS.map(([channel]) => (
                    <td key={channel} className="px-3 py-2 text-right">
                      {formatNumber(counts[channel] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </section>
  );
}
