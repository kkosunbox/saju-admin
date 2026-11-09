"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ErrorBox,
  Field,
  InfoRows,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  QueryState,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  formatDateTime,
  formatNumber,
  PUSH_KIND,
  PUSH_STATUS,
  PUSH_TARGET,
  USER_STATUS,
} from "@/lib/format";
import type {
  PushCampaign,
  PushCampaignKind,
  PushCampaignTarget,
  UserRow,
  UserStatus,
} from "@/lib/types";

const LIMIT = 20;
const PICK_LIMIT = 20;
const MAX_PICKED = 500;

type PickedUser = {
  id: number;
  nickname: string | null;
  email: string | null;
  status: UserStatus;
};

function isAdQuietHours(now = new Date()) {
  const hour = new Date(now.getTime() + 9 * 3600_000).getUTCHours();
  return hour >= 21 || hour < 8;
}

function displayTitle(kind: PushCampaignKind, title: string) {
  const trimmed = title.trim();
  if (kind !== "ad") return trimmed;
  if (trimmed.startsWith("(광고)")) return trimmed;
  return trimmed ? `(광고) ${trimmed}` : "(광고)";
}

function Toggle<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint: string;
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-ink-sub">{label}</p>
      <div className="flex gap-2">
        {options.map(([key, option]) => (
          <button
            key={key}
            type="button"
            className={
              value === key ? "btn-primary flex-1" : "btn-outline flex-1"
            }
            onClick={() => onChange(key)}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-mute">{hint}</p>
    </div>
  );
}

export default function PushPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PushPageInner />
    </Suspense>
  );
}

