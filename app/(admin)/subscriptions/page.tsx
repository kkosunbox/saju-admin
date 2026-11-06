"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  labelsOf,
  MemberLink,
  PageHeader,
  Pagination,
  QueryState,
  Select,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  formatDateTime,
  formatWon,
  LIVE_ENVIRONMENTS,
  STORE,
  SUBSCRIPTION_STATUS,
} from "@/lib/format";

const LIMIT = 30;

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: "", store: "", userId: "" });
  const update = (patch: Partial<typeof filter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["subscriptions", page, filter],
    queryFn: () => api.subscriptions({ ...filter, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="구독"
        description="해지 예약은 이번 기간이 끝날 때까지 이용할 수 있는 구독입니다."
      />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <Select
            value={filter.status}
            onChange={(status) => update({ status })}
            options={labelsOf(SUBSCRIPTION_STATUS)}
            placeholder="전체 상태"
          />
          <Select
            value={filter.store}
            onChange={(store) => update({ store })}
            options={STORE}
            placeholder="전체 스토어"
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
        </div>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.items.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">번호</th>
                  <th className="th">회원</th>
                  <th className="th">스토어</th>
                  <th className="th">상품</th>
                  <th className="th">상태</th>
                  <th className="th text-right">금액</th>
                  <th className="th text-right">회차</th>
                  <th className="th">이번 기간</th>
                  <th className="th">다음 결제</th>
                  <th className="th">카드</th>
                  <th className="th">시작</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id}>
                    <td className="td text-ink-mute">{row.id}</td>
                    <td className="td">
                      <MemberLink userId={row.userId} email={row.userEmail} />
                    </td>
                    <td className="td">
                      {STORE[row.store] ?? row.store}
                      {!LIVE_ENVIRONMENTS.includes(row.environment) && (
                        <span className="ml-1.5">
                          <Badge tone="amber">{row.environment}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="td">{row.productId}</td>
                    <td className="td">
                      <StatusBadge
                        map={SUBSCRIPTION_STATUS}
                        value={row.status}
                      />
                      {row.failedCharges > 0 && (
                        <span className="ml-1.5 text-xs text-danger">
                          실패 {row.failedCharges}회
                        </span>
                      )}
                    </td>
                    <td className="td text-right font-semibold">
                      {formatWon(row.priceKrw)}
                    </td>
                    <td className="td text-right">{row.periodCount}</td>
                    <td className="td text-ink-sub">
                      ~ {formatDateTime(row.currentPeriodEnd)}
                    </td>
                    <td className="td text-ink-sub">
                      {row.autoRenew
                        ? formatDateTime(row.nextChargeAt)
                        : "자동 갱신 꺼짐"}
                    </td>
                    <td className="td text-ink-sub">{row.cardLabel ?? "-"}</td>
                    <td className="td text-ink-sub">
                      {formatDateTime(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
        {data && (
          <Pagination
            page={page}
            total={data.total}
            limit={LIMIT}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
