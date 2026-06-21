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

export type HelpArticle = {
  slug: string;
  title: string;
  category: HelpCategory;
  summary: string;
  content: string;
  keywords: string[];
};

export type HelpSearchResult = {
  article: HelpArticle;
  score: number;
  excerpt: string;
};

export type HelpAssistantResponse = {
  matched: boolean;
  answer: string;
  articles: HelpSearchResult[];
  suggestSupport: boolean;
};
