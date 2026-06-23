"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { FlatCategoryPath } from "@/lib/categories/types";
import { clearSellDraft, loadSellDraft, saveSellDraft } from "@/lib/sell/draft-storage";
import { uploadListingImage, deleteListingImage } from "@/lib/listings/upload-client";
import { buildPublishDescription } from "@/lib/sell/publish-description";
import { deliveryCarriersForMethod } from "@/lib/sell/delivery";
import {
  shouldAutoSelectCategory,
  suggestCategoryFromTitle,
  type TitleCategorySuggestion,
} from "@/lib/sell/suggest-category-from-title";
import type { SellListingMode } from "@/lib/profile/account";
import {
  createEmptyDraft,
  type SellListingDraft,
  type SellPhoto,
  type SellView,
} from "@/features/sell/types";

type UseSellFormOptions = {
  listingMode?: SellListingMode;
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

const TITLE_CATEGORY_DEBOUNCE_MS = 400;

export function useSellForm(options: UseSellFormOptions = {}) {
  const { listingMode = "advanced", editListingId, initialDraft } = options;
  const router = useRouter();
  const [view, setView] = useState<SellView>("form");
  const [draft, setDraft] = useState<SellListingDraft>(() => {
    if (initialDraft) return initialDraft;
    const stored = loadSellDraft();
    return stored ? { ...createEmptyDraft(), ...stored } : createEmptyDraft();
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [categorySuggestions, setCategorySuggestions] = useState<TitleCategorySuggestion[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const categoryLockedRef = useRef(Boolean(initialDraft?.categoryPath));
  const titleCategoryTimerRef = useRef<number | null>(null);
  const uploadSessionRef = useRef(crypto.randomUUID());
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const uploadPhoto = useCallback(async (photo: SellPhoto, index: number, photoCount: number) => {
    if (!photo.file || photo.uploaded) return photo;

    setDraft((current) => ({
      ...current,
      photos: current.photos.map((item) =>
        item.id === photo.id ? { ...item, uploading: true, uploadError: undefined } : item,
      ),
    }));

    try {
      const result = await uploadListingImage({
        file: photo.file,
        productId: editListingId,
        sessionId: uploadSessionRef.current,
        onProgress: (progress) => {
          setUploadProgress(Math.round(((index + progress / 100) / photoCount) * 100));
        },
      });

      return {
        ...photo,
        uploaded: true,
        uploading: false,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        storagePath: result.storagePath,
        thumbnailStoragePath: result.thumbnailStoragePath,
        previewUrl: result.thumbnailUrl || result.url,
      } satisfies SellPhoto;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setDraft((current) => ({
        ...current,
        photos: current.photos.map((item) =>
          item.id === photo.id ? { ...item, uploading: false, uploadError: message } : item,
        ),
      }));
      throw error;
    }
  }, [editListingId]);

  const addPhotos = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploaded: false,
    }));

    setDraft((current) => ({
      ...current,
      photos: [...current.photos, ...incoming].slice(0, 8),
    }));
  }, []);

  const removePhoto = useCallback(async (id: string) => {
    const photo = draft.photos.find((item) => item.id === id);
    if (photo?.existingImageId) {
      setRemovedImageIds((current) =>
        current.includes(photo.existingImageId!) ? current : [...current, photo.existingImageId!],
      );
    }
    if (photo?.storagePath && photo.file) {
      await deleteListingImage({
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
      }).catch(() => undefined);
    }

    setDraft((current) => {
      const target = current.photos.find((item) => item.id === id);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return { ...current, photos: current.photos.filter((item) => item.id !== id) };
    });
  }, [draft.photos]);

  const retryPhotoUpload = useCallback(async (id: string) => {
    const index = draft.photos.findIndex((photo) => photo.id === id);
    const photo = draft.photos[index];
    if (!photo?.file || index < 0) return;

    try {
      const uploaded = await uploadPhoto(photo, index, draft.photos.length);
      setDraft((current) => ({
        ...current,
        photos: current.photos.map((item) => (item.id === id ? uploaded : item)),
      }));
    } catch {
      // uploadPhoto already sets uploadError on the photo
    }
  }, [draft.photos, uploadPhoto]);

  const replacePhoto = useCallback((id: string, file: File) => {
    const existing = draft.photos.find((photo) => photo.id === id);
    if (existing?.existingImageId) {
      setRemovedImageIds((current) =>
        current.includes(existing.existingImageId!)
          ? current
          : [...current, existing.existingImageId!],
      );
    }

    setDraft((current) => ({
      ...current,
      photos: current.photos.map((photo) => {
        if (photo.id !== id) return photo;
        if (photo.file) URL.revokeObjectURL(photo.previewUrl);
        return {
          id: photo.id,
          file,
          previewUrl: URL.createObjectURL(file),
          uploaded: false,
          storagePath: undefined,
        };
      }),
    }));
  }, [draft.photos]);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => {
      const photos = [...current.photos];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      return { ...current, photos };
    });
  }, []);

  useEffect(() => {
    if (titleCategoryTimerRef.current) {
      window.clearTimeout(titleCategoryTimerRef.current);
    }

    titleCategoryTimerRef.current = window.setTimeout(() => {
      const suggestions = suggestCategoryFromTitle(draft.title);
      setCategorySuggestions(suggestions);

      if (categoryLockedRef.current) return;

      const autoSelect = shouldAutoSelectCategory(suggestions);
      if (autoSelect) {
        setDraft((current) =>
          current.categoryPath ? current : { ...current, categoryPath: autoSelect.path },
        );
      }
    }, TITLE_CATEGORY_DEBOUNCE_MS);

    return () => {
      if (titleCategoryTimerRef.current) {
        window.clearTimeout(titleCategoryTimerRef.current);
      }
    };
  }, [draft.title]);

  const updateDraft = useCallback((patch: Partial<SellListingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const setCategoryPath = useCallback((categoryPath: FlatCategoryPath) => {
    categoryLockedRef.current = true;
    setDraft((current) => ({ ...current, categoryPath }));
  }, []);

  const saveDraft = useCallback(() => {
    saveSellDraft(draft);
    setDraftSavedMessage("Draft saved");
    window.setTimeout(() => setDraftSavedMessage(null), 2000);
  }, [draft]);

  const publishListing = useCallback(async () => {
    setIsPublishing(true);
    setFormError(null);
    setUploadProgress(0);

    try {
      const uploadedPhotos: SellPhoto[] = [];
      for (let index = 0; index < draft.photos.length; index += 1) {
        const photo = draft.photos[index]!;
        const uploaded = photo.file
          ? await uploadPhoto(photo, index, draft.photos.length)
          : photo;
        uploadedPhotos.push(uploaded);
      }

      setDraft((current) => ({ ...current, photos: uploadedPhotos }));

      const payload = {
        title: draft.title.trim(),
        description: buildPublishDescription(draft.title, draft.description, draft.material),
        brand: draft.brand.trim() || undefined,
        color: draft.color.trim() || undefined,
        size: draft.size.trim() || undefined,
        condition: draft.condition,
        price: Number(draft.price),
        acceptOffers: draft.acceptOffers,
        deliveryCarriers: deliveryCarriersForMethod(draft.shippingMethod),
        categoryPath: draft.categoryPath
          ? {
              categorySlug: draft.categoryPath.categorySlug,
              subcategorySlug: draft.categoryPath.subcategorySlug,
              childCategorySlug: draft.categoryPath.childCategorySlug,
              categorySlugs: draft.categoryPath.segments.map((segment) => segment.slug),
            }
          : null,
        inventory: {
          stock: draft.stock,
        },
        images: uploadedPhotos.map((photo, index) => ({
          url: photo.url!,
          thumbnailUrl: photo.thumbnailUrl ?? photo.url!,
          storagePath: photo.storagePath!,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      };

      const endpoint = editListingId ? `/api/listings/${editListingId}` : "/api/listings";
      const method = editListingId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editListingId ? { ...payload, removeImageIds: removedImageIds } : payload,
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to save listing.");
      }

      if (editListingId) {
        clearSellDraft();
        router.push("/seller/listings");
        router.refresh();
        return;
      }

      const result = (await response.json()) as { listing?: { id?: string; slug: string } };
      clearSellDraft();
      setPublishedSlug(result.listing?.slug ?? null);
      setView("published");
      trackGaEvent("listing_created", {
        item_id: result.listing?.id ?? result.listing?.slug ?? "unknown",
        item_name: draft.title.trim(),
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to publish listing. Please try again.",
      );
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
    }
  }, [draft, editListingId, removedImageIds, router, uploadPhoto]);

  return {
    view,
    draft,
    formError,
    categorySuggestions,
    isPublishing,
    uploadProgress,
    publishedSlug,
    draftSavedMessage,
    editListingId,
    listingMode,
    addPhotos,
    removePhoto,
    replacePhoto,
    reorderPhotos,
    retryPhotoUpload,
    updateDraft,
    setCategoryPath,
    saveDraft,
    publishListing,
  };
}

export type SellFormController = ReturnType<typeof useSellForm>;
export const useSellWizard = useSellForm;
export type SellWizardController = SellFormController;
