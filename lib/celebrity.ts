export type CelebrityGender = "female" | "male";

/** 천생연분 스타 후보 — 서버 celebrity 한 행 */
export interface Celebrity {
  id: number;
  /** 앱에 보이는 이름 (활동명) */
  name: string;
  /** 이름 아래 한 줄 (예: 가수 · 배우) */
  description: string;
  gender: CelebrityGender;
  /** 양력 생일 YYYY-MM-DD */
  birthDate: string;
  /** 앱 후보에 넣는지 */
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CelebrityInput = Pick<
  Celebrity,
  "name" | "description" | "gender" | "birthDate" | "visible"
>;

export const CELEBRITY_GENDER_LABEL: Record<CelebrityGender, string> = {
  female: "여성",
  male: "남성",
};
