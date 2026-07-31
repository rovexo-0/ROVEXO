"use client";

import type { ReactNode } from "react";
import { CanonicalMenuRow, CanonicalSwitch } from "@/src/components/canonical";
import { SettingsMenuIconGlyph } from "@/features/account-module/components/SettingsMenuIcon";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";
import type { SettingsIconTone } from "@/lib/settings/settings-v1";
import { cn } from "@/lib/cn";

type PreferenceToggleRowProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  locked?: boolean;
  saving?: boolean;
  icon: SettingsMenuIcon;
  tone: SettingsIconTone;
  onChange: (checked: boolean) => void;
};

/**
 * Full-width Settings preference row — icon family + Canonical Switch.
 * Uses a non-button row shell so the switch is the only interactive control.
 */
export function PreferenceToggleRow({
  id,
  label,
  description,
  checked,
  disabled = false,
  locked = false,
  saving = false,
  icon,
  tone,
  onChange,
}: PreferenceToggleRowProps) {
  const isLocked = locked === true;
  const isDisabled = disabled || isLocked || saving;

  return (
    <div
      className={cn("cds-menu-row", isDisabled && "cds-menu-row--disabled")}
      data-preference-toggle-row="v1.0"
      data-locked={isLocked ? "true" : "false"}
    >
      <SettingsMenuIconGlyph name={icon} tone={tone} />
      <span className="cds-menu-row__copy">
        <span className="cds-menu-row__title">
          <span className="truncate">{label}</span>
        </span>
        {description ? <span className="cds-menu-row__subtitle">{description}</span> : null}
      </span>
      <span className="cds-menu-row__trailing-group">
        <span className="cds-menu-row__trailing">
          <CanonicalSwitch
            id={`${id}-switch`}
            label={label}
            checked={isLocked ? true : checked}
            disabled={isDisabled}
            controlOnly
            onChange={(next) => {
              if (isLocked || saving) return;
              onChange(next);
            }}
          />
        </span>
      </span>
    </div>
  );
}

export function PreferenceActionRow({
  title,
  description,
  href,
  icon,
  tone,
  destructive,
}: {
  title: string;
  description?: string;
  href: string;
  icon: SettingsMenuIcon;
  tone: SettingsIconTone;
  destructive?: boolean;
}): ReactNode {
  return (
    <CanonicalMenuRow
      title={title}
      description={description}
      href={href}
      icon={<SettingsMenuIconGlyph name={icon} tone={tone} danger={destructive} />}
      destructive={destructive}
    />
  );
}
