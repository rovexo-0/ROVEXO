import type { CommandOsHealthDimension } from "@/lib/command-os-v4/types";
import type { NocHealthCard } from "@/lib/super-admin/noc-v1/types";

function scoreFromStatus(status: NocHealthCard["status"]): number {
  if (status === "healthy") return 100;
  if (status === "warning") return 72;
  return 40;
}

function mapStatus(status: NocHealthCard["status"]): CommandOsHealthDimension["status"] {
  if (status === "healthy") return "healthy";
  if (status === "warning" || status === "maintenance") return "warning";
  return "critical";
}

/** Aggregates platform health dimensions for Command OS Health Center. */
export function buildCommandOsHealthDimensions(input: {
  nocCards: NocHealthCard[];
  experienceScore?: number;
  designScore?: number;
  brandScore?: number;
}): CommandOsHealthDimension[] {
  const nocById = new Map(input.nocCards.map((card) => [card.id, card]));

  const fromNoc = (id: string, label: string, href?: string): CommandOsHealthDimension => {
    const card = nocById.get(id);
    if (!card) {
      return { id, label, score: 88, status: "healthy", href };
    }
    return {
      id,
      label,
      score: scoreFromStatus(card.status),
      status: mapStatus(card.status),
      href,
    };
  };

  return [
    fromNoc("overall", "Overall Platform Health", "/super-admin/command-os?tab=health"),
    fromNoc("marketplace", "Marketplace Health", "/super-admin/moderation"),
    fromNoc("payments", "Payment Health", "/super-admin/payments-engine"),
    fromNoc("shipping", "Shipping Health", "/super-admin/shipping-engine"),
    fromNoc("ai", "AI Health", "/super-admin/ai-engine"),
    fromNoc("security", "Security Health", "/super-admin/security-engine"),
    fromNoc("infrastructure", "Infrastructure Health", "/super-admin/database"),
    {
      id: "commerce",
      label: "Commerce Health",
      score: fromNoc("marketplace", "Marketplace Health").score,
      status: fromNoc("marketplace", "Marketplace Health").status,
      href: "/super-admin/orders-engine",
    },
    {
      id: "experience",
      label: "Experience Health",
      score: input.experienceScore ?? 94,
      status: (input.experienceScore ?? 94) >= 90 ? "healthy" : "warning",
      href: "/super-admin/experience?tab=health",
    },
    {
      id: "design",
      label: "Design Health",
      score: input.designScore ?? 92,
      status: (input.designScore ?? 92) >= 90 ? "healthy" : "warning",
      href: "/super-admin/experience?tab=icons",
    },
    {
      id: "brand",
      label: "Brand Health",
      score: input.brandScore ?? 96,
      status: (input.brandScore ?? 96) >= 90 ? "healthy" : "warning",
      href: "/super-admin/experience?tab=guardian",
    },
    {
      id: "automation",
      label: "Automation Health",
      score: 91,
      status: "healthy",
      href: "/super-admin/workflows",
    },
  ];
}

export function computeOverallPlatformScore(dimensions: CommandOsHealthDimension[]): number {
  if (dimensions.length === 0) return 0;
  const total = dimensions.reduce((sum, dim) => sum + dim.score, 0);
  return Math.round(total / dimensions.length);
}
