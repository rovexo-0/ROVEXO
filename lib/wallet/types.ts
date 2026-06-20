export type WalletTransactionStatus = "completed" | "pending" | "failed" | "refunded";

export type WalletTransactionType = "sale" | "withdrawal" | "fee" | "refund" | "promotion";

export type WalletTransaction = {
  id: string;
  orderNumber: string;
  productTitle: string;
  productImageUrl: string;
  amount: number;
  status: WalletTransactionStatus;
  type: WalletTransactionType;
  createdAt: string;
  description?: string;
  feeAmount?: number;
  withdrawMethodLabel?: string;
  payoutAvailableAt?: string;
};

export type WithdrawMethodProvider = "bank_account" | "stripe_connect";

export type WithdrawMethod = {
  id: string;
  provider: WithdrawMethodProvider;
  label: string;
  lastDigits: string;
  connected: boolean;
};

export type WalletSummaryMetric = {
  value: number;
  changePercent: number;
};

export type WalletData = {
  availableBalance: number;
  pendingBalance: number;
  pendingAvailableAt: string;
  monthSummary: {
    revenue: WalletSummaryMetric;
    withdrawn: WalletSummaryMetric;
    fees: WalletSummaryMetric;
  };
  transactions: WalletTransaction[];
  withdrawMethods: WithdrawMethod[];
};

export type WithdrawDraft = {
  methodId: string;
  amount: string;
};

export const DEFAULT_WITHDRAW_DRAFT: WithdrawDraft = {
  methodId: "",
  amount: "",
};

export type WithdrawStep = "method" | "amount" | "review" | "success";
