"use client";

import { memo } from "react";
import { RovexoShowcaseSection } from "@/components/home/RovexoShowcaseSection";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";

type RovexoShowcaseRailsProps = {
  sections: ShowcaseSellerSection[];
};

export const RovexoShowcaseRails = memo(function RovexoShowcaseRails({
  sections,
}: RovexoShowcaseRailsProps) {
  if (sections.length === 0) return null;

  return (
    <div className="rx-showcase-v2-stack" aria-label="Showcase sellers">
      {sections.map((section) => (
        <RovexoShowcaseSection key={section.sellerId} section={section} />
      ))}
    </div>
  );
});
