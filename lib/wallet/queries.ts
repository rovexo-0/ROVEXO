import { getWalletData, getWalletTransactionById } from "@/lib/wallet/store";
import { requireAuthContext } from "@/lib/auth/session";
import { getSellerCommerceSummary } from "@/lib/commerce-engine/read-model";
import type { SellerCommerceSummary } from "@/lib/commerce-engine/read-model";

export async function fetchWalletData() {
  const { user } = await requireAuthContext();
  return getWalletData(user.id);
}

export async function fetchWalletCommerceSummary(): Promise<SellerCommerceSummary> {
  const { user } = await requireAuthContext();
  return getSellerCommerceSummary(user.id);
}

export async function fetchWalletTransaction(id: string) {
  const { user } = await requireAuthContext();
  return getWalletTransactionById(user.id, id);
}
