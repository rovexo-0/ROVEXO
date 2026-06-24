import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import type { UserProfile } from "@/lib/profile/types";
import type { AccountType } from "@/lib/profile/account";
import { isAdmin, isSellerRole, isSuperAdmin } from "@/lib/auth/session";

function formatMemberSince(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

function mapProfileRow(
  profile: Tables<"profiles">,
  sellerProfile: Tables<"seller_profiles"> | null,
  unreadMessages: number,
  unreadNotifications: number,
): UserProfile {
  const accountType: AccountType =
    profile.role === "admin" ? "business" : (profile.role as AccountType);
  const seller = isSellerRole(profile.role);

  return {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    verified: profile.verified,
    memberSince: formatMemberSince(profile.created_at),
    role: profile.role,
    accountType,
    isSeller: seller,
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const [{ data: sellerProfile }, unreadMessages, { count: unreadNotifications }] =
    await Promise.all([
      supabase.from("seller_profiles").select("*").eq("id", userId).maybeSingle(),
      countUnreadMessages(userId, profile.role),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false),
    ]);

  return mapProfileRow(profile, sellerProfile, unreadMessages, unreadNotifications ?? 0);
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
