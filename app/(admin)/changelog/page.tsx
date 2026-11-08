"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  CHANGELOG_DESCRIPTION,
  CHANGELOG_KEY,
  CHANGELOG_SEED,
  CHANGE_AREA_LABEL,
  parseChangelog,
  type ChangeArea,
  type ChangeNote,
} from "@/lib/changelog";
import { kstDate } from "@/lib/format";
import type { Tone } from "@/lib/format";

const AREA_TONE: Record<ChangeArea, Tone> = {
  frontend: "blue",
  backend: "navy",
};

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

type AreaFilter = "all" | ChangeArea;

function dateHeading(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
}

function writeChangelog(notes: ChangeNote[], exists: boolean) {
  const body = {
    value: JSON.stringify(notes),
    description: CHANGELOG_DESCRIPTION,
  };
  return exists
    ? api.updateSetting(CHANGELOG_KEY, body)
    : api.createSetting({ key: CHANGELOG_KEY, ...body });
}

export default function ChangelogPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
  });
  const stored = data?.settings.find((setting) => setting.key === CHANGELOG_KEY);
  const parsed = stored ? parseChangelog(stored.value) : null;
  const notes = parsed ?? CHANGELOG_SEED;
  const persisted = Boolean(stored && parsed);
  const broken = Boolean(stored && !parsed);

  const [filter, setFilter] = useState<AreaFilter>("all");
  const [editing, setEditing] = useState<ChangeNote | "new" | null>(null);
  const [seedError, setSeedError] = useState<unknown>(null);
  const seedStarted = useRef(false);

  const save = useMutation({
    mutationFn: (next: ChangeNote[]) => {
      const current = queryClient.getQueryData<{
        settings: { key: string }[];
      }>(["settings"]);
      const exists =
        current?.settings.some((setting) => setting.key === CHANGELOG_KEY) ??
        Boolean(stored);
      return writeChangelog(next, exists);
    },
    onSuccess: async () => {
      setSeedError(null);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  useEffect(() => {
    if (!data || stored || seedStarted.current) return;
    seedStarted.current = true;
    writeChangelog(CHANGELOG_SEED, false)
      .then(() => queryClient.invalidateQueries({ queryKey: ["settings"] }))
      .catch(async () => {
        const fresh = await queryClient.fetchQuery({
          queryKey: ["settings"],
          queryFn: api.settings,
        });
        if (!fresh.settings.some((setting) => setting.key === CHANGELOG_KEY)) {
          setSeedError(new Error("첫 업데이트 이력을 서버에 저장하지 못했습니다."));
        }
      });
  }, [data, stored, queryClient]);

  const visible = notes.filter(
    (note) => filter === "all" || note.areas.includes(filter),
  );
  const groups = groupByDate(visible);

  function remove(id: string) {
    if (!window.confirm("이 변경 기록을 삭제할까요?")) return;
    save.mutate(notes.filter((note) => note.id !== id));
  }

  return (
    <>
      <PageHeader
        title="업데이트 이력"
        description="앱과 서버를 업데이트할 때마다 무엇을 바꿨는지 남겨 둡니다."
        actions={
          <button
            className="btn-primary"
            disabled={!persisted || save.isPending}
            onClick={() => setEditing("new")}
          >
            <Plus size={15} /> 등록
          </button>
        }
      />

      {isLoading && <Loading />}
      {!isLoading && error && !data && (
        <div className="mb-4">
          <ErrorBox error={error} />
          <p className="mt-2 text-sm text-ink-mute">
            서버에서 불러오지 못해, 오늘 넣어 둔 기록을 보여 줍니다.
          </p>
        </div>
      )}
      {broken && (
        <div className="mb-4 space-y-3">
          <ErrorBox
            error={new Error("저장된 업데이트 이력을 읽지 못했습니다.")}
          />
          <button
            className="btn-outline"
            disabled={save.isPending}
            onClick={() => save.mutate(CHANGELOG_SEED)}
          >
            오늘 기록으로 다시 저장
          </button>
        </div>
      )}
      {seedError && (
        <div className="mb-4 space-y-3">
          <ErrorBox error={seedError} />
          <button
            className="btn-outline"
            onClick={() => {
              setSeedError(null);
              writeChangelog(CHANGELOG_SEED, false)
                .then(() =>
                  queryClient.invalidateQueries({ queryKey: ["settings"] }),
                )
                .catch(() =>
                  setSeedError(
                    new Error("첫 업데이트 이력을 서버에 저장하지 못했습니다."),
                  ),
                );
            }}
          >
            다시 저장
          </button>
        </div>
      )}

      {!isLoading && !broken && (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="전체"
              count={notes.length}
            />
            {(Object.keys(CHANGE_AREA_LABEL) as ChangeArea[]).map((area) => (
              <FilterChip
                key={area}
                active={filter === area}
                onClick={() => setFilter(area)}
                label={CHANGE_AREA_LABEL[area]}
                count={notes.filter((note) => note.areas.includes(area)).length}
              />
            ))}
          </div>

          {groups.length === 0 ? (
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
                        <div className="mt-3 flex justify-end gap-3 text-xs font-semibold">
                          <button
                            className="text-ink-mute hover:text-ink disabled:opacity-40"
                            disabled={!persisted || save.isPending}
                            onClick={() => setEditing(note)}
                          >
                            수정
                          </button>
                          <button
                            className="text-danger hover:opacity-80 disabled:opacity-40"
                            disabled={!persisted || save.isPending}
                            onClick={() => remove(note.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {save.error && !editing && (
        <div className="mt-4">
          <ErrorBox error={save.error} />
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
          onSave={(note) => {
            const next =
              editing === "new"
                ? [note, ...notes]
                : notes.map((item) => (item.id === note.id ? note : item));
            save.mutate(next);
          }}
        />
      )}
    </>
  );
}

function groupByDate(notes: ChangeNote[]): [string, ChangeNote[]][] {
  const groups = new Map<string, ChangeNote[]>();
  for (const note of notes) {
    const items = groups.get(note.date) ?? [];
    items.push(note);
    groups.set(note.date, items);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
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
      <span className={active ? "text-white/70" : "text-ink-mute"}>{count}</span>
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
  onSave: (note: ChangeNote) => void;
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
      id: note?.id ?? crypto.randomUUID(),
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
            maxLength={80}
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
