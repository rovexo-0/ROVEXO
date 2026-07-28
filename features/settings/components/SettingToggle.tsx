"use client";

import { CanonicalSwitch, type CanonicalSwitchProps } from "@/src/components/canonical";

/**
 * Settings alias → Canonical Switch Engine v1.0 (LOCKED).
 * Never implement a parallel toggle here.
 */
export function SettingToggle(props: CanonicalSwitchProps) {
  return <CanonicalSwitch {...props} />;
}
