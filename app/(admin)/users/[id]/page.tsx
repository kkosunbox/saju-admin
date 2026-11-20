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
import { Fragment, useState } from "react";
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
import type { UserDetail } from "@/lib/types";
import {
  ENTITLEMENT_SOURCE,
  contentTitle,
  formatDate,
  formatDateTime,
  formatNumber,
  formatWon,
  POINT_TYPE,
  PROVIDER,
  PROFILE_RELATIONSHIP,
  PURCHASE_STATUS,
  actionTitle,
  screenTitle,
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
  const { user, profile, profiles } = data;

  return (
    <>
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft size={15} /> 고객 목록
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-bold">
            {profile?.nickname ?? `회원 ${user.id}`}
          </h1>
          <StatusBadge map={USER_STATUS} value={user.status} />
          <span className="text-sm text-ink-mute">#{user.id}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/push?userId=${user.id}`} className="btn-outline">
            푸시 보내기
          </Link>
          <button className="btn-outline" onClick={() => setModal("status")}>
            상태 변경
          </button>
          <button className="btn-primary" onClick={() => setModal("points")}>
            포인트 지급 · 회수
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
              ["가입", formatDateTime(user.signedUpAt ?? user.createdAt)],
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
        <UsageSection usage={data.usage} />
      </div>

      <FirstDayScreens userId={id} />

      <section className="card mt-4 overflow-hidden">
        <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">
          운세 프로필 · {profiles.length}개
        </h2>
        {profiles.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {[
                    "번호",
                    "닉네임",
                    "관계",
                    "성별",
                    "생일",
                    "태어난 시각",
                    "MBTI",
                    "등록일",
                  ].map((label) => (
                    <th key={label} className="th">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="td text-ink-mute">#{p.id}</td>
                    <td className="td font-semibold">
                      {p.nickname}
                      {p.isPrimary && (
                        <span className="ml-2">
                          <Badge tone="blue">대표</Badge>
                        </span>
                      )}
                    </td>
                    <td className="td">
                      {PROFILE_RELATIONSHIP[p.relationship] ?? p.relationship}
                    </td>
                    <td className="td">
                      {p.gender === "female"
                        ? "여성"
                        : p.gender === "male"
                          ? "남성"
                          : p.gender}
                    </td>
                    <td className="td">
                      {p.birthDateInput} (
                      {p.calendarType === "lunar"
                        ? `음력${p.isLeapMonth ? " 윤달" : ""}`
                        : "양력"}
                      )
                    </td>
                    <td className="td">{p.birthTime ?? "모름"}</td>
                    <td className="td">{p.mbti}</td>
                    <td className="td text-ink-sub">
                      {formatDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>프로필이 없습니다.</Empty>
        )}
      </section>

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

function UsageSection({ usage }: { usage: UserDetail["usage"] }) {
  const { dailyFortune: fortune, consult, freeContents } = usage;
  return (
    <section className="card p-5 lg:col-span-2">
      <h2 className="mb-2 text-sm font-semibold">이용 현황</h2>
      <div className="grid gap-x-8 lg:grid-cols-2">
        <InfoRows
          rows={[
            [
              "오늘의 운세",
              <Badge key="f" tone={fortune.drawnToday ? "blue" : "gray"}>
                {fortune.drawnToday ? "오늘 뽑음" : "오늘 안 뽑음"}
              </Badge>,
            ],
            ["마지막으로 뽑은 날", formatDate(fortune.lastDrawnDate)],
            [
              `최근 ${fortune.recentDays}일`,
              `${formatNumber(fortune.recentDrawnDays)}일 뽑음`,
            ],
            ["누적", `${formatNumber(fortune.drawnDays)}일 뽑음`],
          ]}
        />
        <InfoRows
          rows={[
            [
              "운알톡",
              <Badge key="c" tone={consult.used ? "blue" : "gray"}>
                {consult.used ? "이용함" : "이용 안 함"}
              </Badge>,
            ],
            [
              "상담",
              `결제 ${formatNumber(consult.answeredCount)}건 · 무료 미리보기 ${formatNumber(consult.previewCount)}건`,
            ],
            ["이어 묻기", `${formatNumber(consult.followUpCount)}회`],
            ["마지막 이용", formatDateTime(consult.lastUsedAt)],
          ]}
        />
      </div>
      <p className="mt-2 text-xs text-ink-mute">
        운알톡은 지금 보관 중인 상담만 셉니다. 삭제된 상담은 빠집니다.
      </p>
      {freeContents && (
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">무료 콘텐츠</h3>
          <InfoRows
            rows={[
              [
                "찰떡 MBTI",
                <FreeContentBadge key="mbti" used={freeContents.mbtiMatch} />,
              ],
              [
                "사주 캐릭터",
                <FreeContentBadge
                  key="character"
                  used={freeContents.character}
                />,
              ],
              [
                "전생 테스트",
                <FreeContentBadge
                  key="past-life"
                  used={freeContents.pastLife}
                />,
              ],
              [
                "천생연분 스타",
                <FreeContentBadge
                  key="celebrity"
                  used={freeContents.celebrityMatch ?? false}
                />,
              ],
              [
                "오늘의 부적",
                <FreeContentBadge
                  key="talisman"
                  used={freeContents.talisman.used}
                  drawnToday={freeContents.talisman.drawnToday}
                />,
              ],
            ]}
          />
        </div>
      )}
    </section>
  );
}

const PLATFORM: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  web: "웹",
};

/** 첫 기록 뒤 몇 분·시간이 지났는지 (예: +3분, +2시간 5분). */
function elapsed(from: string, at: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.parse(at) - Date.parse(from)) / 60_000),
  );
  if (minutes < 60) return `+${minutes}분`;
  const hours = Math.floor(minutes / 60);
  return `+${hours}시간${minutes % 60 ? ` ${minutes % 60}분` : ""}`;
}

function FirstDayScreens({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-first-day-screens", userId],
    queryFn: () => api.userFirstDayScreens(userId),
  });
  const views = data?.views ?? [];
  // 게스트 기록 다음, 회원 기록이 처음 나오는 줄 위에 가입 표시
  const signupAt = views.findIndex(
    (view, index) => !view.guest && index > 0 && views[index - 1].guest,
  );
  return (
    <section className="card mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold">
          첫 24시간 화면 이동 · 행동
          {data ? ` · ${formatNumber(views.length)}건` : ""}
        </h2>
        {data && (
          <>
            <span className="text-xs text-ink-mute">
              계정 생성 {formatDateTime(data.createdAt)}
              {data.signedUpAt
                ? ` · 회원 가입 ${formatDateTime(data.signedUpAt)}`
                : ""}
            </span>
            {data.recording && <Badge tone="blue">기록 중</Badge>}
          </>
        )}
      </div>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <div className="p-4">
          <ErrorBox error={error} />
        </div>
      ) : !views.length ? (
        <Empty>
          기록이 없습니다. 게스트가 된 뒤 24시간, 회원으로 가입한 뒤 24시간
          동안만 남깁니다 (이 기능 이전 계정은 비어 있음).
        </Empty>
      ) : (
        <div className="max-h-[28rem] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="th">순서</th>
                <th className="th">시각</th>
                <th className="th">경과</th>
                <th className="th">구분</th>
                <th className="th">화면 · 행동</th>
                <th className="th">기기</th>
              </tr>
            </thead>
            <tbody>
              {views.map((view, index) => (
                <Fragment key={index}>
                  {index === signupAt && (
                    <tr>
                      <td
                        colSpan={6}
                        className="td bg-canvas text-center text-xs font-semibold text-ink-sub"
                      >
                        회원 가입
                        {data?.signedUpAt
                          ? ` · ${formatDateTime(data.signedUpAt)}`
                          : ""}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="td text-ink-mute">{index + 1}</td>
                    <td className="td text-ink-sub">
                      {formatDateTime(view.createdAt)}
                    </td>
                    <td className="td text-ink-sub">
                      {elapsed(views[0].createdAt, view.createdAt)}
                    </td>
                    <td className="td">
                      <Badge tone={view.guest ? "gray" : "blue"}>
                        {view.guest ? "게스트" : "회원"}
                      </Badge>
                    </td>
                    <td className="td">
                      {view.action ? (
                        <span className="mr-2 font-semibold text-[#1e7fc0]">
                          {actionTitle(view.action)}
                        </span>
                      ) : (
                        screenTitle(view.path) && (
                          <span className="mr-2 font-semibold">
                            {screenTitle(view.path)}
                          </span>
                        )
                      )}
                      <span className="font-mono text-xs text-ink-mute">
                        {view.action
                          ? `${screenTitle(view.path) || view.path}에서`
                          : view.path}
                      </span>
                    </td>
                    <td className="td text-ink-sub">
                      {view.platform
                        ? (PLATFORM[view.platform] ?? view.platform)
                        : "-"}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FreeContentBadge({
  used,
  drawnToday,
}: {
  used: boolean;
  drawnToday?: boolean;
}) {
  return (
    <Badge tone={used ? "blue" : "gray"}>
      {drawnToday ? "오늘 뽑음" : used ? "뽑음" : "뽑기 기록 없음"}
    </Badge>
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
                  <td className="td" title={row.contentKey}>
                    {contentTitle("premium_reading", row.contentKey)}
                    {/^(?:compat|crush|pet):\d+$/.test(row.contentKey) && (
                      <span className="ml-1.5 font-mono text-xs text-ink-mute">
                        #{row.contentKey.split(":")[1]}
                      </span>
                    )}
                  </td>
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
