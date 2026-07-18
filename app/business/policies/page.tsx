import { redirect } from "next/navigation";

/**
 * Business Policies — Business Seller Terms + Legal Centre (canonical legal SSOT).
 * One Feature = Legal documents; entry stays under Business hub via back path.
 */
export default function BusinessPoliciesRedirect() {
  redirect("/legal/business-seller-terms?returnTo=/business/dashboard");
}
