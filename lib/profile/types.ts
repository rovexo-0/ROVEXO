import type { AccountType } from "@/lib/profile/account";
import type { UserRole } from "@/lib/supabase/types/database";

export type SellerStats = {
  listings: number;
  sales: number;
  followers: number;
};

export type UserProfile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  verified: boolean;
  memberSince: string;
  role: UserRole;
  accountType: AccountType;
  isSeller: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  sellerStats?: SellerStats;
  unreadMessages: number;
  unreadNotifications: number;
};
