import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/supabase/env";

export type ReviewSchemaInput = {
  productTitle: string;
  productSlug: string;
  rating: number;
  reviewCount: number;
  reviews: { author: string; rating: number; comment: string | null; createdAt: string }[];
};

export async function fetchProductReviews(productId: string, limit = 10) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reviews")
      .select("rating, comment, created_at, profiles!reviews_reviewer_id_fkey(full_name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((row) => ({
      author: (row.profiles as { full_name: string } | null)?.full_name ?? "ROVEXO Buyer",
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchSellerReviews(revieweeId: string, limit = 10) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reviews")
      .select("rating, comment, created_at, profiles!reviews_reviewer_id_fkey(full_name)")
      .eq("reviewee_id", revieweeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((row) => ({
      author: (row.profiles as { full_name: string } | null)?.full_name ?? "ROVEXO Buyer",
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export function productReviewJsonLd(input: ReviewSchemaInput) {
  const url = `${getAppUrl()}/listing/${input.productSlug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.productTitle,
    url,
    aggregateRating:
      input.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
          }
        : undefined,
    review: input.reviews
      .filter((review) => review.comment)
      .slice(0, 5)
      .map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author },
        reviewRating: { "@type": "Rating", ratingValue: review.rating },
        reviewBody: review.comment,
        datePublished: review.createdAt,
      })),
  };
}

export function sellerAggregateRatingJsonLd(input: {
  name: string;
  username: string;
  rating: number;
  reviewCount: number;
  reviews: ReviewSchemaInput["reviews"];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: `${getAppUrl()}/user/${input.username}`,
    aggregateRating:
      input.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
          }
        : undefined,
    review: input.reviews
      .filter((review) => review.comment)
      .slice(0, 3)
      .map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author },
        reviewRating: { "@type": "Rating", ratingValue: review.rating },
        reviewBody: review.comment,
        datePublished: review.createdAt,
      })),
  };
}
