import type { AccountCapabilities, AccountType, RovexoAccountKind } from "@/lib/profile/account";
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
  /** Unified ROVEXO account kind — marketplace users are always `"account"`. */
  accountKind: RovexoAccountKind;
  /** @deprecated Use accountKind — kept for backward compatibility. */
  accountType: AccountType;
  capabilities: AccountCapabilities;
  /** Whether this account has selling tools unlocked (activity or verification). */
  isSeller: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  sellerStats?: SellerStats;
  unreadMessages: number;
  unreadNotifications: number;
};
