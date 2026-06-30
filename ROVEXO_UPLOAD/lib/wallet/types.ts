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
  /** Legacy manual-withdraw balance (v1.0 automatic payouts do not increase this). */
  availableBalance: number;
  pendingBalance: number;
  pendingAvailableAt: string;
  /** Completed sale payouts transferred to Stripe Connect. */
  paidOutBalance: number;
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
