import { designTokens } from "@/components/ui/tokens";
import type { DesignSystemTokenGroup } from "@/lib/design-studio-v1/types";

function flattenTokens(
  group: Record<string, string>,
  prefix: string,
): Array<{ name: string; value: string }> {
  return Object.entries(group).map(([key, value]) => ({
    name: prefix ? `${prefix}-${key}` : key,
    value,
  }));
}

/** Programmatic design system summary for Design Studio dashboard. */
export function buildDesignSystemSummary(): DesignSystemTokenGroup[] {
  return [
    { id: "colors", label: "Global Colors", tokens: flattenTokens(designTokens.color, "color") },
    { id: "typography", label: "Typography", tokens: flattenTokens(designTokens.typography, "type") },
    { id: "spacing", label: "Spacing", tokens: flattenTokens(designTokens.space, "space") },
    { id: "radius", label: "Border Radius", tokens: flattenTokens(designTokens.radius, "radius") },
    { id: "shadows", label: "Shadow Presets", tokens: flattenTokens(designTokens.shadow, "shadow") },
    { id: "motion", label: "Animation Duration", tokens: flattenTokens(designTokens.duration, "duration") },
  ];
}
