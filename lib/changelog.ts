/** 앱(프론트)과 서버(백엔드). 한 변경이 양쪽에 있으면 둘 다 둔다. */
export type ChangeArea = "frontend" | "backend";

export interface ChangeNote {
  id: string;
  /** 반영한 날. YYYY-MM-DD */
  date: string;
  areas: ChangeArea[];
  title: string;
  detail: string;
}

/** system_setting 키. 업데이트 이력 화면에서만 읽고 쓴다. */
export const CHANGELOG_KEY = "product_changelog";

export const CHANGELOG_DESCRIPTION =
  "업데이트 이력 화면에서 관리합니다. 시스템 설정 목록에서는 숨깁니다.";

export const CHANGE_AREA_LABEL: Record<ChangeArea, string> = {
  frontend: "프론트",
  backend: "백엔드",
};

/**
 * 서버에 업데이트 이력이 아직 없을 때의 첫 기록.
 * 한 번 저장되면 이후에는 어드민의 등록으로만 늘어난다.
 */
export const CHANGELOG_SEED: ChangeNote[] = [
  {
    id: "2026-11-08-character-reason",
    date: "2026-11-08",
    areas: ["frontend", "backend"],
    title: "찰떡 캐릭터가 나온 이유",
    detail:
      "사주 캐릭터 화면에서 찰떡 캐릭터 옆에, 왜 그 캐릭터인지를 보여 줍니다. 색끼리 받쳐 주거나 함께 빛나는 관계와, 동물끼리 짝이 되는 이유를 한자 없이 적고, 관계 한 줄(예: 함께 빛나는 사이)도 붙입니다. 공유 카드 가운데에도 같은 관계를 보여 줍니다.",
  },
  {
    id: "2026-11-08-pet-letter",
    date: "2026-11-08",
    areas: ["frontend", "backend"],
    title: "반려동물 궁합 편지, 문단으로 나누기",
    detail:
      "아이가 보내는 편지를 마음, 고마움, 앞으로의 바람으로 나눠 문단 사이에 빈 줄을 둡니다. 한 문단은 두세 문장입니다. 예전처럼 한 덩어리로 저장된 편지는 화면에서 문장을 묶어 나눠 보여 줍니다.",
  },
  {
    id: "2026-11-08-lucky-reasons",
    date: "2026-11-08",
    areas: ["frontend", "backend"],
    title: "오늘의 색·시간·숫자, 고른 이유를 쉽게",
    detail:
      "고른 이유를 용신·일진 같은 말 대신 일상 말로 바꿨습니다. 색은 그 색 소품을 곁에 두라는 식으로, 숫자는 순서나 자리·개수를 고를 때 떠올리라는 식으로, 시간은 중요한 연락이나 결정을 그때 해 보라는 식으로 적습니다. 명리 용어는 이유 아래 작은 근거로 따로 둡니다.",
  },
  {
    id: "2026-11-08-consult-enter",
    date: "2026-11-08",
    areas: ["frontend"],
    title: "운알톡 웹, Enter로 보내기",
    detail:
      "웹에서 Enter는 메시지를 보내고, Shift+Enter는 줄을 바꿉니다. 한글을 조합하는 중의 Enter는 글자를 확정하는 키라 보내지 않습니다. 앱에서는 지금까지처럼 Enter가 줄바꿈입니다.",
  },
];

export function parseChangelog(value: string): ChangeNote[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;

  const notes: ChangeNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const areasRaw = row.areas;
    if (
      typeof row.id !== "string" ||
      typeof row.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      typeof row.title !== "string" ||
      typeof row.detail !== "string" ||
      !Array.isArray(areasRaw)
    ) {
      return null;
    }
    const areas = (["frontend", "backend"] as const).filter((area) =>
      areasRaw.includes(area),
    );
    if (!areas.length || !row.title.trim() || !row.detail.trim()) return null;
    notes.push({
      id: row.id,
      date: row.date,
      areas: [...areas],
      title: row.title.trim(),
      detail: row.detail.trim(),
    });
  }
  return notes;
}
