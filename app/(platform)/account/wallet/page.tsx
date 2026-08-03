import { redirect } from "next/navigation";

/** Legacy account wallet path → canonical Wallet hub (Blood XIII). */
export default function AccountWalletRedirect() {
  redirect("/wallet");
}
