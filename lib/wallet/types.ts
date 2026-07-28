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
  stripeTransferId?: string;
};

export type ConnectPayoutStatus = {
  connected: boolean;
  payoutsEnabled: boolean;
};

export type WalletData = {
  /** Money that can be withdrawn now. Never includes pending/processing/locked. */
  availableBalance: number;
  pendingBalance: number;
  pendingAvailableAt: string;
  /** Funds blocked (claims / security locks). Never withdrawable. */
  lockedBalance: number;
  /** Completed sale payouts transferred to Stripe Connect. */
  paidOutBalance: number;
  /** Live count of pending sale holds (protection period). */
  pendingOrderCount: number;
  withdrawalSummary: {
    processingTotal: number;
    processingCount: number;
    completedTotal: number;
    completedCount: number;
  };
  monthSummary: {
    revenue: WalletSummaryMetric;
    withdrawn: WalletSummaryMetric;
    fees: WalletSummaryMetric;
  };
  transactions: WalletTransaction[];
  withdrawMethods: WithdrawMethod[];
  connectStatus: ConnectPayoutStatus;
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

export type WithdrawDraft = {
  methodId: string;
  amount: string;
};

export const DEFAULT_WITHDRAW_DRAFT: WithdrawDraft = {
  methodId: "",
  amount: "",
};

export type WithdrawStep = "method" | "amount" | "review" | "success";
