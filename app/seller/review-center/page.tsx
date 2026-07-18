import { SellerReviewCenterPage } from "@/features/seller/review-center/components/SellerReviewCenterPage";
import { getProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function SellerReviewCenterRoute() {
  const profile = await getProfile();
  // Never dump Business/Selling tools to My Account (Final Master Order).
  if (!profile.isSeller) redirect("/seller");
  return <SellerReviewCenterPage />;
}
