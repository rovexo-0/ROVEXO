"use client";

import { SafeImage, isRenderableImageSrc } from "@/components/ui/SafeImage";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type ProductGalleryV1Props = {
  images: string[];
  title: string;
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
}: {
  image: string;
  alt: string;
  priority?: boolean;
}) {
  const [transform, setTransform] = useState<PinchTransform>({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    lastPan: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    panning: false,
  });

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
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
  }, [transform.scale, transform.x, transform.y]);

  const onTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
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
  }, [transform.scale]);

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
          quality={92}
          className="object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

export function ProductGalleryV1({ images: rawImages, title }: ProductGalleryV1Props) {
  const images = useMemo(() => rawImages.filter(isRenderableImageSrc), [rawImages]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxScrollerRef = useRef<HTMLDivElement>(null);

  const selectImage = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

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
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
        return;
      }
      if (event.key === "ArrowRight") scrollLightboxTo(activeIndex + 1);
      if (event.key === "ArrowLeft") scrollLightboxTo(activeIndex - 1);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, lightboxOpen, scrollLightboxTo]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const node = lightboxScrollerRef.current;
    if (!node) return;
    node.scrollTo({ left: activeIndex * node.clientWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  if (images.length === 0) {
    return (
      <section className="pd-v1__gallery" aria-label={`${title} gallery`}>
        <div className="pd-v1__gallery-main flex items-center justify-center">
          <p className="text-sm text-text-secondary">No images available</p>
        </div>
      </section>
    );
  }

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  return (
    <>
      <section className="pd-v1__gallery" aria-label={`${title} gallery`}>
        <button
          type="button"
          className="pd-v1__gallery-main"
          aria-label={`Open ${title} fullscreen gallery`}
          onClick={() => openLightbox(activeIndex)}
        >
          {images.map((image, index) => (
            <SafeImage
              key={`${image}-${index}`}
              src={image}
              alt={`${title} — photo ${index + 1}`}
              fill
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              sizes="100vw"
              className={cn(
                "pd-v1__gallery-image object-cover",
                index === activeIndex && "pd-v1__gallery-image--active",
              )}
              draggable={false}
            />
          ))}
          <span className="pd-v1__gallery-counter" aria-live="polite">
            {activeIndex + 1} / {images.length}
          </span>
        </button>

        {images.length > 1 ? (
          <div className="pd-v1__thumbs" role="tablist" aria-label="Product thumbnails">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show photo ${index + 1}`}
                className="pd-v1__thumb"
                data-active={index === activeIndex ? "true" : "false"}
                onClick={() => selectImage(index)}
              >
                <SafeImage src={image} alt="" fill loading="lazy" sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <ModalContainer
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
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
              onClick={() => setLightboxOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
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
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next photo"
                disabled={!canGoNext}
                className={cn("pd-v1__lightbox-nav pd-v1__lightbox-nav--next", focusRing)}
                onClick={() => scrollLightboxTo(activeIndex + 1)}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
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
                  key={`${image}-${index}-${index === activeIndex}`}
                  image={image}
                  alt={`${title} — photo ${index + 1}`}
                  priority={index === activeIndex}
                />
              </div>
            ))}
          </div>
      </ModalContainer>
    </>
  );
}
