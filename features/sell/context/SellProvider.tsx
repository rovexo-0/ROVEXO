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
import type { FlatCategoryPath } from "@/lib/categories/types";
import { clearSellDraft, loadDatabaseDraftId, loadSellDraft, loadUploadSessionId } from "@/lib/sell/draft-storage";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import {
  DRAFT_AUTOSAVE_MS,
  discardLocalDraft,
  loadLocalDraftForRestore,
  persistDraftOnPublishFailure,
} from "@/lib/sell/draft-engine";
import {
  DRAFT_DATABASE_SAVED_MESSAGE,
  PUBLISH_FAILURE_NO_DRAFT_MESSAGE,
} from "@/lib/sell/draft-database-ssot-v1";
import {
  PublishEngineError,
  PUBLISH_FAILURE_MESSAGE,
  runPublishPipeline,
  type PublishPhase,
} from "@/lib/sell/publish-engine";
import { safeRandomUUID } from "@/lib/uuid";
import { persistSellDraftSnapshot, persistSellDraftTextSync } from "@/lib/sell/persist-sell-draft";
import { detectColourFromImageFile } from "@/lib/sell/detect-colour-from-image";
import {
  inferUserModifiedFromDraft,
  markFieldsUserModified,
  type SuggestionFieldId,
} from "@/lib/sell/suggestion-field-lock";
import { type PhotoMetadataEntry } from "@/lib/sell/photo-metadata";
import {
  cancelSellPhotoSession,
  deleteSellListingPhoto,
  intakeSellPhotoFromCanonicalEntry,
  loadSellDraftPhotosViaProductIntegration,
  prepareSellCameraEntry,
  removeSellPhotoViaCanonicalEntry,
  reorderSellPhotosViaCanonicalEntry,
  resetSellPhotoSession,
  resumeSellDraftPhotosIntoSession,
  uploadSellListingPhoto,
  type SellPhotoEntrySource,
} from "@/lib/product-integration";
import {
  markDescriptionAsUserEdited,
  type DescriptionEditState,
} from "@/lib/sell/smart-description-engine";
import { assertSellCategoryPublishGate } from "@/lib/sell/category-engine-v1";
import {
  createEmptyDraft,
  SELL_PHOTO_MAX,
  type SellListingDraft,
  type SellPhoto,
  type SellView,
} from "@/features/sell/types";
import {
  getFirstSellValidationIssue,
  isSellListingPublishable,
} from "@/lib/sell/sell-validation";
import { scrollToSellField, sellFieldDomId } from "@/lib/sell/sell-progressive-flow";
import { sellInputDiag } from "@/lib/sell/sell-input-diagnostics";
import {
  initSellProfiler,
  sellProfileAutosave,
  sellProfileSetDraft,
  sellProfileSyncText,
} from "@/lib/sell/sell-profiler";
import type { SellListingMode } from "@/lib/profile/account";
import { createNewListingSession } from "@/lib/sell/new-listing-session";
import { trackListingPublished } from "@/lib/sell/publish-analytics";
import { toUserSafeFailClosedMessage } from "@/lib/fail-closed";
import type { PublishSuccessPayload } from "@/lib/sell/publish-success";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { getListingCanonicalPath } from "@/lib/sell/publish-success";
import { sellDraftFingerprint } from "@/lib/sell/sell-draft-fingerprint";

export type SellProviderOptions = {
  listingMode?: SellListingMode;
  editListingId?: string;
  /** Public slug — used to return to Listing Details after Save Changes. */
  editListingSlug?: string;
  /** When editing an existing draft, autosave updates products.status='draft'. */
  editListingStatus?: string;
  initialDraft?: SellListingDraft;
  /** Clears stored draft and starts empty (default for /sell). */
  freshSession?: boolean;
  /** Auto-restore local draft without recovery prompt (My Account → Draft Listings). */
  restoreDraft?: boolean;
  /** Pause autosave while draft recovery prompt is open. */
  draftRecoveryPending?: boolean;
};

