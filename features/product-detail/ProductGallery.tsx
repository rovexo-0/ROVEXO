"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type ProductGalleryProps = {
  images: string[];
  title: string;
  className?: string;
};

export function ProductGallery({ images, title, className }: ProductGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goToIndex = useCallback((index: number) => {
    const clamped = Math.min(Math.max(index, 0), images.length - 1);
    setActiveIndex(clamped);
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTo({ left: clamped * node.clientWidth, behavior: "smooth" });
  }, [images.length]);

  const handleScroll = useCallback(() => {
    const node = scrollerRef.current;
    if (!node || node.clientWidth === 0) return;
    const index = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowRight") setActiveIndex((current) => Math.min(current + 1, images.length - 1));
      if (event.key === "ArrowLeft") setActiveIndex((current) => Math.max(current - 1, 0));
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [images.length, lightboxOpen]);

  if (images.length === 0) {
    return (
      <div className={cn("flex h-full items-center justify-center bg-surface-muted", className)}>
        <p className="text-sm text-text-secondary">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("relative flex h-full w-full flex-col bg-surface-muted", className)}>
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          aria-label={`${title} image gallery`}
          className="relative flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`View ${title} photo ${index + 1} fullscreen`}
              onClick={() => {
                setActiveIndex(index);
                setLightboxOpen(true);
              }}
              className={cn(
                "relative h-full w-full shrink-0 snap-center snap-always overflow-hidden bg-surface-muted",
                focusRing,
              )}
            >
              <Image
                src={image}
                alt={`${title} — photo ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover transition-transform duration-200 hover:scale-[1.02]"
                draggable={false}
              />
            </button>
          ))}
        </div>

        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-ds-4 left-ds-4 rounded-ds-full bg-overlay px-ds-3 py-ds-1 text-xs font-semibold text-text-primary shadow-ds-soft backdrop-blur-md backdrop-saturate-150"
        >
          {activeIndex + 1} / {images.length}
        </div>

        {images.length > 1 && (
          <div className="flex gap-ds-2 overflow-x-auto border-t border-border/60 bg-surface/90 px-ds-3 py-ds-2 backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => (
              <button
                key={`thumb-${image}-${index}`}
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goToIndex(index)}
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md border-2 bg-surface-muted",
                  index === activeIndex ? "border-primary" : "border-transparent opacity-70",
                  focusRing,
                  transitionFast,
                )}
              >
                <Image src={image} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[250] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} fullscreen gallery`}
        >
          <div className="flex items-center justify-between px-ds-4 py-ds-3 pt-[max(env(safe-area-inset-top),12px)]">
            <p className="text-sm font-medium text-white">
              {activeIndex + 1} / {images.length}
            </p>
            <button
              type="button"
              aria-label="Close gallery"
              onClick={() => setLightboxOpen(false)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-ds-full text-white hover:bg-white/10",
                focusRing,
              )}
            >
              ×
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-ds-2">
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Previous photo"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
                className="absolute left-ds-2 z-10 flex h-10 w-10 items-center justify-center rounded-ds-full bg-white/10 text-white disabled:opacity-30"
              >
                ‹
              </button>
            )}

            <div className="relative h-full w-full max-w-3xl">
              <Image
                src={images[activeIndex] ?? images[0]}
                alt={`${title} — photo ${activeIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                aria-label="Next photo"
                disabled={activeIndex === images.length - 1}
                onClick={() => setActiveIndex((current) => Math.min(current + 1, images.length - 1))}
                className="absolute right-ds-2 z-10 flex h-10 w-10 items-center justify-center rounded-ds-full bg-white/10 text-white disabled:opacity-30"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
