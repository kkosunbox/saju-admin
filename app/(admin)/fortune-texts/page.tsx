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
import { formatDateTime } from "@/lib/format";
import type { FortuneText } from "@/lib/types";

const KEY_LABEL: Record<string, string> = {
  kind: "종류 (kind)",
  category: "분야 (category)",
  band: "구간 (band)",
  polarity: "좋음 · 피함 (polarity)",
};

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
          <Select
            value={activeSection}
            onChange={setSection}
            options={Object.keys(sections.data ?? {}).map(
              (key) => [key, key] as [string, string],
            )}
          />
          <span className="text-xs text-ink-mute">
            {keys.length ? `구분 키: ${keys.join(" · ")}` : "구분 키 없음"}
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
                      {key}
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
                      <td key={key} className="td align-top font-mono text-xs">
                        {row[key as keyof FortuneText] as string}
                      </td>
                    ))}
                    <td className="td leading-relaxed whitespace-normal">
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
      title={text ? `문장 #${text.id} 수정` : `${section} 문장 추가`}
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        {keys.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {keys.map((key) => (
              <Field key={key} label={KEY_LABEL[key] ?? key}>
                <input
                  className="input w-full font-mono"
                  disabled={!!text}
                  value={
                    text
                      ? ((text[key as keyof FortuneText] as string | null) ??
                        "")
                      : (fields[key] ?? "")
                  }
                  onChange={(event) =>
                    setFields({ ...fields, [key]: event.target.value })
                  }
                />
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
