import type { PushCampaignKind } from "@/lib/types";

/** 개별 ID나 선행 입력 없이 열 수 있는 앱 화면만 등록한다. */
export const PUSH_DESTINATIONS = [
  { group: "기본 화면", label: "홈", url: "/" },
  { group: "기본 화면", label: "오늘의 운세", url: "/fortune" },
  { group: "기본 화면", label: "콘텐츠", url: "/content" },
  { group: "기본 화면", label: "운알톡", url: "/consult" },
  { group: "기본 화면", label: "궁합", url: "/compatibility" },
  { group: "기본 화면", label: "마이", url: "/my" },
  { group: "프리미엄 운세", label: "길일 찾기", url: "/premium/lucky" },
  { group: "프리미엄 운세", label: "월별 상세운세", url: "/premium/monthly" },
  { group: "프리미엄 운세", label: "신년운세", url: "/premium/new-year" },
  { group: "프리미엄 운세", label: "평생운", url: "/premium/life" },
  { group: "프리미엄 운세", label: "상세사주 해석", url: "/premium/saju" },
];

export function pushDestinationLabel(url?: string | null) {
  if (!url) return "앱만 열기";
  return PUSH_DESTINATIONS.find((item) => item.url === url)?.label ?? url;
}

/**
 * 앱 푸시 화면에서 눌러 채우는 문구 모음.
 * 캠페인은 모두에게 같은 글이 나가므로 이름·띠 같은 개인 값은 넣지 않고,
 * 개인 풀이가 있는 화면(url)으로 보내 알림에서 약속한 내용을 거기서 보여준다.
 * 유료 화면으로 보내는 문구는 광고(ad)로 둔다 — 정보통신망법상 결제로 이어지면 광고다.
 */
export interface PushPreset {
  id: string;
  group: PushPresetGroup;
  label: string;
  kind: PushCampaignKind;
  title: string;
  body: string;
  url: string;
  /** 언제 보내면 좋은지, 주의할 점 */
  note: string;
}

export const PUSH_PRESET_GROUPS = [
  "개인화 티저",
  "사주 달력",
  "순위·비교",
  "시간 한정",
  "시즌",
  "관계·다시 보기",
] as const;
export type PushPresetGroup = (typeof PUSH_PRESET_GROUPS)[number];

