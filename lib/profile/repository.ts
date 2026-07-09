import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import type { UserProfile } from "@/lib/profile/types";
import {
  resolveAccountCapabilities,
  resolveRovexoAccountKind,
} from "@/lib/profile/account";
import { isAdmin, isSellerRole, isSuperAdmin } from "@/lib/auth/session";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";

/** Columns granted to authenticated users (see prelaunch_security migration). */
const PROFILE_READ_COLUMNS =
  "id, username, full_name, avatar_url, verified, role, created_at" as const;

const SELLER_PROFILE_READ_COLUMNS =
  "id, listing_count, sales_count, follower_count" as const;

function formatMemberSince(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

type ProfileReadRow = Pick<
  Tables<"profiles">,
  "id" | "username" | "full_name" | "avatar_url" | "verified" | "role" | "created_at" | "email"
>;

type SellerProfileStatsRow = Pick<
  Tables<"seller_profiles">,
  "listing_count" | "sales_count" | "follower_count"
>;

function mapProfileRow(
  profile: ProfileReadRow,
  sellerProfile: SellerProfileStatsRow | null,
  hasBusinessAccount: boolean,
  unreadMessages: number,
  unreadNotifications: number,
): UserProfile {
  const accountKind = resolveRovexoAccountKind(profile.role);
  const capabilityInput = {
    role: profile.role,
    verified: profile.verified,
    hasSellerProfile: Boolean(sellerProfile),
    hasBusinessAccount,
    listingCount: sellerProfile?.listing_count ?? 0,
    username: profile.username,
  };
  const capabilities = resolveAccountCapabilities(capabilityInput);
  const selling = capabilities.canSell;

  return {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    email: profile.email,
    avatarUrl: normalizeAvatarUrl(profile.avatar_url),
    verified: profile.verified,
    memberSince: formatMemberSince(profile.created_at),
    role: profile.role,
    accountKind,
    accountType: accountKind,
    capabilities,
    isSeller: selling,
    isAdmin: isAdmin(profile.role),
    isSuperAdmin: isSuperAdmin(profile.role),
    sellerStats: sellerProfile
      ? {
          listings: sellerProfile.listing_count,
          sales: sellerProfile.sales_count,
          followers: sellerProfile.follower_count,
        }
      : undefined,
    unreadMessages,
    unreadNotifications,
  };
}

async function countUnreadMessages(
  userId: string,
  role: Tables<"profiles">["role"],
): Promise<number> {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (!conversations?.length) {
    return 0;
  }

  const isSellerViewer = isSellerRole(role);

  return conversations.reduce((sum, conversation) => {
    if (conversation.buyer_id === userId) {
      return sum + conversation.buyer_unread_count;
    }
    if (isSellerViewer && conversation.seller_id === userId) {
      return sum + conversation.seller_unread_count;
    }
    return sum;
  }, 0);
}

export async function fetchProfileByUserId(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const [
    { data: profile, error },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_READ_COLUMNS)
      .eq("id", userId)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (error || !profile) {
    return null;
  }

  const email = user?.id === userId ? (user.email ?? "") : "";

  const [{ data: sellerProfile }, { data: businessAccount }, unreadMessages, { count: unreadNotifications }] =
    await Promise.all([
      supabase
        .from("seller_profiles")
        .select(SELLER_PROFILE_READ_COLUMNS)
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("business_accounts").select("id").eq("id", userId).maybeSingle(),
      countUnreadMessages(userId, profile.role),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false),
    ]);

  return mapProfileRow(
    { ...profile, email },
    sellerProfile,
    Boolean(businessAccount),
    unreadMessages,
    unreadNotifications ?? 0,
  );
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return fetchProfileByUserId(user.id);
}

export async function requireCurrentProfile(): Promise<UserProfile> {
  const profile = await fetchCurrentProfile();
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
}
