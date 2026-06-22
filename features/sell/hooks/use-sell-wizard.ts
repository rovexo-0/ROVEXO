"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import { clearSellDraft, loadSellDraft, saveSellDraft } from "@/lib/sell/draft-storage";
import { uploadListingImage, deleteListingImage } from "@/lib/listings/upload-client";
import { applyAnalysisToDraft } from "@/lib/ai-camera/apply";
import { buildPublishDescription } from "@/lib/sell/publish-description";
import { deliveryCarriersForMethod } from "@/lib/sell/delivery";
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

const ANALYSIS_DEBOUNCE_MS = 600;

export function useSellForm(options: UseSellFormOptions = {}) {
  const { listingMode = "advanced", editListingId, initialDraft } = options;
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
  const analyzedSignatureRef = useRef<string | null>(null);
  const analysisCacheRef = useRef<Map<string, AiCameraAnalysisResult>>(new Map());
  const analysisAbortRef = useRef<AbortController | null>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const uploadSessionRef = useRef(crypto.randomUUID());
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const photoAnalysisSignature = useCallback((photos: SellPhoto[]) => {
    return photos
      .map((photo) => {
        if (photo.file) {
          return `${photo.id}:file:${photo.file.name}:${photo.file.size}`;
        }
        const imageUrl = photo.url ?? photo.previewUrl;
        if (imageUrl && !imageUrl.startsWith("blob:")) {
          return `${photo.id}:url:${imageUrl}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("|");
  }, []);

  async function resolvePhotoFile(photo: SellPhoto): Promise<File | null> {
    if (photo.file) return photo.file;

    const imageUrl = photo.url ?? photo.previewUrl;
    if (!imageUrl || imageUrl.startsWith("blob:")) return null;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) return null;
      return new File([blob], `listing-${photo.id}.jpg`, { type: blob.type || "image/jpeg" });
    } catch {
      return null;
    }
  }

  const invalidateAnalysis = useCallback((photos: SellPhoto[]) => {
    const signature = photoAnalysisSignature(photos);
    if (signature !== analyzedSignatureRef.current) {
      analyzedSignatureRef.current = null;
    }
  }, [photoAnalysisSignature]);

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

    setDraft((current) => {
      const photos = [...current.photos, ...incoming].slice(0, 8);
      invalidateAnalysis(photos);
      return { ...current, photos };
    });
  }, [invalidateAnalysis]);

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
      invalidateAnalysis(photos);
      return { ...current, photos };
    });
  }, [draft.photos, invalidateAnalysis]);

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
      invalidateAnalysis(photos);
      return { ...current, photos };
    });
  }, [draft.photos, invalidateAnalysis]);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => {
      const photos = [...current.photos];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      invalidateAnalysis(photos);
      return { ...current, photos };
    });
  }, [invalidateAnalysis]);

  const runAnalysis = useCallback(async (photos: SellPhoto[]) => {
    const resolved = await Promise.all(
      photos.map(async (photo) => ({
        photo,
        file: await resolvePhotoFile(photo),
      })),
    );
    const analyzable = resolved.filter(
      (entry): entry is { photo: SellPhoto; file: File } => Boolean(entry.file),
    );
    if (analyzable.length === 0) return;

    const signature = photoAnalysisSignature(photos);
    const cached = analysisCacheRef.current.get(signature);
    if (cached) {
      analyzedSignatureRef.current = signature;
      setDraft((current) =>
        applyAnalysisToDraft(current, cached, {
          fillTitle: listingMode !== "quick" || !current.title.trim(),
          fillDescription: !current.description.trim(),
        }),
      );
      return;
    }

    analysisAbortRef.current?.abort();
    const controller = new AbortController();
    analysisAbortRef.current = controller;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      for (const { file } of analyzable) {
        formData.append("images", file);
      }

      const response = await fetch("/api/ai/camera/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Analysis failed.");
      }

      const result = (await response.json()) as AiCameraAnalysisResult;
      analysisCacheRef.current.set(signature, result);
      analyzedSignatureRef.current = signature;

      setDraft((current) =>
        applyAnalysisToDraft(current, result, {
          fillTitle: listingMode !== "quick" || !current.title.trim(),
          fillDescription: !current.description.trim(),
        }),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      analyzedSignatureRef.current = null;
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      if (analysisAbortRef.current === controller) {
        setIsAnalyzing(false);
      }
    }
  }, [listingMode, photoAnalysisSignature]);

  useEffect(() => {
    const signature = photoAnalysisSignature(draft.photos);
    if (!signature || signature === analyzedSignatureRef.current) return;

    if (analysisTimerRef.current) {
      window.clearTimeout(analysisTimerRef.current);
    }

    analysisTimerRef.current = window.setTimeout(() => {
      void runAnalysis(draft.photos);
    }, ANALYSIS_DEBOUNCE_MS);

    return () => {
      if (analysisTimerRef.current) {
        window.clearTimeout(analysisTimerRef.current);
      }
    };
  }, [draft.photos, photoAnalysisSignature, runAnalysis]);

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
      setAnalysisError(
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
    isAnalyzing,
    analysisError,
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
