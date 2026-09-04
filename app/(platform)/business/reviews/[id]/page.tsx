import { redirect } from "next/navigation";
import { SellerReviewCasePage } from "@/features/seller/review-center/components/SellerReviewCasePage";
import { loadPwaBusinessSession } from "@/lib/business/pwa-business-session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessReviewCaseRoute({ params }: PageProps) {
  const { status } = await loadPwaBusinessSession();
  if (!status.stripe.verified) {
    redirect(status.hasBusinessProfile ? "/business/connect" : "/business/information");
  }
  if (status.activeSellerContext !== "business") {
    redirect("/account");
  }
  const { id } = await params;
  return (
    <SellerReviewCasePage
      caseId={id}
      backHref="/business/reviews"
      backLabel="Review Center"
      surface="business"
    />
  );
}
