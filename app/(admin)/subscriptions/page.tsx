"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  ErrorBox,
  Field,
  InfoRows,
  labelsOf,
  MemberLink,
  Modal,
  PageHeader,
  Pagination,
  QueryState,
  Select,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Subscription } from "@/lib/types";
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
  const [selected, setSelected] = useState<Subscription | null>(null);
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
        description="해지 예약은 이번 기간이 끝날 때까지 이용할 수 있는 구독입니다. 구독 환불은 문의로만 받습니다 — '혜택 · 환불'에서 혜택 사용 내역을 확인하고 환불 후 종료하세요."
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
                  <th className="th" />
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
                    <td className="td">
                      <button
                        className="btn-outline whitespace-nowrap"
                        onClick={() => setSelected(row)}
                      >
                        혜택 · 환불
                      </button>
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
      {selected && (
        <BenefitsModal
          subscription={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

const BENEFIT_KIND: Record<string, string> = {
  consult: "운알톡",
  monthly: "월별 상세운세",
  attendance: "출석 2배",
};

const REFUND_WINDOW_MS = 7 * 86_400_000;

/** 혜택 사용 내역(환불 판단용)과 "환불 후 종료". */
function BenefitsModal({
  subscription: row,
  onClose,
}: {
  subscription: Subscription;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription-benefits", row.id],
    queryFn: () => api.subscriptionBenefits(row.id),
  });
  const refund = useMutation({
    mutationFn: () => api.refundSubscription(row.id, { reason: reason.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscription-benefits", row.id],
      });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
  const current =
    data?.usage.filter((u) => u.periodCount === row.periodCount) ?? [];
  // 모달을 연 시각 기준 (렌더 중에 시계를 읽지 않는다)
  const [openedAt] = useState(() => Date.now());
  const withinWindow =
    openedAt - new Date(row.currentPeriodStart).getTime() <= REFUND_WINDOW_MS;
  const canRefund =
    row.store === "toss" && row.status !== "expired" && !refund.isSuccess;
  const valid = reason.trim().length >= 2 && confirmed;

  return (
    <Modal title={`구독 #${row.id} 혜택 · 환불`} onClose={onClose} wide>
      <div className="space-y-5">
        <InfoRows
          rows={[
            [
              "회원",
              <MemberLink key="m" userId={row.userId} email={row.userEmail} />,
            ],
            [
              "상태",
              <StatusBadge
                key="s"
                map={SUBSCRIPTION_STATUS}
                value={row.status}
              />,
            ],
            [
              "이번 회차",
              `${row.periodCount}회차 · ${formatDateTime(row.currentPeriodStart)} ~ ${formatDateTime(row.currentPeriodEnd)}`,
            ],
            [
              "결제 후",
              withinWindow ? (
                <Badge key="w" tone="green">
                  7일 이내
                </Badge>
              ) : (
                <Badge key="w" tone="gray">
                  7일 지남
                </Badge>
              ),
            ],
          ]}
        />
        <QueryState isLoading={isLoading} error={error} isEmpty={false}>
          {data && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-semibold">이번 회차 혜택 사용 </span>
                {current.length ? (
                  <Badge tone="amber">{current.length}건 사용</Badge>
                ) : (
                  <Badge tone="green">사용 안 함</Badge>
                )}
                <span className="ml-2 text-ink-sub">
                  운알톡 {data.summary.consultUsed}/{data.summary.consultTotal}
                  회
                </span>
              </div>
              {data.usage.length ? (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-line">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="th">회차</th>
                        <th className="th">혜택</th>
                        <th className="th">대상</th>
                        <th className="th">사용 시각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.usage].reverse().map((u) => (
                        <tr key={u.id}>
                          <td className="td">{u.periodCount}</td>
                          <td className="td">
                            {BENEFIT_KIND[u.kind] ?? u.kind}
                          </td>
                          <td className="td text-ink-sub">{u.refId}</td>
                          <td className="td text-ink-sub">
                            {formatDateTime(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-ink-mute">
                  혜택을 쓴 기록이 없습니다.
                </p>
              )}
            </div>
          )}
        </QueryState>

        {refund.isSuccess ? (
          <p className="rounded-lg bg-canvas p-3 text-sm">
            {formatWon(refund.data.refundedKrw)} 환불하고 구독을 끝냈습니다
            (결제 #{refund.data.purchaseId}).
          </p>
        ) : canRefund ? (
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm text-ink-sub">
              이번 회차({row.periodCount}회차) 결제 {formatWon(row.priceKrw)}를
              토스에서 전액 취소하고, 구독을 바로 끝내고 등록 카드를 지웁니다.
              이미 쓴 혜택과 구독으로 연 콘텐츠는 되돌리지 않습니다.
            </p>
            <Field
              label="사유"
              hint="구독 이력과 결제 알림에 남습니다 (2~200자)."
            >
              <input
                className="input w-full"
                maxLength={200}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="예: 결제 후 2일, 혜택 미사용 — 문의 #123"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              혜택 사용 내역과 7일 조건을 확인했습니다
            </label>
            {refund.error && <ErrorBox error={refund.error} />}
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={onClose}>
                닫기
              </button>
              <button
                className="btn-danger"
                disabled={!valid || refund.isPending}
                onClick={() => refund.mutate()}
              >
                {formatWon(row.priceKrw)} 환불 후 종료
              </button>
            </div>
          </div>
        ) : (
          <p className="border-t border-line pt-4 text-sm text-ink-mute">
            {row.store !== "toss"
              ? "스토어 구독은 앱스토어 · 구글 플레이에서 환불됩니다."
              : "끝난 구독입니다."}
          </p>
        )}
      </div>
    </Modal>
  );
}
