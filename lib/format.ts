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

export const INQUIRY_CATEGORY: Record<string, string> = {
  account: "계정",
  payment: "결제",
  content: "콘텐츠",
  bug: "오류",
  suggestion: "제안",
  etc: "기타",
};

/** 오늘의 운세 분야. 앱 `categoryTheme` 라벨과 같음. */
export const FORTUNE_CATEGORY: Record<string, string> = {
  love: "연애운",
  money: "재물운",
  work: "직장·사업운",
  relationship: "인간관계운",
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

const CONTENT_TITLE: Record<string, string> = {
  saju: "상세 사주 해석",
  life: "평생운 · 10년 대운",
  spouse: "미래 배우자 리포트",
  "bundle:life": "인생 패키지",
  consult: "운알톡",
};

const THEME_TITLE: Record<string, string> = {
  love: "연애·결혼 운세",
  money: "재물 운세",
  career: "직업·적성 운세",
};

const LUCKY_TITLE: Record<string, string> = {
  move: "이사",
  contract: "계약",
  confess: "고백",
  interview: "면접",
  travel: "여행",
  start: "새 출발",
};

const CONSULT_TOPIC: Record<string, string> = {
  love: "연애·썸",
  crush: "짝사랑",
  marriage: "결혼",
  reunion: "재회·이별",
  work: "직장·이직",
  job: "취업·면접",
  business: "사업·창업",
  money: "돈·재테크",
  people: "인간관계",
  friend: "친구",
  family: "가족",
  children: "자녀·육아",
  study: "진로·시험",
  decision: "선택·결정",
  self: "나 자신",
};

/** 앱에 보이는 콘텐츠 이름. 키를 모르면 키를 그대로 둔다. */
export function contentTitle(
  feature: string,
  contentKey: string | null | undefined,
): string {
  if (!contentKey || contentKey === "-") return "-";
  if (feature === "consult") return CONSULT_TOPIC[contentKey] ?? contentKey;
  if (feature === "daily_fortune") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(contentKey);
    if (match) {
      return `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일 운세`;
    }
  }
  const fixed = CONTENT_TITLE[contentKey];
  if (fixed) return fixed;
  const [kind, arg, extra] = contentKey.split(":");
  if (!arg || extra !== undefined) return contentKey;
  if (kind === "theme") return THEME_TITLE[arg] ?? contentKey;
  if (kind === "lucky") {
    return LUCKY_TITLE[arg] ? `${LUCKY_TITLE[arg]} 길일 TOP 5` : "길일 찾기";
  }
  if (kind === "newyear" && /^\d{4}$/.test(arg)) return `${arg}년 신년운세`;
  const monthly = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(arg);
  if (kind === "monthly" && monthly) {
    return `${monthly[1]}년 ${Number(monthly[2])}월 상세운세`;
  }
  if (kind === "compat") return "심층 궁합";
  if (kind === "crush") return "그 사람의 속마음";
  if (kind === "pet") return "반려동물 궁합";
  return contentKey;
}

export const AI_STATUS: Record<string, [string, Tone]> = {
  ok: ["성공", "green"],
  refusal: ["거절", "amber"],
  truncated: ["잘림", "amber"],
  invalid_output: ["형식 오류", "red"],
  timeout: ["시간 초과", "red"],
  api_error: ["API 오류", "red"],
};

export const LIVE_ENVIRONMENTS = ["live", "production"];
