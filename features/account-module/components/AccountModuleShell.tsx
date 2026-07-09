import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { AccountModuleBackHeader } from "@/features/account-module/components/AccountModuleBackHeader";

type AccountModuleShellProps = {
  title: string;
  backHref?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
  version?: string;
};

export function AccountModuleShell({
  title,
  backHref,
  rightAction,
  children,
  className,
  version = "v1.0",
}: AccountModuleShellProps) {
  return (
    <BetaAppShell bottomNavTab="account" className={className ?? "acm-shell"}>
      <div className="acm" data-account-module-version={version}>
        <AccountModuleBackHeader title={title} backHref={backHref} rightAction={rightAction} />
        <ScrollContainer withBottomNav className="acm__scroll">
          {children}
        </ScrollContainer>
      </div>
    </BetaAppShell>
  );
}
