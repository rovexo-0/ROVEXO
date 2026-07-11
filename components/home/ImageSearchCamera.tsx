"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Images } from "lucide-react";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { cn } from "@/lib/cn";
import { captureVideoFrame, fileToDataUrl } from "@/lib/image-search/similarity";
import { focusRing } from "@/components/ui/tokens";
import "@/styles/rovexo/image-search.css";

export type ImageSearchCameraProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

export function ImageSearchCamera({ open, onClose, onCapture }: ImageSearchCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputId = sanitizeId(useId());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      releaseStream();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera unavailable on this device.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.playsInline = true;
        await video.play();
        setReady(true);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Unable to open camera. Use gallery to choose a photo.");
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      releaseStream();
    };
  }, [open, releaseStream]);

  const handleShutter = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    try {
      const dataUrl = await captureVideoFrame(video);
      releaseStream();
      onCapture(dataUrl);
    } catch {
      setError("Could not capture photo. Try again.");
    }
  }, [onCapture, ready, releaseStream]);

  const handleGalleryFiles = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file);
        releaseStream();
        onCapture(dataUrl);
      } catch {
        setError("Could not load that image.");
      }
    },
    [onCapture, releaseStream],
  );

  if (!open) return null;

  return (
    <div className="rx-image-search-camera" role="dialog" aria-modal="true" aria-label="Image search camera">
      <video ref={videoRef} className="rx-image-search-camera__preview" muted playsInline autoPlay />

      {error ? <p className="rx-image-search-camera__error">{error}</p> : null}

      <button
        type="button"
        className={cn("rx-image-search-camera__close", focusRing)}
        aria-label="Close camera"
        onClick={() => {
          releaseStream();
          setReady(false);
          setError(null);
          onClose();
        }}
      >
        ×
      </button>

      <div className="rx-image-search-camera__controls">
        <button
          type="button"
          className={cn("rx-image-search-camera__shutter", focusRing)}
          aria-label="Take photo"
          disabled={!ready}
          onClick={() => void handleShutter()}
        />

        <label
          htmlFor={galleryInputId}
          className={cn("rx-image-search-camera__gallery", focusRing)}
          aria-label="Choose from gallery"
        >
          <Images width={22} height={22} strokeWidth={1.75} aria-hidden />
          <NativeImageFileInput
            id={galleryInputId}
            intent="gallery"
            placement="associated"
            className="rx-image-search-camera__gallery-input"
            onFilesSelected={(files) => void handleGalleryFiles(files)}
          />
        </label>
      </div>
    </div>
  );
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}
