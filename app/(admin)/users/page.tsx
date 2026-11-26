"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  labelsOf,
  PageHeader,
  Pagination,
  QueryState,
  Select,
  Badge,
  StatusBadge,
} from "@/components/ui";
import { SortTh, sortQuery, useSort } from "@/components/sort";
import { UserInsightsCard } from "@/components/UserInsights";
import { api } from "@/lib/api";
import {
  formatDateTime,
  formatNumber,
  PROVIDER,
  USER_STATUS,
} from "@/lib/format";

const LIMIT = 20;

// 방문 일수 필터: [라벨, 이상, 이하]
const VISIT_FILTERS: Record<string, [string, number?, number?]> = {
  once: ["방문 1일", 1, 1],
  "2plus": ["방문 2일+", 2],
  "7plus": ["방문 7일+", 7],
};
const visitOptions = Object.entries(VISIT_FILTERS).map(
  ([key, [label]]) => [key, label] as const,
);

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [visits, setVisits] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [, minVisitDays, maxVisitDays] = VISIT_FILTERS[visits] ?? [];
  const sorting = useSort(() => setPage(1));
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", page, status, visits, search, sorting.sort],
    queryFn: () =>
      api.users({
        page,
        limit: LIMIT,
        status,
        search,
        minVisitDays,
        maxVisitDays,
        ...sortQuery(sorting.sort),
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="고객"
        description="회원 번호 · 이메일 · 전화번호 · 모든 프로필의 닉네임으로 찾습니다."
      />
      <UserInsightsCard />
      <div className="card mt-5 overflow-hidden">
        <form
          className="flex flex-wrap gap-2 border-b border-line p-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(input.trim());
          }}
        >
          <Select
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={labelsOf(USER_STATUS)}
            placeholder="전체 상태"
          />
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search
              size={15}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute"
            />
            <input
              className="input w-full pl-8 sm:w-72"
              placeholder="검색"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>
          <button className="btn-outline">검색</button>
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:ml-auto sm:w-auto">
            {[["", "전체"] as const, ...visitOptions].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={visits === key}
                onClick={() => {
                  setVisits(key);
                  setPage(1);
                }}
                className={clsx(
                  "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-semibold",
                  visits === key
                    ? "border-navy bg-navy text-white"
                    : "border-line bg-white text-ink-sub hover:bg-canvas",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </form>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.items.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <SortTh label="번호" sortKey="id" {...sorting} />
                  <th className="th">대표 닉네임</th>
                  <SortTh
                    label="프로필"
                    sortKey="profileCount"
                    align="right"
                    {...sorting}
                  />
                  <th className="th">상태</th>
                  <th className="th">이메일</th>
                  <th className="th">로그인</th>
                  <SortTh
                    label="포인트"
                    sortKey="balance"
                    align="right"
                    {...sorting}
                  />
                  <SortTh
                    label="마지막 활동"
                    sortKey="lastActiveAt"
                    {...sorting}
                  />
                  <SortTh label="가입" sortKey="createdAt" {...sorting} />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer hover:bg-canvas/70"
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    <td className="td text-ink-mute">{user.id}</td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-semibold">
                          {user.nickname ?? "-"}
                        </span>
                        {user.visitDays > 0 && (
                          <span title="앱을 쓴 날 수 (회원 11/19 · 게스트 11/23부터 집계)">
                            <Badge tone={visitTone(user.visitDays)}>
                              방문 {formatNumber(user.visitDays)}일
                            </Badge>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="td text-right">
                      {formatNumber(user.profileCount)}개
                    </td>
                    <td className="td">
                      <StatusBadge map={USER_STATUS} value={user.status} />
                    </td>
                    <td className="td text-ink-sub">{user.email ?? "-"}</td>
                    <td className="td text-ink-sub">
                      {user.providers
                        .map((provider) => PROVIDER[provider] ?? provider)
                        .join(", ") || "-"}
                    </td>
                    <td className="td text-right font-semibold">
                      {formatNumber(user.balance)}
                    </td>
                    <td className="td text-ink-sub">
                      {formatDateTime(user.lastActiveAt)}
                    </td>
                    <td className="td text-ink-sub">
                      {formatDateTime(user.createdAt)}
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

function visitTone(days: number) {
  if (days >= 7) return "green";
  if (days >= 2) return "blue";
  return "gray";
}
