"use client";

import Link from "next/link";
import { focusRing } from "@/components/ui/tokens";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/cn";

export function AccountCenterDeleteButton() {
  const { t } = useTranslation();

  return (
    <Link href="/account/settings" className={cn("account-center-delete", focusRing)}>
      {t("account.deleteAccount")}
    </Link>
  );
}
