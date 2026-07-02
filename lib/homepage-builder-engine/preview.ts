import type { HomepagePreviewMode, HomepageSection } from "@/lib/homepage-builder-engine/types";
import { filterVisibleSections } from "@/lib/homepage-builder-engine/sections";

export function resolvePreviewDevice(mode: HomepagePreviewMode): "desktop" | "tablet" | "mobile" {
  if (mode === "phone" || mode === "portrait") return "mobile";
  if (mode === "tablet") return "tablet";
  return "desktop";
}

export function buildPreviewSections(sections: HomepageSection[], mode: HomepagePreviewMode): HomepageSection[] {
  const device = resolvePreviewDevice(mode);
  const visible = filterVisibleSections(sections, device);
  return [...visible].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.order - b.order;
  });
}

export function previewDimensions(mode: HomepagePreviewMode): { width: number; height: number } {
  switch (mode) {
    case "phone":
    case "portrait":
      return { width: 390, height: 844 };
    case "tablet":
      return { width: 768, height: 1024 };
    case "laptop":
      return { width: 1280, height: 800 };
    case "landscape":
      return { width: 844, height: 390 };
    default:
      return { width: 1440, height: 900 };
  }
}

export function isDarkPreviewMode(mode: HomepagePreviewMode): boolean {
  return mode === "dark";
}

export function buildPreviewUrl(basePath: string, mode: HomepagePreviewMode): string {
  return `${basePath}?preview=${mode}`;
}
