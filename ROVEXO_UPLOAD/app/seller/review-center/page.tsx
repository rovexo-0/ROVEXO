import { SellerReviewCenterPage } from "@/features/seller/review-center/components/SellerReviewCenterPage";
import { getProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

export default async function SellerReviewCenterRoute() {
  const profile = await getProfile();
  if (!profile.isSeller) redirect("/account");
  return <SellerReviewCenterPage />;
}
