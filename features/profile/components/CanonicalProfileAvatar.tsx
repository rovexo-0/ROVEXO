"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Avatar } from "@/components/ui/Avatar";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { sanitizeNativeImagePickerId } from "@/lib/media/native-image-picker";
import {
  ACCOUNT_SETTINGS_FAIL_CLOSED_COPY,
  isAccountSettingsPhotoFileValid,
} from "@/lib/account/account-settings-v1";
import "@/styles/rovexo/canonical-profile-avatar-v1.css";

export type CanonicalProfileAvatarHandle = {
  openSheet: () => void;
};

export type CanonicalProfileAvatarProps = {
  name: string;
  avatarUrl: string | null;
  onUpdated: (avatarUrl: string | null) => void;
  onCroppingChange?: (cropping: boolean) => void;
  className?: string;
};

const CROP_SIZE = 280;
const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function CameraGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h3l2-2h6l2 2h3v11H4V8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

/**
 * Canonical Profile Photo control — camera badge + action sheet + one upload pipeline.
 * Used on My Profile, Personal Information, and Change Profile Picture.
 */
export const CanonicalProfileAvatar = forwardRef<
  CanonicalProfileAvatarHandle,
  CanonicalProfileAvatarProps
>(function CanonicalProfileAvatar(
  { name, avatarUrl, onUpdated, onCroppingChange, className },
  ref,
) {
  const router = useRouter();
  const reactId = useId();
  const galleryId = sanitizeNativeImagePickerId(`${reactId}-gallery`);
  const cameraId = sanitizeNativeImagePickerId(`${reactId}-camera`);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      openSheet: () => {
        if (!preview) setSheetOpen(true);
      },
    }),
    [preview],
  );

  useEffect(() => {
    onCroppingChange?.(Boolean(preview));
  }, [preview, onCroppingChange]);

  const drawCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = sourceImage;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    ctx.drawImage(image, offset.x, offset.y, drawWidth, drawHeight);
    ctx.restore();
  }, [offset, scale, sourceImage]);

  useEffect(() => {
    drawCrop();
  }, [drawCrop]);

  const onFileChange = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setSheetOpen(false);
    setError(null);
    if (!isAccountSettingsPhotoFileValid(file)) {
      setError(ACCOUNT_SETTINGS_FAIL_CLOSED_COPY);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const fitScale = Math.max(CROP_SIZE / image.width, CROP_SIZE / image.height);
      setSourceImage(image);
      setScale(fitScale);
      setOffset({
        x: (CROP_SIZE - image.width * fitScale) / 2,
        y: (CROP_SIZE - image.height * fitScale) / 2,
      });
      setPreview(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError(ACCOUNT_SETTINGS_FAIL_CLOSED_COPY);
    };
    image.src = objectUrl;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    // Do not setPointerCapture — Safari throws NotFoundError on auto-release races.
    // Canvas crop drag stays within the element; window listeners are unnecessary.
    dragRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    setOffset({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const uploadCropped = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setBusy(true);
    setError(null);

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/webp", 0.9),
      );
      if (!blob) throw new Error("Unable to process image.");

      const compressed = await imageCompression(
        new File([blob], "avatar.webp", { type: "image/webp" }),
        { maxSizeMB: 0.8, maxWidthOrHeight: 512, useWebWorker: true },
      );

      const formData = new FormData();
      formData.append("file", compressed);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const payload = (await response.json()) as { avatarUrl?: string; error?: string };
      if (!response.ok || !payload.avatarUrl) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      onUpdated(payload.avatarUrl);
      setPreview(null);
      setSourceImage(null);
      router.refresh();
    } catch {
      setError(ACCOUNT_SETTINGS_FAIL_CLOSED_COPY);
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
    setSheetOpen(false);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Unable to remove avatar.");
      }
      onUpdated(null);
      setPreview(null);
      setSourceImage(null);
      router.refresh();
    } catch {
      setError(ACCOUNT_SETTINGS_FAIL_CLOSED_COPY);
    } finally {
      setBusy(false);
    }
  };

  const clearCrop = () => {
    setPreview(null);
    setSourceImage(null);
    setError(null);
  };

  const triggerInput = (id: string) => {
    setSheetOpen(false);
    const input = document.getElementById(id);
    if (input instanceof HTMLInputElement && !input.disabled) {
      input.click();
    }
  };

  return (
    <div
      className={cn("rx-profile-avatar", className)}
      data-canonical-profile-avatar="v1.0"
      data-avatar-uploader="canonical"
    >
      <NativeImageFileInput
        id={galleryId}
        intent="gallery"
        accept={PHOTO_ACCEPT}
        disabled={busy}
        onFilesSelected={(files) => void onFileChange(files)}
      />
      <NativeImageFileInput
        id={cameraId}
        intent="camera"
        accept={PHOTO_ACCEPT}
        disabled={busy}
        onFilesSelected={(files) => void onFileChange(files)}
      />

      {!preview ? (
        <button
          type="button"
          className={cn("rx-profile-avatar__hit", focusRing)}
          aria-label={avatarUrl ? "Change profile photo" : "Add profile photo"}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          disabled={busy}
          onClick={() => setSheetOpen(true)}
        >
          <Avatar
            src={avatarUrl}
            alt={name}
            name={name}
            size="xl"
            className="rx-profile-avatar__image"
          />
          <span className="rx-profile-avatar__camera" aria-hidden>
            <CameraGlyph />
          </span>
        </button>
      ) : (
        <div className="rx-profile-avatar__crop">
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            className="rx-profile-avatar__crop-canvas touch-none rounded-ds-full"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            aria-label="Drag to reposition your profile photo"
          />
          <label className="sr-only" htmlFor={`${reactId}-scale`}>
            Zoom
          </label>
          <input
            id={`${reactId}-scale`}
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="rx-profile-avatar__crop-zoom"
          />
          <div className="rx-profile-avatar__crop-actions">
            <button
              type="button"
              className="rx-profile-avatar__crop-save"
              onClick={() => void uploadCropped()}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save photo"}
            </button>
            <button
              type="button"
              className="rx-profile-avatar__crop-cancel"
              onClick={clearCrop}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error ? <p className="rx-profile-avatar__error">{error}</p> : null}

      {sheetOpen && !preview ? (
        <div
          className="rx-profile-avatar__backdrop"
          role="presentation"
          onClick={() => setSheetOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSheetOpen(false);
          }}
        >
          <div
            className="rx-profile-avatar__sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Profile photo options"
            data-profile-avatar-sheet="v1.0"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="rx-profile-avatar__sheet-item"
              disabled={busy}
              onClick={() => triggerInput(cameraId)}
            >
              📷 Take Photo
            </button>
            <button
              type="button"
              className="rx-profile-avatar__sheet-item"
              disabled={busy}
              onClick={() => triggerInput(galleryId)}
            >
              🖼 Choose from Gallery
            </button>
            {avatarUrl ? (
              <button
                type="button"
                className="rx-profile-avatar__sheet-item rx-profile-avatar__sheet-item--danger"
                disabled={busy}
                onClick={() => void removeAvatar()}
              >
                🗑 Remove Photo
              </button>
            ) : null}
            <button
              type="button"
              className="rx-profile-avatar__sheet-item rx-profile-avatar__sheet-item--cancel"
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
});
