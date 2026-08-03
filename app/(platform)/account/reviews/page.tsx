import { ReviewsV1 } from "@/features/account-module/components/ReviewsV1";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { getProfile } from "@/lib/profile/data";
import { listSellerReviews } from "@/lib/reviews/store";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountReviewsRoute() {
  const profile = await getProfile();
  const [reviews, snapshot] = await Promise.all([
    listSellerReviews(profile.id, 50),
    fetchAccountHubSnapshot(profile),
  ]);

  return (
    <ReviewsV1
      rating={snapshot.rating}
      reviewCount={snapshot.reviewCount}
      reviews={reviews}
    />
  );
}
