"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { VIEW_ITEM_PRESENTATION_TOKENS_V1 } from "@/lib/product-detail/view-item-presentation-tokens-v1";

type ProductDescriptionV1Props = {
  description: string;
};

/**
 * Vinted-style description — title 16/600 · body 15/400 LH 24.
 * Auto-expands; Read more only when body exceeds ~12 lines.
 */
export function ProductDescriptionV1({ description }: ProductDescriptionV1Props) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const clampLines = VIEW_ITEM_PRESENTATION_TOKENS_V1.descriptionClampLines;

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * clampLines;
    const overflows = el.scrollHeight > maxHeight + 1;
    setNeedsToggle(overflows);
    setExpanded(!overflows);
  }, [description, clampLines]);

  const text = description.trim();
  if (!text) return null;

  return (
    <section className="pd-v1__description-block" aria-labelledby="pd-description-title" data-description-vinted>
      <h2 id="pd-description-title" className="pd-v1__description-title">
        Description
      </h2>
      <p
        ref={bodyRef}
        className={`pd-v1__description ${needsToggle && !expanded ? "pd-v1__description--clamp" : ""}`}
        style={
          needsToggle && !expanded
            ? ({ WebkitLineClamp: clampLines } as CSSProperties)
            : undefined
        }
      >
        {text}
      </p>
      {needsToggle ? (
        <button
          type="button"
          className="pd-v1__description-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </section>
  );
}
