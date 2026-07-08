"use client";

import { useState } from "react";

type ProductDescriptionV1Props = {
  description: string;
};

export function ProductDescriptionV1({ description }: ProductDescriptionV1Props) {
  const [expanded, setExpanded] = useState(description.length < 280);

  return (
    <section aria-labelledby="pd-description-title">
      <h2 id="pd-description-title" className="pd-v1__section-title">
        Description
      </h2>
      <p className={`pd-v1__description ${expanded ? "" : "line-clamp-4"}`}>{description}</p>
      {description.length > 280 ? (
        <button
          type="button"
          className="pd-v1__description-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </section>
  );
}
