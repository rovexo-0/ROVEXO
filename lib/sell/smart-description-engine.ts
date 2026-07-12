import type { FlatCategoryPath } from "@/lib/categories/types";
import type { SellListingDraft } from "@/features/sell/types";
import { buildCategoryDescriptionTemplate } from "@/lib/sell/description-templates";
import { parseListingTitle } from "@/lib/sell/title-parser";
import {
  buildPhotoAnalysisSnapshot,
  type PhotoAnalysisSnapshot,
  type PhotoMetadataEntry,
} from "@/lib/sell/photo-metadata";
import { isTitleStepComplete } from "@/lib/sell/sell-progressive-flow";
import type { SupportedDescriptionLocale } from "@/lib/sell/marketplace-knowledge-base";

export type SmartDescriptionInput = {
  draft: SellListingDraft;
  title: string;
  locale?: SupportedDescriptionLocale;
  photoMetadata?: PhotoMetadataEntry[];
};

export type SmartDescriptionResult = {
  description: string;
  photoAnalysis: PhotoAnalysisSnapshot;
  parsedTitle: ReturnType<typeof parseListingTitle>;
};

/** Engine starts only after photo + title + category are ready (§ENGINE START). */
export function canStartSmartDescriptionEngine(
  draft: SellListingDraft,
  title: string,
): boolean {
  return (
    draft.photos.length > 0 &&
    !draft.photos.some((photo) => photo.uploading) &&
    isTitleStepComplete(title) &&
    Boolean(draft.categoryPath)
  );
}

function resolveProductLabel(title: string, categoryPath: FlatCategoryPath): string {
  const parsed = parseListingTitle(title);
  if (parsed.raw.length >= 3) return parsed.raw;
  const leaf = categoryPath.segments[categoryPath.segments.length - 1];
  return leaf?.name ?? categoryPath.pathLabel;
}

function readAttribute(draft: SellListingDraft, key: string): string | null {
  const direct = (draft as Record<string, unknown>)[key];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const fromMap = draft.attributes[key];
  return fromMap?.trim() ? fromMap.trim() : null;
}

/**
 * Deterministic Smart Description Engine — 100% local, no AI, no network.
 * Target generation <100ms.
 */
export function buildSmartDescription(input: SmartDescriptionInput): SmartDescriptionResult {
  const { draft, title, locale = "en", photoMetadata = [] } = input;
  const categoryPath = draft.categoryPath!;
  const parsedTitle = parseListingTitle(title);
  const photoAnalysis = buildPhotoAnalysisSnapshot(draft.photos, photoMetadata);

  const detectedColour =
    draft.color.trim() ||
    photoAnalysis.dominantColours[0] ||
    null;

  const description = buildCategoryDescriptionTemplate({
    productLabel: resolveProductLabel(title, categoryPath),
    brand: draft.brand.trim() || parsedTitle.brand,
    color: detectedColour,
    material: draft.material.trim() || null,
    size: draft.size.trim() || readAttribute(draft, "size"),
    condition: draft.condition.trim() || null,
    categoryPath,
    locale,
  });

  return {
    description,
    photoAnalysis,
    parsedTitle,
  };
}

export type DescriptionEditState = {
  lastAuto: string;
  userEdited: boolean;
};

export function shouldApplyAutoDescription(
  currentDescription: string,
  nextDescription: string,
  state: DescriptionEditState,
): boolean {
  if (nextDescription === currentDescription) return false;
  if (!state.userEdited) return true;
  return currentDescription.trim() === state.lastAuto.trim();
}

export function markDescriptionAsUserEdited(
  currentDescription: string,
  state: DescriptionEditState,
): DescriptionEditState {
  if (currentDescription.trim() !== state.lastAuto.trim()) {
    return { ...state, userEdited: true };
  }
  return state;
}
