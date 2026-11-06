import { getToken, setToken } from "./session";
import type {
  Admin,
  AiUsageRow,
  AiUsageSummary,
  Dashboard,
  Entitlement,
  FortuneText,
  Inquiry,
  Page,
  PointTransaction,
  PromoRow,
  Purchase,
  Setting,
  Subscription,
  UserDetail,
  UserRow,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

async function request<T>(
  path: string,
  options: { method?: string; query?: Query; body?: unknown } = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const token = getToken();
  const response = await fetch(
    `/api${path}${params.size ? `?${params}` : ""}`,
    {
      method: options.method ?? "GET",
      headers: {
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    },
  );
  const json = (await response.json().catch(() => null)) as {
    data?: T;
    code?: string;
    message?: string | string[];
  } | null;
  if (!response.ok) {
    if (response.status === 401 && token && path !== "/admin/auth/login") {
      setToken(null);
    }
    const message = Array.isArray(json?.message)
      ? json.message.join(", ")
      : json?.message;
    throw new ApiError(
      message && message !== json?.code ? message : messageOf(response.status),
      response.status,
      json?.code,
    );
  }
  return json?.data as T;
}

function messageOf(status: number): string {
  if (status === 400) return "요청 값이 올바르지 않습니다.";
  if (status === 401) return "아이디 또는 비밀번호를 확인해 주세요.";
  if (status === 403) return "권한이 없습니다.";
  if (status === 404) return "데이터를 찾을 수 없습니다.";
  return "서버 오류가 발생했습니다.";
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "알 수 없는 오류가 발생했습니다.";
}

export const api = {
  login: (body: { username: string; password: string }) =>
    request<{ accessToken: string; admin: Admin }>("/admin/auth/login", {
      method: "POST",
      body,
    }),
  me: () => request<Admin>("/admin/auth/me"),

  dashboard: (query: { from?: string; to?: string; includeTest?: boolean }) =>
    request<Dashboard>("/admin/dashboard/summary", { query }),

  users: (query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) => request<Page<UserRow>>("/admin/users", { query }),
  user: (id: number) => request<UserDetail>(`/admin/users/${id}`),
  updateUserStatus: (id: number, status: string) =>
    request<boolean>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  userPoints: (id: number, query: { limit: number; beforeId?: number }) =>
    request<{ items: PointTransaction[]; hasMore: boolean }>(
      `/admin/users/${id}/points`,
      {
        query,
      },
    ),
  adjustPoints: (id: number, body: { amount: number; reason: string }) =>
    request<PointTransaction>(`/admin/users/${id}/points`, {
      method: "POST",
      body,
    }),
  userEntitlements: (id: number) =>
    request<{ items: Entitlement[] }>(`/admin/users/${id}/entitlements`),

  purchases: (query: Query) =>
    request<Page<Purchase>>("/admin/purchases", { query }),
  subscriptions: (query: Query) =>
    request<Page<Subscription>>("/admin/subscriptions", { query }),

  inquiries: (query: { page: number; limit: number; status?: string }) =>
    request<Page<Inquiry>>("/admin/inquiries", { query }),
  inquiry: (id: number) => request<Inquiry>(`/admin/inquiries/${id}`),
  answerInquiry: (id: number, answer: string) =>
    request<boolean>(`/admin/inquiries/${id}/answer`, {
      method: "PATCH",
      body: { answer },
    }),

  aiUsage: (query: Query) =>
    request<Page<AiUsageRow>>("/admin/ai-usage", { query }),
  aiUsageSummary: (query: Query) =>
    request<AiUsageSummary>("/admin/ai-usage/summary", { query }),

  promoSummary: (query: Query) =>
    request<{ rows: PromoRow[] }>("/admin/promo-events/summary", { query }),

  textSections: () =>
    request<Record<string, string[]>>("/admin/fortune-texts/sections"),
  texts: (query: Query) =>
    request<{ list: FortuneText[]; total: number }>("/admin/fortune-texts", {
      query,
    }),
  createText: (
    body: Partial<FortuneText> & { section: string; text: string },
  ) => request<FortuneText>("/admin/fortune-texts", { method: "POST", body }),
  updateText: (id: number, body: { text?: string; isActive?: boolean }) =>
    request<FortuneText>(`/admin/fortune-texts/${id}`, {
      method: "PATCH",
      body,
    }),

  settings: () => request<{ settings: Setting[] }>("/admin/settings"),
  createSetting: (body: { key: string; value: string; description?: string }) =>
    request<Setting>("/admin/settings", { method: "POST", body }),
  updateSetting: (key: string, body: { value: string; description?: string }) =>
    request<Setting>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body,
    }),
};
