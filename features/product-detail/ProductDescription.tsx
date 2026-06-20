"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ProductDescriptionProps = {
  description: string;
};

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="description-heading">
      <h2 id="description-heading" className="mb-ds-3 text-base font-semibold text-text-primary">
        Description
      </h2>

      <p className={cn("text-sm leading-relaxed text-text-secondary", !expanded && "line-clamp-4")}>
        {description}
      </p>

      <Button
        variant="ghost"
        size="sm"
        className="mt-ds-2 h-auto px-0 py-ds-1 text-sm font-semibold text-primary hover:bg-transparent"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        {expanded ? "Show Less" : "Show More"}
      </Button>
    </section>
  );
}
