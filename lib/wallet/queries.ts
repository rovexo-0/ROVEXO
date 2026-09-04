import { getWalletData, getWalletTransactionById } from "@/lib/wallet/store";
import { requireAuthContext } from "@/lib/auth/session";
import { getSellerCommerceSummary } from "@/lib/commerce-engine/read-model";
import type { SellerCommerceSummary } from "@/lib/commerce-engine/read-model";
import { normalizeSellerContext, type SellerContext } from "@/lib/seller-context/seller-context-v1";

export async function fetchWalletData(sellerContext: SellerContext | string = "individual") {
  const { user } = await requireAuthContext();
  return getWalletData(user.id, normalizeSellerContext(sellerContext));
}

export async function fetchWalletCommerceSummary(
  sellerContext: SellerContext | string = "individual",
): Promise<SellerCommerceSummary> {
  const { user } = await requireAuthContext();
  return getSellerCommerceSummary(user.id, normalizeSellerContext(sellerContext));
}

export async function fetchWalletTransaction(
  id: string,
  sellerContext: SellerContext | string = "individual",
) {
  const { user } = await requireAuthContext();
  return getWalletTransactionById(user.id, id, normalizeSellerContext(sellerContext));
}
