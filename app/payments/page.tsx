import { redirect } from "next/navigation";

/** Payments management lives in Wallet — single entry point. */
export default function PaymentsHubRedirect() {
  redirect("/wallet");
}
