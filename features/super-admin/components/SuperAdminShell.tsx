"use client";

import type { ReactNode } from "react";
import { CommandCentreLayout } from "@/features/command-centre/CommandCentreLayout";
import { COMMAND_CENTER_SIDEBAR_NAV } from "@/lib/super-admin/nav";

type SuperAdminShellProps = {
  children: ReactNode;
};

/**
 * Thin role wrapper — UI chrome lives in shared CommandCentreLayout (White Theme RC1).
 */
export function SuperAdminShell({ children }: SuperAdminShellProps) {
  return (
    <CommandCentreLayout
      variant="super_admin"
      navItems={COMMAND_CENTER_SIDEBAR_NAV}
      enableSuperAdminTools
    >
      {children}
    </CommandCentreLayout>
  );
}

export { SuperAdminPageHeader } from "@/features/command-centre/SuperAdminPageHeader";
