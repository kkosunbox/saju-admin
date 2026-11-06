"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  ErrorBox,
  InfoRows,
  Loading,
  MemberLink,
  Modal,
  PageHeader,
  Pagination,
  QueryState,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, INQUIRY_CATEGORY } from "@/lib/format";

const LIMIT = 20;

export default function InquiriesPage() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["inquiries", page],
    queryFn: () => api.inquiries({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="문의"
        description="고객이 앱에서 남긴 문의입니다. 답변은 남긴 연락처로 따로 알려야 합니다."
      />
      <div className="card overflow-hidden">
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
                  <th className="th">접수</th>
                  <th className="th">분류</th>
                  <th className="th">내용</th>
                  <th className="th">회원</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-canvas/70"
                    onClick={() => setOpenId(row.id)}
                  >
                    <td className="td text-ink-mute">{row.id}</td>
                    <td className="td text-ink-sub">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="td">
                      {INQUIRY_CATEGORY[row.category] ?? row.category}
                    </td>
                    <td className="td max-w-md truncate">
                      {row.deletedAt && (
                        <span className="mr-1.5">
                          <Badge tone="red">고객 삭제</Badge>
                        </span>
                      )}
                      {row.title ? (
                        <span className="mr-1.5 font-semibold">
                          {row.title}
                        </span>
                      ) : null}
                      <span className="text-ink-sub">{row.content}</span>
                    </td>
                    <td className="td">
                      <MemberLink userId={row.userId} email={row.user?.email} />
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
      {openId !== null && (
        <InquiryModal id={openId} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function InquiryModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["inquiry", id],
    queryFn: () => api.inquiry(id),
  });

  return (
    <Modal title={`문의 #${id}`} onClose={onClose} wide>
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorBox error={error} />
      ) : (
        <div className="space-y-5">
          <InfoRows
            rows={[
              ["분류", INQUIRY_CATEGORY[data.category] ?? data.category],
              [
                "회원",
                <Link
                  key="u"
                  className="text-link hover:underline"
                  href={`/users/${data.userId}`}
                >
                  {data.user?.email?.trim() || "-"}
                </Link>,
              ],
              ["연락처", data.contact],
              ["접수", formatDateTime(data.createdAt)],
            ]}
          />
          <div className="rounded-xl bg-canvas p-4">
            {data.title && <p className="mb-1.5 font-semibold">{data.title}</p>}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {data.content}
            </p>
            {!!data.attachmentUrls?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.attachmentUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="첨부"
                      className="h-24 w-24 rounded-lg border border-line object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button className="btn-outline" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
