"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import { clearSellDraft, loadSellDraft, saveSellDraft } from "@/lib/sell/draft-storage";
import { uploadListingImage, deleteListingImage } from "@/lib/listings/upload-client";
import {
  createEmptyDraft,
  type SellListingDraft,
  type SellPhoto,
  type SellView,
} from "@/features/sell/types";

function applyAnalysisToDraft(
  draft: SellListingDraft,
  result: AiCameraAnalysisResult,
): SellListingDraft {
  const categoryPath =
    result.autoSelected && result.selected
      ? result.selected.path
      : result.matches[0]?.path ?? null;

  return {
    ...draft,
    analysis: result,
    categoryPath,
    brand: result.brand?.value ?? draft.brand,
    color: result.color?.value ?? draft.color,
    size: result.size?.value ?? draft.size,
    title: result.title?.value ?? draft.title,
    description: result.description?.value ?? draft.description,
  };
}

type UseSellFormOptions = {
  manageInventory?: boolean;
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

export function useSellForm(options: UseSellFormOptions = {}) {
  const { manageInventory = false, editListingId, initialDraft } = options;
  const router = useRouter();
  const [view, setView] = useState<SellView>("form");
  const [draft, setDraft] = useState<SellListingDraft>(() => {
    if (initialDraft) return initialDraft;
    const stored = loadSellDraft();
    return stored ? { ...createEmptyDraft(), ...stored } : createEmptyDraft();
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const analyzedPhotoIdRef = useRef<string | null>(null);
  const uploadSessionRef = useRef(crypto.randomUUID());
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const invalidatePrimaryAnalysis = useCallback((photos: SellPhoto[]) => {
    const primaryId = photos[0]?.id ?? null;
    if (primaryId !== analyzedPhotoIdRef.current) analyzedPhotoIdRef.current = null;
  }, []);

  const uploadPhoto = useCallback(async (photo: SellPhoto, index: number) => {
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
          setUploadProgress(Math.round(((index + progress / 100) / draft.photos.length) * 100));
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
  }, [draft.photos.length, editListingId]);

  const addPhotos = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploaded: false,
    }));

    setDraft((current) => {
      const photos = [...current.photos, ...incoming].slice(0, 8);
      invalidatePrimaryAnalysis(photos);
      return { ...current, photos };
    });
  }, [invalidatePrimaryAnalysis]);

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
      const photos = current.photos.filter((item) => item.id !== id);
      invalidatePrimaryAnalysis(photos);
      return { ...current, photos };
    });
  }, [draft.photos, invalidatePrimaryAnalysis]);

  const retryPhotoUpload = useCallback(async (id: string) => {
    const index = draft.photos.findIndex((photo) => photo.id === id);
    const photo = draft.photos[index];
    if (!photo?.file || index < 0) return;

    try {
      const uploaded = await uploadPhoto(photo, index);
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

    setDraft((current) => {
      const photos = current.photos.map((photo) => {
        if (photo.id !== id) return photo;
        if (photo.file) URL.revokeObjectURL(photo.previewUrl);
        return {
          id: photo.id,
          file,
          previewUrl: URL.createObjectURL(file),
          uploaded: false,
          storagePath: undefined,
        };
      });
      invalidatePrimaryAnalysis(photos);
      return { ...current, photos };
    });
  }, [draft.photos, invalidatePrimaryAnalysis]);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => {
      const photos = [...current.photos];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      invalidatePrimaryAnalysis(photos);
      return { ...current, photos };
    });
  }, [invalidatePrimaryAnalysis]);

  const runAnalysis = useCallback(async (primaryPhoto: SellPhoto) => {
    if (!primaryPhoto.file) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append("image", primaryPhoto.file);
      const response = await fetch("/api/ai/camera/analyze", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Analysis failed.");
      }
      const result = (await response.json()) as AiCameraAnalysisResult;
      setDraft((current) => applyAnalysisToDraft(current, result));
    } catch (error) {
      analyzedPhotoIdRef.current = null;
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    const primaryPhoto = draft.photos[0];
    if (!primaryPhoto?.file || isAnalyzing) return;
    if (analyzedPhotoIdRef.current === primaryPhoto.id) return;
    analyzedPhotoIdRef.current = primaryPhoto.id;
    void runAnalysis(primaryPhoto);
  }, [draft.photos, isAnalyzing, runAnalysis]);

  const updateDraft = useCallback((patch: Partial<SellListingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const setCategoryPath = useCallback((categoryPath: FlatCategoryPath) => {
    setDraft((current) => ({ ...current, categoryPath }));
  }, []);

  const saveDraft = useCallback(() => {
    saveSellDraft(draft);
    setDraftSavedMessage("Draft saved");
    window.setTimeout(() => setDraftSavedMessage(null), 2000);
  }, [draft]);

  const publishListing = useCallback(async () => {
    setIsPublishing(true);
    setAnalysisError(null);
    setUploadProgress(0);

    try {
      const uploadedPhotos: SellPhoto[] = [];
      for (let index = 0; index < draft.photos.length; index += 1) {
        const photo = draft.photos[index]!;
        const uploaded = photo.file
          ? await uploadPhoto(photo, index)
          : photo;
        uploadedPhotos.push(uploaded);
      }

      setDraft((current) => ({ ...current, photos: uploadedPhotos }));

      const payload = {
        title: draft.title,
        description: draft.description,
        brand: draft.brand,
        color: draft.color,
        size: draft.size,
        condition: draft.condition,
        price: Number(draft.price),
        acceptOffers: draft.acceptOffers,
        categoryPath: draft.categoryPath
          ? {
              categorySlug: draft.categoryPath.categorySlug,
              subcategorySlug: draft.categoryPath.subcategorySlug,
              childCategorySlug: draft.categoryPath.childCategorySlug,
            }
          : null,
        inventory: {
          stock: draft.stock,
          lowStockAlert: manageInventory ? draft.lowStockAlert : draft.stock,
          ...(manageInventory && draft.sku.trim() ? { sku: draft.sku.trim() } : {}),
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

      const result = (await response.json()) as { listing?: { slug: string } };
      clearSellDraft();
      setPublishedSlug(result.listing?.slug ?? null);
      setView("published");
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Unable to publish listing. Please try again.",
      );
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
    }
  }, [draft, editListingId, manageInventory, removedImageIds, router, uploadPhoto]);

  return {
    view,
    draft,
    isAnalyzing,
    analysisError,
    isPublishing,
    uploadProgress,
    publishedSlug,
    draftSavedMessage,
    editListingId,
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
