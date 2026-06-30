export type TrustVerificationType =
  | "email"
  | "phone"
  | "identity"
  | "address"
  | "payment"
  | "business"
  | "wholesale"
  | "manufacturer"
  | "supplier"
  | "document";

export type TrustVerificationStatus = "not_started" | "pending" | "approved" | "rejected" | "expired";

export type TrustVerificationLevel = "basic" | "verified" | "premium" | "enterprise";

export type TrustTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type TrustFactorSnapshot = {
  completedSales: number;
  completedPurchases: number;
  cancelledOrders: number;
  disputesLost: number;
  disputesWon: number;
  refundsIssued: number;
  positiveReviews: number;
  negativeReviews: number;
  reportsReceived: number;
  moderationPenalties: number;
  verificationsApproved: number;
  accountAgeDays: number;
  profileCompletion: number;
  onTimeShipments: number;
  lateShipments: number;
  responseRate: number;
  repeatBuyers: number;
  chargebacks: number;
  suspensions: number;
  warnings: number;
  shippingReliability: number | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export type TrustRecommendations = string[];

export type TrustScore = {
  userId: string;
  score: number;
  buyerScore: number;
  sellerScore: number;
  businessScore: number;
  level: TrustVerificationLevel;
  tier: TrustTier;
  scoreLocked: boolean;
  lockReason: string | null;
  factors: TrustFactorSnapshot | null;
  recommendations: TrustRecommendations;
  updatedAt: string;
  lastRecalculatedAt: string | null;
};

export type TrustVerification = {
  id: string;
  userId: string;
  verificationType: TrustVerificationType;
  status: TrustVerificationStatus;
  level: TrustVerificationLevel;
  documentUrls: string[];
  reviewedAt: string | null;
  expiresAt: string | null;
};

export type TrustEvent = {
  id: string;
  eventType: string;
  delta: number;
  scoreAfter: number | null;
  reason: string | null;
  createdAt: string;
};

export type TrustAdminAuditEntry = {
  id: string;
  userId: string;
  adminId: string;
  action: string;
  delta: number | null;
  scoreBefore: number | null;
  scoreAfter: number | null;
  reason: string;
  createdAt: string;
};

export type PublicTrustSummary = {
  userId: string;
  score: number;
  tier: TrustTier;
  level: TrustVerificationLevel;
  badges: string[];
  completedSales: number;
  completedPurchases: number;
  responseRate: number | null;
  shippingReliability: number | null;
  accountAgeDays: number;
  verifications: string[];
  isLowTrust: boolean;
  trustReasons: string[];
  warnings: string[];
};

export type TrustDashboardData = TrustCenterData & {
  factors: TrustFactorSnapshot;
  recommendations: TrustRecommendations;
  progress: {
    current: TrustTier;
    next: TrustTier | null;
    percent: number;
  };
};

export type TrustCenterSection = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
};

export type TrustCenterData = {
  score: TrustScore;
  verifications: TrustVerification[];
  recentEvents: TrustEvent[];
  badges: string[];
};

export const TRUST_CENTER_SECTIONS: TrustCenterSection[] = [
  { id: "score", title: "Trust Score", description: "Your marketplace reputation score", href: "/trust#score", icon: "⭐" },
  { id: "buyer-protection", title: "Buyer Protection", description: "Secure checkout and dispute support", href: "/help/category/buyer", icon: "🛡️" },
  { id: "seller-protection", title: "Seller Protection", description: "Payout security and seller policies", href: "/help/category/seller", icon: "🏷️" },
  { id: "business-protection", title: "Business Protection", description: "B2B trade protection and verification", href: "/help/category/business-accounts", icon: "🏢" },
  { id: "verification", title: "Verification", description: "Identity, business, and payment verification", href: "/trust#verification", icon: "✅" },
  { id: "disputes", title: "Dispute Center", description: "Open and track protection cases", href: "/resolution", icon: "⚖️" },
  { id: "reports", title: "Report Center", description: "Report listings, users, and scams", href: "/help/category/reports", icon: "🚩" },
  { id: "security", title: "Security Center", description: "Account security and fraud prevention", href: "/help/category/authentication", icon: "🔐" },
  { id: "safety", title: "Community Safety", description: "Platform rules and scam prevention", href: "/help/category/safety", icon: "🤝" },
  { id: "policies", title: "Platform Rules", description: "Terms, guidelines, and prohibited items", href: "/help/category/policies", icon: "📜" },
  { id: "appeals", title: "Appeal System", description: "Request moderation review", href: "/help/category/reports", icon: "📨" },
];

export const VERIFICATION_TYPES: Array<{ type: TrustVerificationType; label: string; description: string }> = [
  { type: "email", label: "Email Verification", description: "Confirm your email address" },
  { type: "phone", label: "Phone Verification", description: "Verify your mobile number" },
  { type: "identity", label: "Identity Verification", description: "Government ID verification" },
  { type: "address", label: "Address Verification", description: "Confirm your registered address" },
  { type: "payment", label: "Payment Verification", description: "Stripe Connect and payout setup" },
  { type: "business", label: "Business Verification", description: "Company registration and VAT" },
  { type: "wholesale", label: "Verified Wholesale", description: "Wholesale trade account verification" },
  { type: "manufacturer", label: "Verified Manufacturer", description: "Manufacturing credentials" },
  { type: "supplier", label: "Verified Supplier", description: "Supplier trade verification" },
  { type: "document", label: "Document Verification", description: "Supporting business documents" },
];

export const TRUST_TIER_COLORS: Record<TrustTier, string> = {
  bronze: "text-amber-700",
  silver: "text-zinc-400",
  gold: "text-yellow-500",
  platinum: "text-sky-300",
  diamond: "text-cyan-300",
};
