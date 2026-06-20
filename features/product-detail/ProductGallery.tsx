"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ProductGalleryProps = {
  images: string[];
  title: string;
  className?: string;
};

export function ProductGallery({ images, title, className }: ProductGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const node = scrollerRef.current;
    if (!node || node.clientWidth === 0) return;
    const index = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  }, [images.length]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-b-ds-xl bg-surface-muted", className)}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        aria-label={`${title} image gallery`}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden bg-surface-muted"
          >
            <Image
              src={image}
              alt={`${title} — photo ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none absolute bottom-ds-4 left-ds-4 rounded-ds-full bg-overlay px-ds-3 py-ds-1 text-xs font-semibold text-text-primary shadow-ds-soft backdrop-blur-md backdrop-saturate-150"
      >
        {activeIndex + 1} / {images.length}
      </div>
    </div>
  );
}
