"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CanonicalSwitch } from "@/src/components/canonical";
import { ProfileMenuIcon } from "@/features/account-center/components/ProfileMenuIcons";
import {
  HOLIDAY_MODE_DISABLE_CONFIRM,
  HOLIDAY_MODE_ENABLE_CONFIRM,
} from "@/lib/listings/holiday-mode-visibility-v1";

type HolidayModeProfileRowProps = {
  initialEnabled: boolean;
};

type ConfirmKind = "enable" | "disable" | null;

/**
 * Profile → Holiday Mode inline toggle (v1.0).
 * Confirm before persist · seller toast only · no buyer notifications.
 * Uses Canonical Switch v1.0 (LOCKED) — no parallel switch design.
 * Icon: Profile Icon System v1.0 (palm tree · #22C55E · 24px).
 */
export function HolidayModeProfileRow({ initialEnabled }: HolidayModeProfileRowProps) {
  const { tx } = useTranslation();
  const { pushToast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled === true);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [isPending, startTransition] = useTransition();

  function requestToggle(next: boolean) {
    if (isPending) return;
    setConfirmKind(next ? "enable" : "disable");
  }

  function persist(next: boolean) {
    const previous = enabled;
    setConfirmKind(null);
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
          pushToast({
            title: "Unable to update Holiday Mode.",
            variant: "error",
          });
          return;
        }
        const payload = (await response.json()) as { settings?: { vacationMode?: boolean } };
        // Fail-closed: only explicit true is ON
        const confirmed = payload.settings?.vacationMode === true;
        setEnabled(confirmed);
        pushToast({
          title: confirmed ? "Holiday Mode enabled." : "Holiday Mode disabled.",
          variant: "success",
        });
      } catch {
        setEnabled(previous);
        pushToast({
          title: "Unable to update Holiday Mode.",
          variant: "error",
        });
      }
    });
  }

  const confirmCopy =
    confirmKind === "enable" ? HOLIDAY_MODE_ENABLE_CONFIRM : HOLIDAY_MODE_DISABLE_CONFIRM;

  return (
    <>
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
            onChange={requestToggle}
            controlOnly
          />
        </span>
      </label>

      <Dialog
        open={confirmKind != null}
        onClose={() => setConfirmKind(null)}
        title={confirmCopy.title}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmKind(null)}>
              {confirmCopy.cancel}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isPending}
              onClick={() => persist(confirmKind === "enable")}
            >
              {confirmCopy.confirm}
            </Button>
          </>
        }
      >
        <p>{confirmCopy.body}</p>
      </Dialog>
    </>
  );
}
