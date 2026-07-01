import type { UserAddress } from "@/lib/addresses/repository";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";
import type { Order } from "@/lib/orders/types";
import type { UserProfile } from "@/lib/profile/types";
import type { Product } from "@/lib/products/types";
import type { SavedItem } from "@/lib/saved/types";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { RovexoIconRef } from "@/lib/icons/types";

export type BuyerDashboardStatus = "loading" | "success" | "empty" | "error";

export type BuyerQuickAction = {
  id: string;
  title: string;
  href: string;
  icon: RovexoIconRef;
  count?: number;
};

export type BuyerStatistics = {
  orders: number;
  saved: number;
  reviews: number;
  protectionActive: boolean;
};

export type BuyerProtectionSummary = {
  status: "protected" | "claim_in_progress" | "attention";
  coverageLabel: string;
  activeClaims: number;
  refundsEnabled: boolean;
  href: string;
};

export type BuyerPaymentMethod = {
  id: string;
  label: string;
  brand: "apple_pay" | "google_pay" | "card" | "bank";
  last4?: string;
  connected: boolean;
  icon: RovexoIconRef;
};

export type BuyerReviewsSummary = {
  count: number;
  averageRating: number;
};

export type BuyerSettingsLink = {
  id: string;
  label: string;
  href: string;
  icon: RovexoIconRef;
};

export type BuyerDashboardData = {
  profile: UserProfile;
  trust: TrustDashboardData | null;
  statistics: BuyerStatistics;
  quickActions: BuyerQuickAction[];
  activeOrders: Order[];
  orderHistory: Order[];
  saved: SavedItem[];
  recentlyViewed: Product[];
  protection: BuyerProtectionSummary;
  addresses: UserAddress[];
  paymentMethods: BuyerPaymentMethod[];
  conversations: Conversation[];
  notifications: Notification[];
  reviews: BuyerReviewsSummary;
  settingsLinks: BuyerSettingsLink[];
};

export type BuyerDashboardState = {
  status: BuyerDashboardStatus;
  data: BuyerDashboardData | null;
  error?: string;
};
