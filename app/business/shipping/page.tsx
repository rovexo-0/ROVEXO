import { redirect } from "next/navigation";

/** Business Shipping — seller shipping lives in Settings (never My Account hub). */
export default function BusinessShippingRedirect() {
  redirect("/account/settings?returnTo=/business/dashboard");
}
