"use client";

import { CanonicalButton, cdsButtonClass } from "@/src/components/canonical";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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

type AvatarUploaderProps = {
  name: string;
  avatarUrl: string | null;
  onUpdated: (avatarUrl: string | null) => void;
  /** Account Settings — Take / Gallery / Remove shown immediately (no Change Photo gate). */
  accountSettings?: boolean;
  /**
   * My Profile camera — open OS native image picker only (no ROVEXO sheet).
   * Crop / upload / refresh stay on Profile via the existing pipeline.
   */
  nativeDirect?: boolean;
  /** Stable id for Profile `<label htmlFor>` (Samsung-safe after sanitize). */
  pickerInputId?: string;
  /** Notifies Profile when crop UI is active (hide avatar hit while cropping). */
  onCroppingChange?: (cropping: boolean) => void;
};

const CROP_SIZE = 280;
const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export function AvatarUploader({
  name,
  avatarUrl,
  onUpdated,
  accountSettings = false,
  nativeDirect = false,
  pickerInputId,
  onCroppingChange,
}: AvatarUploaderProps) {
  const router = useRouter();
  const reactId = useId();
  const pickerId = pickerInputId
    ? sanitizeNativeImagePickerId(pickerInputId)
    : sanitizeNativeImagePickerId(reactId);
  const cameraId = sanitizeNativeImagePickerId(`${reactId}-cam`);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const usePhotoActions = accountSettings || nativeDirect;
  const strictPhotoValidation = usePhotoActions;

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

  const onFileChange = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    if (strictPhotoValidation && !isAccountSettingsPhotoFileValid(file)) {
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
    dragRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
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

  useEffect(() => {
    drawCrop();
  }, [drawCrop]);

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
      if (!usePhotoActions) {
        router.refresh();
      }
    } catch {
      setError(usePhotoActions ? ACCOUNT_SETTINGS_FAIL_CLOSED_COPY : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
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
      if (!usePhotoActions) {
        router.refresh();
      }
    } catch {
      setError(usePhotoActions ? ACCOUNT_SETTINGS_FAIL_CLOSED_COPY : "Unable to remove avatar.");
    } finally {
      setBusy(false);
    }
  };

  const clearCrop = () => {
    setPreview(null);
    setSourceImage(null);
    setError(null);
  };

  if (nativeDirect) {
    return (
      <div className="vp-v1__avatar-native" data-avatar-uploader="native-direct">
        {/* Gallery intent + image/* · no capture → OS Photo Picker (Take Photo / Gallery). */}
        <NativeImageFileInput
          id={pickerId}
          intent="gallery"
          disabled={busy}
          onFilesSelected={(files) => void onFileChange(files)}
        />

        {preview ? (
          <div className="vp-v1__avatar-crop">
            <canvas
              ref={canvasRef}
              width={CROP_SIZE}
              height={CROP_SIZE}
              className="vp-v1__avatar-crop-canvas touch-none rounded-ds-full"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              aria-label="Drag to reposition your profile photo"
            />
            <label className="sr-only" htmlFor="avatar-scale-native">
              Zoom
            </label>
            <input
              id="avatar-scale-native"
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="vp-v1__avatar-crop-zoom"
            />
            <div className="vp-v1__avatar-crop-actions">
              <button
                type="button"
                className="vp-v1__avatar-crop-save"
                onClick={() => void uploadCropped()}
                disabled={busy}
              >
                {busy ? "Saving…" : "Save photo"}
              </button>
              <button
                type="button"
                className="vp-v1__avatar-crop-cancel"
                onClick={clearCrop}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="vp-v1__avatar-crop-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-ds-4", accountSettings ? "as-v1-photo items-start" : "items-center")}>
      {!preview ? (
        <div
          className={cn(
            "rounded-ds-full",
            accountSettings && "as-v1-photo__preview",
            busy && "pointer-events-none opacity-50",
          )}
        >
          <Avatar name={name} alt={name} src={avatarUrl} size="xl" />
        </div>
      ) : (
        <div className={cn("flex flex-col gap-ds-3", accountSettings ? "items-start" : "items-center")}>
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            className={cn(
              "touch-none rounded-ds-full",
              accountSettings ? "h-20 w-20" : "border border-border shadow-md",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            aria-label="Drag to reposition your profile photo"
          />
          <label className="sr-only" htmlFor="avatar-scale">
            Zoom
          </label>
          <input
            id="avatar-scale"
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="w-full"
          />
        </div>
      )}

      <NativeImageFileInput
        id={pickerId}
        intent="gallery"
        accept={accountSettings ? PHOTO_ACCEPT : undefined}
        disabled={busy}
        onFilesSelected={(files) => void onFileChange(files)}
      />
      {accountSettings ? (
        <NativeImageFileInput
          id={cameraId}
          intent="camera"
          accept={PHOTO_ACCEPT}
          disabled={busy}
          onFilesSelected={(files) => void onFileChange(files)}
        />
      ) : null}

      <div className={cn("flex flex-wrap gap-ds-2", accountSettings ? "as-v1-photo__actions" : "justify-center")}>
        {!preview ? (
          <>
            {accountSettings ? (
              <>
                <label
                  htmlFor={cameraId}
                  className={cn("as-v1-photo__action", busy && "pointer-events-none opacity-40")}
                >
                  Take Photo
                </label>
                <label
                  htmlFor={pickerId}
                  className={cn("as-v1-photo__action", busy && "pointer-events-none opacity-40")}
                >
                  Choose From Gallery
                </label>
                {avatarUrl ? (
                  <button
                    type="button"
                    className="as-v1-photo__action as-v1-photo__action--danger"
                    onClick={() => void removeAvatar()}
                    disabled={busy}
                  >
                    Remove Photo
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <label
                  htmlFor={pickerId}
                  className={cn(cdsButtonClass("secondary"), focusRing, busy && "pointer-events-none opacity-50")}
                >
                  Upload Photo
                </label>
                {avatarUrl ? (
                  <CanonicalButton type="button" variant="ghost" onClick={() => void removeAvatar()} disabled={busy}>
                    Remove Photo
                  </CanonicalButton>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            {accountSettings ? (
              <>
                <button
                  type="button"
                  className="as-v1-photo__action"
                  onClick={() => void uploadCropped()}
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save photo"}
                </button>
                <button
                  type="button"
                  className="as-v1-photo__action as-v1-photo__action--muted"
                  onClick={clearCrop}
                  disabled={busy}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <CanonicalButton type="button" onClick={() => void uploadCropped()} disabled={busy} loading={busy}>
                  {busy ? "Saving…" : "Save photo"}
                </CanonicalButton>
                <CanonicalButton type="button" variant="ghost" onClick={clearCrop} disabled={busy}>
                  Cancel
                </CanonicalButton>
              </>
            )}
          </>
        )}
      </div>

      {error ? <p className="as-v1-hint as-v1-hint--error">{error}</p> : null}
    </div>
  );
}
