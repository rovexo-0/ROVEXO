import type { HealthStatus } from "@/lib/ops/health";
import type {
  CommandCenterMetric,
  CommandCenterMetricTone,
  CommandCenterSection,
} from "@/lib/super-admin/command-center-v1/types";

export function metric(
  id: string,
  label: string,
  value: string | number,
  options: Partial<Omit<CommandCenterMetric, "id" | "label" | "value">> = {},
): CommandCenterMetric {
  return { id, label, value, ...options };
}

export function statusTone(status: HealthStatus | string): CommandCenterMetricTone {
  if (status === "healthy" || status === "online" || status === "live") return "healthy";
  if (status === "degraded" || status === "warning") return "warning";
  if (status === "unhealthy" || status === "offline" || status === "critical") return "critical";
  return "info";
}

type SectionInput = {
  liveUsers: Record<string, number | string>;
  marketplace: Record<string, number | string>;
  sales: Record<string, number | string>;
  payments: Record<string, number | string>;
  shipping: Record<string, number | string>;
  users: Record<string, number | string>;
  security: Record<string, number | string>;
  servers: Record<string, number | string>;
  performance: Record<string, number | string>;
  ai: Record<string, number | string>;
  analytics: Record<string, number | string>;
  support: Record<string, number | string>;
  marketHealth: Record<string, number | string>;
  financial: Record<string, number | string>;
  audit: Record<string, number | string>;
};

function sectionMetrics(data: Record<string, number | string>, hrefMap: Record<string, string> = {}): CommandCenterMetric[] {
  return Object.entries(data).map(([id, value]) =>
    metric(id, formatLabel(id), value, {
      format: inferFormat(id, value),
      tone: inferTone(id, value),
      href: hrefMap[id],
    }),
  );
}

