import { explainFeature } from "@/lib/ai-assistant/features";
import { findNavigationTarget } from "@/lib/ai-assistant/navigation";
import { getPersonaProfile } from "@/lib/ai-assistant/personas";
import { answerHelpQuestion } from "@/lib/help/assistant";
import { detectHelpIntent, guideHrefForTopic } from "@/lib/help/intents";
import { suggestTopicForPath } from "@/lib/help/search";
import type { HelpTopicSlug } from "@/lib/help/types";

export type AssistantPersona = "buyer" | "seller" | "business" | "wholesale" | "admin";

export type MarketplaceAssistantContext = {
  pathname: string;
  persona: AssistantPersona;
  userId?: string;
  accountType?: string;
  premiumAi?: boolean;
};

export type MarketplaceAssistantResponse = {
  matched: boolean;
  answer: string;
  persona: AssistantPersona;
  guideHref: string | null;
  trustHref: string | null;
  helpHref: string | null;
  navigationHref: string | null;
  suggestions: Array<{ label: string; href: string }>;
  suggestSupport: boolean;
  suggestTree: boolean;
  premiumRequired: boolean;
};

const PERSONA_SUGGESTIONS: Record<AssistantPersona, Array<{ label: string; href: string }>> = {
  buyer: [
    { label: "Purchase protection", href: "/help/category/buyer" },
    { label: "Track an order", href: "/help/category/orders" },
    { label: "Trust Center", href: "/trust" },
  ],
  seller: [
    { label: "Withdraw help", href: "/help/category/withdraw" },
    { label: "Seller dashboard", href: "/seller" },
    { label: "Promote listings", href: "/seller/listings" },
  ],
  business: [
    { label: "Business dashboard", href: "/business/dashboard" },
    { label: "Business verification", href: "/trust#verification" },
    { label: "Business directory", href: "/business/directory" },
  ],
  wholesale: [
    { label: "Wholesale center", href: "/wholesale" },
    { label: "Submit RFQ", href: "/wholesale" },
    { label: "Verified suppliers", href: "/trust#verification" },
  ],
  admin: [
    { label: "Admin dashboard", href: "/admin" },
    { label: "Trust review", href: "/admin/trust" },
    { label: "Platform analytics", href: "/admin/analytics" },
  ],
};

export function inferAssistantPersona(pathname: string, accountType?: string): AssistantPersona {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/wholesale") || accountType === "wholesale") return "wholesale";
  if (pathname.startsWith("/business") || accountType === "business") return "business";
  if (pathname.startsWith("/seller") || pathname.startsWith("/sell")) return "seller";
  return "buyer";
}

export function askMarketplaceAssistant(
  query: string,
  context: MarketplaceAssistantContext,
): MarketplaceAssistantResponse {
  const trimmed = query.trim();
  const profile = getPersonaProfile(context.persona);
  const helpResponse = answerHelpQuestion(trimmed);
  const intent = detectHelpIntent(trimmed);
  const navigation = findNavigationTarget(trimmed);
  const feature = explainFeature(trimmed);
  const pathTopic = suggestTopicForPath(context.pathname);
  const topicSlug: HelpTopicSlug | null = intent?.topicSlug ?? pathTopic;

  const premiumRequired =
    !context.premiumAi &&
    /\b(advanced|deep|premium ai|enterprise ai)\b/i.test(trimmed);

  let answer = helpResponse.matched
    ? helpResponse.answer
    : `${profile.greeting}\n\nTry asking about ${profile.focusAreas.slice(0, 3).join(", ")}.`;

  if (navigation) {
    answer = `You can open **${navigation.label}** — ${navigation.description}.`;
  } else if (feature) {
    answer = `**${feature.title}**: ${feature.summary}`;
  }

  const suggestions = [
    ...(navigation ? [{ label: `Go to ${navigation.label}`, href: navigation.href }] : []),
    ...(feature ? [{ label: `Learn about ${feature.title}`, href: feature.href }] : []),
    ...(topicSlug ? [{ label: `Open ${topicSlug.replace(/-/g, " ")} guide`, href: guideHrefForTopic(topicSlug) }] : []),
    ...PERSONA_SUGGESTIONS[context.persona],
  ];

  return {
    matched: helpResponse.matched || Boolean(navigation || feature),
    answer,
    persona: context.persona,
    guideHref: helpResponse.guideHref ?? (topicSlug ? guideHrefForTopic(topicSlug) : feature?.href ?? null),
    trustHref: "/trust",
    helpHref: "/help",
    navigationHref: navigation?.href ?? null,
    suggestions,
    suggestSupport: helpResponse.suggestSupport && !helpResponse.matched,
    suggestTree: helpResponse.suggestTree,
    premiumRequired,
  };
}
