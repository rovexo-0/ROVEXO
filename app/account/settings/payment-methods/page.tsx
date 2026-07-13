import { redirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export default function SettingsPaymentMethodsRedirect() {
  redirect(WALLET_ROUTES.paymentMethods);
}
