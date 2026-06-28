"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
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

  return (
    <div className="omega-engine-admin">
      <header className="omega-engine-admin__header">
        <div>
          <p className="omega-engine-admin__eyebrow">OMEGA AI Engine</p>
          <h2 className="omega-engine-admin__title">{engineIcon} {engineLabel}</h2>
          <p className="omega-engine-admin__desc">Orchestrated by OMEGA — all requests flow through the unified command center.</p>
        </div>
        <div className="omega-engine-admin__score">
          <span>Engine Score</span>
          <strong>{initialSnapshot.score}%</strong>
        </div>
      </header>

      <nav className="omega-engine-tabs" aria-label={`${engineLabel} sections`}>
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/super-admin/ai/${engine}?tab=${tab}`}
            className={cn("omega-engine-tab", activeTab === tab && "omega-engine-tab--active")}
          >
            {tab.replace(/-/g, " ")}
          </Link>
        ))}
      </nav>

      <div className="omega-engine-admin__links">
        <Link href="/super-admin/omega" className="omega-link">← OMEGA Command Center</Link>
        {OMEGA_ENGINE_ROUTES.filter((e) => e.id !== engine).map((e) => (
          <Link key={e.id} href={e.href} className="omega-link">{e.icon} {e.label}</Link>
        ))}
      </div>

      <section className="omega-panel">
        <h3>{activeTab.replace(/-/g, " ")}</h3>
        <table className="omega-table">
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
    </div>
  );
}
