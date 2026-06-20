import type { AccountType } from "@/lib/profile/account";

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
  accountType: AccountType;
  isSeller: boolean;
  sellerStats?: SellerStats;
  unreadMessages: number;
  unreadNotifications: number;
};
