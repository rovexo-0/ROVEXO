export {
  SIZE_ENGINE_V1,
  SIZE_ENGINE_CLOTHING_ROWS,
  SIZE_ENGINE_FOOTWEAR_ROWS,
  SIZE_ENGINE_KIDS_ROWS,
  SIZE_ENGINE_RING_ROWS,
  sectionTitleForKind,
  clothingSectionTitle,
  footwearSectionTitle,
  type SizeEngineKind,
  type SizeType,
  type SizeSelectionV1,
  type ClothingSizeId,
  type ClothingSizeRow,
  type FootwearSizeRow,
  type SimpleSizeRow,
} from "@/lib/size/size-engine-v1";

export { SIZE_ENGINE_FEATURE_FREEZE_V1 } from "@/lib/size/size-engine-feature-freeze-v1";

export { resolveSizeEngineKind } from "@/lib/size/size-category-resolve-v1";

export {
  trimCustomSizeInput,
  validateCustomSizeInput,
  selectionFromClothingId,
  selectionFromFootwearId,
  selectionFromCustom,
  encodeSizeForStorage,
  parseStoredSize,
  formatSizeForViewItem,
  isCustomStoredSize,
  standardRowsForKind,
  buildStandardSelection,
} from "@/lib/size/size-value-v1";
