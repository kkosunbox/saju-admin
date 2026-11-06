"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  ErrorBox,
  Field,
  Modal,
  PageHeader,
  QueryState,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, FORTUNE_CATEGORY } from "@/lib/format";
import type { FortuneText } from "@/lib/types";

const KEY_LABEL: Record<string, string> = {
  kind: "종류 (kind)",
  category: "분야",
  band: "구간 (band)",
  polarity: "좋음 · 피함 (polarity)",
};

/** 문장 묶음. 값은 저장 키, 화면은 앱에서 이 문장이 나오는 곳. */
const SECTION_LABEL: Record<string, string> = {
  category: "분야별 운세",
  factor: "분야별 운세 · 이유",
  summary_kind: "오늘의 한 줄 · 근거",
  summary_band: "오늘의 한 줄 · 점수",
  story_opening: "오늘의 흐름 · 첫 문장",
  story_kind: "오늘의 흐름 · 근거",
  story_viewpoints: "다른 관점에서",
  story_common_keywords: "다른 관점 · 겹친 키워드",
  story_top_keyword: "다른 관점 · 대표 키워드",
  story_interest: "오늘의 중심 · 관심 분야",
  story_concern: "오늘의 중심 · 고민",
  story_closing: "오늘의 중심 · 마무리",
  story_closing_low: "오늘의 중심 · 낮은 날",
  story_lucky: "오늘의 중심 · 행운",
  action_kind: "하면 좋은 것 · 근거",
  action_category: "하면 좋은 것 · 분야",
};

const SECTION_NOTE: Record<string, string> = {
  category:
    "홈과 종합풀이의 분야 카드. 분야와 점수 높음·중간·낮음으로 나뉩니다.",
  factor: "분야 문장 앞에 붙는 이유. 사주 근거와 분야로 나뉩니다.",
  summary_kind:
    "종합풀이 맨 위 한 줄이고, 홈 말풍선에도 나옵니다. 오늘을 이끄는 근거로 나뉩니다.",
  summary_band:
    "근거에 맞는 한 줄이 없을 때 쓰는 한 줄. 종합 점수 구간으로 나뉩니다.",
  story_opening:
    "종합풀이 ‘오늘의 흐름’ 첫 문장. 홈 ‘오늘의 운세’에도 나옵니다. 종합 점수 구간으로 나뉩니다.",
  story_kind: "‘오늘의 흐름’에서 첫 문장 뒤에 이어지는 사주 설명. 근거로 나뉩니다.",
  story_viewpoints:
    "보관 중인 관점 문장입니다. 앱은 지금 고정 문장을 써서, 여기서 고쳐도 화면에 바로 안 나갑니다.",
  story_common_keywords: "‘다른 관점에서’ 관점이 겹칠 때의 키워드 문장.",
  story_top_keyword: "겹친 키워드가 없을 때, 가장 또렷한 키워드 문장.",
  story_interest:
    "‘오늘의 중심’에서 관심 분야를 말하는 문장. 그 분야 점수 구간으로 나뉩니다.",
  story_concern:
    "고민을 적어 둔 날에만 ‘오늘의 중심’에 붙습니다. 종합 점수 구간으로 나뉩니다.",
  story_closing: "‘오늘의 중심’ 마무리. 가장 강한 분야로 나뉩니다.",
  story_closing_low: "가장 강한 분야도 낮을 때의 마무리.",
  story_lucky: "‘오늘의 중심’ 마지막, 행운 색과 숫자.",
  action_kind:
    "홈과 종합풀이의 ‘하면 좋은 것 · 피하면 좋은 것’. 사주 근거로 나뉩니다.",
  action_category:
    "근거 문장이 부족할 때 채우는 행동. 분야와 점수 구간으로 나뉩니다.",
};

function fieldText(key: string, value: string | null | undefined): string {
  if (!value) return "";
  if (key === "category") return FORTUNE_CATEGORY[value] ?? value;
  return value;
}

