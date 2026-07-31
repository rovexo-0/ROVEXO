export {
  DOCUMENTATION_ENGINE_V1,
  MASTER_DOC_SECTIONS,
  PRODUCT_CLASSIFICATIONS,
  CLASSIFICATION_LABEL,
  wrapMasterHelpDocument,
  formatFaqMarkdown,
  formatLinkList,
  renderClassifiedProduct,
  renderProductCategoryManual,
} from "@/lib/documentation/documentation-engine-v1";

export type {
  ProductClassification,
  DocLink,
  FaqEntry,
  ClassifiedProduct,
  ProductCategoryManual,
} from "@/lib/documentation/documentation-engine-v1";

export {
  buildProhibitedRestrictedItemsPolicyMarkdown,
  getProhibitedRestrictedStats,
  PROHIBITED_RESTRICTED_CATEGORIES,
} from "@/lib/documentation/prohibited/build-prohibited-restricted-items-policy-v1";
