import { redirect } from "next/navigation";

export default function BuyerRulesRedirect() {
  redirect("/legal/buyer-terms");
}
