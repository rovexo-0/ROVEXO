export type WholesaleAccountType = "wholesale" | "manufacturer" | "supplier" | "importer" | "exporter";

export type WholesaleAccount = {
  id: string;
  accountType: WholesaleAccountType;
  companyName: string;
  moqDefault: number;
  bulkPricingEnabled: boolean;
  rfqEnabled: boolean;
  verified: boolean;
};

export type WholesalePricingTier = {
  id: string;
  sellerId: string;
  productId: string | null;
  minQuantity: number;
  unitPrice: number;
  currency: string;
};

export type RfqRequest = {
  id: string;
  buyerId: string;
  sellerId: string | null;
  title: string;
  description: string;
  quantity: number;
  categorySlug: string | null;
  status: string;
  premium: boolean;
  createdAt: string;
};

export const WHOLESALE_FEATURES = [
  { id: "moq", title: "MOQ", description: "Minimum order quantities for bulk buyers" },
  { id: "bulk-pricing", title: "Bulk Pricing", description: "Tiered pricing by quantity" },
  { id: "rfq", title: "Request Quote", description: "Company-to-company RFQ workflow" },
  { id: "verified-suppliers", title: "Verified Suppliers", description: "Trust-verified trade accounts" },
  { id: "verified-manufacturers", title: "Verified Manufacturers", description: "Manufacturer credentials" },
  { id: "wholesale-promotions", title: "Wholesale Promotions", description: "B2B promotion tools" },
] as const;