function formatLabel(id: string): string {
  return id
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function inferFormat(id: string, value: string | number): CommandCenterMetric["format"] {
  if (typeof value === "string" && /healthy|degraded|online|offline|live|warning|critical/i.test(value)) {
    return "status";
  }
  if (/revenue|fee|cost|profit|commission|balance|withdrawal|payment|order/i.test(id) && typeof value === "number") {
    return "currency";
  }
  if (/rate|score|ctr|bounce|percent|usage/i.test(id) && typeof value === "number") {
    return "percent";
  }
  if (/latency|time|speed|response/i.test(id)) {
    return "duration";
  }
  return typeof value === "number" ? "number" : "text";
}

function inferTone(id: string, value: string | number): CommandCenterMetricTone | undefined {
  if (typeof value === "string") {
    if (/healthy|online|live|completed|verified|available|authenticated|valid|active|synced|connected/i.test(value)) {
      return "healthy";
    }
    if (/warning|pending|degraded|idle|configured/i.test(value)) return "warning";
    if (/critical|failed|offline|blocked|attack|unavailable|missing/i.test(value)) return "critical";
  }
  if (/failed|critical|attack|blocked|chargeback|dispute|error/i.test(id)) {
    return typeof value === "number" && value > 0 ? "critical" : "healthy";
  }
  if (/pending|warning|appeal/i.test(id) && typeof value === "number" && value > 0) return "warning";
  if (/revenue|orders|listings|visitors|conversion|marketplace/i.test(id)) return "marketplace";
  if (/analytics|ga|clarity|traffic|session/i.test(id)) return "analytics";
  return undefined;
}

export function buildCommandCenterSections(input: SectionInput): CommandCenterSection[] {
  return [
    {
      id: "live-users",
      title: "Live Users",
      subtitle: "Real-time presence and registration",
      metrics: sectionMetrics(input.liveUsers, {
        usersOnline: "/super-admin/visitors",
        newUsersToday: "/super-admin/users",
        verifiedBusinesses: "/super-admin/businesses",
      }),
    },
    {
      id: "marketplace",
      title: "Marketplace",
      subtitle: "Listings and catalog health",
      metrics: sectionMetrics(input.marketplace, {
        liveListings: "/super-admin/moderation",
        pendingReview: "/super-admin/moderation",
        boostedListings: "/super-admin/promotions",
      }),
    },
    {
      id: "sales",
      title: "Sales",
      subtitle: "Orders and revenue",
      metrics: sectionMetrics(input.sales, {
        todaysRevenue: "/super-admin/analytics-engine",
        ordersToday: "/super-admin/orders-engine",
        refunds: "/super-admin/payments-engine",
        buyerProtection: "/super-admin/protection-engine",
      }),
    },
    {
      id: "payments",
      title: "Payments",
      subtitle: "Stripe and wallet operations",
      metrics: sectionMetrics(input.payments, {
        stripeStatus: "/super-admin/payments-engine",
        pendingPayments: "/super-admin/payments-engine",
        withdrawals: "/super-admin/wallet-engine",
        chargebacks: "/super-admin/payments-engine",
      }),
    },
    {
      id: "shipping",
      title: "Shipping",
      subtitle: "Sendcloud — live shipping operations",
      metrics: sectionMetrics(input.shipping, {
        sendcloudApiStatus: "/super-admin/shipping-engine",
        labelsGeneratedToday: "/super-admin/shipping-engine",
        packagesInTransit: "/super-admin/shipping-engine",
        deliveredToday: "/super-admin/shipping-engine",
      }),
    },
    {
      id: "users",
      title: "Users",
      subtitle: "Accounts and verification",
      metrics: sectionMetrics(input.users, {
        totalUsers: "/super-admin/users",
        pendingVerification: "/super-admin/trust",
        businesses: "/super-admin/businesses",
      }),
    },
    {
      id: "security",
      title: "Security",
      subtitle: "Omega, Sentinel, and threat monitoring",
      metrics: sectionMetrics(input.security, {
        omegaEngine: "/super-admin/omega",
        sentinelEngine: "/super-admin/ai/sentinel",
        failedLogins: "/super-admin/security-engine",
        liveThreatLevel: "/super-admin/security-engine",
      }),
    },
    {
      id: "servers",
      title: "Servers",
      subtitle: "Infrastructure and runtime",
      metrics: sectionMetrics(input.servers, {
        api: "/super-admin/monitoring",
        supabase: "/super-admin/database",
        redis: "/super-admin/monitoring",
        latency: "/super-admin/monitoring",
      }),
    },
    {
      id: "performance",
      title: "Performance",
      subtitle: "Application speed and cache",
      metrics: sectionMetrics(input.performance, {
        responseTime: "/super-admin/platform/performance",
        pageSpeed: "/super-admin/analytics-engine",
        cacheHit: "/super-admin/monitoring",
      }),
    },
    {
      id: "ai",
      title: "AI",
      subtitle: "AI orchestration and moderation",
      metrics: sectionMetrics(input.ai, {
        aiRequests: "/super-admin/ai-engine",
        moderationAi: "/super-admin/operations/ai",
        categoryAi: "/super-admin/category-management",
      }),
    },
    {
      id: "analytics",
      title: "Analytics",
      subtitle: "GA4, Search Console, Clarity",
      metrics: sectionMetrics(input.analytics, {
        liveVisitors: "/super-admin/visitors",
        conversions: "/super-admin/analytics-engine",
        sessions: "/super-admin/analytics",
      }),
    },
    {
      id: "customer-support",
      title: "Customer Support",
      subtitle: "Tickets, chats, and disputes",
      metrics: sectionMetrics(input.support, {
        openTickets: "/super-admin/support",
        liveChats: "/super-admin/messages-engine",
        disputes: "/super-admin/protection-engine",
      }),
    },
    {
      id: "market-health",
      title: "Market Health",
      subtitle: "Engagement and discovery",
      metrics: sectionMetrics(input.marketHealth, {
        messages: "/super-admin/messages-engine",
        favorites: "/super-admin/analytics-engine",
        searches: "/super-admin/search-engine",
      }),
    },
    {
      id: "financial",
      title: "Financial",
      subtitle: "Platform revenue and fees",
      metrics: sectionMetrics(input.financial, {
        platformRevenue: "/super-admin/business-intelligence",
        buyerProtectionFees: "/super-admin/protection-engine",
        projectedRevenue: "/super-admin/analytics-engine",
      }),
    },
    {
      id: "audit",
      title: "Audit",
      subtitle: "Deployments, CI/CD, and system health",
      metrics: sectionMetrics(input.audit, {
        systemErrors: "/super-admin/monitoring",
        buildStatus: "/super-admin/certification",
        cronJobs: "/super-admin/monitoring",
      }),
    },
  ];
}

export const COMMAND_CENTER_QUICK_ACTIONS = [
  { id: "create-admin", label: "Create Admin", href: "/super-admin/users", icon: "👤" },
  { id: "manage-users", label: "Manage Users", href: "/super-admin/users", icon: "👥" },
  { id: "manage-listings", label: "Manage Listings", href: "/super-admin/moderation", icon: "🏷️" },
  { id: "security-center", label: "Security Center", href: "/super-admin/security-engine", icon: "🔒" },
  { id: "shipping-center", label: "Shipping Center", href: "/super-admin/shipping-engine", icon: "🚚" },
  { id: "payments-center", label: "Payments Center", href: "/super-admin/payments-engine", icon: "💳" },
  { id: "ai-center", label: "AI Center", href: "/super-admin/operations/ai", icon: "🤖" },
  { id: "analytics", label: "Analytics", href: "/super-admin/analytics-engine", icon: "📊" },
  { id: "database", label: "Database", href: "/super-admin/database", icon: "🗄️" },
  { id: "marketplace", label: "Marketplace", href: "/super-admin/moderation", icon: "🛒" },
  { id: "system-settings", label: "System Settings", href: "/super-admin/platform", icon: "⚙️" },
  { id: "command-os", label: "Command OS", href: "/super-admin/command-os", icon: "🧭" },
  { id: "experience-os", label: "Experience OS", href: "/super-admin/experience", icon: "🎛️" },
  { id: "design-studio", label: "Design Studio", href: "/super-admin/experience", icon: "🎨" },
  { id: "theme-manager", label: "Theme Manager", href: "/super-admin/experience?tab=navigation", icon: "🖌️" },
  { id: "banner-manager", label: "Banner Manager", href: "/super-admin/banners", icon: "🖼️" },
  { id: "maintenance-mode", label: "Maintenance Mode", href: "/super-admin/platform", icon: "🛠️" },
  { id: "deploy", label: "Deploy", href: "/super-admin/certification", icon: "🚀" },
  { id: "audit-logs", label: "Audit Logs", href: "/super-admin/audit", icon: "📋" },
] as const;
