export type LegalDocumentCategory =
  | "terms"
  | "privacy"
  | "commerce"
  | "platform"
  | "governance"
  | "compliance";

export type LegalDocument = {
  slug: string;
  title: string;
  summary: string;
  category: LegalDocumentCategory;
  lastUpdated: string;
  content: string;
};
