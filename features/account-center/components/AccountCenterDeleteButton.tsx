"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/features/settings/components/ConfirmDialog";
import { focusRing } from "@/components/ui/tokens";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/cn";

export function AccountCenterDeleteButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn("account-center-delete", focusRing)}
        onClick={() => setOpen(true)}
      >
        {t("account.deleteAccount")}
      </button>

      <ConfirmDialog
        open={open}
        title={t("account.deleteAccount")}
        description="Account deletion is not available in v1.0. Contact support if you need help closing your account."
        confirmLabel="Contact support"
        cancelLabel="Cancel"
        onConfirm={() => {
          setOpen(false);
          window.location.href = "/support";
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
