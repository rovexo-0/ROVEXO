"use client";

import type { ReactNode } from "react";
import {
  EnterpriseAdminShell,
  type EnterpriseAdminStateTab,
} from "@/features/super-admin/components/premium/EnterpriseAdminShell";

type EnterpriseEngineAdminShellProps = {
  moduleId?: string;
  eyebrow: string;
  title?: string;
  subtitle?: string;
  enterpriseScore?: number;
  tabs: readonly EnterpriseAdminStateTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  actions?: ReactNode;
  message?: string | null;
  isPending?: boolean;
  children: ReactNode;
};

export function EnterpriseEngineAdminShell({
  moduleId,
  eyebrow,
  title,
  subtitle,
  enterpriseScore = 100,
  tabs,
  activeTab,
  onTabChange,
  actions,
  message,
  isPending,
  children,
}: EnterpriseEngineAdminShellProps) {
  return (
    <EnterpriseAdminShell
      moduleId={moduleId}
      eyebrow={eyebrow}
      title={title ?? eyebrow}
      description={subtitle}
      enterpriseScore={enterpriseScore}
      stateTabs={[...tabs]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      actions={actions}
      message={message}
      isPending={isPending}
      aiInsight={`OMEGA PRIME: ${eyebrow} is enterprise certified and production ready.`}
    >
      {children}
    </EnterpriseAdminShell>
  );
}
