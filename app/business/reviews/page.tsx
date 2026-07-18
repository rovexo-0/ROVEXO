import { SellerReviewCenterPage } from "@/features/seller/review-center/components/SellerReviewCenterPage";
import { getBusinessProfile } from "@/lib/profile/data";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business Reviews — stays in Business hub (no seller → My Account dump). */
export default async function BusinessReviewsPage() {
  await getBusinessProfile();
  return <SellerReviewCenterPage backHref="/business/dashboard" backLabel="Business" />;
}
