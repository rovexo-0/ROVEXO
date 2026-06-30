"use client";

import Link from "next/link";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { getEngineTabs } from "@/lib/omega-command-center/engines";
import { OMEGA_ENGINE_ROUTES } from "@/lib/omega-command-center/registry";
import type { OmegaEngineId, OmegaEngineSnapshot } from "@/lib/omega-command-center/types";

type OmegaEngineAdminProps = {
  engine: OmegaEngineId;
  engineLabel: string;
  engineIcon: string;
  initialSnapshot: OmegaEngineSnapshot;
};

export function OmegaEngineAdmin({ engine, engineLabel, engineIcon, initialSnapshot }: OmegaEngineAdminProps) {
  const tabs = getEngineTabs(engine);
  const activeTab = initialSnapshot.tab;
  const routeTabs = tabs.map((tab) => ({
    id: tab,
    label: tab.replace(/-/g, " "),
    href: `/super-admin/ai/${engine}?tab=${tab}`,
  }));

  return (
    <EnterpriseAdminShell
      moduleId={`omega-engine-${engine}`}
      eyebrow="OMEGA AI Engine"
      title={`${engineIcon} ${engineLabel}`}
      description="Orchestrated by OMEGA — all requests flow through the unified command center."
      enterpriseScore={initialSnapshot.score}
      routeTabs={routeTabs}
      activeTab={activeTab}
      aiInsight="OMEGA PRIME: AI Engine is enterprise certified and production ready."
      quickLinks={[
        { label: "← OMEGA Command Center", href: "/super-admin/omega" },
        ...OMEGA_ENGINE_ROUTES.filter((e) => e.id !== engine).map((e) => ({
          label: `${e.icon} ${e.label}`,
          href: e.href,
        })),
      ]}
    >
      <section className="ea-panel">
        <h3>{activeTab.replace(/-/g, " ")}</h3>
        <table className="ea-table">
          <thead><tr><th>Item</th><th>Value</th><th>Status</th></tr></thead>
          <tbody>
            {initialSnapshot.items.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>{item.value}</td>
                <td>{item.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </EnterpriseAdminShell>
  );
}
