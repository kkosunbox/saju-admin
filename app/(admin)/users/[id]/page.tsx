"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Badge,
  Empty,
  ErrorBox,
  Field,
  InfoRows,
  labelsOf,
  Loading,
  Modal,
  Select,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  ENTITLEMENT_SOURCE,
  formatDate,
  formatDateTime,
  formatNumber,
  formatWon,
  POINT_TYPE,
  PROVIDER,
  PURCHASE_STATUS,
  STORE,
  SUBSCRIPTION_STATUS,
  USER_STATUS,
} from "@/lib/format";

const POINT_LIMIT = 30;

export default function UserDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const { data, isLoading, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.user(id),
  });
  const [modal, setModal] = useState<"points" | "status" | null>(null);

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorBox error={error} />;
  const { user, profile } = data;

  return (
    <>
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft size={15} /> 고객 목록
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">
            {profile?.nickname ?? `회원 ${user.id}`}
          </h1>
          <StatusBadge map={USER_STATUS} value={user.status} />
          <span className="text-sm text-ink-mute">#{user.id}</span>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setModal("status")}>
            상태 변경
          </button>
          <button className="btn-primary" onClick={() => setModal("points")}>
            포인트 지급 · 회수
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-2 text-sm font-semibold">회원 정보</h2>
          <InfoRows
            rows={[
              ["이메일", user.email],
              ["전화번호", user.phone],
              [
                "로그인",
                data.socialAccounts.length
                  ? data.socialAccounts
                      .map(
                        (account) =>
                          PROVIDER[account.provider] ?? account.provider,
                      )
                      .join(", ")
                  : "-",
              ],
              ["마케팅 수신", user.isAllowMarketing ? "동의" : "미동의"],
              ["가입", formatDateTime(user.createdAt)],
              ["마지막 로그인", formatDateTime(user.lastLoginAt)],
              ["마지막 활동", formatDateTime(user.lastActiveAt)],
              ...(user.mergedIntoUserId
                ? ([
                    [
                      "병합 대상",
                      <Link
                        key="m"
                        className="text-link"
                        href={`/users/${user.mergedIntoUserId}`}
                      >
                        #{user.mergedIntoUserId}
                      </Link>,
                    ],
                  ] as [string, React.ReactNode][])
                : []),
              ...(user.withdrawalReason
                ? ([["탈퇴 사유", user.withdrawalReason]] as [string, string][])
                : []),
            ]}
          />
        </section>
        <section className="card p-5">
          <h2 className="mb-2 text-sm font-semibold">운세 프로필</h2>
          {profile ? (
            <InfoRows
              rows={[
                ["닉네임", profile.nickname],
                [
                  "성별",
                  profile.gender === "female"
                    ? "여성"
                    : profile.gender === "male"
                      ? "남성"
                      : profile.gender,
                ],
                [
                  "생일",
                  `${profile.birthDateInput} (${profile.calendarType === "lunar" ? `음력${profile.isLeapMonth ? " 윤달" : ""}` : "양력"})`,
                ],
                ["태어난 시각", profile.birthTime ?? "모름"],
                ["MBTI", profile.mbti],
              ]}
            />
          ) : (
            <Empty>프로필이 없습니다.</Empty>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-2 text-sm font-semibold">포인트 · 구독</h2>
          <p className="py-2 text-3xl font-bold tracking-tight">
            {formatNumber(data.balance)}
            <span className="ml-1 text-base font-semibold text-ink-mute">
              P
            </span>
          </p>
          {data.subscription ? (
            <InfoRows
              rows={[
                [
                  "구독",
                  <StatusBadge
                    key="s"
                    map={SUBSCRIPTION_STATUS}
                    value={data.subscription.status}
                  />,
                ],
                [
                  "스토어",
                  STORE[data.subscription.store] ?? data.subscription.store,
                ],
                ["금액", formatWon(data.subscription.priceKrw)],
                [
                  "이번 기간 끝",
                  formatDateTime(data.subscription.currentPeriodEnd),
                ],
                ["자동 갱신", data.subscription.autoRenew ? "켜짐" : "꺼짐"],
              ]}
            />
          ) : (
            <p className="text-sm text-ink-mute">이용 중인 구독 없음</p>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PointHistory userId={id} />
        <div className="space-y-4">
          <Entitlements userId={id} />
          <UserPurchases userId={id} />
        </div>
      </div>

      {modal === "points" && (
        <AdjustPointsModal
          userId={id}
          balance={data.balance}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "status" && (
        <StatusModal
          userId={id}
          current={user.status}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function PointHistory({ userId }: { userId: number }) {
  const query = useInfiniteQuery({
    queryKey: ["user-points", userId],
    queryFn: ({ pageParam }) =>
      api.userPoints(userId, { limit: POINT_LIMIT, beforeId: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? last.items[last.items.length - 1]?.id : undefined,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">
        포인트 이용 내역
      </h2>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <div className="p-4">
          <ErrorBox error={query.error} />
        </div>
      ) : !items.length ? (
        <Empty />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">일시</th>
                  <th className="th">구분</th>
                  <th className="th">내용</th>
                  <th className="th text-right">변동</th>
                  <th className="th text-right">잔액</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td className="td text-ink-sub">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="td">
                      <Badge tone={row.amount > 0 ? "blue" : "gray"}>
                        {POINT_TYPE[row.type] ?? row.type}
                      </Badge>
                    </td>
                    <td
                      className="td max-w-56 truncate"
                      title={row.idempotencyKey}
                    >
                      {row.label}
                    </td>
                    <td
                      className={`td text-right font-semibold ${row.amount > 0 ? "text-[#1e7fc0]" : "text-ink"}`}
                    >
                      {row.amount > 0 ? "+" : ""}
                      {formatNumber(row.amount)}
                    </td>
                    <td className="td text-right text-ink-sub">
                      {formatNumber(row.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {query.hasNextPage && (
            <div className="p-3 text-center">
              <button
                className="btn-outline"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                더 보기
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Entitlements({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-entitlements", userId],
    queryFn: () => api.userEntitlements(userId),
  });
  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">
        보유 콘텐츠
      </h2>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <div className="p-4">
          <ErrorBox error={error} />
        </div>
      ) : !data?.items.length ? (
        <Empty>열린 유료 콘텐츠가 없습니다.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">콘텐츠</th>
                <th className="th">경로</th>
                <th className="th">기한</th>
                <th className="th">열린 날</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td className="td font-mono text-xs">{row.contentKey}</td>
                  <td className="td">
                    {ENTITLEMENT_SOURCE[row.source] ?? row.source}
                  </td>
                  <td className="td text-ink-sub">
                    {row.validUntil ? formatDate(row.validUntil) : "소장"}
                  </td>
                  <td className="td text-ink-sub">
                    {formatDateTime(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UserPurchases({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchases", "user", userId],
    queryFn: () => api.purchases({ userId, page: 1, limit: 20 }),
  });
  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">
        결제 (최근 20건)
      </h2>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <div className="p-4">
          <ErrorBox error={error} />
        </div>
      ) : !data?.items.length ? (
        <Empty>결제 내역이 없습니다.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">일시</th>
                <th className="th">상품</th>
                <th className="th">상태</th>
                <th className="th text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td className="td text-ink-sub">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="td">
                    {row.productId}
                    <span className="ml-1.5 text-xs text-ink-mute">
                      {STORE[row.store] ?? row.store}
                    </span>
                  </td>
                  <td className="td">
                    <StatusBadge map={PURCHASE_STATUS} value={row.status} />
                  </td>
                  <td className="td text-right font-semibold">
                    {formatWon(row.amountKrw)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdjustPointsModal({
  userId,
  balance,
  onClose,
}: {
  userId: number;
  balance: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState<"grant" | "revoke">("grant");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const value = Math.trunc(Number(amount));
  const mutation = useMutation({
    mutationFn: () =>
      api.adjustPoints(userId, {
        amount: direction === "grant" ? value : -value,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-points", userId] });
      onClose();
    },
  });
  const valid =
    value > 0 &&
    value <= 100_000 &&
    reason.trim().length >= 2 &&
    (direction === "grant" || value <= balance);

  return (
    <Modal title="포인트 지급 · 회수" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["grant", "revoke"] as const).map((key) => (
            <button
              key={key}
              className={
                direction === key ? "btn-primary flex-1" : "btn-outline flex-1"
              }
              onClick={() => setDirection(key)}
            >
              {key === "grant" ? "지급" : "회수"}
            </button>
          ))}
        </div>
        <Field
          label="포인트"
          hint={
            direction === "grant"
              ? "무료 포인트로 지급되며 1년 뒤 소멸합니다."
              : `현재 잔액 ${formatNumber(balance)}P 이내에서 회수합니다.`
          }
        >
          <input
            className="input w-full"
            inputMode="numeric"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="예: 100"
          />
        </Field>
        <Field
          label="사유"
          hint="고객의 포인트 이용 내역에 '관리자 조정: 사유'로 보입니다 (2~80자)."
        >
          <input
            className="input w-full"
            maxLength={80}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="예: 이벤트 보상"
          />
        </Field>
        {mutation.error && <ErrorBox error={mutation.error} />}
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>
            취소
          </button>
          <button
            className={direction === "grant" ? "btn-primary" : "btn-danger"}
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {formatNumber(value || 0)}P{" "}
            {direction === "grant" ? "지급" : "회수"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StatusModal({
  userId,
  current,
  onClose,
}: {
  userId: number;
  current: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(current);
  const mutation = useMutation({
    mutationFn: () => api.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });
  return (
    <Modal title="회원 상태 변경" onClose={onClose}>
      <div className="space-y-4">
        <Field
          label="상태"
          hint="정지하면 이 회원은 로그인과 API 이용이 막힙니다."
        >
          <Select
            value={status}
            onChange={setStatus}
            options={labelsOf(USER_STATUS)}
          />
        </Field>
        {mutation.error && <ErrorBox error={mutation.error} />}
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-primary"
            disabled={status === current || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            변경
          </button>
        </div>
      </div>
    </Modal>
  );
}
