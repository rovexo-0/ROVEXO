import { roundWalletMoney } from "@/lib/wallet/security";
import { LOST_PARCEL_SELLER_GUARANTEE_MAX_GBP } from "@/lib/seller-context/seller-context-v1";

export function computeSellerGuaranteeNetGbp(input: {
  orderItemPriceGbp: number;
  carrierCompensationGbp?: number | null;
}): { gross: number; carrier: number; net: number } {
  const gross = Math.min(
    LOST_PARCEL_SELLER_GUARANTEE_MAX_GBP,
    Math.max(0, roundWalletMoney(input.orderItemPriceGbp)),
  );
  const carrier = Math.max(0, roundWalletMoney(Number(input.carrierCompensationGbp ?? 0)));
  const net = Math.max(0, roundWalletMoney(gross - carrier));
  return { gross, carrier, net };
}
