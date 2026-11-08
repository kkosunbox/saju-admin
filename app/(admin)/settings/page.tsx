"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  ErrorBox,
  Field,
  Modal,
  PageHeader,
  QueryState,
} from "@/components/ui";
import { api } from "@/lib/api";
import { CHANGELOG_KEY } from "@/lib/changelog";
import { formatDateTime } from "@/lib/format";
import type { Setting } from "@/lib/types";

export default function SettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
  });
  const [editing, setEditing] = useState<Setting | "new" | null>(null);
  const settings = (data?.settings ?? []).filter(
    (setting) => setting.key !== CHANGELOG_KEY,
  );

  return (
    <>
      <PageHeader
        title="시스템 설정"
        description="서버가 읽는 키 · 값 설정 (system_setting)."
        actions={
          <button className="btn-primary" onClick={() => setEditing("new")}>
            <Plus size={15} /> 설정 추가
          </button>
        }
      />
      <div className="card overflow-hidden">
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!settings.length}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">키</th>
                  <th className="th">값</th>
                  <th className="th w-full">설명</th>
                  <th className="th">수정</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr
                    key={setting.key}
                    className="cursor-pointer hover:bg-canvas/70"
                    onClick={() => setEditing(setting)}
                  >
                    <td className="td font-mono text-xs font-semibold">
                      {setting.key}
                    </td>
                    <td className="td max-w-xs truncate font-mono text-xs">
                      {setting.value}
                    </td>
                    <td className="td whitespace-normal text-ink-sub">
                      {setting.description ?? "-"}
                    </td>
                    <td className="td text-xs text-ink-mute">
                      {formatDateTime(setting.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
      </div>
      {editing && (
        <SettingModal
          setting={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function SettingModal({
  setting,
  onClose,
}: {
  setting: Setting | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState(setting?.key ?? "");
  const [value, setValue] = useState(setting?.value ?? "");
  const [description, setDescription] = useState(setting?.description ?? "");
  const save = useMutation({
    mutationFn: () => {
      const body = { value, description: description.trim() || undefined };
      return setting
        ? api.updateSetting(setting.key, body)
        : api.createSetting({ key: key.trim(), ...body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      onClose();
    },
  });

  return (
    <Modal title={setting ? "설정 수정" : "설정 추가"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="키">
          <input
            className="input w-full font-mono"
            maxLength={100}
            disabled={!!setting}
            value={key}
            onChange={(event) => setKey(event.target.value)}
          />
        </Field>
        <Field label="값">
          <textarea
            className="textarea min-h-24 font-mono"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Field label="설명">
          <input
            className="input w-full"
            maxLength={200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        {save.error && <ErrorBox error={save.error} />}
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-primary"
            disabled={!key.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}
