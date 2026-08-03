import { SellerReviewCasePage } from "@/features/seller/review-center/components/SellerReviewCasePage";
import { getProfile } from "@/lib/profile/data";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SellerReviewCaseRoute({ params }: PageProps) {
  const profile = await getProfile();
  if (!profile.isSeller) redirect("/account");
  const { id } = await params;
  return <SellerReviewCasePage caseId={id} />;
}
