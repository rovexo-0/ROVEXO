import type {
  DashboardPerformance,
  DashboardRecentOrder,
  DashboardSummaryCard,
} from "@/features/dashboard/types";
import type { InventoryOverview, InventoryItem } from "@/lib/business/inventory";
import type { UserProfile } from "@/lib/profile/types";

export type BusinessCompanyInfo = {
  companyName: string;
  companyLogoUrl: string | null;
  storeSlug: string;
  rating: number;
  reviewCount: number;
  activeListings: number;
  verifiedBusiness?: boolean;
  verifiedWholesale?: boolean;
  verifiedManufacturer?: boolean;
  verifiedSupplier?: boolean;
};

export type BusinessDashboardData = {
  profile: UserProfile;
  company: BusinessCompanyInfo;
  todaySummary: DashboardSummaryCard[];
  inventoryOverview: InventoryOverview;
  performance: DashboardPerformance;
  recentOrders: DashboardRecentOrder[];
};

export type BusinessInventoryData = {
  profile: UserProfile;
  company: Pick<BusinessCompanyInfo, "companyName">;
  items: InventoryItem[];
};
