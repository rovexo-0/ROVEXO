"use client";

/**
 * Canonical View Item fullscreen image viewer (SSOT).
 * Used by ProductGalleryV1 and ConversationHub — one implementation only.
 */

import { SafeImage, isRenderableImageSrc } from "@/components/ui/SafeImage";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export type ProductFullscreenImageViewerProps = {
  open: boolean;
  onClose: () => void;
  images: string[];
  title: string;
  /** Zero-based index to show when opened. */
  initialIndex?: number;
};

type PinchTransform = {
  scale: number;
  x: number;
  y: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function getTouchDistance(touches: { length: number; 0?: Touch; 1?: Touch }): number {
  const first = touches[0];
  const second = touches[1];
  if (!first || !second) return 0;
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function PinchZoomSlide({
  image,
  alt,
  priority,
  isActive,
}: {
  image: string;
  alt: string;
  priority?: boolean;
  isActive: boolean;
}) {
  const [transform, setTransform] = useState<PinchTransform>({ scale: 1, x: 0, y: 0 });
  const [wasActive, setWasActive] = useState(isActive);
  const pinchRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    lastPan: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    panning: false,
  });

  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (!isActive) {
      setTransform({ scale: 1, x: 0, y: 0 });
    }
  }

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        pinchRef.current.initialDistance = getTouchDistance(event.touches);
        pinchRef.current.initialScale = transform.scale;
        pinchRef.current.panning = false;
        return;
      }

      if (event.touches.length === 1 && transform.scale > 1) {
        const touch = event.touches[0];
        if (!touch) return;
        pinchRef.current.panning = true;
        pinchRef.current.panStart = { x: touch.clientX, y: touch.clientY };
        pinchRef.current.lastPan = { x: transform.x, y: transform.y };
      }
    },
    [transform.scale, transform.x, transform.y],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const distance = getTouchDistance(event.touches);
        if (!pinchRef.current.initialDistance) return;
        const nextScale = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, (distance / pinchRef.current.initialDistance) * pinchRef.current.initialScale),
        );
        setTransform((current) => ({ ...current, scale: nextScale }));
        return;
      }

      if (pinchRef.current.panning && event.touches.length === 1 && transform.scale > 1) {
        event.preventDefault();
        const touch = event.touches[0];
        if (!touch) return;
        const dx = touch.clientX - pinchRef.current.panStart.x;
        const dy = touch.clientY - pinchRef.current.panStart.y;
        setTransform((current) => ({
          ...current,
          x: pinchRef.current.lastPan.x + dx,
          y: pinchRef.current.lastPan.y + dy,
        }));
      }
    },
    [transform.scale],
  );

  const onTouchEnd = useCallback(() => {
    pinchRef.current.initialDistance = 0;
    pinchRef.current.panning = false;
    setTransform((current) => {
      if (current.scale <= 1.02) {
        return { scale: 1, x: 0, y: 0 };
      }
      return current;
    });
  }, []);

  const onDoubleClick = useCallback(() => {
    setTransform((current) =>
      current.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2, x: 0, y: 0 },
    );
  }, []);

  return (
    <div
      className="pd-v1__lightbox-slide"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="pd-v1__lightbox-zoom"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        }}
      >
        <SafeImage
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          quality={90}
          className="pd-v1__lightbox-image object-contain"
          style={{ objectFit: "contain" }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export const ProductFullscreenImageViewer = memo(function ProductFullscreenImageViewer({
  open,
  onClose,
  images: rawImages,
  title,
  initialIndex = 0,
}: ProductFullscreenImageViewerProps) {
  const images = useMemo(() => rawImages.filter(isRenderableImageSrc), [rawImages]);
  const clampedInitial = Math.min(
    Math.max(initialIndex, 0),
    Math.max(images.length - 1, 0),
  );
  const [activeIndex, setActiveIndex] = useState(clampedInitial);
  const [openSyncKey, setOpenSyncKey] = useState(`${open}:${clampedInitial}:${images.length}`);
  const lightboxScrollerRef = useRef<HTMLDivElement>(null);

  // Sync index when the viewer opens / source set changes — render-phase adjust (no effect setState).
  const nextOpenSyncKey = `${open}:${clampedInitial}:${images.length}`;
  if (open && nextOpenSyncKey !== openSyncKey) {
    setOpenSyncKey(nextOpenSyncKey);
    setActiveIndex(clampedInitial);
  }

  const scrollLightboxTo = useCallback(
    (index: number) => {
      const node = lightboxScrollerRef.current;
      if (!node) return;
      const clamped = Math.min(Math.max(index, 0), images.length - 1);
      node.scrollTo({ left: clamped * node.clientWidth, behavior: "smooth" });
      setActiveIndex(clamped);
    },
    [images.length],
  );

  const handleLightboxScroll = useCallback(() => {
    const node = lightboxScrollerRef.current;
    if (!node || node.clientWidth === 0) return;
    const index = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") scrollLightboxTo(activeIndex + 1);
      if (event.key === "ArrowLeft") scrollLightboxTo(activeIndex - 1);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, open, onClose, scrollLightboxTo]);

  useEffect(() => {
    if (!open) return;
    const node = lightboxScrollerRef.current;
    if (!node) return;
    node.scrollTo({ left: activeIndex * node.clientWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || images.length === 0) return null;

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="lightbox"
      zIndex={250}
      ariaLabel={`${title} fullscreen gallery`}
      panelClassName="pd-v1__lightbox"
    >
      <div className="pd-v1__lightbox-chrome">
        <p aria-live="polite" className="pd-v1__lightbox-count">
          {activeIndex + 1} / {images.length}
        </p>
        <button
          type="button"
          aria-label="Close gallery"
          className={cn("pd-v1__lightbox-close", focusRing)}
          onClick={onClose}
        >
          <PlatformEmoji emoji={PLATFORM_EMOJI.close} size={24} className="h-6 w-6" />
        </button>
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            disabled={!canGoPrev}
            className={cn("pd-v1__lightbox-nav pd-v1__lightbox-nav--prev", focusRing)}
            onClick={() => scrollLightboxTo(activeIndex - 1)}
          >
            <PlatformEmoji emoji={PLATFORM_EMOJI.back} size={24} className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            disabled={!canGoNext}
            className={cn("pd-v1__lightbox-nav pd-v1__lightbox-nav--next", focusRing)}
            onClick={() => scrollLightboxTo(activeIndex + 1)}
          >
            <PlatformEmoji emoji={PLATFORM_EMOJI.continue} size={24} className="h-6 w-6" />
          </button>
        </>
      ) : null}

      <div
        ref={lightboxScrollerRef}
        onScroll={handleLightboxScroll}
        className="pd-v1__lightbox-scroller"
        aria-label={`${title} fullscreen image`}
      >
        {images.map((image, index) => (
          <div key={`fullscreen-${image}-${index}`} className="pd-v1__lightbox-panel">
            <PinchZoomSlide
              image={image}
              alt={`${title} — photo ${index + 1}`}
              priority={index === activeIndex || Math.abs(index - activeIndex) === 1}
              isActive={index === activeIndex}
            />
          </div>
        ))}
      </div>
    </ModalContainer>
  );
});
