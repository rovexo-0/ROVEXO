import { getWalletData, getWalletTransactionById } from "@/lib/wallet/store";
import { requireAuthContext } from "@/lib/auth/session";

export async function fetchWalletData() {
  const { user } = await requireAuthContext();
  return getWalletData(user.id);
}

export async function fetchWalletTransaction(id: string) {
  const { user } = await requireAuthContext();
  return getWalletTransactionById(user.id, id);
}
