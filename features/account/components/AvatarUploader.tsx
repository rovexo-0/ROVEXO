"use client";

import { CanonicalButton, cdsButtonClass } from "@/src/components/canonical";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Avatar } from "@/components/ui/Avatar";

import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import {
  ACCOUNT_SETTINGS_FAIL_CLOSED_COPY,
  isAccountSettingsPhotoFileValid,
} from "@/lib/account/account-settings-v1";

type AvatarUploaderProps = {
  name: string;
  avatarUrl: string | null;
  onUpdated: (avatarUrl: string | null) => void;
  /** Account Settings v1.3 — Change Photo → Take / Gallery / Remove / Cancel. */
  accountSettings?: boolean;
};

const CROP_SIZE = 280;

export function AvatarUploader({ name, avatarUrl, onUpdated, accountSettings = false }: AvatarUploaderProps) {
  const router = useRouter();
  const pickerId = useId();
  const cameraId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

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
    setMenuOpen(false);
    if (accountSettings && !isAccountSettingsPhotoFileValid(file)) {
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
      if (!accountSettings) {
        router.refresh();
      }
    } catch {
      setError(accountSettings ? ACCOUNT_SETTINGS_FAIL_CLOSED_COPY : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
    setBusy(true);
    setError(null);
    setMenuOpen(false);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Unable to remove avatar.");
      }
      onUpdated(null);
      setPreview(null);
      setSourceImage(null);
      if (!accountSettings) {
        router.refresh();
      }
    } catch {
      setError(accountSettings ? ACCOUNT_SETTINGS_FAIL_CLOSED_COPY : "Unable to remove avatar.");
    } finally {
      setBusy(false);
    }
  };

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
        accept={accountSettings ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" : undefined}
        disabled={busy}
        onFilesSelected={(files) => void onFileChange(files)}
      />
      {accountSettings ? (
        <NativeImageFileInput
          id={cameraId}
          intent="camera"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          disabled={busy}
          onFilesSelected={(files) => void onFileChange(files)}
        />
      ) : null}

      <div className={cn("flex flex-wrap gap-ds-2", accountSettings ? "as-v1-photo__actions" : "justify-center")}>
        {!preview ? (
          <>
            {accountSettings ? (
              <>
                {!menuOpen ? (
                  <button
                    type="button"
                    className="as-v1-photo__change"
                    disabled={busy}
                    onClick={() => setMenuOpen(true)}
                  >
                    Change Photo
                  </button>
                ) : (
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
                    <button
                      type="button"
                      className="as-v1-photo__action as-v1-photo__action--muted"
                      onClick={() => setMenuOpen(false)}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  </>
                )}
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
                  {busy ? "Saving..." : "Apply"}
                </button>
                <button
                  type="button"
                  className="as-v1-photo__action as-v1-photo__action--muted"
                  onClick={() => {
                    setPreview(null);
                    setSourceImage(null);
                  }}
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
                <CanonicalButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPreview(null);
                    setSourceImage(null);
                  }}
                  disabled={busy}
                >
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
