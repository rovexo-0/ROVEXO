/**
 * Promote payment options — My Wallet + Default Saved Card only.
 * Reuses Wallet Engine + Payment Methods Engine (no new payment systems).
 */

import "server-only";

import { listPaymentMethods, type SavedPaymentMethod } from "@/lib/payments/repository";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/wallet/utils";
import type { PromotionPaymentMethodId } from "@/lib/promotions/payment-safe";
import { formatDefaultCardLabel } from "@/lib/promotions/payment-format";

export type PromotionDefaultCard = {
  brand: string;
  last4: string;
  label: string;
};

export type PromotionPaymentOptions = {
  wallet: {
    availableBalance: number;
    availableLabel: string;
    /** True when Available Balance >= promotion amount. */
    canPay: boolean;
  };
  defaultCard: PromotionDefaultCard | null;
  /** True when at least one method can complete this charge. */
  hasPayableMethod: boolean;
  amountCents: number;
  methods: PromotionPaymentMethodId[];
};

export { formatDefaultCardLabel } from "@/lib/promotions/payment-format";

export async function getPromotionPaymentOptions(
  userId: string,
  amountCents = 0,
): Promise<PromotionPaymentOptions> {
  let availableBalance = 0;

  const admin = tryCreateAdminClient();
  if (admin) {
    const { data: wallet } = await admin
      .from("wallets")
      .select("available_balance")
      .eq("user_id", userId)
      .maybeSingle();
    availableBalance = Number(wallet?.available_balance ?? 0);
  } else {
    const supabase = await createClient();
    const { data: wallet } = await supabase
      .from("wallets")
      .select("available_balance")
      .eq("user_id", userId)
      .maybeSingle();
    availableBalance = Number(wallet?.available_balance ?? 0);
  }

  const methods = await listPaymentMethods(userId).catch(() => [] as SavedPaymentMethod[]);
  const defaultMethod = methods.find((method) => method.isDefault) ?? methods[0] ?? null;

  const defaultCard = defaultMethod
    ? {
        brand: defaultMethod.brand,
        last4: defaultMethod.last4,
        label: formatDefaultCardLabel(defaultMethod),
      }
    : null;

  const availableRounded = Math.round(availableBalance * 100) / 100;
  const amountGbp = Math.max(0, Math.round(amountCents) / 100);
  const walletCanPay = amountCents > 0 ? availableRounded + 1e-9 >= amountGbp : availableRounded > 0;

  return {
    wallet: {
      availableBalance: availableRounded,
      availableLabel: formatCurrency(availableRounded),
      canPay: walletCanPay,
    },
    defaultCard,
    hasPayableMethod: walletCanPay || Boolean(defaultCard),
    amountCents: Math.max(0, Math.round(amountCents)),
    methods: [
      ...(walletCanPay ? (["wallet"] as const) : []),
      ...(defaultCard ? (["default_card"] as const) : []),
    ],
  };
}
