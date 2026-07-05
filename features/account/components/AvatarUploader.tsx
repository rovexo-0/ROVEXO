"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AvatarUploaderProps = {
  name: string;
  avatarUrl: string | null;
  onUpdated: (avatarUrl: string | null) => void;
};

const CROP_SIZE = 280;

export function AvatarUploader({ name, avatarUrl, onUpdated }: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const openPicker = () => inputRef.current?.click();

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
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
    image.src = objectUrl;
    event.target.value = "";
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
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
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
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to remove avatar.");
      }
      onUpdated(null);
      setPreview(null);
      setSourceImage(null);
      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove avatar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-ds-4">
      {!preview ? (
        <button
          type="button"
          onClick={openPicker}
          className={cn("rounded-ds-full", focusRing)}
          aria-label="Change profile photo"
        >
          <Avatar name={name} alt={name} src={avatarUrl} size="xl" />
        </button>
      ) : (
        <div className="flex flex-col items-center gap-ds-3">
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            className="touch-none rounded-ds-full border border-border shadow-md"
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
            className="w-full max-w-xs"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="sr-only"
        onChange={(event) => void onFileChange(event)}
      />

      <div className="flex flex-wrap justify-center gap-ds-2">
        {!preview ? (
          <>
            <Button type="button" variant="secondary" onClick={openPicker} disabled={busy}>
              Upload photo
            </Button>
            {avatarUrl ? (
              <Button type="button" variant="ghost" onClick={() => void removeAvatar()} disabled={busy}>
                Remove
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button type="button" variant="primary" onClick={() => void uploadCropped()} disabled={busy}>
              {busy ? "Saving…" : "Save photo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPreview(null);
                setSourceImage(null);
              }}
              disabled={busy}
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
