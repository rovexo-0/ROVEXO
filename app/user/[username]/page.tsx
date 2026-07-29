import type { Metadata } from "next";
import { StoreUnavailablePage } from "@/components/store/StoreUnavailablePage";
import { ViewProfilePage } from "@/features/profile/components/ViewProfilePage";
import { loadSellerReviews } from "@/features/profile/components/SellerReviewsSection";
import {
  fetchSellerDraftListings,
  getPublicSellerProfile,
  type PublicSellerProfile,
} from "@/lib/profile/public";
import { getFollowCounts, isFollowing } from "@/lib/follow/marketplace-follow-store-v1";
import { failClosedPublicTrustSummary, getPublicTrustSummary } from "@/lib/trust/service";
import { getAuthContext } from "@/lib/auth/session";
import { sellerPageMetadata, sellerProfilePageJsonLd } from "@/lib/seo/engine";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";
import {
  resolveStoreByRouteParam,
  storeMemberSinceLabel,
  type StoreRecord,
} from "@/lib/store/store-repository";
import type { Review } from "@/lib/reviews/types";
import type { PublicTrustSummary } from "@/lib/trust/types";

type PageProps = {
  params: Promise<{ username: string }>;
};

type ViewProfilePayload =
  | { kind: "unavailable" }
  | {
      kind: "ok";
      profile: PublicSellerProfile;
      reviews: Review[];
      trustSummary: PublicTrustSummary;
      isOwnProfile: boolean;
      loadFailed: boolean;
      jsonLdScript?: string;
    };

function storeToPublicProfile(store: StoreRecord): PublicSellerProfile {
  return {
    id: store.sellerId,
    fullName: store.storeName,
    username: store.storeSlug,
    avatarUrl: store.avatarUrl,
    coverUrl: null,
    rating: store.rating,
    reviewCount: store.reviewCount,
    listingCount: store.listingCount,
    salesCount: store.salesCount,
    memberSince: storeMemberSinceLabel(store.memberSinceIso),
    lastSeenLabel: null,
    country: null,
    emailVerified: store.verified,
    bio: store.bio,
    holidayModeEnabled: store.holidayModeEnabled,
    listings: store.listings,
    soldListings: store.soldListings,
    draftListings: [],
    followerCount: store.followerCount,
    followingCount: store.followingCount,
    badgeLabel: null,
    isFollowing: false,
  };
}

/**
 * Phase 1 — View Profile must open Public Profile whenever the account exists.
 * "Store unavailable" only when the account is missing, deleted, or suspended.
 */
async function resolvePublicProfile(routeParam: string): Promise<PublicSellerProfile | null> {
  const param = routeParam?.trim() ?? "";
  if (!param) return null;

  try {
    const store = await resolveStoreByRouteParam(param);
    if (store) return storeToPublicProfile(store);
  } catch {
    /* soft — fall through to profile loader */
  }

  try {
    return await getPublicSellerProfile(param);
  } catch {
    return null;
  }
}

async function loadViewProfilePayload(routeParam: string): Promise<ViewProfilePayload> {
  const profile = await resolvePublicProfile(routeParam);

  if (!profile) {
    return { kind: "unavailable" };
  }

  try {
    const [reviews, trustSummary, auth] = await Promise.all([
      loadSellerReviews(profile.id).catch(() => []),
      getPublicTrustSummary(profile.id).catch(() => failClosedPublicTrustSummary(profile.id)),
      getAuthContext().catch(() => null),
    ]);

    const isOwnProfile = auth?.user.id === profile.id;
    const draftListings = isOwnProfile
      ? await fetchSellerDraftListings(profile.id, {
          fullName: profile.fullName,
          username: profile.username,
        }).catch(() => [])
      : [];

    // Owner still sees ACTIVE listings while Holiday Mode hides them from buyers.
    let ownerListings = profile.listings;
    if (isOwnProfile && profile.holidayModeEnabled) {
      const { getEligibleListings } = await import("@/lib/listings/eligible-listings");
      const owned = await getEligibleListings({
        surface: "seller",
        sellerId: profile.id,
        page: 1,
        pageSize: 24,
        includeHolidayModeListings: true,
      }).catch(() => null);
      if (owned) ownerListings = owned.items;
    }

    const [followCounts, viewerFollowing] = await Promise.all([
      getFollowCounts(profile.id).catch(() => ({
        followerCount: 0,
        followingCount: 0,
      })),
      auth?.user.id && !isOwnProfile
        ? isFollowing(auth.user.id, profile.id).catch(() => false)
        : Promise.resolve(false),
    ]);

    const safeProfile: PublicSellerProfile = {
      ...profile,
      listings: isOwnProfile ? ownerListings : profile.listings,
      draftListings,
      badgeLabel: profile.badgeLabel ?? null,
      followerCount: followCounts.followerCount,
      followingCount: followCounts.followingCount,
      isFollowing: Boolean(viewerFollowing),
    };

    const jsonLd = sellerProfilePageJsonLd({
      name: safeProfile.fullName,
      username: safeProfile.username,
      products: safeProfile.listings,
      rating: safeProfile.rating,
      reviewCount: safeProfile.reviewCount,
    });

    return {
      kind: "ok",
      profile: safeProfile,
      reviews,
      trustSummary,
      isOwnProfile,
      loadFailed: false,
      jsonLdScript: JSON.stringify([jsonLd.profile, jsonLd.itemList].filter(Boolean)),
    };
  } catch {
    // Soft fail — still show Public Profile shell (empty store / reviews).
    return {
      kind: "ok",
      profile: {
        ...profile,
        draftListings: [],
        listings: [],
        soldListings: [],
        holidayModeEnabled: profile.holidayModeEnabled ?? false,
      },
      reviews: [],
      trustSummary: failClosedPublicTrustSummary(profile.id),
      isOwnProfile: false,
      loadFailed: true,
    };
  }
}

export default async function PublicSellerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const payload = await loadViewProfilePayload(username);

  if (payload.kind === "unavailable") {
    return <StoreUnavailablePage kind="store" />;
  }

  return (
    <ViewProfilePage
      profile={payload.profile}
      reviews={payload.reviews}
      trustSummary={payload.trustSummary}
      isOwnProfile={payload.isOwnProfile}
      loadFailed={payload.loadFailed}
      jsonLdScript={payload.jsonLdScript}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await resolvePublicProfile(username);
    if (!profile) {
      return {
        title: `${STORE_UNAVAILABLE_COPY.title} · ROVEXO`,
        robots: { index: false, follow: false },
      };
    }

    return sellerPageMetadata({
      fullName: profile.fullName,
      username: profile.username,
      listingCount: profile.listingCount,
    });
  } catch {
    return {
      title: `${STORE_UNAVAILABLE_COPY.title} · ROVEXO`,
      robots: { index: false, follow: false },
    };
  }
}
