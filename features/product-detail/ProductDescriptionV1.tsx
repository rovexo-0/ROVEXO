"use client";

import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { stripListingAttributeNotesFromDescriptionV1 } from "@/lib/product-detail/parse-listing-attribute-notes-v1";
import { VIEW_ITEM_PRESENTATION_TOKENS_V1 } from "@/lib/product-detail/view-item-presentation-tokens-v1";

type ProductDescriptionV1Props = {
  description: string;
};

/**
 * View Item v2.0 description — title 16/700 · body 15/400 LH 24.
 * Clamp ~3 lines for mockup Read more + chevron (when body overflows).
 * memo: parent qty/offer/sheet updates must not re-run description layout measure.
 */
export const ProductDescriptionV1 = memo(function ProductDescriptionV1({
  description,
}: ProductDescriptionV1Props) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [expanded, setExpanded] = useState(true);
  /* Mockup: Read more after ~3 lines (token default is presentation SSOT; v2 clamp is visual). */
  const clampLines = Math.min(3, VIEW_ITEM_PRESENTATION_TOKENS_V1.descriptionClampLines);
  const text = stripListingAttributeNotesFromDescriptionV1(description);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || !text) return;
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * clampLines;
    const overflows = el.scrollHeight > maxHeight + 1;
    setNeedsToggle(overflows);
    setExpanded(!overflows);
  }, [text, clampLines]);

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
          <span>{expanded ? "Show less" : "Read more"}</span>
          <svg
            className="pd-v1__description-chevron"
            data-expanded={expanded ? "true" : "false"}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </section>
  );
});
