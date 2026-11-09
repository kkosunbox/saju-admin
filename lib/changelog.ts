/** 앱(프론트)과 서버(백엔드). 한 변경이 양쪽에 있으면 둘 다 둔다. */
export type ChangeArea = "frontend" | "backend";

/** 업데이트 이력 한 건 — 서버 product_changelog 한 행 */
export interface ChangeNote {
  id: number;
  /** 스크립트 등록·옛 기록의 이름. 어드민 등록은 null */
  slug: string | null;
  /** 반영한 날. YYYY-MM-DD */
  date: string;
  areas: ChangeArea[];
  title: string;
  detail: string;
  /** 등록한 시각(ISO). 시각을 모르는 옛 기록은 null */
  createdAt: string | null;
}

export type ChangeNoteInput = Pick<ChangeNote, "date" | "areas" | "title" | "detail">;

export interface ChangelogPage {
  items: ChangeNote[];
  total: number;
  page: number;
  limit: number;
  /** 구분과 상관없는 전체·프론트·백엔드 건수 */
  counts: { all: number } & Record<ChangeArea, number>;
}

/**
 * 예전에 업데이트 이력을 JSON 하나로 두던 system_setting 키.
 * 이제 product_changelog 표로 옮겼고, 되돌릴 때를 위해 행은 남겨 두었다 — 시스템 설정 목록에서는 숨긴다.
 */
export const CHANGELOG_KEY = "product_changelog";

export const CHANGE_AREA_LABEL: Record<ChangeArea, string> = {
  frontend: "프론트",
  backend: "백엔드",
};
