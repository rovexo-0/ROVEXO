import { permanentRedirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export default function AccountPaymentMethodsRedirect() {
  permanentRedirect(WALLET_ROUTES.paymentMethods);
}
