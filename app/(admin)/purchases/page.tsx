"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  DateRange,
  labelsOf,
  PageHeader,
  Pagination,
  QueryState,
  Select,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  formatDateTime,
  formatNumber,
  formatWon,
  LIVE_ENVIRONMENTS,
  PURCHASE_STATUS,
  STORE,
} from "@/lib/format";

const LIMIT = 30;

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    status: "",
    store: "",
    kind: "",
    userId: "",
    liveOnly: false,
    from: "",
    to: "",
  });
  const update = (patch: Partial<typeof filter>) => {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchases", page, filter],
    queryFn: () => api.purchases({ ...filter, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="결제"
        description="포인트 충전과 구독 결제. 결제 대기는 결제창을 열고 끝내지 않은 주문입니다."
      />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <Select
            value={filter.status}
            onChange={(status) => update({ status })}
            options={labelsOf(PURCHASE_STATUS)}
            placeholder="전체 상태"
          />
          <Select
            value={filter.store}
            onChange={(store) => update({ store })}
            options={STORE}
            placeholder="전체 스토어"
          />
          <Select
            value={filter.kind}
            onChange={(kind) => update({ kind })}
            options={{ points: "포인트", subscription: "구독" }}
            placeholder="전체 종류"
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
          <label className="flex items-center gap-1.5 text-sm text-ink-sub">
            <input
              type="checkbox"
              checked={filter.liveOnly}
              onChange={(event) => update({ liveOnly: event.target.checked })}
            />
            실결제만
          </label>
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
                  <th className="th">요청 일시</th>
                  <th className="th">회원</th>
                  <th className="th">스토어</th>
                  <th className="th">상품</th>
                  <th className="th">상태</th>
                  <th className="th text-right">금액</th>
                  <th className="th text-right">포인트</th>
                  <th className="th">완료 · 환불</th>
                  <th className="th">거래 번호</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id}>
                    <td className="td text-ink-mute">{row.id}</td>
                    <td className="td text-ink-sub">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="td">
                      <Link
                        className="text-link hover:underline"
                        href={`/users/${row.userId}`}
                      >
                        #{row.userId}
                      </Link>
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
                      <StatusBadge map={PURCHASE_STATUS} value={row.status} />
                      {row.failureReason && (
                        <span
                          className="ml-1.5 text-xs text-ink-mute"
                          title={row.failureReason}
                        >
                          {row.failureReason.slice(0, 20)}
                        </span>
                      )}
                    </td>
                    <td className="td text-right font-semibold">
                      {formatWon(row.amountKrw)}
                    </td>
                    <td className="td text-right text-ink-sub">
                      {row.kind === "points"
                        ? `${formatNumber(row.points + row.bonusPoints)}P`
                        : "-"}
                    </td>
                    <td className="td text-ink-sub">
                      {row.refundedAt
                        ? `환불 ${formatDateTime(row.refundedAt)}`
                        : formatDateTime(row.completedAt)}
                    </td>
                    <td
                      className="td max-w-40 truncate font-mono text-xs text-ink-mute"
                      title={row.storeTransactionId ?? row.orderId ?? ""}
                    >
                      {row.storeTransactionId ?? row.orderId ?? "-"}
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
