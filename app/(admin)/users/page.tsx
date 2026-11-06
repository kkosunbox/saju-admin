"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
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
  PROVIDER,
  USER_STATUS,
} from "@/lib/format";

const LIMIT = 20;

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", page, status, search],
    queryFn: () => api.users({ page, limit: LIMIT, status, search }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="고객"
        description="회원 번호 · 이메일 · 전화번호 · 닉네임으로 찾습니다."
      />
      <div className="card overflow-hidden">
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
                  <th className="th">번호</th>
                  <th className="th">닉네임</th>
                  <th className="th">상태</th>
                  <th className="th">이메일</th>
                  <th className="th">로그인</th>
                  <th className="th text-right">포인트</th>
                  <th className="th">마지막 활동</th>
                  <th className="th">가입</th>
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
                    <td className="td font-semibold">{user.nickname ?? "-"}</td>
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