export default function FortuneTextsPage() {
  const sections = useQuery({
    queryKey: ["text-sections"],
    queryFn: api.textSections,
  });
  const [section, setSection] = useState("");
  const [showOff, setShowOff] = useState(true);
  const [editing, setEditing] = useState<FortuneText | "new" | null>(null);
  const activeSection = section || Object.keys(sections.data ?? {})[0] || "";
  const texts = useQuery({
    queryKey: ["texts", activeSection],
    queryFn: () => api.texts({ section: activeSection }),
    enabled: !!activeSection,
  });
  const rows = (texts.data?.list ?? []).filter(
    (row) => showOff || row.isActive,
  );
  const keys = sections.data?.[activeSection] ?? [];

  return (
    <>
      <PageHeader
        title="문장 은행"
        description="오늘의 운세 문장. 저장하면 금지어 · 자리표시자 · 문장 끝을 검사하고 바로 반영합니다 (다른 서버는 5분 안에)."
        actions={
          <button
            className="btn-primary"
            disabled={!activeSection}
            onClick={() => setEditing("new")}
          >
            <Plus size={15} /> 문장 추가
          </button>
        }
      />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <label className="flex items-center gap-2 text-sm text-ink-sub">
            <span className="shrink-0">쓰는 곳</span>
            <Select
              value={activeSection}
              onChange={setSection}
              options={Object.keys(sections.data ?? {}).map(
                (key) => [key, SECTION_LABEL[key] ?? key] as [string, string],
              )}
            />
          </label>
          <span className="text-xs text-ink-mute">
            {SECTION_NOTE[activeSection] ??
              (keys.length
                ? keys.map((key) => KEY_LABEL[key] ?? key).join(" · ")
                : "한 묶음으로 씁니다.")}
          </span>
          <label className="ml-auto flex items-center gap-1.5 text-sm text-ink-sub">
            <input
              type="checkbox"
              checked={showOff}
              onChange={(event) => setShowOff(event.target.checked)}
            />
            꺼진 문장도 보기
          </label>
        </div>
        <QueryState
          isLoading={sections.isLoading || texts.isLoading}
          error={sections.error ?? texts.error}
          isEmpty={!rows.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">번호</th>
                  {keys.map((key) => (
                    <th key={key} className="th">
                      {KEY_LABEL[key] ?? key}
                    </th>
                  ))}
                  <th className="th w-full">문장</th>
                  <th className="th">상태</th>
                  <th className="th">수정</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer hover:bg-canvas/70 ${row.isActive ? "" : "opacity-50"}`}
                    onClick={() => setEditing(row)}
                  >
                    <td className="td align-top text-ink-mute">{row.id}</td>
                    {keys.map((key) => (
                      <td
                        key={key}
                        className={`td align-top text-xs ${key === "category" ? "whitespace-nowrap" : "font-mono"}`}
                      >
                        {fieldText(
                          key,
                          row[key as keyof FortuneText] as string | null,
                        )}
                      </td>
                    ))}
                    <td className="td min-w-64 leading-relaxed whitespace-normal">
                      {row.text}
                    </td>
                    <td className="td align-top">
                      {row.isActive ? (
                        <Badge tone="green">사용</Badge>
                      ) : (
                        <Badge>꺼짐</Badge>
                      )}
                    </td>
                    <td className="td align-top text-xs text-ink-mute">
                      {formatDateTime(row.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
      </div>
      {editing && (
        <TextModal
          section={activeSection}
          keys={keys}
          text={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function TextModal({
  section,
  keys,
  text,
  onClose,
}: {
  section: string;
  keys: string[];
  text: FortuneText | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(text?.text ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (body: { text?: string; isActive?: boolean }) =>
      text
        ? api.updateText(text.id, body)
        : api.createText({
            section,
            text: value.trim(),
            ...Object.fromEntries(
              keys.map((key) => [key, fields[key]?.trim() || null]),
            ),
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texts", section] });
      onClose();
    },
  });

  return (
    <Modal
      title={
        text
          ? `문장 #${text.id} 수정`
          : `${SECTION_LABEL[section] ?? section} 문장 추가`
      }
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        {keys.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((key) => (
              <Field key={key} label={KEY_LABEL[key] ?? key}>
                {key === "category" && !text ? (
                  <Select
                    value={fields.category ?? ""}
                    onChange={(value) =>
                      setFields({ ...fields, category: value })
                    }
                    options={FORTUNE_CATEGORY}
                    placeholder="선택"
                  />
                ) : (
                  <input
                    className={`input w-full${key === "category" ? "" : " font-mono"}`}
                    disabled={!!text}
                    value={
                      text
                        ? fieldText(
                            key,
                            text[key as keyof FortuneText] as string | null,
                          )
                        : (fields[key] ?? "")
                    }
                    onChange={(event) =>
                      setFields({ ...fields, [key]: event.target.value })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
        )}
        <Field
          label="문장"
          hint="2~300자. 이모지 · 금지어는 저장되지 않습니다."
        >
          <textarea
            className="textarea min-h-28"
            maxLength={300}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        {save.error && <ErrorBox error={save.error} />}
        <div className="flex items-center justify-between gap-2">
          <div>
            {text && (
              <button
                className={text.isActive ? "btn-danger" : "btn-outline"}
                disabled={save.isPending}
                onClick={() => save.mutate({ isActive: !text.isActive })}
              >
                {text.isActive ? "이 문장 끄기" : "다시 켜기"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={onClose}>
              취소
            </button>
            <button
              className="btn-primary"
              disabled={
                value.trim().length < 2 ||
                save.isPending ||
                (!!text && value.trim() === text.text)
              }
              onClick={() => save.mutate({ text: value.trim() })}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
