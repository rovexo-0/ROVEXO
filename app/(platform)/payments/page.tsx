import { redirect } from "next/navigation";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

export default function PaymentsPage() {
  redirect(WALLET_ROUTES.hub);
}
