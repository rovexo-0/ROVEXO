import { redirect } from "next/navigation";
import { SellerReviewCenterPage } from "@/features/seller/review-center/components/SellerReviewCenterPage";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business Reviews — canonical Review Center, Business hub only. */
export default async function BusinessReviewsPage() {
  const { status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }
  if (status.activeSellerContext !== "business") {
    redirect("/account");
  }
  return (
    <SellerReviewCenterPage
      backHref="/business/menu"
      backLabel="Business Menu"
      listingsHref="/business/inventory"
      listingsLabel="Back to inventory"
      caseHrefBase="/business/reviews"
      surface="business"
    />
  );
}