function PushPageInner() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const presetId = Number(searchParams.get("userId"));
  const addedPreset = useRef(false);

  const [kind, setKind] = useState<PushCampaignKind>("info");
  const [target, setTarget] = useState<PushCampaignTarget>("users");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<PickedUser[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const quiet = kind === "ad" && isAdQuietHours();

  const preset = useQuery({
    queryKey: ["user", presetId],
    queryFn: () => api.user(presetId),
    enabled: Number.isInteger(presetId) && presetId > 0,
  });

  useEffect(() => {
    if (addedPreset.current || !preset.data) return;
    addedPreset.current = true;
    const { user, profile } = preset.data;
    setTarget("users");
    setPicked((list) =>
      list.some((item) => item.id === user.id)
        ? list
        : [
            ...list,
            {
              id: user.id,
              nickname: profile?.nickname ?? null,
              email: user.email,
              status: user.status,
            },
          ],
    );
  }, [preset.data]);

  const userIds = useMemo(() => picked.map((user) => user.id), [picked]);
  const audience = useQuery({
    queryKey: ["push-audience", kind, target, userIds],
    queryFn: () =>
      api.pushAudience({
        kind,
        target,
        userIds: target === "users" ? userIds : undefined,
      }),
    enabled: target === "all" || userIds.length > 0,
  });
  const history = useQuery({
    queryKey: ["push-campaigns", page],
    queryFn: () => api.pushCampaigns({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const send = useMutation({
    mutationFn: () =>
      api.sendPush({
        kind,
        target,
        userIds: target === "users" ? userIds : undefined,
        title: title.trim() || undefined,
        body: body.trim(),
        url: url.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["push-audience"] });
      setConfirming(false);
      setTitle("");
      setBody("");
      setUrl("");
    },
  });

  const canSend =
    body.trim().length > 0 &&
    !quiet &&
    (target === "all" || picked.length > 0) &&
    (audience.data?.devices ?? 0) > 0 &&
    !send.isPending;

  return (
    <>
      <PageHeader
        title="앱 푸시"
        description="고른 고객에게 보내거나, 기기가 있는 전체에게 한 번에 보냅니다."
      />

      <section className="card mb-4 p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Toggle
              label="종류"
              value={kind}
              onChange={setKind}
              options={[
                ["info", "안내"],
                ["ad", "광고"],
              ]}
              hint={
                kind === "ad"
                  ? "마케팅 수신에 동의한 사람만 받습니다. 제목 앞에 (광고)가 붙고, 밤 9시부터 아침 8시까지는 보낼 수 없습니다."
                  : "정지되지 않은 회원·게스트 중 기기가 있는 사람에게 갑니다."
              }
            />
            <Toggle
              label="대상"
              value={target}
              onChange={setTarget}
              options={[
                ["users", "선택한 고객"],
                ["all", "전체"],
              ]}
              hint={
                target === "all"
                  ? "조건에 맞는 모든 기기. 한 번에 나가므로 내용을 다시 확인해 주세요."
                  : `목록에서 고릅니다. 최대 ${MAX_PICKED}명.`
              }
            />
            <Field
              label="제목"
              hint={`${displayTitle(kind, title).length}/100`}
            >
              <input
                className="input w-full"
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={kind === "ad" ? "이벤트 안내" : "생략하면 본문만"}
              />
            </Field>
            <Field label="본문" hint={`${body.length}/500`}>
              <textarea
                className="textarea min-h-28"
                maxLength={500}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="알림에 보일 내용"
              />
            </Field>
            <Field
              label="열 경로"
              hint="알림을 누르면 열리는 앱 경로. 비우면 앱만 엽니다."
            >
              <input
                className="input w-full font-mono"
                maxLength={200}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="/fortune"
              />
            </Field>
          </div>
          <div className="space-y-4">
            {target === "users" && (
              <UserPicker picked={picked} onChange={setPicked} />
            )}
            <div className="rounded-xl bg-canvas px-4 py-3 text-sm">
              {quiet ? (
                <p className="text-[#a56b10]">
                  지금은 광고 푸시를 보낼 수 없는 시간입니다. 아침 8시 이후에
                  다시 시도해 주세요.
                </p>
              ) : audience.isError ? (
                <ErrorBox error={audience.error} />
              ) : target === "users" && !picked.length ? (
                <p className="text-ink-mute">
                  받을 고객을 고르면 인원이 나옵니다.
                </p>
              ) : audience.isFetching && !audience.data ? (
                <p className="text-ink-mute">받는 사람을 세는 중</p>
              ) : (
                <p>
                  <span className="font-semibold">
                    {formatNumber(audience.data?.users ?? 0)}명
                  </span>
                  <span className="text-ink-mute">
                    {" "}
                    · 기기 {formatNumber(audience.data?.devices ?? 0)}대
                  </span>
                  {kind === "ad" && (
                    <span className="mt-1 block text-xs text-ink-mute">
                      미리보기 제목: {displayTitle(kind, title) || "(광고)"}
                    </span>
                  )}
                </p>
              )}
            </div>
            {send.error && <ErrorBox error={send.error} />}
            <div className="flex justify-end">
              <button
                className="btn-primary"
                disabled={!canSend}
                onClick={() => {
                  send.reset();
                  setConfirming(true);
                }}
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">
          발송 이력
        </h2>
        <QueryState
          isLoading={history.isLoading}
          error={history.error}
          isEmpty={!history.data?.items.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">보낸 시각</th>
                  <th className="th">종류</th>
                  <th className="th">대상</th>
                  <th className="th">내용</th>
                  <th className="th">상태</th>
                  <th className="th text-right">발송</th>
                </tr>
              </thead>
              <tbody>
                {history.data?.items.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-canvas/70"
                    onClick={() => setOpenId(row.id)}
                  >
                    <td className="td text-ink-sub">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="td">
                      <StatusBadge map={PUSH_KIND} value={row.kind} />
                    </td>
                    <td className="td text-ink-sub">
                      {PUSH_TARGET[row.target] ?? row.target}
                      {row.target === "users" && row.userIds?.length
                        ? ` ${row.userIds.length}명`
                        : ""}
                    </td>
                    <td className="td max-w-sm truncate">
                      {row.title ? (
                        <span className="mr-1.5 font-semibold">
                          {row.title}
                        </span>
                      ) : null}
                      <span className="text-ink-sub">{row.body}</span>
                    </td>
                    <td className="td">
                      <StatusBadge map={PUSH_STATUS} value={row.status} />
                    </td>
                    <td className="td text-right text-ink-sub">
                      {formatNumber(row.sent)}
                      {row.failed ? (
                        <span className="text-danger">
                          {" "}
                          · 실패 {formatNumber(row.failed)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
        {history.data && (
          <Pagination
            page={page}
            total={history.data.total}
            limit={LIMIT}
            onChange={setPage}
          />
        )}
      </section>

      {confirming && (
        <Modal title="푸시를 보낼까요?" onClose={() => setConfirming(false)}>
          <div className="space-y-4">
            <p className="text-sm text-ink-sub">
              보낸 알림은 거둘 수 없습니다.{" "}
              {target === "all"
                ? "전체 발송이므로 내용을 한 번 더 확인해 주세요."
                : null}
            </p>
            <InfoRows
              rows={[
                ["종류", PUSH_KIND[kind]?.[0] ?? kind],
                [
                  "대상",
                  target === "users"
                    ? `선택한 고객 ${picked.length}명`
                    : "전체",
                ],
                ["받을 사람", `${formatNumber(audience.data?.users ?? 0)}명`],
                ["기기", `${formatNumber(audience.data?.devices ?? 0)}대`],
                ["제목", displayTitle(kind, title) || "-"],
                ["본문", body.trim()],
                ["경로", url.trim() || "-"],
              ]}
            />
            {send.error && <ErrorBox error={send.error} />}
            <div className="flex justify-end gap-2">
              <button
                className="btn-outline"
                onClick={() => setConfirming(false)}
              >
                취소
              </button>
              <button
                className="btn-primary"
                disabled={send.isPending}
                onClick={() => send.mutate()}
              >
                {send.isPending ? "보내는 중" : "보내기"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {openId !== null && (
        <CampaignModal id={openId} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function UserPicker({
  picked,
  onChange,
}: {
  picked: PickedUser[];
  onChange: (users: PickedUser[]) => void;
}) {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", "push-pick", page, search],
    queryFn: () => api.users({ page, limit: PICK_LIMIT, search }),
    placeholderData: keepPreviousData,
  });
  const selected = new Set(picked.map((user) => user.id));

  function toggle(user: PickedUser) {
    if (selected.has(user.id)) {
      onChange(picked.filter((item) => item.id !== user.id));
      return;
    }
    if (picked.length >= MAX_PICKED) return;
    onChange([...picked, user]);
  }

  return (
    <div className="rounded-xl border border-line">
      <form
        className="flex gap-2 border-b border-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(input.trim());
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute"
          />
          <input
            className="input w-full pl-8"
            placeholder="번호 · 이메일 · 닉네임"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <button className="btn-outline">검색</button>
      </form>
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {picked.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-[#1e7fc0]"
            >
              {user.nickname ?? user.email ?? `#${user.id}`}
              <button
                type="button"
                className="rounded p-0.5 hover:bg-white/70"
                aria-label={`${user.nickname ?? user.id} 선택 해제`}
                onClick={() =>
                  onChange(picked.filter((item) => item.id !== user.id))
                }
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!data?.items.length}
      >
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full">
            <tbody>
              {data?.items.map((user) => (
                <UserPickRow
                  key={user.id}
                  user={user}
                  checked={selected.has(user.id)}
                  onToggle={() =>
                    toggle({
                      id: user.id,
                      nickname: user.nickname,
                      email: user.email,
                      status: user.status,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      {data && (
        <Pagination
          page={page}
          total={data.total}
          limit={PICK_LIMIT}
          onChange={setPage}
        />
      )}
    </div>
  );
}

function UserPickRow({
  user,
  checked,
  onToggle,
}: {
  user: UserRow;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <tr className="cursor-pointer hover:bg-canvas/70" onClick={onToggle}>
      <td className="td w-8">
        <input
          type="checkbox"
          checked={checked}
          aria-label={`${user.nickname ?? user.id} 선택`}
          onClick={(event) => event.stopPropagation()}
          onChange={onToggle}
        />
      </td>
      <td className="td font-semibold">{user.nickname ?? "-"}</td>
      <td className="td text-ink-mute">#{user.id}</td>
      <td className="td">
        <StatusBadge map={USER_STATUS} value={user.status} />
      </td>
      <td className="td max-w-36 truncate text-ink-sub">{user.email ?? "-"}</td>
    </tr>
  );
}

function CampaignModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["push-campaign", id],
    queryFn: () => api.pushCampaign(id),
  });

  return (
    <Modal title={`푸시 #${id}`} onClose={onClose} wide>
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorBox error={error} />
      ) : (
        <CampaignDetail campaign={data} onClose={onClose} />
      )}
    </Modal>
  );
}

function CampaignDetail({
  campaign,
  onClose,
}: {
  campaign: PushCampaign;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <InfoRows
        rows={[
          [
            "종류",
            <StatusBadge key="k" map={PUSH_KIND} value={campaign.kind} />,
          ],
          [
            "대상",
            campaign.target === "users"
              ? `선택한 고객 ${campaign.userIds?.length ?? 0}명`
              : "전체",
          ],
          [
            "상태",
            <StatusBadge key="s" map={PUSH_STATUS} value={campaign.status} />,
          ],
          ["보낸 사람", campaign.adminName],
          ["보낸 시각", formatDateTime(campaign.createdAt)],
          ["끝난 시각", formatDateTime(campaign.completedAt)],
          ["받을 사람", `${formatNumber(campaign.users)}명`],
          ["기기", `${formatNumber(campaign.devices)}대`],
          [
            "결과",
            `발송 ${formatNumber(campaign.sent)} · 실패 ${formatNumber(campaign.failed)} · 정리 ${formatNumber(campaign.removed)}`,
          ],
          ["제목", campaign.title],
          ["경로", campaign.url],
        ]}
      />
      <div className="rounded-xl bg-canvas p-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {campaign.body}
        </p>
      </div>
      {campaign.errorMessage && (
        <div className="rounded-xl border border-[#f6caca] bg-[#fdecec] px-4 py-3 text-sm text-[#c43a3a]">
          {campaign.errorMessage}
        </div>
      )}
      {!!campaign.userIds?.length && (
        <p className="text-xs leading-relaxed text-ink-mute">
          고른 번호:{" "}
          {campaign.userIds.map((userId, index) => (
            <span key={userId}>
              {index > 0 ? ", " : ""}
              <Link
                className="text-link hover:underline"
                href={`/users/${userId}`}
              >
                #{userId}
              </Link>
            </span>
          ))}
        </p>
      )}
      <div className="flex justify-end">
        <button className="btn-outline" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
