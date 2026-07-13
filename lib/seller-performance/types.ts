import type {
  AchievementId,
  ProfileCompletionField,
  RecalculationTrigger,
  SellerLevel,
  SellerPerformanceComponentKey,
} from "@/lib/seller-performance/master-spec";

export type ReviewBreakdown = {
  averageRating: number;
  reviewCount: number;
  stars: { five: number; four: number; three: number; two: number; one: number };
};

export type SellerPerformanceFactors = {
  reviews: ReviewBreakdown;
  completedOrders: number;
  messagesReceived: number;
  messagesReplied: number;
  responseRatePercent: number;
  averageResponseTimeMinutes: number | null;
  averageDispatchTimeHours: number | null;
  dispatchWithin24hPercent: number | null;
  dispatchWithin48hPercent: number | null;
  cancelledOrders: number;
  cancellationRatePercent: number;
  validatedReports: number;
  profileCompletion: {
    percent: number;
    completed: ProfileCompletionField[];
    missing: ProfileCompletionField[];
  };
  storeActivity: {
    recentListings: number;
    recentLogins: number;
    recentMessages: number;
    recentSales: number;
    recentUpdates: number;
    score: number;
  };
  identityVerified: boolean;
  businessVerified: boolean;
};

export type ComponentScores = Record<SellerPerformanceComponentKey, number>;

export type SellerPerformanceScore = {
  userId: string;
  score: number;
  level: SellerLevel;
  componentScores: ComponentScores;
  factors: SellerPerformanceFactors | null;
  achievements: AchievementId[];
  badgesGranted: AchievementId[];
  badgesRevoked: AchievementId[];
  updatedAt: string;
  lastRecalculatedAt: string | null;
};

export type SellerPerformanceChange = {
  id: string;
  userId: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  reason: string;
  triggerEvent: RecalculationTrigger | null;
  createdAt: string;
};

export type SellerPerformanceHistoryPoint = {
  score: number;
  level: SellerLevel;
  recordedAt: string;
};

export type NextLevelRequirement = {
  kind: "points" | "completed_orders" | "five_star_reviews" | "response_rate" | "profile";
  label: string;
  current: number;
  target: number;
  remaining: number;
};

export type SellerPerformanceProgress = {
  currentLevel: SellerLevel;
  nextLevel: SellerLevel | null;
  percent: number;
  pointsToNext: number | null;
  requirements: NextLevelRequirement[];
};

export type ScoreHistoryRange = "30d" | "90d" | "1y" | "all";

export type FactorBreakdownItem = {
  key: SellerPerformanceComponentKey;
  label: string;
  description: string;
  currentValue: string;
  componentScore: number;
  maxContributionPercent: number;
  currentContribution: number;
};

export type SellerPerformanceDashboard = {
  score: SellerPerformanceScore;
  progress: SellerPerformanceProgress;
  latestChanges: SellerPerformanceChange[];
  scoreHistory: SellerPerformanceHistoryPoint[];
  factorBreakdown: FactorBreakdownItem[];
  achievements: Array<{
    id: AchievementId;
    label: string;
    description: string;
    earned: boolean;
    earnedAt: string | null;
  }>;
};

export type PublicSellerPerformanceSummary = {
  userId: string;
  level: SellerLevel;
  levelLabel: string;
  averageRating: number;
  reviewCount: number;
  completedSales: number;
  verified: boolean;
  badges: Array<{ id: AchievementId; label: string }>;
};

export type SellerPerformanceBadgeHistoryEntry = {
  id: string;
  userId: string;
  badgeId: AchievementId;
  action: "earned" | "lost";
  previousBadges: AchievementId[];
  newBadges: AchievementId[];
  reason: string;
  triggerEvent: RecalculationTrigger | null;
  adminId: string | null;
  createdAt: string;
};

export type SellerPerformanceAuditEntry = {
  id: string;
  userId: string;
  adminId: string;
  action: string;
  scoreBefore: number | null;
  scoreAfter: number | null;
  reason: string;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
