import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicSellerProfile } from "@/lib/profile/public";
import { ProStorePage } from "@/features/store/components/ProStorePage";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/supabase/env";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getBusinessStore(username: string) {
  const supabase = await createClient();
  const normalized = username.trim().toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, verified")
    .eq("username", normalized)
    .maybeSingle();

  if (!profile || profile.role !== "business") {
    return null;
  }

  const [{ data: business }, { data: sellerProfile }] = await Promise.all([
    supabase
      .from("business_accounts")
      .select("business_name, website")
      .eq("id", profile.id)
      .maybeSingle(),
    supabase
      .from("seller_profiles")
      .select("bio, rating, review_count, follower_count, listing_count, sales_count")
      .eq("id", profile.id)
      .maybeSingle(),
  ]);

  const publicProfile = await getPublicSellerProfile(normalized);
  if (!publicProfile) return null;

  return {
    profile,
    business,
    sellerProfile,
    listings: publicProfile.listings,
    rating: publicProfile.rating,
    reviewCount: publicProfile.reviewCount,
    listingCount: publicProfile.listingCount,
    salesCount: publicProfile.salesCount,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getBusinessStore(slug);
  if (!store) {
    return { title: "Store not found · ROVEXO" };
  }

  const name = store.business?.business_name ?? store.profile.full_name;
  const canonical = `${getAppUrl()}/store/${slug}`;

  return {
    title: `${name} · ROVEXO Store`,
    description: `Shop ${name} on ROVEXO. ${store.listingCount} listings and verified business seller.`,
    alternates: { canonical },
    openGraph: {
      title: `${name} · ROVEXO Store`,
      description: `Featured products from ${name}.`,
      url: canonical,
      type: "website",
    },
  };
}

export default async function ProStoreRoute({ params }: PageProps) {
  const { slug } = await params;
  const store = await getBusinessStore(slug);

  if (!store) {
    const fallback = await getPublicSellerProfile(slug);
    if (fallback) {
      redirect(`/user/${slug}`);
    }
    notFound();
  }

  return (
    <ProStorePage
      storeName={store.business?.business_name ?? store.profile.full_name}
      username={store.profile.username}
      avatarUrl={store.profile.avatar_url}
      verified={store.profile.verified}
      bio={store.sellerProfile?.bio ?? null}
      website={store.business?.website ?? null}
      rating={store.rating}
      reviewCount={store.reviewCount}
      followerCount={store.sellerProfile?.follower_count ?? 0}
      listingCount={store.listingCount}
      salesCount={store.salesCount}
      listings={store.listings}
    />
  );
}
