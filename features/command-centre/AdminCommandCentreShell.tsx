"use client";

import type { ReactNode } from "react";
import { CommandCentreLayout } from "@/features/command-centre/CommandCentreLayout";
import { ADMIN_COMMAND_CENTRE_NAV } from "@/lib/command-centre/admin-command-centre-nav-v1";

type AdminCommandCentreShellProps = {
  children: ReactNode;
};

/** Admin Command Centre — same shell as Super Admin; admin-only modules. */
export function AdminCommandCentreShell({ children }: AdminCommandCentreShellProps) {
  return (
    <CommandCentreLayout variant="admin" navItems={ADMIN_COMMAND_CENTRE_NAV}>
      {children}
    </CommandCentreLayout>
  );
}
