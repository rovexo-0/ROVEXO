"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  startTransition,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import type { FlatCategoryPath } from "@/lib/categories/types";
import { clearSellDraft, loadSellDraft, loadUploadSessionId } from "@/lib/sell/draft-storage";
import { loadDraftPhotos } from "@/lib/sell/draft-photo-storage";
import { uploadListingImage, deleteListingImage } from "@/lib/listings/upload-client";
import { buildListingPublishPayload } from "@/lib/sell/build-listing-publish-payload";
import {
  detectCategoryFromTitle,
  shouldAutoSelectCategory,
  type CategoryDetectionResult,
} from "@/lib/sell/category-detection-pro";
import { logCategoryManualOverride } from "@/lib/sell/category-detection-learning";
import { createDebouncedCategoryDetection } from "@/lib/sell/category-detection-scheduler";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { sellBackgroundPolicy, runSellBackgroundTask } from "@/lib/sell/sell-background-policy";
import { compressListingImage, createListingThumbnail, validateClientImage } from "@/lib/storage/client-images";
import { persistSellDraftSnapshot, persistSellDraftTextSync } from "@/lib/sell/persist-sell-draft";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";
import type { SellListingMode } from "@/lib/profile/account";
import {
  createEmptyDraft,
  isListingValid,
  type SellListingDraft,
  type SellPhoto,
  type SellView,
} from "@/features/sell/types";

export type SellProviderOptions = {
  listingMode?: SellListingMode;
  editListingId?: string;
  initialDraft?: SellListingDraft;
};

export type SellContextValue = {
  view: SellView;
  draft: SellListingDraft;
  formError: string | null;
  isPublishing: boolean;
  uploadProgress: number;
  publishedSlug: string | null;
  editListingId?: string;
  listingMode: SellListingMode;
  showValidation: boolean;
  pendingTitleRef: MutableRefObject<string>;
  pendingDescriptionRef: MutableRefObject<string>;
  flushTitleCommitRef: MutableRefObject<(() => void) | null>;
  flushDescriptionCommitRef: MutableRefObject<(() => void) | null>;
  syncTitleToDraft: (title: string) => void;
  syncDescriptionToDraft: (description: string) => void;
  scheduleCategoryDetection: () => void;
  addPhotos: (files: FileList | File[]) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  replacePhoto: (id: string, file: File) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  setMainPhoto: (id: string) => void;
  retryPhotoUpload: (id: string) => Promise<void>;
  updateDraft: (patch: Partial<SellListingDraft>) => void;
  setCategoryPath: (categoryPath: FlatCategoryPath, source?: "manual" | "confirm") => void;
  publishListing: () => Promise<void>;
  resetForAnotherListing: () => void;
};

const SellContext = createContext<SellContextValue | null>(null);