export type SellContextValue = {
  view: SellView;
  draft: SellListingDraft;
  formError: string | null;
  isPublishing: boolean;
  publishPhase: PublishPhase;
  uploadProgress: number;
  publishSuccess: PublishSuccessPayload | null;
  editListingId?: string;
  editListingSlug?: string;
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
  updateDraft: (patch: Partial<SellListingDraft>, options?: { userModifiedFields?: SuggestionFieldId[] }) => void;
  setCategoryPath: (categoryPath: FlatCategoryPath) => void;
  publishListing: () => Promise<void>;
  restoreLocalDraft: () => Promise<void>;
  discardRecoveryDraft: () => Promise<void>;
  markDescriptionManuallyEdited: (text: string) => void;
  descriptionIsAutoGenerated: boolean;
  resetForAnotherListing: () => Promise<void>;
  getIsDirty: () => boolean;
};

const SellContext = createContext<SellContextValue | null>(null);

function useSellFormInternal(options: SellProviderOptions = {}): SellContextValue {
  const {
    listingMode = "quick",
    editListingId,
    editListingSlug,
    editListingStatus,
    initialDraft,
    freshSession = false,
    restoreDraft = false,
    draftRecoveryPending = false,
  } = options;
  const router = useRouter();
  const { pushToast } = useToast();
  const [view, setView] = useState<SellView>("form");
  const [draft, setDraft] = useState<SellListingDraft>(() => {
    if (initialDraft) return initialDraft;
    return createEmptyDraft();
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishPhase, setPublishPhase] = useState<PublishPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishSuccess, setPublishSuccess] = useState<PublishSuccessPayload | null>(null);
  const publishSuccessRef = useRef(false);
  const publishStartedAtRef = useRef(0);
  const uploadStartedAtRef = useRef(0);
  const uploadFinishedAtRef = useRef(0);
  const [showValidation, setShowValidation] = useState(false);
  const uploadSessionRef = useRef<string>("");
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const removedImageIdsRef = useRef<string[]>([]);
  /** Photo ids deleted while upload still in flight — completion must not re-inject. */
  const cancelledPhotoIdsRef = useRef(new Set<string>());
  const pendingTitleRef = useRef(draft.title);
  const pendingDescriptionRef = useRef(draft.description);
  const draftRef = useRef(draft);
  const flushTitleCommitRef = useRef<(() => void) | null>(null);
  const flushDescriptionCommitRef = useRef<(() => void) | null>(null);
  const draftRevisionRef = useRef(0);
  const descriptionEditRef = useRef<DescriptionEditState>({ lastAuto: "", userEdited: false });
  const photoMetadataRef = useRef<PhotoMetadataEntry[]>([]);
  const photoSessionOwnerIdRef = useRef<string>(safeRandomUUID());
  const [descriptionIsAutoGenerated, setDescriptionIsAutoGenerated] = useState(false);
  const baselineFingerprintRef = useRef<string | null>(
    editListingId && initialDraft
      ? sellDraftFingerprint(initialDraft, {
          pendingTitle: initialDraft.title,
          pendingDescription: initialDraft.description,
          removedImageIds: [],
        })
      : null,
  );

  const resolvePhotoEntrySource = useCallback(
    (base: Exclude<SellPhotoEntrySource, "sell_camera" | "draft_restore">): SellPhotoEntrySource => {
      if (editListingId && (base === "replace_photo" || base === "add_photo")) {
        return "edit_listing_photo";
      }
      return base;
    },
    [editListingId],
  );

  useEffect(() => {
    initSellProfiler();
  }, []);

  useEffect(() => {
    draftRef.current = draft;
    draftRevisionRef.current += 1;
    sellProfileSetDraft("draft", `revision-${draftRevisionRef.current}`);
  }, [draft]);

  useEffect(() => {
    removedImageIdsRef.current = removedImageIds;
  }, [removedImageIds]);

  useEffect(() => {
    if (initialDraft || editListingId || freshSession || restoreDraft) return;

    let cancelled = false;

    void (async () => {
      const stored = loadSellDraft();
      const photos = await loadSellDraftPhotosViaProductIntegration();
      const sessionId = loadUploadSessionId();

      if (sessionId) {
        uploadSessionRef.current = sessionId;
      } else {
        uploadSessionRef.current = safeRandomUUID();
      }

      if (!stored && photos.length === 0) return;
      if (cancelled) return;

      setDraft((current) => {
        const userStartedEditing =
          current.photos.length > 0 ||
          current.title.trim().length > 0 ||
          current.description.trim().length > 0 ||
          current.categoryPath !== null;
        if (userStartedEditing) return current;

        const merged = {
          ...createEmptyDraft(),
          ...stored,
          parcelSize: stored?.parcelSize ?? "medium",
          photos: photos.length > 0 ? photos : current.photos,
          userModified: inferUserModifiedFromDraft(stored ?? {}),
        };
        pendingTitleRef.current = merged.title;
        pendingDescriptionRef.current = merged.description;
        if (merged.photos.length > 0) {
          void resumeSellDraftPhotosIntoSession(photoSessionOwnerIdRef.current, merged.photos);
        }
        return merged;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [editListingId, freshSession, initialDraft, restoreDraft]);

  useEffect(() => {
    prepareSellCameraEntry(photoSessionOwnerIdRef.current);
  }, []);

  useEffect(() => {
    if (!initialDraft?.photos.length) return;
    void resumeSellDraftPhotosIntoSession(photoSessionOwnerIdRef.current, initialDraft.photos);
  }, [initialDraft]);

  const restoreLocalDraft = useCallback(async () => {
    const { draft: restored, uploadSessionId } = await loadLocalDraftForRestore();
    if (uploadSessionId) {
      uploadSessionRef.current = uploadSessionId;
    } else {
      uploadSessionRef.current = safeRandomUUID();
    }
    pendingTitleRef.current = restored.title;
    pendingDescriptionRef.current = restored.description;
    setDraft(restored);
    setFormError(null);
    setShowValidation(false);
    if (restored.photos.length > 0) {
      void resumeSellDraftPhotosIntoSession(photoSessionOwnerIdRef.current, restored.photos);
    } else {
      prepareSellCameraEntry(photoSessionOwnerIdRef.current);
    }
  }, []);

  const discardRecoveryDraft = useCallback(async () => {
    await discardLocalDraft();
    uploadSessionRef.current = safeRandomUUID();
    pendingTitleRef.current = "";
    pendingDescriptionRef.current = "";
    cancelSellPhotoSession();
    photoSessionOwnerIdRef.current = safeRandomUUID();
    setDraft(createEmptyDraft());
    setFormError(null);
    setShowValidation(false);
    setRemovedImageIds([]);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!restoreDraft || initialDraft || editListingId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoration intentionally populates the draft after its asynchronous storage read.
    void restoreLocalDraft();
  }, [editListingId, initialDraft, restoreDraft, restoreLocalDraft]);

  /** Category Engine v1.0 — descriptions are manual only (auto-write removed). */
  const refreshSmartDescription = useCallback(() => {
    setDescriptionIsAutoGenerated(false);
  }, []);

  const markDescriptionManuallyEdited = useCallback((text: string) => {
    descriptionEditRef.current = markDescriptionAsUserEdited(text, descriptionEditRef.current);
    setDescriptionIsAutoGenerated(false);
  }, []);

  const syncTitleToDraft = useCallback((title: string) => {
    sellProfileSyncText("title", title.length, "syncTitleToDraft");
    pendingTitleRef.current = title;
    setDraft((current) => (current.title === title ? current : { ...current, title }));
  }, []);

  const syncDescriptionToDraft = useCallback((description: string) => {
    sellInputDiag("syncDescriptionToDraft", {
      len: description.length,
      caller: new Error().stack?.split("\n").slice(2, 5).join(" | "),
    });
    sellProfileSyncText("description", description.length, "syncDescriptionToDraft");
    pendingDescriptionRef.current = description;
    setDraft((current) =>
      current.description === description ? current : { ...current, description },
    );
  }, []);

  const flushPendingText = useCallback(() => {
    flushTitleCommitRef.current?.();
    flushDescriptionCommitRef.current?.();
  }, []);

  const persistDraftSnapshot = useCallback(() => {
    if (draftRecoveryPending || publishSuccessRef.current) return;
    const isCreateAutosave = !editListingId && !initialDraft;
    const isDraftEditAutosave = Boolean(editListingId && editListingStatus === "draft");
    if (!isCreateAutosave && !isDraftEditAutosave) return;
    void persistSellDraftSnapshot(
      {
        draftRef,
        pendingTitleRef,
        pendingDescriptionRef,
        uploadSessionId: uploadSessionRef.current,
      },
      {
        databaseDraftId: editListingId ?? loadDatabaseDraftId(),
        persistDatabase: true,
      },
    );
  }, [draftRecoveryPending, editListingId, editListingStatus, initialDraft]);

  const persistDraftTextSync = useCallback(() => {
    if (draftRecoveryPending || publishSuccessRef.current) return false;
    const isCreateAutosave = !editListingId && !initialDraft;
    const isDraftEditAutosave = Boolean(editListingId && editListingStatus === "draft");
    if (!isCreateAutosave && !isDraftEditAutosave) return false;
    return persistSellDraftTextSync({
      draftRef,
      pendingTitleRef,
      pendingDescriptionRef,
      uploadSessionId: uploadSessionRef.current,
    });
  }, [draftRecoveryPending, editListingId, editListingStatus, initialDraft]);

  useEffect(() => {
    if (draftRecoveryPending || publishSuccess) return;
    const isCreateAutosave = !editListingId && !initialDraft;
    const isDraftEditAutosave = Boolean(editListingId && editListingStatus === "draft");
    if (!isCreateAutosave && !isDraftEditAutosave) return;

    sellProfileAutosave("schedule");
    const autosaveTimer = window.setTimeout(() => {
      sellInputDiag("autosave.timer.fire", {
        draftDescriptionLen: draftRef.current.description.length,
        pendingDescriptionLen: pendingDescriptionRef.current.length,
      });
      sellProfileAutosave("fire");
      persistDraftSnapshot();
    }, DRAFT_AUTOSAVE_MS);

    return () => window.clearTimeout(autosaveTimer);
  }, [
    draft,
    draftRecoveryPending,
    editListingId,
    editListingStatus,
    initialDraft,
    persistDraftSnapshot,
    publishSuccess,
  ]);

  useEffect(() => {
    if (draftRecoveryPending || publishSuccess) return;
    const isCreateAutosave = !editListingId && !initialDraft;
    if (!isCreateAutosave) return;

    const persistOnHide = () => {
      persistDraftTextSync();
      void persistDraftSnapshot();
    };

    const restoreOnShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      void (async () => {
        const stored = loadSellDraft();
        const photos = await loadSellDraftPhotosViaProductIntegration();
        if (!stored && photos.length === 0) return;

        setDraft((current) => {
          const merged = {
            ...createEmptyDraft(),
            ...stored,
            parcelSize: stored?.parcelSize ?? "medium",
            photos: photos.length > 0 ? photos : current.photos,
            userModified: inferUserModifiedFromDraft(stored ?? {}),
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
  }, [
    draftRecoveryPending,
    editListingId,
    initialDraft,
    persistDraftSnapshot,
    persistDraftTextSync,
    publishSuccess,
  ]);

  const ensureUploadSessionId = useCallback(() => {
    if (!uploadSessionRef.current) {
      uploadSessionRef.current = safeRandomUUID();
    }
    return uploadSessionRef.current;
  }, []);

  const uploadPhoto = useCallback(
    async (photo: SellPhoto, onFraction?: (fraction: number) => void) => {
      if (!photo.file || photo.uploaded) return photo;
      if (cancelledPhotoIdsRef.current.has(photo.id)) return photo;

      setDraft((current) => ({
        ...current,
        photos: current.photos.map((item) =>
          item.id === photo.id ? { ...item, uploading: true, uploadError: undefined } : item,
        ),
      }));

      try {
        const result = await uploadSellListingPhoto({
          file: photo.file,
          productId: editListingId,
          sessionId: ensureUploadSessionId(),
          onProgress: (progress) => onFraction?.(progress),
          alreadyPipelinePrepared: true,
        });

        // Deleted mid-upload — cancel queue: drop remote object, do not re-inject tile.
        if (cancelledPhotoIdsRef.current.has(photo.id)) {
          cancelledPhotoIdsRef.current.delete(photo.id);
          void deleteSellListingPhoto({
            storagePath: result.storagePath,
            thumbnailStoragePath: result.thumbnailStoragePath,
          }).catch(() => undefined);
          return photo;
        }

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
        if (cancelledPhotoIdsRef.current.has(photo.id)) {
          cancelledPhotoIdsRef.current.delete(photo.id);
          throw error;
        }
        const message = toUserSafeFailClosedMessage(error, "unavailable").body;
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
    const ownerId = photoSessionOwnerIdRef.current;
    const source = resolvePhotoEntrySource("add_photo");

    /* Phase A3 — paint thumbnails immediately; compress/pipeline/upload in background. */
    const placeholders: SellPhoto[] = selected.map((file) => ({
      id: safeRandomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploaded: false,
      uploading: false,
    }));

    setDraft((current) => ({
      ...current,
      photos: [...current.photos, ...placeholders].slice(0, SELL_PHOTO_MAX),
    }));

    const CONCURRENCY = 8;
    let cursor = 0;

    const processPlaceholder = async (placeholder: SellPhoto) => {
      if (!placeholder.file) return;
      try {
        const result = await intakeSellPhotoFromCanonicalEntry({
          ownerId,
          source,
          file: placeholder.file,
          photoId: placeholder.id,
        });
        if (!result.ok) {
          failures.push(result.message);
          setDraft((current) => ({
            ...current,
            photos: current.photos.filter((row) => row.id !== placeholder.id),
          }));
          if (placeholder.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(placeholder.previewUrl);
          }
          return;
        }

        const prepared = result.photo;
        setDraft((current) => ({
          ...current,
          photos: current.photos.map((row) =>
            row.id === placeholder.id
              ? {
                  ...prepared,
                  /* Keep first-paint blob until prepared thumb exists — zero flicker. */
                  previewUrl: prepared.previewUrl || row.previewUrl,
                }
              : row,
          ),
        }));
        if (
          prepared.previewUrl &&
          prepared.previewUrl !== placeholder.previewUrl &&
          placeholder.previewUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(placeholder.previewUrl);
        }

        const colour = prepared.file
          ? await detectColourFromImageFile(prepared.file)
          : null;
        photoMetadataRef.current = [
          ...photoMetadataRef.current.filter((entry) => entry.id !== prepared.id),
          {
            ...result.draftMetadata,
            dominantColour: colour ?? result.draftMetadata.dominantColour,
          },
        ];
        refreshSmartDescription();

        void uploadPhoto({
          ...prepared,
          previewUrl: prepared.previewUrl || placeholder.previewUrl,
        })
          .then((uploaded) => {
            if (
              cancelledPhotoIdsRef.current.has(uploaded.id) ||
              !draftRef.current.photos.some((row) => row.id === uploaded.id)
            ) {
              cancelledPhotoIdsRef.current.delete(uploaded.id);
              if (uploaded.storagePath) {
                void deleteSellListingPhoto({
                  storagePath: uploaded.storagePath,
                  thumbnailStoragePath: uploaded.thumbnailStoragePath,
                }).catch(() => undefined);
              }
              return;
            }
            setDraft((current) => ({
              ...current,
              photos: current.photos.map((row) => (row.id === uploaded.id ? uploaded : row)),
            }));
          })
          .catch(() => undefined);
      } catch (error) {
        failures.push(toUserSafeFailClosedMessage(error, "unavailable").body);
        setDraft((current) => ({
          ...current,
          photos: current.photos.filter((row) => row.id !== placeholder.id),
        }));
        if (placeholder.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(placeholder.previewUrl);
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, placeholders.length) }, async () => {
      while (cursor < placeholders.length) {
        const index = cursor;
        cursor += 1;
        const placeholder = placeholders[index];
        if (placeholder) await processPlaceholder(placeholder);
      }
    });
    await Promise.all(workers);

    if (failures.length > 0) {
      pushToast({
        title: "Photo not added",
        description: failures[0] ?? "Unable to add one or more photos.",
        variant: "error",
      });
    }
  }, [pushToast, refreshSmartDescription, resolvePhotoEntrySource, uploadPhoto]);

  const removePhoto = useCallback(async (id: string) => {
    const previous = draftRef.current;
    const photo = previous.photos.find((item) => item.id === id);
    if (!photo) return;

    // Cancel active upload for this id — completion must not re-inject the photo.
    cancelledPhotoIdsRef.current.add(id);

    const previousRemovedImageIds = removedImageIdsRef.current;
    const previousMetadata = photoMetadataRef.current;

    if (photo.existingImageId) {
      setRemovedImageIds((current) =>
        current.includes(photo.existingImageId!) ? current : [...current, photo.existingImageId!],
      );
    }

    try {
      // Instant local remove — same frame. Storage cleanup is background-only.
      setDraft((current) => {
        const target = current.photos.find((item) => item.id === id);
        if (target?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(target.previewUrl);
        }
        photoMetadataRef.current = photoMetadataRef.current.filter((entry) => entry.id !== id);
        return { ...current, photos: current.photos.filter((item) => item.id !== id) };
      });

      removeSellPhotoViaCanonicalEntry(photoSessionOwnerIdRef.current, id);

      if (photo.storagePath) {
        void deleteSellListingPhoto({
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
        }).catch(() => undefined);
      }
    } catch {
      // Fail closed — restore previous photos. Never leave ghost/blank slots.
      cancelledPhotoIdsRef.current.delete(id);
      photoMetadataRef.current = previousMetadata;
      setRemovedImageIds(previousRemovedImageIds);
      setDraft(previous);
    }
  }, []);

  const retryPhotoUpload = useCallback(
    async (id: string) => {
      const photos = draftRef.current.photos;
      const index = photos.findIndex((photo) => photo.id === id);
      const photo = photos[index];
      if (!photo?.file || index < 0) return;
      cancelledPhotoIdsRef.current.delete(id);

      try {
        const uploaded = await uploadPhoto(photo, (fraction) => setUploadProgress(fraction));
        if (
          cancelledPhotoIdsRef.current.has(id) ||
          !draftRef.current.photos.some((item) => item.id === id)
        ) {
          if (uploaded.storagePath) {
            void deleteSellListingPhoto({
              storagePath: uploaded.storagePath,
              thumbnailStoragePath: uploaded.thumbnailStoragePath,
            }).catch(() => undefined);
          }
          return;
        }
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

    void (async () => {
      const result = await intakeSellPhotoFromCanonicalEntry({
        ownerId: photoSessionOwnerIdRef.current,
        source: resolvePhotoEntrySource("replace_photo"),
        file,
        photoId: id,
        replacePhotoId: id,
      });
      if (!result.ok) {
        pushToast({
          title: "Photo not replaced",
          description: result.message,
          variant: "error",
        });
        return;
      }

      setDraft((current) => ({
        ...current,
        photos: current.photos.map((photo) => {
          if (photo.id !== id) return photo;
          if (photo.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(photo.previewUrl);
          return result.photo;
        }),
      }));

      const colour = result.photo.file
        ? await detectColourFromImageFile(result.photo.file)
        : null;
      photoMetadataRef.current = [
        ...photoMetadataRef.current.filter((entry) => entry.id !== id),
        {
          ...result.draftMetadata,
          dominantColour: colour ?? result.draftMetadata.dominantColour,
        },
      ];
      refreshSmartDescription();

      void uploadPhoto(result.photo).catch(() => undefined);
    })();
  }, [pushToast, refreshSmartDescription, resolvePhotoEntrySource, uploadPhoto]);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => {
      const photos = [...current.photos];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      return { ...current, photos };
    });
    reorderSellPhotosViaCanonicalEntry(photoSessionOwnerIdRef.current, fromIndex, toIndex);
  }, []);

  const updateDraft = useCallback(
    (patch: Partial<SellListingDraft>, options?: { userModifiedFields?: SuggestionFieldId[] }) => {
      setDraft((current) => {
        const next = { ...current, ...patch };
        if (options?.userModifiedFields?.length) {
          next.userModified = markFieldsUserModified(current.userModified, options.userModifiedFields);
        }
        return next;
      });
    },
    [],
  );

  const setMainPhoto = useCallback((id: string) => {
    setDraft((current) => {
      const index = current.photos.findIndex((photo) => photo.id === id);
      if (index <= 0) return current;
      const photos = [...current.photos];
      const [moved] = photos.splice(index, 1);
      photos.unshift(moved);
      reorderSellPhotosViaCanonicalEntry(photoSessionOwnerIdRef.current, index, 0);
      return { ...current, photos };
    });
  }, []);

  const setCategoryPath = useCallback((categoryPath: FlatCategoryPath) => {
    setDraft((current) => ({
      ...current,
      categoryPath,
      // COD SÂNGE — category loads its attribute DB; nothing auto-selected.
      brand: "",
      color: "",
      material: "",
      size: "",
      condition: "",
      attributes: {},
      userModified: {
        ...markFieldsUserModified(current.userModified, ["category"]),
        brand: false,
        colour: false,
        material: false,
        size: false,
        condition: false,
      },
    }));
  }, []);

  const publishListing = useCallback(async () => {
    if (isPublishing) return;

    flushPendingText();
    setShowValidation(true);
    setFormError(null);

    const baseDraft = resolveEffectiveSellDraft(draftRef.current, {
      title: pendingTitleRef.current,
      description: pendingDescriptionRef.current,
    });

    if (!isSellListingPublishable(baseDraft, {
      title: pendingTitleRef.current,
      description: pendingDescriptionRef.current,
    })) {
      const issue = getFirstSellValidationIssue(baseDraft, {
        title: pendingTitleRef.current,
        description: pendingDescriptionRef.current,
      });
      if (issue) scrollToSellField(issue.fieldDomId);
      return;
    }

    const categoryGate = assertSellCategoryPublishGate({
      categoryPath: baseDraft.categoryPath,
      title: pendingTitleRef.current,
      description: pendingDescriptionRef.current,
      brand: baseDraft.brand,
    });
    if (!categoryGate.ok) {
      setFormError(categoryGate.message);
      scrollToSellField(sellFieldDomId("category"));
      return;
    }

    publishStartedAtRef.current = performance.now();
    uploadStartedAtRef.current = 0;
    uploadFinishedAtRef.current = 0;

    setIsPublishing(true);
    setPublishPhase("validating");
    setUploadProgress(0);

    const handlePhase = (phase: PublishPhase) => {
      if (phase === "uploading" && uploadStartedAtRef.current === 0) {
        uploadStartedAtRef.current = performance.now();
      }
      if (phase === "creating" && uploadFinishedAtRef.current === 0 && uploadStartedAtRef.current > 0) {
        uploadFinishedAtRef.current = performance.now();
      }
      setPublishPhase(phase);
    };

    try {
      try {
        const gateResponse = await fetch(
          `/api/account/profile-gate?intent=publish&returnTo=${encodeURIComponent(window.location.pathname)}`,
        );
        const gatePayload = (await gateResponse.json()) as { redirect?: string | null };
        if (gatePayload.redirect) {
          router.push(gatePayload.redirect);
          return;
        }
      } catch {
        setFormError("Unable to verify your profile. Please try again.");
        return;
      }

      const databaseDraftId = !editListingId ? loadDatabaseDraftId() : null;
      const publishTargetId = editListingId ?? databaseDraftId ?? undefined;

      const result = await runPublishPipeline({
        draft: baseDraft,
        editListingId: publishTargetId,
        removedImageIds,
        uploadPhoto,
        onPhase: handlePhase,
        onUploadProgress: setUploadProgress,
      });

      setDraft((current) => ({ ...current, photos: result.photos }));

      if (editListingId) {
        clearSellDraft();
        const returnSlug = result.listingSlug || editListingSlug;
        const returnPath = returnSlug
          ? `${getListingCanonicalPath(returnSlug)}?updated=1`
          : "/seller/listings";
        pushToast({ title: "Listing updated.", variant: "success" });
        router.push(returnPath);
        router.refresh();
        return;
      }

      clearSellDraft();

      const publishDurationMs = performance.now() - publishStartedAtRef.current;
      const uploadDurationMs =
        uploadFinishedAtRef.current > 0 && uploadStartedAtRef.current > 0
          ? uploadFinishedAtRef.current - uploadStartedAtRef.current
          : undefined;

      const { photos: _unusedPhotos, ...successPayload } = result;
      void _unusedPhotos;

      // Category Engine v1.0 — wipe form immediately after successful publish.
      publishSuccessRef.current = true;
      const session = await createNewListingSession(draftRef.current, safeRandomUUID());
      pendingTitleRef.current = "";
      pendingDescriptionRef.current = "";
      uploadSessionRef.current = session.uploadSessionId;
      descriptionEditRef.current = session.descriptionEdit;
      photoMetadataRef.current = session.photoMetadata;
      photoSessionOwnerIdRef.current = safeRandomUUID();
      resetSellPhotoSession(photoSessionOwnerIdRef.current);
      setDescriptionIsAutoGenerated(false);
      draftRef.current = session.draft;
      setDraft(session.draft);
      setRemovedImageIds([]);
      bumpPendingTextVersion();
      setShowValidation(false);
      setFormError(null);
      setPublishSuccess(successPayload);
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
      // New Listing Priority: bust client RSC cache so My Store / My Listings
      // show the new item first without a manual refresh.
      router.refresh();
      trackListingPublished(successPayload, { publishDurationMs, uploadDurationMs });
    } catch (error) {
      if (
        error instanceof PublishEngineError &&
        "redirect" in error &&
        typeof (error as PublishEngineError & { redirect?: string }).redirect === "string"
      ) {
        router.push((error as PublishEngineError & { redirect: string }).redirect);
        return;
      }

      // Surface real PublishEngineError message. Claim draft saved only if DB draft OK.
      if (error instanceof PublishEngineError && error.persistDraft) {
        const persistResult = await persistDraftOnPublishFailure(
          {
            draftRef,
            pendingTitleRef,
            pendingDescriptionRef,
            uploadSessionId: uploadSessionRef.current,
          },
          { databaseDraftId: editListingId ?? loadDatabaseDraftId() },
        );
        const apiMessage = error.message.trim();
        const claimsFakeDraftSave = /draft has been safely saved/i.test(apiMessage);
        if (persistResult.databaseDraftSaved) {
          setFormError(
            claimsFakeDraftSave || !apiMessage || apiMessage === PUBLISH_FAILURE_MESSAGE
              ? DRAFT_DATABASE_SAVED_MESSAGE
              : apiMessage,
          );
        } else {
          setFormError(
            claimsFakeDraftSave || !apiMessage || apiMessage === PUBLISH_FAILURE_MESSAGE
              ? PUBLISH_FAILURE_NO_DRAFT_MESSAGE
              : apiMessage,
          );
        }
        setPublishPhase("error");
        return;
      }

      setFormError(
        error instanceof PublishEngineError && error.message.trim()
          ? error.message
          : error instanceof Error && error.message.trim()
            ? error.message
            : PUBLISH_FAILURE_NO_DRAFT_MESSAGE,
      );
      setPublishPhase("error");
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
      setPublishPhase((current) => (current === "published" ? "published" : "idle"));
    }
  }, [editListingId, editListingSlug, flushPendingText, isPublishing, pushToast, removedImageIds, router, uploadPhoto]);

  const getIsDirty = useCallback(() => {
    if (!editListingId || !baselineFingerprintRef.current) return false;
    flushPendingText();
    return (
      sellDraftFingerprint(draftRef.current, {
        pendingTitle: pendingTitleRef.current,
        pendingDescription: pendingDescriptionRef.current,
        removedImageIds: removedImageIdsRef.current,
      }) !== baselineFingerprintRef.current
    );
  }, [editListingId, flushPendingText]);

  const resetForAnotherListing = useCallback(async () => {
    const session = await createNewListingSession(draftRef.current, safeRandomUUID());
    setView("form");
    publishSuccessRef.current = false;
    setPublishSuccess(null);
    setPublishPhase("idle");
    setFormError(null);
    setShowValidation(false);
    pendingTitleRef.current = "";
    pendingDescriptionRef.current = "";
    uploadSessionRef.current = session.uploadSessionId;
    descriptionEditRef.current = session.descriptionEdit;
    photoMetadataRef.current = session.photoMetadata;
    photoSessionOwnerIdRef.current = safeRandomUUID();
    resetSellPhotoSession(photoSessionOwnerIdRef.current);
    setDescriptionIsAutoGenerated(false);
    draftRef.current = session.draft;
    setDraft(session.draft);
    setRemovedImageIds([]);
    bumpPendingTextVersion();
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  return {
    view,
    draft,
    formError,
    isPublishing,
    publishPhase,
    uploadProgress,
    publishSuccess,
    editListingId,
    editListingSlug,
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
    restoreLocalDraft,
    discardRecoveryDraft,
    markDescriptionManuallyEdited,
    descriptionIsAutoGenerated,
    resetForAnotherListing,
    getIsDirty,
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
