import type { IconStandardRule } from "@/lib/design-studio-v1/types";

/** Global Icon Standard v1.0 — mandatory platform rules. */
export const ICON_STANDARD_RULES: IconStandardRule[] = [
  {
    id: "no-backgrounds",
    title: "Remove Icon Backgrounds",
    description:
      "No decorative icon backgrounds, containers, squares, circles, or rounded boxes. Icons appear clean.",
    enforced: true,
  },
  {
    id: "no-borders",
    title: "Remove Icon Borders",
    description:
      "No borders, outline containers, or decorative frames on icons. Functional UI borders only.",
    enforced: true,
  },
  {
    id: "vector-first",
    title: "Vector First",
    description: "Premium, clean, modern, minimal, high-resolution SVG icons with consistent stroke and lighting.",
    enforced: true,
  },
  {
    id: "single-registry",
    title: "Single Asset Registry",
    description: "All icons resolve through RovexoIcons and the Design Studio Asset Library. No local overrides.",
    enforced: true,
  },
  {
    id: "auto-replacement",
    title: "Automatic Replacement",
    description: "Broken, missing, or legacy icons are replaced with official assets from the Asset Library.",
    enforced: true,
  },
];

export const LEGACY_ICON_IMPORTS = [
  "Fluency3DIcon",
  "CategoryIcon3D",
  "HomeCategoryIcon3D",
] as const;

export const DECORATIVE_ICON_CSS_SELECTORS = [
  ".rx-category-tile__container",
  ".seller-icon-slot",
] as const;
