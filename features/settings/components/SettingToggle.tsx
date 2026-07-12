"use client";

import { CanonicalSwitch } from "@/src/components/canonical";

type SettingToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function SettingToggle(props: SettingToggleProps) {
  return <CanonicalSwitch {...props} />;
}
