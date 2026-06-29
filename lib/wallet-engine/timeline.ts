import type { WalletTransaction, WalletTransactionStatus, WalletTransactionType } from "@/lib/wallet/types";
import { WALLET_ENGINE_TIMELINE_EVENTS } from "@/lib/wallet-engine/registry";
import type {
  WalletEngineBalanceSnapshot,
  WalletEngineEarningsSnapshot,
  WalletEngineFilterId,
  WalletEngineProtectionStatus,
  WalletEngineTimelineEvent,
  WalletEngineTimelineEventId,
  WalletEngineTransactionStatus,
  WalletEngineTransactionSummary,
  WalletEngineTransactionType,
} from "@/lib/wallet-engine/types";
import type { WalletData } from "@/lib/wallet/types";

export function mapTransactionType(type: WalletTransactionType): WalletEngineTransactionType {
  const map: Record<WalletTransactionType, WalletEngineTransactionType> = {
    sale: "sale",
    withdrawal: "withdrawal",
    fee: "buyer-protection-fee",
    refund: "refund",
    promotion: "promotion",
  };
  return map[type];
}

export function mapTransactionStatus(status: WalletTransactionStatus): WalletEngineTransactionStatus {
  const map: Record<WalletTransactionStatus, WalletEngineTransactionStatus> = {
    pending: "pending",
    completed: "completed",
    failed: "failed",
    refunded: "refunded",
  };
  return map[status];
}

export function mapTransactionToFilters(
  status: WalletTransactionStatus,
  type: WalletTransactionType,
): WalletEngineFilterId[] {
  const tags: WalletEngineFilterId[] = [];
  if (status === "pending") tags.push("pending", "protected");
  if (status === "completed" && type === "sale") tags.push("completed", "available");
  if (status === "failed") tags.push("failed");
  if (status === "refunded") tags.push("refunded");
  if (type === "withdrawal") tags.push("processing");
  return tags.length ? tags : ["pending"];
}

export function mapTransactionToSummary(tx: WalletTransaction, currency = "GBP"): WalletEngineTransactionSummary {
  return {
    transactionId: tx.id,
    orderNumber: tx.orderNumber,
    productTitle: tx.productTitle,
    amount: tx.amount,
    currency,
    type: mapTransactionType(tx.type),
    status: mapTransactionStatus(tx.status),
    createdAt: tx.createdAt,
    description: tx.description,
    filterTags: mapTransactionToFilters(tx.status, tx.type),
  };
}

export function mapWalletDataToBalances(data: WalletData, currency = "GBP"): WalletEngineBalanceSnapshot {
  return {
    pending: data.pendingBalance,
    protected: data.pendingBalance,
    available: data.availableBalance,
    withdrawable: data.connectStatus.payoutsEnabled ? data.pendingBalance : 0,
    reserved: 0,
    refund: Math.abs(
      data.transactions.filter((tx) => tx.type === "refund").reduce((sum, tx) => sum + tx.amount, 0),
    ),
    processing: data.transactions
      .filter((tx) => tx.status === "pending" && tx.type === "withdrawal")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    completed: data.paidOutBalance,
    currency,
  };
}

export function mapWalletDataToEarnings(data: WalletData, currency = "GBP"): WalletEngineEarningsSnapshot {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sales = data.transactions.filter((tx) => tx.type === "sale");
  const toTime = (value: string) => new Date(value).getTime();
  const sumSales = (filter: (tx: WalletTransaction) => boolean) =>
    sales.filter(filter).reduce((sum, tx) => sum + tx.amount, 0);

  return {
    pending: data.pendingBalance,
    protected: data.pendingBalance,
    available: data.availableBalance,
    withdrawn: data.paidOutBalance,
    lifetime: sales.reduce((sum, tx) => sum + tx.amount, 0),
    monthly: sumSales((tx) => toTime(tx.createdAt) >= startOfMonth.getTime()),
    weekly: sumSales((tx) => toTime(tx.createdAt) >= startOfWeek.getTime()),
    today: sumSales((tx) => toTime(tx.createdAt) >= startOfDay.getTime()),
    currency,
  };
}

export function mapProtectionStatus(data: WalletData): WalletEngineProtectionStatus {
  if (data.pendingBalance > 0) return "protected";
  if (data.transactions.some((tx) => tx.type === "refund" && tx.status === "pending")) return "disputed";
  if (data.paidOutBalance > 0) return "released";
  return "active";
}

type TimelineInput = {
  status: WalletTransactionStatus;
  type: WalletTransactionType;
  createdAt: string;
  payoutAvailableAt?: string;
  stripeTransferId?: string;
};

function currentTimelineStage(input: TimelineInput): WalletEngineTimelineEventId {
  if (input.status === "refunded") return "refunded";
  if (input.status === "failed") return "failed";
  if (input.type === "withdrawal" && input.status === "pending") return "processing";
  if (input.status === "completed" && input.stripeTransferId) return "payout-completed";
  if (input.status === "completed") return "available";
  if (input.status === "pending" && input.payoutAvailableAt) {
    const available = new Date(input.payoutAvailableAt).getTime() <= Date.now();
    return available ? "available" : "protected";
  }
  return "created";
}

const TIMELINE_ORDER: WalletEngineTimelineEventId[] = WALLET_ENGINE_TIMELINE_EVENTS.map((e) => e.id);

export function buildWalletTimeline(input: TimelineInput): WalletEngineTimelineEvent[] {
  const current = currentTimelineStage(input);
  const currentIndex = TIMELINE_ORDER.indexOf(current);

  const timestamps: Partial<Record<WalletEngineTimelineEventId, string | undefined>> = {
    created: input.createdAt,
    protected: input.createdAt,
    processing: input.type === "withdrawal" ? input.createdAt : undefined,
    available: input.payoutAvailableAt,
    "payout-initiated": input.stripeTransferId ? input.payoutAvailableAt : undefined,
    "payout-completed": input.stripeTransferId ? input.createdAt : undefined,
  };

  return WALLET_ENGINE_TIMELINE_EVENTS.map((event) => {
    const index = TIMELINE_ORDER.indexOf(event.id);
    return {
      id: event.id,
      label: event.label,
      timestamp: timestamps[event.id],
      done: index <= currentIndex,
      current: event.id === current,
    };
  });
}

export function matchesFilter(status: WalletTransactionStatus, filter: WalletEngineFilterId): boolean {
  const tags = mapTransactionToFilters(status, "sale");
  return tags.includes(filter);
}

export function matchesSummaryFilter(status: WalletEngineTransactionStatus, filter: WalletEngineFilterId): boolean {
  if (filter === "pending" && status === "pending") return true;
  if (filter === "protected" && status === "protected") return true;
  if (filter === "processing" && status === "processing") return true;
  if (filter === "available" && status === "available") return true;
  if (filter === "completed" && status === "completed") return true;
  if (filter === "failed" && status === "failed") return true;
  if (filter === "cancelled" && status === "cancelled") return true;
  if (filter === "refunded" && status === "refunded") return true;
  return false;
}

export function matchesSearch(
  query: string,
  fields: { orderNumber?: string; productTitle?: string; description?: string },
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [fields.orderNumber, fields.productTitle, fields.description]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}
