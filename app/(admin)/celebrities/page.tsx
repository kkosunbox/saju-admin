"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
  CELEBRITY_GENDER_LABEL,
  type Celebrity,
  type CelebrityGender,
  type CelebrityInput,
} from "@/lib/celebrity";
import { SortTh, sortRows, useSort } from "@/components/sort";

type GenderFilter = "all" | CelebrityGender;

export default function CelebritiesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<GenderFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Celebrity | "new" | null>(null);

  const query = useQuery({
    queryKey: ["celebrities"],
    queryFn: () => api.celebrities(),
  });
  const all = useMemo(() => query.data ?? [], [query.data]);
  const counts = useMemo(
    () => ({
      all: all.length,
      female: all.filter((c) => c.gender === "female").length,
      male: all.filter((c) => c.gender === "male").length,
      hidden: all.filter((c) => !c.visible).length,
    }),
    [all],
  );
  const sorting = useSort();
  const rows = useMemo(() => {
    const word = search.trim();
    const matched = all.filter(
      (c) =>
        (filter === "all" || c.gender === filter) &&
        (!word || c.name.includes(word) || c.description.includes(word)),
    );
    return sortRows(matched, sorting.sort, {
      birthDate: (c) => c.birthDate,
    });
  }, [all, filter, search, sorting.sort]);

  const done = async () => {
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["celebrities"] });
  };
  const save = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: CelebrityInput }) =>
      id ? api.updateCelebrity(id, body) : api.createCelebrity(body),
    onSuccess: done,
  });
  const toggle = useMutation({
    mutationFn: (c: Celebrity) => api.setCelebrityVisible(c.id, !c.visible),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["celebrities"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteCelebrity(id),
    onSuccess: done,
  });
  const busy = save.isPending || toggle.isPending || remove.isPending;

  return (
    <>
      <PageHeader
        title="천생연분 스타"
        description="무료 콘텐츠 '천생연분 스타'의 후보입니다. 사진 없이 이름과 생일로 정해지는 사주 캐릭터만 보여 줍니다. 문제가 생기면 노출을 끄면 앱에서 바로 빠집니다."
        actions={
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => {
              save.reset();
              setEditing("new");
            }}
          >
            <Plus size={15} /> 추가
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "전체", counts.all],
            ["female", "여성", counts.female],
            ["male", "남성", counts.male],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={clsx(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
              filter === key
                ? "border border-navy bg-navy text-white"
                : "border border-line bg-white text-ink-sub hover:bg-canvas",
            )}
          >
            {label}
            <span className={filter === key ? "text-white/70" : "text-ink-mute"}>
              {count}
            </span>
          </button>
        ))}
        <span className="text-xs text-ink-mute">숨김 {counts.hidden}명</span>
        <div className="relative ml-auto w-full sm:w-60">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute"
          />
          <input
            className="input w-full pl-8"
            placeholder="이름·설명 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorBox error={query.error} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-mute">
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-4 py-3 font-semibold">설명</th>
                <th className="px-4 py-3 font-semibold">성별</th>
                <SortTh
                  label="양력 생일"
                  sortKey="birthDate"
                  bare
                  className="px-4 py-3 font-semibold"
                  {...sorting}
                />
                <th className="px-4 py-3 font-semibold">앱 노출</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className={clsx(!c.visible && "text-ink-mute")}>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3">{c.description || "-"}</td>
                  <td className="px-4 py-3">
                    {CELEBRITY_GENDER_LABEL[c.gender]}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.birthDate}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggle.mutate(c)}
                      aria-label={`${c.name} 앱 노출 ${c.visible ? "끄기" : "켜기"}`}
                    >
                      <Badge tone={c.visible ? "green" : "gray"}>
                        {c.visible ? "노출" : "숨김"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap">
                    <button
                      className="mr-3 text-ink-mute hover:text-ink disabled:opacity-40"
                      disabled={busy}
                      onClick={() => {
                        save.reset();
                        setEditing(c);
                      }}
                    >
                      수정
                    </button>
                    <button
                      className="text-danger hover:opacity-80 disabled:opacity-40"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `${c.name} 후보를 삭제할까요? 잠시 빼려면 노출만 꺼 주세요.`,
                          )
                        ) {
                          remove.mutate(c.id);
                        }
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-sm text-ink-mute"
                  >
                    조건에 맞는 후보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(toggle.error || remove.error) && (
        <div className="mt-4">
          <ErrorBox error={toggle.error ?? remove.error} />
        </div>
      )}

      {editing && (
        <CelebrityModal
          celebrity={editing === "new" ? null : editing}
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

function CelebrityModal({
  celebrity,
  pending,
  error,
  onClose,
  onSave,
}: {
  celebrity: Celebrity | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSave: (body: CelebrityInput) => void;
}) {
  const [name, setName] = useState(celebrity?.name ?? "");
  const [description, setDescription] = useState(celebrity?.description ?? "");
  const [gender, setGender] = useState<CelebrityGender>(
    celebrity?.gender ?? "female",
  );
  const [birthDate, setBirthDate] = useState(celebrity?.birthDate ?? "");
  const [visible, setVisible] = useState(celebrity?.visible ?? true);
  const [invalid, setInvalid] = useState("");

  function submit() {
    const nextName = name.trim();
    if (!nextName || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setInvalid("이름과 양력 생일을 적어 주세요.");
      return;
    }
    setInvalid("");
    onSave({
      name: nextName,
      description: description.trim(),
      gender,
      birthDate,
      visible,
    });
  }

  return (
    <Modal title={celebrity ? "후보 수정" : "후보 추가"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="이름" hint="앱에 그대로 보입니다. 그룹명·소속사는 넣지 않습니다.">
          <input
            className="input w-full"
            maxLength={30}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="설명" hint="이름 아래 한 줄 (예: 가수 · 배우)">
          <input
            className="input w-full"
            maxLength={60}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field label="성별">
          <div className="flex gap-2">
            {(Object.keys(CELEBRITY_GENDER_LABEL) as CelebrityGender[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={gender === key}
                  onClick={() => setGender(key)}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-sm font-semibold",
                    gender === key
                      ? "border-navy bg-navy text-white"
                      : "border-line-strong bg-white text-ink-sub",
                  )}
                >
                  {CELEBRITY_GENDER_LABEL[key]}
                </button>
              ),
            )}
          </div>
        </Field>
        <Field label="양력 생일" hint="출생 시간은 쓰지 않습니다.">
          <input
            type="date"
            className="input w-full"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-sub">
          <input
            type="checkbox"
            checked={visible}
            onChange={(event) => setVisible(event.target.checked)}
          />
          앱 후보에 노출
        </label>
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
