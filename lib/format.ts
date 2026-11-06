const dateTime = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateOnly = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : "-";
}

export function formatDate(value: string | null | undefined): string {
  return value ? dateOnly.format(new Date(value)) : "-";
}

export function formatNumber(
  value: number | string | null | undefined,
): string {
  return value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("ko-KR");
}

export function formatWon(value: number | string | null | undefined): string {
  return value === null || value === undefined
    ? "-"
    : `${Math.round(Number(value)).toLocaleString("ko-KR")}원`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** YYYY-MM-DD in KST, `daysAgo` days before today. */
export function kstDate(daysAgo = 0): string {
  return new Date(Date.now() + 9 * 3600_000 - daysAgo * 86400_000)
    .toISOString()
    .slice(0, 10);
}

export type Tone = "gray" | "blue" | "green" | "amber" | "red" | "navy";

export const USER_STATUS: Record<string, [string, Tone]> = {
  guest: ["게스트", "gray"],
  active: ["회원", "green"],
  inactive: ["탈퇴·병합", "amber"],
  suspended: ["정지", "red"],
};

export const PURCHASE_STATUS: Record<string, [string, Tone]> = {
  pending: ["결제 대기", "gray"],
  completed: ["완료", "green"],
  refunded: ["환불", "amber"],
  cancelled: ["취소", "gray"],
  failed: ["실패", "red"],
};

export const SUBSCRIPTION_STATUS: Record<string, [string, Tone]> = {
  active: ["이용 중", "green"],
  grace: ["결제 재시도", "amber"],
  cancelled: ["해지 예약", "gray"],
  expired: ["만료", "red"],
};

export const INQUIRY_STATUS: Record<string, [string, Tone]> = {
  pending: ["답변 대기", "amber"],
  in_progress: ["처리 중", "blue"],
  resolved: ["답변 완료", "green"],
};

export const INQUIRY_CATEGORY: Record<string, string> = {
  account: "계정",
  payment: "결제",
  content: "콘텐츠",
  bug: "오류",
  suggestion: "제안",
  etc: "기타",
};

export const STORE: Record<string, string> = {
  toss: "토스(웹)",
  apple: "App Store",
  google: "Google Play",
};

export const PROVIDER: Record<string, string> = {
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
  apple: "애플",
};

export const POINT_TYPE: Record<string, string> = {
  charge: "충전",
  grant: "무료 지급",
  use: "사용",
  expire: "소멸",
  refund: "환불",
  revoke: "회수(스토어 환불)",
  adjust: "관리자 조정",
};

export const ENTITLEMENT_SOURCE: Record<string, string> = {
  points: "포인트",
  bundle: "묶음",
  subscription: "구독",
  admin: "관리자",
};

export const AI_FEATURE: Record<string, string> = {
  premium_reading: "유료 풀이",
  consult: "운알톡 상담",
  daily_fortune: "오늘의 운세",
};

export const AI_STATUS: Record<string, [string, Tone]> = {
  ok: ["성공", "green"],
  refusal: ["거절", "amber"],
  truncated: ["잘림", "amber"],
  invalid_output: ["형식 오류", "red"],
  timeout: ["시간 초과", "red"],
  api_error: ["API 오류", "red"],
};

export const LIVE_ENVIRONMENTS = ["live", "production"];
