export type SellerRegistrationType =
  | "personal"
  | "pro_seller"
  | "business_sole_trader"
  | "business_company";

export type SellerTaxProfile = {
  sellerId: string;
  registrationType: SellerRegistrationType;
  fullName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  nino: string | null;
  utr: string | null;
  companyName: string | null;
  companyNumber: string | null;
  registeredAddress: string | null;
  vatNumber: string | null;
  directorName: string | null;
  stripeConnectCompleted: boolean;
  submittedAt: string | null;
};

export const SELLER_REGISTRATION_OPTIONS: Array<{
  id: SellerRegistrationType;
  label: string;
  description: string;
}> = [
  { id: "personal", label: "Personal", description: "Occasional individual selling" },
  { id: "pro_seller", label: "Pro Seller", description: "Regular individual seller" },
  {
    id: "business_sole_trader",
    label: "Business Sole Trader",
    description: "Self-employed business seller",
  },
  {
    id: "business_company",
    label: "Business Company",
    description: "Registered limited company",
  },
];
