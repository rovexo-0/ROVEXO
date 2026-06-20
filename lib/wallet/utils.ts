import type { WalletTransactionStatus } from "@/lib/wallet/types";
import type { BadgeVariant } from "@/components/ui/Badge";

export function getTransactionStatusLabel(status: WalletTransactionStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
  }
}

export function getTransactionStatusVariant(status: WalletTransactionStatus): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    case "refunded":
      return "primary";
  }
}

export function formatWalletDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatWalletDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function getDaysUntilAvailable(availableAt: string, now = new Date()): number {
  const target = new Date(availableAt);
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatChangePercent(changePercent: number): string {
  const prefix = changePercent > 0 ? "+" : "";
  return `${prefix}${changePercent}%`;
}

export function parseWithdrawAmount(raw: string, maxAmount: number): number {
  const normalized = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, maxAmount);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
