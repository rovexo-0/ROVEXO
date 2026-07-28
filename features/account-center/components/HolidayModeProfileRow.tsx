"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n/use-translation";
import { CanonicalSwitch } from "@/src/components/canonical";
import { ProfileMenuIcon } from "@/features/account-center/components/ProfileMenuIcons";

type HolidayModeProfileRowProps = {
  initialEnabled: boolean;
};

/**
 * Profile → Holiday Mode inline toggle (v1.0).
 * One click · auto-save · no subpage · no confirmation.
 * Uses Canonical Switch v1.0 (LOCKED) — no parallel switch design.
 * Icon: Profile Icon System v1.0 (palm tree · #22C55E · 24px).
 */
export function HolidayModeProfileRow({ initialEnabled }: HolidayModeProfileRowProps) {
  const { tx } = useTranslation();
  const [enabled, setEnabled] = useState(initialEnabled === true);
  const [isPending, startTransition] = useTransition();

  function persist(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vacationMode: next }),
        });
        if (!response.ok) {
          setEnabled(previous);
          return;
        }
        const payload = (await response.json()) as { settings?: { vacationMode?: boolean } };
        // Fail-closed: only explicit true is ON
        setEnabled(payload.settings?.vacationMode === true);
      } catch {
        setEnabled(previous);
      }
    });
  }

  return (
    <label
      htmlFor="ac-canonical-holiday-mode-switch"
      className={cn(
        "cds-menu-row ac-holiday-mode-row",
        isPending && "ac-holiday-mode-row--pending",
      )}
      data-holiday-mode={enabled ? "on" : "off"}
      data-holiday-mode-ui="v1.0-inline"
    >
      <span className="cds-menu-row__icon" aria-hidden>
        <ProfileMenuIcon id="holiday-mode" />
      </span>
      <span className="cds-menu-row__copy">
        <span className="cds-menu-row__title">
          <span className="truncate">{tx("Holiday Mode")}</span>
        </span>
      </span>
      <span className="cds-menu-row__trailing-group">
        <CanonicalSwitch
          id="ac-canonical-holiday-mode-switch"
          label={tx("Holiday Mode")}
          checked={enabled}
          disabled={isPending}
          onChange={persist}
          controlOnly
        />
      </span>
    </label>
  );
}
