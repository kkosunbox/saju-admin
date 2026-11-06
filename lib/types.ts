export interface Admin {
  id: number;
  username: string;
  name: string;
  role: "admin";
}

export interface Page<T> {
  items: T[];
  total: number;
}

export type UserStatus = "guest" | "active" | "inactive" | "suspended";

export interface UserRow {
  id: number;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  nickname: string | null;
  balance: number;
  providers: string[];
  lastActiveAt: string | null;
  createdAt: string;
}

export interface UserDetail {
  user: {
    id: number;
    email: string | null;
    phone: string | null;
    status: UserStatus;
    isAllowMarketing: boolean;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
    mergedIntoUserId: number | null;
    withdrawalReason: string | null;
    createdAt: string;
    updatedAt: string;
  };
  profile: {
    nickname: string;
    gender: string;
    calendarType: string;
    birthDateInput: string;
    isLeapMonth: boolean;
    birthTime: string | null;
    mbti: string;
    createdAt: string;
  } | null;
  socialAccounts: {
    provider: string;
    email: string;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
  balance: number;
  subscription: {
    id: number;
    store: string;
    status: string;
    priceKrw: number;
    currentPeriodEnd: string;
    autoRenew: boolean;
  } | null;
}

export interface PointTransaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  label: string;
  createdAt: string;
  idempotencyKey?: string;
  refType?: string | null;
  refId?: string | null;
}

export interface Entitlement {
  id: number;
  contentKey: string;
  source: string;
  validUntil: string | null;
  transactionId: number | null;
  createdAt: string;
}

export interface Purchase {
  id: number;
  userId: number;
  userEmail?: string | null;
  store: string;
  productId: string;
  kind: string;
  status: string;
  orderId: string | null;
  storeTransactionId: string | null;
  amountKrw: number;
  points: number;
  bonusPoints: number;
  environment: string;
  failureReason: string | null;
  completedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  userEmail?: string | null;
  store: string;
  productId: string;
  status: string;
  priceKrw: number;
  periodCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  graceUntil: string | null;
  nextChargeAt: string | null;
  failedCharges: number;
  cardLabel: string | null;
  environment: string;
  cancelledAt: string | null;
  createdAt: string;
}

export interface Inquiry {
  id: number;
  userId: number;
  category: string;
  title: string | null;
  content: string;
  attachmentUrls: string[] | null;
  contact: string | null;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  user: { id: number; email: string | null; status: UserStatus } | null;
}

export interface DashboardDay {
  day: string;
  members: number;
  guests: number;
  payments: number;
  amountKrw: number;
  refunds: number;
  refundedKrw: number;
  aiCalls: number;
  aiCostKrw: number;
}

export interface Dashboard {
  from: string;
  to: string;
  total: Omit<DashboardDay, "day">;
  series: DashboardDay[];
  users: Record<UserStatus, number>;
  subscriptions: Record<string, number>;
  pendingInquiries: number;
}

export interface AiUsageRow {
  id: number;
  userId: number | null;
  userEmail?: string | null;
  feature: string;
  contentKey: string | null;
  refId: number | null;
  step: string | null;
  model: string | null;
  status: string;
  errorMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: string | null;
  costKrw: string | null;
  latencyMs: number;
  createdAt: string;
}

export interface AiUsageSummaryRow {
  day: string;
  feature: string;
  contentKey: string | null;
  model: string | null;
  calls: number;
  failedCalls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costKrw: number;
}

export interface AiUsageSummary {
  total: {
    calls: number;
    failedCalls: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUsd: number;
    costKrw: number;
  };
  rows: AiUsageSummaryRow[];
}

export interface PromoRow {
  screen: string;
  item: string;
  views: number;
  clicks: number;
  clickers: number;
  converted: number;
  clickRate: number;
  conversionRate: number;
}

export interface FortuneText {
  id: number;
  section: string;
  kind: string | null;
  category: string | null;
  band: string | null;
  polarity: string | null;
  text: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}
