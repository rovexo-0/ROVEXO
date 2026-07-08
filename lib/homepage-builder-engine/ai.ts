import type { HomepageAiSuggestion, HomepageSection, HomepageSectionType } from "@/lib/homepage-builder-engine/types";

export function generateHomepageAiSuggestions(sections: HomepageSection[]): HomepageAiSuggestion[] {
  const suggestions: HomepageAiSuggestion[] = [];

  if (!sections.some((s) => s.type === "hero-banner")) {
    suggestions.push({
      id: "ai-hero",
      type: "section",
      title: "Add Hero Banner",
      description: "A hero banner improves first-impression conversion by up to 24%.",
      confidence: 0.92,
    });
  }

  if (!sections.some((s) => s.type === "ai-picks")) {
    suggestions.push({
      id: "ai-picks",
      type: "section",
      title: "Add AI Picks Section",
      description: "Personalized AI recommendations increase CTR on returning visitors.",
      confidence: 0.88,
    });
  }

  if (!sections.some((s) => s.type === "floating-cta")) {
    suggestions.push({
      id: "ai-cta",
      type: "cta",
      title: "Add Floating CTA",
      description: "Sticky call-to-action improves mobile conversion.",
      confidence: 0.85,
    });
  }

  suggestions.push({
    id: "ai-seo",
    type: "seo",
    title: "Optimize Section Order",
    description: "Move trending and featured listings above the fold for SEO and engagement.",
    confidence: 0.8,
  });

  return suggestions;
}

export function suggestSectionsForGoal(goal: "conversion" | "seo" | "engagement"): HomepageSectionType[] {
  if (goal === "conversion") return ["hero-banner", "flash-deals", "floating-cta", "countdown"];
  if (goal === "seo") return ["categories", "featured-listings", "brands", "faq"];
  return ["trending", "ai-picks", "continue-browsing", "reviews"];
}

export function generateBannerContent(prompt: string): { title: string; subtitle: string; cta: string } {
  return {
    title: prompt.slice(0, 60) || "Discover Premium Marketplace Deals",
    subtitle: "Curated listings, trusted sellers, and enterprise-grade purchase protection.",
    cta: "Shop Now",
  };
}

export function optimizeLayoutScore(sections: HomepageSection[]): number {
  let score = 50;
  if (sections.some((s) => s.type === "hero-banner" && s.enabled)) score += 15;
  if (sections.filter((s) => s.enabled && !s.hidden).length >= 8) score += 10;
  if (sections.some((s) => s.type === "newsletter")) score += 5;
  if (sections.some((s) => s.pinned)) score += 5;
  return Math.min(100, score);
}
