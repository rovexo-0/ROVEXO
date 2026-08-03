import { redirect } from "next/navigation";

export default function SellerRulesRedirect() {
  redirect("/legal/seller-terms");
}
