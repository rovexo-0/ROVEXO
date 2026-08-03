import { permanentRedirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export default function SettingsPaymentMethodsRedirect() {
  permanentRedirect(WALLET_ROUTES.paymentMethods);
}
