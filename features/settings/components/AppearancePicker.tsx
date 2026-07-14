"use client";

import { CanonicalRadioGroup } from "@/src/components/canonical";
import type { AppearanceMode } from "@/lib/settings/types";

const OPTIONS = [
  { value: "light" as const, label: "Light", description: "Light background with purple accent" },
  { value: "dark" as const, label: "Dark", description: "Dark background with purple accent" },
  {
    value: "system" as const,
    label: "System",
    description: "Follow iOS / Android system preference",
  },
];

type AppearancePickerProps = {
  value: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
};

export function AppearancePicker({ value, onChange }: AppearancePickerProps) {
  return (
    <CanonicalRadioGroup
      name="appearance"
      legend="Appearance"
      value={value}
      options={OPTIONS}
      layout="cards"
      onChange={onChange}
    />
  );
}
