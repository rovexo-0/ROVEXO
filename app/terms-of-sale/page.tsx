import { redirect } from "next/navigation";

export default function TermsOfSaleRedirect() {
  redirect("/legal/buyer-terms");
}
