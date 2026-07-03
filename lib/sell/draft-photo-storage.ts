import type { SellPhoto } from "@/features/sell/types";

const DB_NAME = "rovexo-sell-draft";
const DB_VERSION = 1;
const PHOTO_STORE = "photos";

type StoredPhotoRecord = {
  id: string;
  order: number;
  mimeType: string;
  blob: Blob | null;
  previewUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  storagePath?: string;
  thumbnailStoragePath?: string;
  uploaded?: boolean;
  existingImageId?: string;
};

function openDraftPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("Unable to open sell draft database."));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDraftPhotoDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(PHOTO_STORE, mode);
        const store = tx.objectStore(PHOTO_STORE);
        const request = run(store);

        request.onerror = () => reject(request.error ?? new Error("Sell draft photo transaction failed."));
        request.onsuccess = () => resolve(request.result);

        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error ?? new Error("Sell draft photo transaction failed."));
      }),
  );
}

function photoToRecord(photo: SellPhoto, order: number): StoredPhotoRecord | null {
  if (photo.file) {
    return {
      id: photo.id,
      order,
      mimeType: photo.file.type || "image/jpeg",
      blob: photo.file,
      previewUrl: photo.previewUrl,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      uploaded: photo.uploaded,
      existingImageId: photo.existingImageId,
    };
  }

  if (photo.previewUrl || photo.url || photo.thumbnailUrl) {
    return {
      id: photo.id,
      order,
      mimeType: "image/jpeg",
      blob: null,
      previewUrl: photo.previewUrl,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      uploaded: photo.uploaded,
      existingImageId: photo.existingImageId,
    };
  }

  return null;
}

function recordToPhoto(record: StoredPhotoRecord): SellPhoto {
  if (record.blob) {
    const file = new File([record.blob], `${record.id}.jpg`, {
      type: record.mimeType || "image/jpeg",
    });
    const previewUrl = URL.createObjectURL(record.blob);
    return {
      id: record.id,
      file,
      previewUrl,
      url: record.url,
      thumbnailUrl: record.thumbnailUrl,
      storagePath: record.storagePath,
      thumbnailStoragePath: record.thumbnailStoragePath,
      uploaded: record.uploaded,
      existingImageId: record.existingImageId,
    };
  }

  return {
    id: record.id,
    previewUrl: record.previewUrl ?? record.thumbnailUrl ?? record.url ?? "",
    url: record.url,
    thumbnailUrl: record.thumbnailUrl,
    storagePath: record.storagePath,
    thumbnailStoragePath: record.thumbnailStoragePath,
    uploaded: record.uploaded,
    existingImageId: record.existingImageId,
  };
}

export async function saveDraftPhotos(photos: SellPhoto[]): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  // Draft photo persistence is a best-effort convenience (survives reloads /
  // backgrounding). Some environments — notably iOS Safari private mode and
  // storage-restricted WebViews — throw when opening IndexedDB or storing
  // Blobs. Those failures must never surface as an uncaught rejection or block
  // the in-memory photo flow, so we swallow them here.
  try {
    const db = await openDraftPhotoDb();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      const store = tx.objectStore(PHOTO_STORE);
      store.clear();

      photos.forEach((photo, index) => {
        const record = photoToRecord(photo, index);
        if (record) store.put(record);
      });

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error ?? new Error("Unable to save sell draft photos."));
    });
  } catch {
    // Persistence unavailable — draft photos simply won't survive a reload.
  }
}

export async function loadDraftPhotos(): Promise<SellPhoto[]> {
  if (typeof indexedDB === "undefined") return [];

  try {
    const records = await runTransaction<StoredPhotoRecord[]>("readonly", (store) => store.getAll());
    return records
      .sort((left, right) => left.order - right.order)
      .map(recordToPhoto)
      // Drop legacy/corrupt records that can no longer be published (no local
      // file to upload and no already-uploaded URL). Restoring these would make
      // photo validation fail and leave Publish disabled on mobile.
      .filter((photo) => Boolean(photo.file) || Boolean(photo.uploaded && photo.url))
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function clearDraftPhotos(): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await openDraftPhotoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error ?? new Error("Unable to clear sell draft photos."));
    });
  } catch {
    // Best-effort cleanup — ignore storage failures.
  }
}
