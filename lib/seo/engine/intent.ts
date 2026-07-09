import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type SearchIntent =
  | "informational"
  | "commercial_investigation"
  | "transactional"
  | "navigational";

export type IntentMetadataHints = {
  intent: SearchIntent;
  titleSuffix: string;
  descriptionLead: string;
  ctaLabel: string;
};

const INTENT_HINTS: Record<SearchIntent, Omit<IntentMetadataHints, "intent">> = {
  informational: {
    titleSuffix: "Guide & Listings",
    descriptionLead: "Learn about",
    ctaLabel: "Browse listings",
  },
  commercial_investigation: {
    titleSuffix: "Compare & Shop",
    descriptionLead: "Compare",
    ctaLabel: "Shop now",
  },
  transactional: {
    titleSuffix: "Buy on ROVEXO",
    descriptionLead: "Buy",
    ctaLabel: "Buy now",
  },
  navigational: {
    titleSuffix: "Official Listings",
    descriptionLead: "Find",
    ctaLabel: "View listings",
  },
};

export function classifySearchIntent(page: Pick<OrganicLandingPage, "kind" | "facetTypes" | "slug">): SearchIntent {
  if (page.kind === "brand" || page.kind === "store" || page.kind === "seller") {
    return "navigational";
  }

  if (page.kind === "collection") {
    const slug = page.slug;
    if (slug.includes("newly") || slug.includes("trending") || slug.includes("most-viewed")) {
      return "commercial_investigation";
    }
    if (slug.startsWith("under-") || slug.includes("deals") || slug.includes("reduced")) {
      return "transactional";
    }
  }

  if (page.facetTypes.includes("price") || page.facetTypes.includes("condition")) {
    return "transactional";
  }

  if (
    page.facetTypes.includes("brand") ||
    page.facetTypes.includes("location") ||
    page.facetTypes.includes("category")
  ) {
    return "commercial_investigation";
  }

  if (page.kind === "trend") {
    return "commercial_investigation";
  }

  return "transactional";
}

export function intentMetadataHints(intent: SearchIntent): IntentMetadataHints {
  return { intent, ...INTENT_HINTS[intent] };
}

export function applyIntentToTitle(baseTitle: string, intent: SearchIntent): string {
  const hints = intentMetadataHints(intent);
  if (baseTitle.includes("ROVEXO")) return baseTitle;
  return `${baseTitle} | ${hints.titleSuffix}`;
}

export function applyIntentToDescription(baseDescription: string, intent: SearchIntent, subject: string): string {
  const hints = intentMetadataHints(intent);
  if (intent === "informational") {
    return `${hints.descriptionLead} ${subject.toLowerCase()} and browse verified UK listings on ROVEXO.`;
  }
  return baseDescription;
}
