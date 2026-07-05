import { ICON_STANDARD_RULES } from "@/lib/design-studio-v1/icon-standard";
import type { BrandDnaRule } from "@/lib/design-studio-v1/types";

const DNA_RULES: BrandDnaRule[] = [
  {
    id: "logo-rules",
    category: "Logo",
    title: "Logo Usage",
    rule: "All logos must originate from Brand Center. No local logo overrides.",
    enforced: true,
  },
  {
    id: "typography-rules",
    category: "Typography",
    title: "Typography Scale",
    rule: "Use design token typography classes only — display, heading, title, body, caption.",
    enforced: true,
  },
  {
    id: "spacing-rules",
    category: "Spacing",
    title: "Spacing Grid",
    rule: "All spacing must use --ds-space-* tokens. No arbitrary pixel values in components.",
    enforced: true,
  },
  {
    id: "radius-rules",
    category: "Radius",
    title: "Border Radius",
    rule: "Use --ds-radius-* tokens. Icons must have zero decorative radius.",
    enforced: true,
  },
  {
    id: "elevation-rules",
    category: "Elevation",
    title: "Elevation & Depth",
    rule: "Shadows use --ds-shadow-* presets. No decorative icon elevation.",
    enforced: true,
  },
  {
    id: "icon-rules",
    category: "Icons",
    title: "Icon Standard",
    rule: ICON_STANDARD_RULES.map((r) => r.title).join(". "),
    enforced: true,
  },
  {
    id: "illustration-rules",
    category: "Illustration",
    title: "Illustration Style",
    rule: "Premium, clean, vector-first illustrations from Asset Library only.",
    enforced: true,
  },
  {
    id: "animation-rules",
    category: "Animation",
    title: "Motion Timing",
    rule: "Use --ds-duration-* tokens. Respect prefers-reduced-motion.",
    enforced: true,
  },
  {
    id: "button-rules",
    category: "Buttons",
    title: "Button Tokens",
    rule: "Buttons use official component library variants — no custom one-off styles.",
    enforced: true,
  },
  {
    id: "card-rules",
    category: "Cards",
    title: "Card Tokens",
    rule: "Listing cards follow homepage grid lock — 173×300, official gaps.",
    enforced: true,
  },
  {
    id: "shadow-rules",
    category: "Shadows",
    title: "Shadow Presets",
    rule: "Only --ds-shadow-soft, medium, floating, premium. No icon shadows.",
    enforced: true,
  },
  {
    id: "color-rules",
    category: "Colors",
    title: "Global Colors",
    rule: "All colors resolve through --ds-color-* tokens. No hardcoded hex in components.",
    enforced: true,
  },
  {
    id: "dark-theme-rules",
    category: "Dark Theme",
    title: "Dark Mode",
    rule: "Assets and tokens must pass dark mode compatibility validation.",
    enforced: true,
  },
  {
    id: "light-theme-rules",
    category: "Light Theme",
    title: "Light Mode",
    rule: "Default theme uses light surface tokens. Icons remain transparent.",
    enforced: true,
  },
  {
    id: "accessibility-rules",
    category: "Accessibility",
    title: "Accessibility",
    rule: "WCAG AA contrast, focus rings, alt text for meaningful icons, aria-hidden for decorative.",
    enforced: true,
  },
];

export function getBrandDnaRules(): BrandDnaRule[] {
  return DNA_RULES;
}

export function validateAgainstBrandDna(violationIds: string[]): {
  pass: boolean;
  violatedRules: BrandDnaRule[];
  score: number;
} {
  const violatedRules = DNA_RULES.filter((rule) => violationIds.includes(rule.id));
  const score = Math.round(((DNA_RULES.length - violatedRules.length) / DNA_RULES.length) * 100);
  return { pass: violatedRules.length === 0, violatedRules, score };
}
