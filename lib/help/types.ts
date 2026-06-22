/** Legacy article categories — preserved for existing article URLs. */
export type HelpCategory =
  | "account"
  | "buying"
  | "selling"
  | "payments"
  | "delivery"
  | "chat"
  | "pro-seller"
  | "business-accounts"
  | "safety"
  | "ai-moderation"
  | "prohibited-items"
  | "community-guidelines"
  | "reports-appeals"
  | "privacy"
  | "terms";

/** Enterprise help topic slugs — interactive guide entry points. */
export type HelpTopicSlug =
  | "account"
  | "authentication"
  | "buyer"
  | "seller"
  | "business-accounts"
  | "wholesale"
  | "manufacturers"
  | "suppliers"
  | "orders"
  | "payments"
  | "withdraw"
  | "stripe"
  | "wallet"
  | "chat-messages"
  | "trust-score"
  | "verification"
  | "reports"
  | "shipping"
  | "returns"
  | "refunds"
  | "subscriptions"
  | "promoted-listings"
  | "featured-listings"
  | "bump-listings"
  | "auto"
  | "license-plate-search"
  | "vin-search"
  | "property"
  | "jobs"
  | "services"
  | "business-directory"
  | "company-profiles"
  | "request-quote"
  | "request-part"
  | "request-services"
  | "safety"
  | "privacy"
  | "policies"
  | "support"
  | "other";

export type LocalizedString = {
  en: string;
  [locale: string]: string;
};

export type HelpTopic = {
  slug: HelpTopicSlug;
  label: string;
  description: string;
  icon: string;
  group: string;
  keywords: string[];
  relatedTopics: HelpTopicSlug[];
  relatedFeatures: { label: string; href: string }[];
  relatedPolicies: { label: string; href: string }[];
  searchRanking: number;
  visible: boolean;
  pinnedArticleSlugs?: string[];
};

export type HelpArticleSection = {
  overview: string;
  steps: string[];
  requirements: string[];
  processingTime: string;
  commonMistakes: string[];
  troubleshooting: string[];
  faqs: { question: string; answer: string }[];
};

export type HelpArticle = {
  slug: string;
  title: string;
  category: HelpCategory;
  topic?: HelpTopicSlug;
  summary: string;
  content: string;
  keywords: string[];
  lastUpdated?: string;
  relatedArticleSlugs?: string[];
  relatedTopicSlugs?: HelpTopicSlug[];
  relatedFeatureHrefs?: { label: string; href: string }[];
  relatedPolicyHrefs?: { label: string; href: string }[];
  sections?: HelpArticleSection;
};

export type HelpSearchResult = {
  type: "article" | "topic" | "faq" | "feature" | "policy";
  id: string;
  title: string;
  excerpt: string;
  href: string;
  score: number;
  article?: HelpArticle;
  topic?: HelpTopic;
};

export type DecisionOption = {
  id: string;
  label: string;
  nextNodeId?: string;
  solutionId?: string;
  articleSlug?: string;
  topicSlug?: HelpTopicSlug;
};

export type DecisionNode = {
  id: string;
  question: string;
  options: DecisionOption[];
};

export type HelpSolution = {
  id: string;
  title: string;
  overview: string;
  currentStatus?: string;
  estimatedReviewTime?: string;
  estimatedTransferTime?: string;
  possibleDelays?: string[];
  steps: string[];
  requirements: string[];
  processingTime: string;
  commonMistakes: string[];
  troubleshooting: string[];
  relatedQuestions: { label: string; href: string }[];
  relatedTopics: HelpTopicSlug[];
  relatedFeatures: { label: string; href: string }[];
  relatedPolicies: { label: string; href: string }[];
  faqs: { question: string; answer: string }[];
  lastUpdated: string;
};

export type DecisionTree = {
  topicSlug: HelpTopicSlug;
  title: string;
  rootNodeId: string;
  nodes: Record<string, DecisionNode>;
  solutions: Record<string, HelpSolution>;
};

export type HelpSessionPathStep = {
  nodeId: string;
  optionId: string;
  label: string;
  timestamp: string;
};

export type HelpSessionState = {
  topicSlug: HelpTopicSlug | null;
  path: HelpSessionPathStep[];
  articlesViewed: string[];
  solutionsViewed: string[];
  treeCompleted: boolean;
  resolutionAttempted: boolean;
  resolved: boolean | null;
  startedAt: string;
  updatedAt: string;
};

export type HelpAssistantIntent = {
  topicSlug: HelpTopicSlug;
  confidence: number;
  matchedTerms: string[];
};

export type HelpAssistantResponse = {
  matched: boolean;
  answer: string;
  articles: HelpSearchResult[];
  intent: HelpAssistantIntent | null;
  guideHref: string | null;
  suggestSupport: boolean;
  suggestTree: boolean;
};

export type HelpAnalyticsEventType =
  | "search"
  | "search_no_results"
  | "topic_open"
  | "tree_start"
  | "tree_step"
  | "tree_complete"
  | "solution_view"
  | "article_view"
  | "resolution_yes"
  | "resolution_no"
  | "support_gate_pass"
  | "support_gate_block"
  | "support_submit";

export type HelpAnalyticsEvent = {
  type: HelpAnalyticsEventType;
  topicSlug?: HelpTopicSlug;
  query?: string;
  articleSlug?: string;
  solutionId?: string;
  path?: HelpSessionPathStep[];
  metadata?: Record<string, string | number | boolean>;
};

export type SupportHelpContext = {
  helpTopicSlug?: HelpTopicSlug;
  decisionTreePath?: HelpSessionPathStep[];
  articlesViewed?: string[];
  solutionsViewed?: string[];
  treeCompleted?: boolean;
  resolutionAttempted?: boolean;
  currentPage?: string;
  device?: string;
  browser?: string;
  platformVersion?: string;
  country?: string;
  accountType?: string;
  errorCode?: string;
};

export type HelpContentRequirement = {
  featureId: string;
  featureName: string;
  requiredTopicSlug: HelpTopicSlug;
  requiredArticleSlug: string;
  requiredTree: boolean;
  requiredFaq: boolean;
  requiredKeywords: string[];
  requiredPolicyHref?: string;
  estimatedProcessingTime?: string;
};
