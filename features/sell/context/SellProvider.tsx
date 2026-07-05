"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { safeRandomUUID } from "@/lib/uuid";
import { compressListingImage, createListingThumbnail, validateClientImage } from "@/lib/storage/client-images";
import { persistSellDraftSnapshot, persistSellDraftTextSync } from "@/lib/sell/persist-sell-draft";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";
import {
  initSellProfiler,
  sellProfileAutosave,
  sellProfileSetDraft,
  sellProfileSyncText,
} from "@/lib/sell/sell-profiler";
import type { SellListingMode } from "@/lib/profile/account";
import {
  createEmptyDraft,
  isListingValid,
  SELL_PHOTO_MAX,
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
  addPhotos: (files: FileList | File[]) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  replacePhoto: (id: string, file: File) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  setMainPhoto: (id: string) => void;
  retryPhotoUpload: (id: string) => Promise<void>;
  updateDraft: (patch: Partial<SellListingDraft>) => void;
  setCategoryPath: (categoryPath: FlatCategoryPath) => void;
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
  const uploadSessionRef = useRef<string>("");
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const pendingTitleRef = useRef(draft.title);
  const pendingDescriptionRef = useRef(draft.description);
  const draftRef = useRef(draft);
  const flushTitleCommitRef = useRef<(() => void) | null>(null);
  const flushDescriptionCommitRef = useRef<(() => void) | null>(null);
  const draftRevisionRef = useRef(0);

  useEffect(() => {
    initSellProfiler();
  }, []);

  useEffect(() => {
    draftRef.current = draft;
    draftRevisionRef.current += 1;
    sellProfileSetDraft("draft", `revision-${draftRevisionRef.current}`);
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
      } else {
        uploadSessionRef.current = safeRandomUUID();
      }

      if (!stored && photos.length === 0) return;
      if (cancelled) return;

      setDraft((current) => {
        const merged = {
          ...createEmptyDraft(),
          ...stored,
          parcelSize: stored?.parcelSize ?? "medium",
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

  const syncTitleToDraft = useCallback((title: string) => {
    sellProfileSyncText("title", title.length, "syncTitleToDraft");
    pendingTitleRef.current = title;
    setDraft((current) => (current.title === title ? current : { ...current, title }));
  }, []);

  const syncDescriptionToDraft = useCallback(
    (description: string) => {
      sellInputDiag("syncDescriptionToDraft", {
        len: description.length,
        caller: new Error().stack?.split("\n").slice(2, 5).join(" | "),
      });
      sellProfileSyncText("description", description.length, "syncDescriptionToDraft");
      pendingDescriptionRef.current = description;
      setDraft((current) =>
        current.description === description ? current : { ...current, description },
      );
      // Detection is title-driven only — typing/editing the description never
      // triggers analysis, keeping the Description field perfectly responsive.
    },
    [],
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

    sellProfileAutosave("schedule");
    const autosaveTimer = window.setTimeout(() => {
      sellInputDiag("autosave.timer.fire", {
        draftDescriptionLen: draftRef.current.description.length,
        pendingDescriptionLen: pendingDescriptionRef.current.length,
      });
      sellProfileAutosave("fire");
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
            parcelSize: stored?.parcelSize ?? "medium",
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
    if (!uploadSessionRef.current) {
      uploadSessionRef.current = safeRandomUUID();
    }
    return uploadSessionRef.current;
  }, []);

  const uploadPhoto = useCallback(
    async (photo: SellPhoto, onFraction?: (fraction: number) => void) => {
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
          onProgress: (progress) => onFraction?.(progress),
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
    const remaining = SELL_PHOTO_MAX - draftRef.current.photos.length;
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
            id: safeRandomUUID(),
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
        photos: [...current.photos, ...added].slice(0, SELL_PHOTO_MAX),
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
        const uploaded = await uploadPhoto(photo, (fraction) => setUploadProgress(fraction));
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

  const setCategoryPath = useCallback((categoryPath: FlatCategoryPath) => {
    setDraft((current) => ({ ...current, categoryPath }));
  }, []);

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
      // Upload all photos concurrently (browsers cap ~6 parallel requests per
      // host) instead of serializing them, and aggregate per-photo progress into
      // a single monotonic bar. On mobile this cuts multi-photo publish time
      // roughly proportional to the number of photos.
      const photos = publishDraft.photos;
      const fractions = new Array(photos.length).fill(0);
      const reportAggregate = () => {
        const sum = fractions.reduce((total, value) => total + value, 0);
        setUploadProgress(Math.round(sum / Math.max(1, photos.length)));
      };
      const uploadedPhotos: SellPhoto[] = await Promise.all(
        photos.map((photo, index) => {
          if (!photo.file) {
            fractions[index] = 100;
            return Promise.resolve(photo);
          }
          return uploadPhoto(photo, (fraction) => {
            fractions[index] = fraction;
            reportAggregate();
          });
        }),
      );

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