export const PUSH_PRESETS: PushPreset[] = [
  // 개인화 티저 — 앞부분만 말하고 오늘 운세 화면에서 마저 보여준다
  {
    id: "tease-words",
    group: "개인화 티저",
    label: "말 한마디 조심",
    kind: "info",
    title: "오늘 말 한마디가 운을 가릅니다",
    body: "오늘 사주 흐름에 조심해야 할 대화가 하나 보여요. 누구와, 언제인지 확인해 보세요.",
    url: "/fortune",
    note: "평일 오전 8~10시. 오늘 운세 화면의 대인운 내용과 이어집니다.",
  },
  {
    id: "tease-contact",
    group: "개인화 티저",
    label: "연락 올 사람",
    kind: "info",
    title: "이번 주에 연락 올 사람",
    body: "이번 주 흐름에 반가운 연락 기운이 보여요. 내 사주로 본 이번 주 인연운을 확인해 보세요.",
    url: "/fortune",
    note: "월요일 저녁. 주간 운세 탭으로 들어가 연애·대인운을 보게 됩니다.",
  },
  {
    id: "tease-money",
    group: "개인화 티저",
    label: "돈 쓰기 전에",
    kind: "info",
    title: "오늘 지갑 열기 전에 1분만",
    body: "오늘 금전운에 쓰면 아쉬운 돈과 써도 괜찮은 돈이 나뉘어 있어요.",
    url: "/fortune",
    note: "점심 직전(11시대)이나 금요일 오후가 잘 맞습니다.",
  },
  {
    id: "tease-clash",
    group: "개인화 티저",
    label: "일진이 부딪히는 날",
    kind: "info",
    title: "오늘 일진, 나와 맞을까요?",
    body: "날마다 들어오는 기운이 내 사주와 부딪히기도, 맞물리기도 해요. 오늘은 어느 쪽인지 확인해 보세요.",
    url: "/fortune",
    note: "모두에게 같은 글이 가므로 '부딪힌다'고 단정하지 않는 문구입니다.",
  },

  // 사주 달력 — 실제 날짜에 맞춰 보내는 정보
  {
    id: "cal-term",
    group: "사주 달력",
    label: "절기, 새 달의 운 시작",
    kind: "info",
    title: "오늘부터 새 달의 운이 시작돼요",
    body: "사주에서는 절기가 바뀌는 날 달이 바뀝니다. 이번 달 내 운의 흐름이 어떻게 달라졌는지 확인해 보세요.",
    url: "/fortune",
    note: "절기 당일 아침. 남은 날: 대설 12/7, 소한 1/5, 입춘 2/4.",
  },
  {
    id: "cal-dongji",
    group: "사주 달력",
    label: "소설·동지",
    kind: "info",
    title: "오늘은 동지, 한 해 기운이 바뀌는 날",
    body: "밤이 가장 긴 오늘부터 양의 기운이 다시 자라요. 남은 올해와 다가올 흐름을 미리 확인해 보세요.",
    url: "/fortune",
    note: "동지 12/21 아침. 소설(11/22)에 쓰려면 제목을 '오늘은 소설, 겨울 기운이 깊어지는 날'로 바꾸세요.",
  },
  {
    id: "cal-move",
    group: "사주 달력",
    label: "이사·계약 좋은 날",
    kind: "ad",
    title: "이사·계약, 이번 달 좋은 날 따로 있어요",
    body: "손 없는 날만으로는 부족해요. 내 사주 일진에 맞는 길일 TOP 5를 찾아 드려요.",
    url: "/premium/lucky",
    note: "유료 화면(길일 찾기)이라 광고입니다. 월초·주말 전 낮 시간.",
  },
  {
    id: "cal-month",
    group: "사주 달력",
    label: "이번 달 좋은 날·조심할 날",
    kind: "ad",
    title: "이번 달, 조심할 날이 있어요",
    body: "이번 달 좋은 날과 조심할 날을 날짜별로 정리했어요. 일정 잡기 전에 확인해 보세요.",
    url: "/premium/monthly",
    note: "유료 화면(월별 상세운세)이라 광고입니다. 매달 1일 또는 절기 다음 날.",
  },
  {
    id: "cal-newyear",
    group: "사주 달력",
    label: "정미년 신년운세",
    kind: "ad",
    title: "2027 정미년, 내 운이 크게 바뀌는 달",
    body: "붉은 양의 해, 정미년이 다가와요. 새해 열두 달 중 내 운이 크게 움직이는 달을 미리 확인해 보세요.",
    url: "/premium/new-year",
    note: "12월 초부터 설(2027-02-06) 전까지. 유료 화면이라 광고입니다.",
  },

  // 순위·비교
  {
    id: "rank-zodiac",
    group: "순위·비교",
    label: "오늘 금전운 1위 띠",
    kind: "info",
    title: "오늘 금전운 1위 띠는?",
    body: "열두 띠 중 오늘 돈 기운이 가장 좋은 띠가 있어요. 내 띠는 몇 위인지 확인해 보세요.",
    url: "/fortune",
    note: "오늘 운세 화면에 띠 순위가 없으면 '내 금전운 점수'로 기대가 맞춰지도록 본문을 조정하세요.",
  },
  {
    id: "rank-love",
    group: "순위·비교",
    label: "이번 달 연애운 상위",
    kind: "info",
    title: "이번 달 연애운, 상위권일까요?",
    body: "이번 달 내 연애운 점수가 나왔어요. 지난달보다 올랐는지 확인해 보세요.",
    url: "/fortune",
    note: "월초. 월간 탭의 연애운 점수로 이어집니다.",
  },

  // 시간 한정
  {
    id: "time-lucky-hour",
    group: "시간 한정",
    label: "오늘 행운의 시간",
    kind: "info",
    title: "오늘 행운의 시간, 확인하셨어요?",
    body: "하루 중 기운이 가장 좋은 시간이 따로 있어요. 놓치기 전에 확인해 보세요.",
    url: "/fortune",
    note: "오전 9시 전후. 사람마다 시간이 달라 '30분 뒤' 같은 시각은 넣지 않았습니다.",
  },
  {
    id: "time-week-turn",
    group: "시간 한정",
    label: "이번 주 흐름이 꺾이는 날",
    kind: "info",
    title: "이번 주, 흐름이 바뀌는 요일이 있어요",
    body: "좋을 때 밀고, 꺾일 때 쉬어 가세요. 이번 주 요일별 흐름을 확인해 보세요.",
    url: "/fortune",
    note: "월요일 아침 8~9시.",
  },

  // 시즌
  {
    id: "season-suneung",
    group: "시즌",
    label: "수능",
    kind: "info",
    title: "수험생 가족이라면 오늘 알아둘 것",
    body: "긴장되는 날, 오늘 운의 흐름과 마음을 다잡을 한마디를 준비했어요. 모두 응원합니다.",
    url: "/fortune",
    note: "수능(11/19) 전날 저녁이나 당일 아침 7시대.",
  },
  {
    id: "season-xmas",
    group: "시즌",
    label: "크리스마스·연말 연애운",
    kind: "info",
    title: "올해 연애운, 아직 한 번 남았어요",
    body: "연말에 들어오는 인연 기운이 있는지, 내 사주로 확인해 보세요.",
    url: "/fortune",
    note: "12월 셋째 주 저녁.",
  },
  {
    id: "season-monday",
    group: "시즌",
    label: "월요일 아침",
    kind: "info",
    title: "이번 주 조심할 요일 하나",
    body: "한 주를 시작하기 전에 피해 가면 좋을 날을 짚어 드려요.",
    url: "/fortune",
    note: "월요일 8시. 매주 쓰면 질리니 2~3주에 한 번.",
  },

  // 관계·다시 보기
  {
    id: "rel-compat",
    group: "관계·다시 보기",
    label: "궁합 흐름",
    kind: "info",
    title: "그 사람과 이번 주 궁합 흐름",
    body: "궁합은 날마다 조금씩 달라져요. 이번 주 둘의 흐름이 어떤지 확인해 보세요.",
    url: "/compatibility",
    note: "궁합을 본 적 있는 고객을 골라 보내면 가장 잘 맞습니다.",
  },
  {
    id: "rel-unread",
    group: "관계·다시 보기",
    label: "보다 만 운세",
    kind: "info",
    title: "어제 운세에 놓친 내용이 있어요",
    body: "끝까지 보지 않은 풀이에 오늘 이어지는 이야기가 남아 있어요.",
    url: "/fortune",
    note: "며칠 들어오지 않은 고객을 골라 저녁 7~9시에. 전체 발송에는 맞지 않습니다.",
  },
];
