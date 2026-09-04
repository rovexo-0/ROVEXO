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
  /**
   * In-code audience metadata only. Omitted = shared.
   * Do not invent Business-only legal wording from this field.
   */
  audience?: "shared" | "individual" | "business";
};
