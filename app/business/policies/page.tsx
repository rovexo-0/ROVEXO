import { redirect } from "next/navigation";

/**
 * Business Policies entry — redirects to Seller Terms (Business Seller Terms withdrawn in v1.0).
 * Phase C Business hub UX is removed; this route remains as a safe redirect only.
 */
export default function BusinessPoliciesRedirect() {
  redirect("/legal/seller-terms");
}