function useSellFormInternal(options: SellProviderOptions = {}): SellContextValue {
  const { listingMode = "quick", editListingId, initialDraft } = options;
  const router = useRouter();
  const { pushToast } = useToast();
  const [view, setView] = useState<SellView>("form");
  const [draft, setDraft] = useState<SellListingDraft>(() => {
    if (initialDraft) return initialDraft;
    return createEmptyDraft();
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const userOverrodeCategoryRef = useRef(Boolean(initialDraft?.categoryPath));
  const lastDetectionRef = useRef<CategoryDetectionResult>({
    suggestions: [],
    top: null,
    tier: "none",
  });
  const lastAiTopPathIdRef = useRef<string | null>(null);
  const uploadSessionRef = useRef<string>("");
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const pendingTitleRef = useRef(draft.title);
  const pendingDescriptionRef = useRef(draft.description);
  const draftRef = useRef(draft);
  const flushTitleCommitRef = useRef<(() => void) | null>(null);
  const flushDescriptionCommitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (initialDraft || editListingId) return;

    let cancelled = false;

    void (async () => {
      const stored = loadSellDraft();
      const photos = await loadDraftPhotos();
      const sessionId = loadUploadSessionId();

      if (sessionId) {
        uploadSessionRef.current = sessionId;
      } else if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        uploadSessionRef.current = crypto.randomUUID();
      }

      if (!stored && photos.length === 0) return;
      if (cancelled) return;

      setDraft((current) => {
        const merged = {
          ...createEmptyDraft(),
          ...stored,
          photos: photos.length > 0 ? photos : current.photos,
        };
        pendingTitleRef.current = merged.title;
        pendingDescriptionRef.current = merged.description;
        return merged;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [editListingId, initialDraft]);

  const runCategoryDetection = useCallback(() => {
    if (!sellBackgroundPolicy.categorySuggestEnabled) return;

    runSellBackgroundTask(() => {
      const title = pendingTitleRef.current.trim();
      const description = pendingDescriptionRef.current.trim();
      if (title.length < 3 && description.length < 3) return;

      const detection = detectCategoryFromTitle(title, description);
      lastDetectionRef.current = detection;
      lastAiTopPathIdRef.current = detection.top
        ? `${detection.top.path.categorySlug}:${detection.top.path.subcategorySlug}:${detection.top.path.childCategorySlug ?? ""}`
        : null;

      startTransition(() => {
        if (userOverrodeCategoryRef.current) return;

        const autoSelect = shouldAutoSelectCategory(detection.suggestions);
        if (!autoSelect) return;

        const nextPathId = `${autoSelect.path.categorySlug}:${autoSelect.path.subcategorySlug}:${autoSelect.path.childCategorySlug ?? ""}`;

        setDraft((prev) => {
          const currentPathId = prev.categoryPath
            ? `${prev.categoryPath.categorySlug}:${prev.categoryPath.subcategorySlug}:${prev.categoryPath.childCategorySlug ?? ""}`
            : null;
          if (currentPathId === nextPathId) return prev;
          return { ...prev, categoryPath: autoSelect.path };
        });
      });
    });
  }, []);

  const categorySchedulerRef = useRef<ReturnType<typeof createDebouncedCategoryDetection> | null>(
    null,
  );

  useEffect(() => {
    categorySchedulerRef.current = createDebouncedCategoryDetection(
      runCategoryDetection,
      sellBackgroundPolicy.categoryDebounceMs,
    );
    return () => categorySchedulerRef.current?.cancel();
  }, [runCategoryDetection]);

  const scheduleCategoryDetection = useCallback(() => {
    categorySchedulerRef.current?.schedule();
  }, []);

  const syncTitleToDraft = useCallback(
    (title: string) => {
      pendingTitleRef.current = title;
      setDraft((current) => (current.title === title ? current : { ...current, title }));
      scheduleCategoryDetection();
    },
    [scheduleCategoryDetection],
  );

  const syncDescriptionToDraft = useCallback(
    (description: string) => {
      sellInputDiag("syncDescriptionToDraft", {
        len: description.length,
        caller: new Error().stack?.split("\n").slice(2, 5).join(" | "),
      });
      pendingDescriptionRef.current = description;
      setDraft((current) =>
        current.description === description ? current : { ...current, description },
      );
      scheduleCategoryDetection();
    },
    [scheduleCategoryDetection],
  );

  const flushPendingText = useCallback(() => {
    flushTitleCommitRef.current?.();
    flushDescriptionCommitRef.current?.();
  }, []);

  const persistDraftSnapshot = useCallback(() => {
    if (initialDraft || editListingId) return;
    void persistSellDraftSnapshot({
      draftRef,
      pendingTitleRef,
      pendingDescriptionRef,
      uploadSessionId: uploadSessionRef.current,
    });
  }, [editListingId, initialDraft]);

  const persistDraftTextSync = useCallback(() => {
    if (initialDraft || editListingId) return false;
    return persistSellDraftTextSync({
      draftRef,
      pendingTitleRef,
      pendingDescriptionRef,
      uploadSessionId: uploadSessionRef.current,
    });
  }, [editListingId, initialDraft]);

  useEffect(() => {
    if (initialDraft || editListingId) return;

    const autosaveTimer = window.setTimeout(() => {
      sellInputDiag("autosave.timer.fire", {
        draftDescriptionLen: draftRef.current.description.length,
        pendingDescriptionLen: pendingDescriptionRef.current.length,
      });
      persistDraftSnapshot();
    }, 1500);

    return () => window.clearTimeout(autosaveTimer);
  }, [draft, editListingId, initialDraft, persistDraftSnapshot]);

  useEffect(() => {
    if (initialDraft || editListingId) return;

    const persistOnHide = () => {
      persistDraftTextSync();
      void persistDraftSnapshot();
    };

    const restoreOnShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      void (async () => {
        const stored = loadSellDraft();
        const photos = await loadDraftPhotos();
        if (!stored && photos.length === 0) return;

        setDraft((current) => {
          const merged = {
            ...createEmptyDraft(),
            ...stored,
            photos: photos.length > 0 ? photos : current.photos,
          };
          pendingTitleRef.current = merged.title;
          pendingDescriptionRef.current = merged.description;
          return merged;
        });
      })();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistOnHide();
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", persistOnHide);
    window.addEventListener("pageshow", restoreOnShow);

    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", persistOnHide);
      window.removeEventListener("pageshow", restoreOnShow);
    };
  }, [editListingId, initialDraft, persistDraftSnapshot, persistDraftTextSync]);

  const ensureUploadSessionId = useCallback(() => {
    if (!uploadSessionRef.current && typeof crypto !== "undefined" && "randomUUID" in crypto) {
      uploadSessionRef.current = crypto.randomUUID();
    }
    return uploadSessionRef.current;
  }, []);

  const uploadPhoto = useCallback(
    async (photo: SellPhoto, index: number, photoCount: number) => {
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
          sessionId: ensureUploadSessionId(),
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
    },
    [editListingId, ensureUploadSessionId],
  );

  const addPhotos = useCallback(async (files: FileList | File[]) => {
    const remaining = 8 - draftRef.current.photos.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) return;

    const failures: string[] = [];

    const incoming = await Promise.all(
      selected.map(async (file) => {
        try {
          validateClientImage(file);
          const compressed = await compressListingImage(file);
          const thumbnail = await createListingThumbnail(compressed);
          return {
            id: crypto.randomUUID(),
            file: compressed,
            previewUrl: URL.createObjectURL(thumbnail),
            uploaded: false,
          } satisfies SellPhoto;
        } catch (error) {
          failures.push(error instanceof Error ? error.message : "Unable to add photo.");
          return null;
        }
      }),
    );

    const added = incoming.filter((photo) => photo !== null) as SellPhoto[];

    if (added.length > 0) {
      setDraft((current) => ({
        ...current,
        photos: [...current.photos, ...added].slice(0, 8),
      }));
    }

    if (failures.length > 0) {
      pushToast({
        title: "Photo not added",
        description: failures[0] ?? "Unable to add one or more photos.",
        variant: "error",
      });
    }
  }, [pushToast]);

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

  const retryPhotoUpload = useCallback(
    async (id: string) => {
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
    },
    [uploadPhoto],
  );

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
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const setMainPhoto = useCallback((id: string) => {
    setDraft((current) => {
      const index = current.photos.findIndex((photo) => photo.id === id);
      if (index <= 0) return current;
      const photos = [...current.photos];
      const [moved] = photos.splice(index, 1);
      photos.unshift(moved);
      return { ...current, photos };
    });
  }, []);

  const setCategoryPath = useCallback(
    (categoryPath: FlatCategoryPath, source: "manual" | "confirm" = "manual") => {
      if (source === "manual") {
        userOverrodeCategoryRef.current = true;
      }

      setDraft((current) => {
        const nextPathId = `${categoryPath.categorySlug}:${categoryPath.subcategorySlug}:${categoryPath.childCategorySlug ?? ""}`;
        const detection = lastDetectionRef.current;

        if (
          source === "manual" &&
          detection.top &&
          lastAiTopPathIdRef.current &&
          lastAiTopPathIdRef.current !== nextPathId
        ) {
          void logCategoryManualOverride({
            title: pendingTitleRef.current || current.title,
            suggestedPath: detection.top.path,
            chosenPath: categoryPath,
            confidence: detection.top.confidence,
            tier: detection.tier,
          });
        }

        return { ...current, categoryPath };
      });
    },
    [],
  );

  const publishListing = useCallback(async () => {
    flushPendingText();
    setShowValidation(true);
    setIsPublishing(true);
    setFormError(null);
    setUploadProgress(0);

    const baseDraft = resolveEffectiveSellDraft(draftRef.current, {
      title: pendingTitleRef.current,
      description: pendingDescriptionRef.current,
    });

    const publishDraft = baseDraft.condition
      ? baseDraft
      : { ...baseDraft, condition: "Used" };

    if (!isListingValid(publishDraft, { mode: "quick", showErrors: true })) {
      setFormError("Please complete all required fields before publishing.");
      setIsPublishing(false);
      return;
    }

    try {
      const uploadedPhotos: SellPhoto[] = [];
      for (let index = 0; index < publishDraft.photos.length; index += 1) {
        const photo = publishDraft.photos[index]!;
        const uploaded = photo.file
          ? await uploadPhoto(photo, index, publishDraft.photos.length)
          : photo;
        uploadedPhotos.push(uploaded);
      }

      setDraft((current) => ({ ...current, photos: uploadedPhotos }));

      if (uploadedPhotos.some((photo) => !photo.url || !photo.storagePath)) {
        throw new Error("Photo upload did not complete. Please try again.");
      }

      const payload = buildListingPublishPayload(publishDraft, uploadedPhotos);

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
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Unable to save listing.");
      }

      if (editListingId) {
        clearSellDraft();
        router.push("/seller/listings");
        router.refresh();
        return;
      }

      const result = (await response.json()) as { listing?: { id?: string; slug: string } };
      const slug = result.listing?.slug;
      if (!slug) {
        throw new Error("Listing was saved but no public URL was returned. Check My Listings.");
      }

      clearSellDraft();
      setPublishedSlug(slug);
      setView("published");
      pushToast({
        title: "🎉 Congratulations!",
        description: "Your listing has been published successfully.",
        variant: "success",
      });
      router.refresh();
      trackGaEvent("listing_created", {
        item_id: result.listing?.id ?? slug,
        item_name: publishDraft.title.trim(),
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to publish listing. Please try again.",
      );
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
    }
  }, [editListingId, flushPendingText, pushToast, removedImageIds, router, uploadPhoto]);

  const resetForAnotherListing = useCallback(() => {
    setView("form");
    setPublishedSlug(null);
    setFormError(null);
    setShowValidation(false);
    pendingTitleRef.current = "";
    pendingDescriptionRef.current = "";
    setDraft(createEmptyDraft());
    setRemovedImageIds([]);
    lastDetectionRef.current = { suggestions: [], top: null, tier: "none" };
    userOverrodeCategoryRef.current = false;
  }, []);

  return {
    view,
    draft,
    formError,
    isPublishing,
    uploadProgress,
    publishedSlug,
    editListingId,
    listingMode,
    showValidation,
    pendingTitleRef,
    pendingDescriptionRef,
    flushTitleCommitRef,
    flushDescriptionCommitRef,
    syncTitleToDraft,
    syncDescriptionToDraft,
    scheduleCategoryDetection,
    addPhotos,
    removePhoto,
    replacePhoto,
    reorderPhotos,
    setMainPhoto,
    retryPhotoUpload,
    updateDraft,
    setCategoryPath,
    publishListing,
    resetForAnotherListing,
  };
}

type SellProviderProps = SellProviderOptions & {
  children: ReactNode;
};

export function SellProvider({ children, ...options }: SellProviderProps) {
  const value = useSellFormInternal(options);
  return <SellContext.Provider value={value}>{children}</SellContext.Provider>;
}

export function useSell(): SellContextValue {
  const context = useContext(SellContext);
  if (!context) {
    throw new Error("useSell must be used within SellProvider");
  }
  return context;
}

export const useSellForm = useSellFormInternal;
export type SellFormController = SellContextValue;
