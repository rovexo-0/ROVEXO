"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";
import { clearSellDraft, loadSellDraft, saveSellDraft } from "@/lib/sell/draft-storage";
import { uploadListingImage, deleteListingImage } from "@/lib/listings/upload-client";
import { buildPublishDescription } from "@/lib/sell/publish-description";
import { sanitizeListingLocationCity } from "@/lib/sell/listing-location";
import { deliveryCarriersForMethod } from "@/lib/sell/delivery";
import {
  detectCategoryFromTitle,
  shouldAutoSelectCategory,
  type CategoryDetectionResult,
} from "@/lib/sell/category-detection-pro";
import {
  applyAiAnalysisFields,
  categoryDetectionFromAiAnalysis,
} from "@/lib/sell/listing-ai-category";
import { logCategoryManualOverride } from "@/lib/sell/category-detection-learning";
import {
  createDebouncedCategoryDetection,
  CATEGORY_DETECTION_DEBOUNCE_MS,
} from "@/lib/sell/category-detection-scheduler";
import type { SellListingMode } from "@/lib/profile/account";
import {
  createEmptyDraft,
  isListingValid,
  type SellListingDraft,
  type SellPhoto,
  type SellView,
} from "@/features/sell/types";

type UseSellFormOptions = {
  listingMode?: SellListingMode;
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

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
  const [showValidation, setShowValidation] = useState(false);
  const [categoryDetection, setCategoryDetection] = useState<CategoryDetectionResult>({
    suggestions: [],
    top: null,
    tier: "none",
  });
  const [categoryDetectionDismissed, setCategoryDetectionDismissed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const userOverrodeCategoryRef = useRef(Boolean(initialDraft?.categoryPath));
  const lastAiTopPathIdRef = useRef<string | null>(null);
  const lastAiAppliedPathIdRef = useRef<string | null>(null);
  const pendingTitleRef = useRef(draft.title);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const pendingDetectionSnapshotRef = useRef<
    Pick<SellListingDraft, "title" | "description" | "photos"> | null
  >(null);
  const runCategoryDetectionBodyRef = useRef(() => {});
  const categoryDetectionSchedulerRef = useRef(
    createDebouncedCategoryDetection(() => {
      runCategoryDetectionBodyRef.current();
    }, CATEGORY_DETECTION_DEBOUNCE_MS),
  );
  const uploadSessionRef = useRef(crypto.randomUUID());
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const buildPhotoMetadata = useCallback(
    (photos: SellListingDraft["photos"]): Array<{ description?: string; filename?: string }> =>
      photos.map((photo) => ({ filename: photo.file?.name, description: undefined })),
    [],
  );

  const applyCategoryDetection = useCallback((detection: CategoryDetectionResult) => {
    setCategoryDetection(detection);
    setCategoryDetectionDismissed(false);
    lastAiTopPathIdRef.current = detection.top
      ? `${detection.top.path.categorySlug}:${detection.top.path.subcategorySlug}:${detection.top.path.childCategorySlug ?? ""}`
      : null;

    if (userOverrodeCategoryRef.current) return;

    const autoSelect = shouldAutoSelectCategory(detection.suggestions);
    if (autoSelect) {
      const nextPathId = `${autoSelect.path.categorySlug}:${autoSelect.path.subcategorySlug}:${autoSelect.path.childCategorySlug ?? ""}`;
      lastAiAppliedPathIdRef.current = nextPathId;
      setDraft((current) => ({ ...current, categoryPath: autoSelect.path }));
      return;
    }

    const appliedPathId = lastAiAppliedPathIdRef.current;
    if (!appliedPathId) return;

    setDraft((current) => {
      const currentPathId = current.categoryPath
        ? `${current.categoryPath.categorySlug}:${current.categoryPath.subcategorySlug}:${current.categoryPath.childCategorySlug ?? ""}`
        : null;
      if (currentPathId !== appliedPathId) return current;
      lastAiAppliedPathIdRef.current = null;
      return { ...current, categoryPath: null };
    });
  }, []);

  runCategoryDetectionBodyRef.current = () => {
    const current = draftRef.current;
    const snapshot = pendingDetectionSnapshotRef.current;
    const title = snapshot?.title ?? pendingTitleRef.current ?? current.title;
    const description = snapshot?.description ?? current.description;
    const photos = snapshot?.photos ?? current.photos;
    const detection = detectCategoryFromTitle(title, description, buildPhotoMetadata(photos));
    applyCategoryDetection(detection);
    pendingDetectionSnapshotRef.current = null;
  };

  const scheduleCategoryDetection = useCallback(
    (snapshot?: Pick<SellListingDraft, "title" | "description" | "photos">) => {
      pendingDetectionSnapshotRef.current = snapshot ?? null;
      categoryDetectionSchedulerRef.current.schedule();
    },
    [],
  );

  const runCategoryDetectionSoon = useCallback(
    (snapshot?: Pick<SellListingDraft, "title" | "description" | "photos">) => {
      pendingDetectionSnapshotRef.current = snapshot ?? null;
      categoryDetectionSchedulerRef.current.runSoon();
    },
    [],
  );

  const runPhotoAiAnalysis = useCallback(
    async (photo: SellPhoto) => {
      if (!photo.file) {
        runCategoryDetectionSoon();
        return;
      }

      try {
        const formData = new FormData();
        formData.append("image", photo.file);
        const response = await fetch("/api/ai/camera/analyze", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          runCategoryDetectionSoon();
          return;
        }

        const analysis = (await response.json()) as AiCameraAnalysisResult;
        const current = draftRef.current;
        const title = pendingTitleRef.current || current.title;
        const detection = categoryDetectionFromAiAnalysis(analysis, title, current.description);
        applyCategoryDetection(detection);

        const patch = applyAiAnalysisFields(analysis, {
          title,
          brand: current.brand,
          color: current.color,
          size: current.size,
          condition: current.condition,
          description: current.description,
        });

        setDraft((state) => {
          const next = {
            ...state,
            analysis,
            ...(patch.title ? { title: patch.title } : {}),
            ...(patch.brand ? { brand: patch.brand } : {}),
            ...(patch.color ? { color: patch.color } : {}),
            ...(patch.size ? { size: patch.size } : {}),
            ...(patch.condition ? { condition: patch.condition } : {}),
            ...(patch.description ? { description: patch.description } : {}),
            ...(patch.categoryPath && !userOverrodeCategoryRef.current
              ? { categoryPath: patch.categoryPath }
              : {}),
          };
          if (patch.title) pendingTitleRef.current = patch.title;
          return next;
        });
      } catch {
        runCategoryDetectionSoon();
      }
    },
    [applyCategoryDetection, runCategoryDetectionSoon],
  );

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

  const addPhotos = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        uploaded: false,
      }));

      setDraft((current) => {
        const wasEmpty = current.photos.length === 0;
        const photos = [...current.photos, ...incoming].slice(0, 8);
        const firstPhoto = wasEmpty && photos.length > 0 ? photos[0] : null;
        if (firstPhoto) {
          queueMicrotask(() => {
            void runPhotoAiAnalysis(firstPhoto);
          });
        }
        return { ...current, photos };
      });
    },
    [runPhotoAiAnalysis],
  );

  const removePhoto = useCallback(async (id: string) => {
    const photo = draftRef.current.photos.find((item) => item.id === id);
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
  }, []);

  const retryPhotoUpload = useCallback(async (id: string) => {
    const photos = draftRef.current.photos;
    const index = photos.findIndex((photo) => photo.id === id);
    const photo = photos[index];
    if (!photo?.file || index < 0) return;

    try {
      const uploaded = await uploadPhoto(photo, index, photos.length);
      setDraft((current) => ({
        ...current,
        photos: current.photos.map((item) => (item.id === id ? uploaded : item)),
      }));
    } catch {
      // uploadPhoto already sets uploadError on the photo
    }
  }, [uploadPhoto]);

  const replacePhoto = useCallback((id: string, file: File) => {
    const existing = draftRef.current.photos.find((photo) => photo.id === id);
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
  }, []);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => {
      const photos = [...current.photos];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      return { ...current, photos };
    });
  }, []);

  const updateDraft = useCallback((patch: Partial<SellListingDraft>) => {
    if (typeof patch.title === "string") {
      pendingTitleRef.current = patch.title;
    }
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const commitTitle = useCallback(
    (title: string) => {
      pendingTitleRef.current = title;
      updateDraft({ title });
      scheduleCategoryDetection({
        title,
        description: draftRef.current.description,
        photos: draftRef.current.photos,
      });
    },
    [scheduleCategoryDetection, updateDraft],
  );

  const setCategoryPath = useCallback(
    (categoryPath: FlatCategoryPath, source: "manual" | "confirm" = "manual") => {
      if (source === "manual") {
        userOverrodeCategoryRef.current = true;
      }

      setDraft((current) => {
        const nextPathId = `${categoryPath.categorySlug}:${categoryPath.subcategorySlug}:${categoryPath.childCategorySlug ?? ""}`;

        if (
          source === "manual" &&
          categoryDetection.top &&
          lastAiTopPathIdRef.current &&
          lastAiTopPathIdRef.current !== nextPathId
        ) {
          void logCategoryManualOverride({
            title: pendingTitleRef.current || current.title,
            suggestedPath: categoryDetection.top.path,
            chosenPath: categoryPath,
            confidence: categoryDetection.top.confidence,
            tier: categoryDetection.tier,
          });
        }

        return { ...current, categoryPath };
      });
    },
    [categoryDetection],
  );

  const confirmSuggestedCategory = useCallback(() => {
    if (!categoryDetection.top) return;
    setCategoryPath(categoryDetection.top.path, "confirm");
  }, [categoryDetection, setCategoryPath]);

  const dismissCategoryDetection = useCallback(() => {
    setCategoryDetectionDismissed(true);
    const currentDraft = draftRef.current;
    if (categoryDetection.top && currentDraft.categoryPath) {
      const currentPathId = `${currentDraft.categoryPath.categorySlug}:${currentDraft.categoryPath.subcategorySlug}:${currentDraft.categoryPath.childCategorySlug ?? ""}`;
      const aiPathId = `${categoryDetection.top.path.categorySlug}:${categoryDetection.top.path.subcategorySlug}:${categoryDetection.top.path.childCategorySlug ?? ""}`;
      if (currentPathId === aiPathId) {
        userOverrodeCategoryRef.current = true;
        setDraft((current) => ({ ...current, categoryPath: null }));
      }
    }
  }, [categoryDetection]);

  const openCategoryPickerForChange = useCallback(() => {
    userOverrodeCategoryRef.current = true;
  }, []);

  const saveDraft = useCallback(() => {
    const nextDraft = { ...draftRef.current, title: pendingTitleRef.current };
    saveSellDraft(nextDraft);
    setDraftSavedMessage("Draft saved");
    window.setTimeout(() => setDraftSavedMessage(null), 2000);
  }, []);

  const publishListing = useCallback(async () => {
    const committedTitle = pendingTitleRef.current.trim();
    const effectiveDraft = { ...draftRef.current, title: committedTitle };
    setShowValidation(true);

    if (!isListingValid(effectiveDraft, { mode: listingMode })) {
      setFormError("Please complete all required fields.");
      return;
    }

    setIsPublishing(true);
    setFormError(null);
    setUploadProgress(0);
    setDraft((current) => ({ ...current, title: committedTitle }));

    try {
      const workingDraft = { ...draftRef.current, title: committedTitle };
      const uploadedPhotos: SellPhoto[] = [];
      for (let index = 0; index < workingDraft.photos.length; index += 1) {
        const photo = workingDraft.photos[index]!;
        const uploaded = photo.file
          ? await uploadPhoto(photo, index, workingDraft.photos.length)
          : photo;
        uploadedPhotos.push(uploaded);
      }

      setDraft((current) => ({ ...current, photos: uploadedPhotos, title: committedTitle }));

      const payload = {
        title: committedTitle,
        description: buildPublishDescription(committedTitle, workingDraft.description, workingDraft.material),
        locationCity: sanitizeListingLocationCity(workingDraft.locationCity),
        brand: workingDraft.brand.trim() || undefined,
        color: workingDraft.color.trim() || undefined,
        size: workingDraft.size.trim() || undefined,
        condition: workingDraft.condition,
        price: Number(workingDraft.price),
        acceptOffers: workingDraft.acceptOffers,
        deliveryCarriers: deliveryCarriersForMethod(workingDraft.shippingMethod),
        categoryPath: workingDraft.categoryPath
          ? {
              categorySlug: workingDraft.categoryPath.categorySlug,
              subcategorySlug: workingDraft.categoryPath.subcategorySlug,
              childCategorySlug: workingDraft.categoryPath.childCategorySlug,
              categorySlugs: workingDraft.categoryPath.segments.map((segment) => segment.slug),
            }
          : null,
        inventory: {
          stock: workingDraft.stock,
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
        item_name: committedTitle,
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to publish listing. Please try again.",
      );
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
    }
  }, [editListingId, listingMode, removedImageIds, router, uploadPhoto]);

  const resetForAnotherListing = useCallback(() => {
    setView("form");
    setPublishedSlug(null);
    setFormError(null);
    setShowValidation(false);
    pendingTitleRef.current = "";
    setDraft(createEmptyDraft());
    setRemovedImageIds([]);
    setCategoryDetection({ suggestions: [], top: null, tier: "none" });
    setCategoryDetectionDismissed(false);
  }, []);

  return {
    view,
    draft,
    formError,
    showValidation,
    categoryDetection,
    categoryDetectionDismissed,
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
    commitTitle,
    pendingTitleRef,
    setCategoryPath,
    confirmSuggestedCategory,
    dismissCategoryDetection,
    openCategoryPickerForChange,
    saveDraft,
    publishListing,
    resetForAnotherListing,
  };
}

export type SellFormController = ReturnType<typeof useSellForm>;
export const useSellWizard = useSellForm;
export type SellWizardController = SellFormController;
