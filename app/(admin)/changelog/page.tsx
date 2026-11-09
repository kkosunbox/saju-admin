"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  CHANGE_AREA_LABEL,
  type ChangeArea,
  type ChangeNote,
  type ChangeNoteInput,
} from "@/lib/changelog";
import { formatDateTime, kstDate } from "@/lib/format";
import type { Tone } from "@/lib/format";

const AREA_TONE: Record<ChangeArea, Tone> = {
  frontend: "blue",
  backend: "navy",
};

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const PAGE_SIZE = 50;

type AreaFilter = "all" | ChangeArea;

function dateHeading(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
}

export default function ChangelogPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AreaFilter>("all");
  const [editing, setEditing] = useState<ChangeNote | "new" | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["changelog", filter],
    queryFn: ({ pageParam }) =>
      api.changelog({
        page: pageParam,
        limit: PAGE_SIZE,
        area: filter === "all" ? undefined : filter,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
  });
  const notes = query.data?.pages.flatMap((page) => page.items) ?? [];
  const counts = query.data?.pages[0]?.counts;
  const groups = groupByDate(notes);

  const done = async () => {
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["changelog"] });
  };
  const save = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: ChangeNoteInput }) =>
      id ? api.updateChangelog(id, body) : api.createChangelog(body),
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteChangelog(id),
    onSuccess: done,
  });
  const busy = save.isPending || remove.isPending;

  return (
    <>
      <PageHeader
        title="업데이트 이력"
        description="앱과 서버를 업데이트할 때마다 무엇을 바꿨는지 남겨 둡니다."
        actions={
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => {
              save.reset();
              setEditing("new");
            }}
          >
            <Plus size={15} /> 등록
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="전체"
          count={counts?.all}
        />
        {(Object.keys(CHANGE_AREA_LABEL) as ChangeArea[]).map((area) => (
          <FilterChip
            key={area}
            active={filter === area}
            onClick={() => setFilter(area)}
            label={CHANGE_AREA_LABEL[area]}
            count={counts?.[area]}
          />
        ))}
      </div>

      {query.isLoading ? (
        <Loading />
      ) : query.error && !notes.length ? (
        <ErrorBox error={query.error} />
      ) : groups.length === 0 ? (
        <div className="card">
          <p className="py-16 text-center text-sm text-ink-mute">
            이 구분의 변경 기록이 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-3 text-sm font-bold text-ink">
                {dateHeading(date)}
                <span className="ml-2 font-medium text-ink-mute">
                  {items.length}건
                </span>
              </h2>
              <ul className="space-y-3">
                {items.map((note) => (
                  <li key={note.id} className="card px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap gap-1.5">
                      {note.areas.map((area) => (
                        <Badge key={area} tone={AREA_TONE[area]}>
                          {CHANGE_AREA_LABEL[area]}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="mt-2.5 text-base font-bold tracking-tight">
                      {note.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-ink-sub">
                      {note.detail}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                      <span className="mr-auto font-medium text-ink-mute">
                        {note.createdAt ? formatDateTime(note.createdAt) : ""}
                      </span>
                      <button
                        className="text-ink-mute hover:text-ink disabled:opacity-40"
                        disabled={busy}
                        onClick={() => {
                          save.reset();
                          setEditing(note);
                        }}
                      >
                        수정
                      </button>
                      <button
                        className="text-danger hover:opacity-80 disabled:opacity-40"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("이 변경 기록을 삭제할까요?")) {
                            remove.mutate(note.id);
                          }
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {query.hasNextPage && (
            <div className="flex justify-center">
              <button
                className="btn-outline"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "불러오는 중" : "더 보기"}
              </button>
            </div>
          )}
        </div>
      )}

      {remove.error && (
        <div className="mt-4">
          <ErrorBox error={remove.error} />
        </div>
      )}

      {editing && (
        <NoteModal
          note={editing === "new" ? null : editing}
          pending={save.isPending}
          error={save.error}
          onClose={() => {
            if (!save.isPending) setEditing(null);
          }}
          onSave={(body) =>
            save.mutate({ id: editing === "new" ? undefined : editing.id, body })
          }
        />
      )}
    </>
  );
}

/** 이미 반영일 → 등록 시각 순으로 온다. 같은 날끼리 묶기만 한다 (더 보기로 이어 붙여도 순서 유지). */
function groupByDate(notes: ChangeNote[]): [string, ChangeNote[]][] {
  const groups = new Map<string, ChangeNote[]>();
  for (const note of notes) {
    const items = groups.get(note.date) ?? [];
    items.push(note);
    groups.set(note.date, items);
  }
  return [...groups.entries()];
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
        active
          ? "border border-navy bg-navy text-white"
          : "border border-line bg-white text-ink-sub hover:bg-canvas",
      )}
    >
      {label}
      {count !== undefined && (
        <span className={active ? "text-white/70" : "text-ink-mute"}>
          {count}
        </span>
      )}
    </button>
  );
}

function NoteModal({
  note,
  pending,
  error,
  onClose,
  onSave,
}: {
  note: ChangeNote | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSave: (note: ChangeNoteInput) => void;
}) {
  const [date, setDate] = useState(note?.date ?? kstDate());
  const [areas, setAreas] = useState<ChangeArea[]>(
    note?.areas ?? ["frontend", "backend"],
  );
  const [title, setTitle] = useState(note?.title ?? "");
  const [detail, setDetail] = useState(note?.detail ?? "");
  const [invalid, setInvalid] = useState("");

  function toggle(area: ChangeArea) {
    setAreas((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  }

  function submit() {
    const nextTitle = title.trim();
    const nextDetail = detail.trim();
    if (!date || !areas.length || !nextTitle || !nextDetail) {
      setInvalid("날짜, 대상, 제목, 내용을 모두 적어 주세요.");
      return;
    }
    setInvalid("");
    onSave({
      date,
      areas: (["frontend", "backend"] as const).filter((area) =>
        areas.includes(area),
      ),
      title: nextTitle,
      detail: nextDetail,
    });
  }

  return (
    <Modal title={note ? "변경 수정" : "등록"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="날짜" hint="사용자에게 반영한 날">
          <input
            type="date"
            className="input w-full"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <Field label="대상">
          <div className="flex gap-2">
            {(Object.keys(CHANGE_AREA_LABEL) as ChangeArea[]).map((area) => {
              const on = areas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(area)}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-sm font-semibold",
                    on
                      ? "border-navy bg-navy text-white"
                      : "border-line-strong bg-white text-ink-sub",
                  )}
                >
                  {CHANGE_AREA_LABEL[area]}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="제목">
          <input
            className="input w-full"
            maxLength={100}
            value={title}
            placeholder="무엇을 바꿨는지"
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="내용" hint="사용자가 화면에서 보게 되는 변화를 적습니다.">
          <textarea
            className="textarea min-h-32"
            maxLength={2000}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
        </Field>
        {invalid && <ErrorBox error={new Error(invalid)} />}
        {error ? <ErrorBox error={error} /> : null}
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose} disabled={pending}>
            취소
          </button>
          <button className="btn-primary" onClick={submit} disabled={pending}>
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
