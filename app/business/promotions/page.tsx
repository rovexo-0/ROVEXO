import { redirect } from "next/navigation";

/** Business Promotions — one promotions implementation; return to Business. */
export default function BusinessPromotionsRedirect() {
  redirect("/account/promotion-tools?returnTo=/business/dashboard");
}
