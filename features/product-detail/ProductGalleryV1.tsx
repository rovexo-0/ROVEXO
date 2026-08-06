"use client";

import { SafeImage, isRenderableImageSrc } from "@/components/ui/SafeImage";
import { ProductFullscreenImageViewer } from "@/features/product-detail/ProductFullscreenImageViewer";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProductGalleryV1Props = {
  images: string[];
  title: string;
  /** Percent off when originalPrice > price (e.g. 12 → "-12%"). */
  discountPercent?: number | null;
};

export const ProductGalleryV1 = memo(function ProductGalleryV1({
  images: rawImages,
  title,
  discountPercent = null,
}: ProductGalleryV1Props) {
  const images = useMemo(() => rawImages.filter(isRenderableImageSrc), [rawImages]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainScrollerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const selectImage = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  const scrollMainTo = useCallback(
    (index: number) => {
      const node = mainScrollerRef.current;
      if (!node) return;
      const clamped = Math.min(Math.max(index, 0), images.length - 1);
      node.scrollTo({ left: clamped * node.clientWidth, behavior: "smooth" });
      setActiveIndex(clamped);
    },
    [images.length],
  );

  const handleMainScroll = useCallback(() => {
    const node = mainScrollerRef.current;
    if (!node || node.clientWidth === 0) return;
    const index = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const node = mainScrollerRef.current;
    if (!node || lightboxOpen) return;
    if (Math.round(node.scrollLeft / Math.max(node.clientWidth, 1)) !== activeIndex) {
      node.scrollTo({ left: activeIndex * node.clientWidth });
    }
  }, [activeIndex, lightboxOpen]);

  if (images.length === 0) {
    return (
      <section className="pd-v1__gallery" aria-label={`${title} gallery`}>
        <div className="pd-v1__gallery-main flex items-center justify-center">
          <p className="text-sm text-text-secondary">No images available</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="pd-v1__gallery" aria-label={`${title} gallery`}>
        <div className="pd-v1__gallery-frame">
          <div
            ref={mainScrollerRef}
            className="pd-v1__gallery-scroller"
            onScroll={handleMainScroll}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              const end = event.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (start == null || end == null || images.length < 2) return;
              const delta = end - start;
              if (Math.abs(delta) < 40) return;
              if (delta < 0) scrollMainTo(activeIndex + 1);
              else scrollMainTo(activeIndex - 1);
            }}
            aria-label={`${title} photos`}
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className="pd-v1__gallery-slide"
                aria-label={`Open ${title} photo ${index + 1} fullscreen`}
                onClick={() => openLightbox(index)}
              >
                <SafeImage
                  src={image}
                  alt={`${title} — photo ${index + 1}`}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  sizes="100vw"
                  quality={90}
                  className="pd-v1__gallery-image object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
          <span className="pd-v1__gallery-counter" aria-live="polite">
            {activeIndex + 1}/{images.length}
          </span>
          {discountPercent != null && discountPercent > 0 ? (
            <span className="pd-v1__gallery-discount" aria-label={`${discountPercent} percent off`}>
              -{discountPercent}%
            </span>
          ) : null}
        </div>

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
                onClick={() => {
                  selectImage(index);
                  scrollMainTo(index);
                }}
              >
                <SafeImage src={image} alt="" fill loading="lazy" sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <ProductFullscreenImageViewer
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        title={title}
        initialIndex={activeIndex}
      />
    </>
  );
});
