"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  ErrorBox,
  InfoRows,
  labelsOf,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  QueryState,
  Select,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, INQUIRY_CATEGORY, INQUIRY_STATUS } from "@/lib/format";

const LIMIT = 20;

export default function InquiriesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["inquiries", page, status],
    queryFn: () => api.inquiries({ page, limit: LIMIT, status }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="문의"
        description="답변을 등록하면 답변 완료로 바뀝니다. 앱에는 아직 답변을 보여 주는 화면이 없어, 고객에게는 남긴 연락처로 따로 알려야 합니다."
      />
      <div className="card overflow-hidden">
        <div className="flex gap-2 border-b border-line p-3">
          <Select
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={labelsOf(INQUIRY_STATUS)}
            placeholder="전체 상태"
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
                  <th className="th">접수</th>
                  <th className="th">분류</th>
                  <th className="th">내용</th>
                  <th className="th">회원</th>
                  <th className="th">상태</th>
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
                      {row.title ? (
                        <span className="mr-1.5 font-semibold">
                          {row.title}
                        </span>
                      ) : null}
                      <span className="text-ink-sub">{row.content}</span>
                    </td>
                    <td className="td">#{row.userId}</td>
                    <td className="td">
                      <StatusBadge map={INQUIRY_STATUS} value={row.status} />
                      {row.deletedAt && (
                        <span className="ml-1.5">
                          <Badge tone="red">고객 삭제</Badge>
                        </span>
                      )}
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
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["inquiry", id],
    queryFn: () => api.inquiry(id),
  });
  const [draft, setDraft] = useState<string | null>(null);
  const answer = draft ?? data?.answer ?? "";
  const mutation = useMutation({
    mutationFn: () => api.answerInquiry(id, answer.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["inquiry", id] });
      onClose();
    },
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
                "상태",
                <StatusBadge
                  key="s"
                  map={INQUIRY_STATUS}
                  value={data.status}
                />,
              ],
              [
                "회원",
                <Link
                  key="u"
                  className="text-link hover:underline"
                  href={`/users/${data.userId}`}
                >
                  #{data.userId} {data.user?.email ?? ""}
                </Link>,
              ],
              ["연락처", data.contact],
              ["접수", formatDateTime(data.createdAt)],
              ...(data.answeredAt
                ? ([["답변", formatDateTime(data.answeredAt)]] as [
                    string,
                    string,
                  ][])
                : []),
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
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-sub">답변</p>
            <textarea
              className="textarea min-h-40"
              value={answer}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="고객에게 보낼 답변"
            />
          </div>
          {mutation.error && <ErrorBox error={mutation.error} />}
          <div className="flex justify-end gap-2">
            <button className="btn-outline" onClick={onClose}>
              닫기
            </button>
            <button
              className="btn-primary"
              disabled={!answer.trim() || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {data.answer ? "답변 수정" : "답변 등록"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
