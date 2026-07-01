"use client";

import { PageBack } from "@/components/navigation/PageBack";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type AccountCenterBackButtonProps = {
  backHref: string;
  backLabel: string;
};

export function AccountCenterBackButton({ backHref, backLabel }: AccountCenterBackButtonProps) {
  return (
    <PageBack
      backHref={backHref}
      backLabel={backLabel}
      preferHistory
      className={cn("account-center-header__back-btn", focusRing)}
    />
  );
}
