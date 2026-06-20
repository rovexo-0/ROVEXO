import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BETA_VERSION, getBetaModule } from "@/lib/beta/roadmap";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";

type BetaModulePlaceholderProps = {
  moduleId: string;
  bottomNavTab?: BottomNavTab;
  showBottomNav?: boolean;
  backHref?: string;
};

const statusLabels = {
  complete: "Complete",
  in_progress: "In Progress",
  planned: "Planned",
} as const;

const statusVariants = {
  complete: "success",
  in_progress: "warning",
  planned: "default",
} as const;

export function BetaModulePlaceholder({
  moduleId,
  bottomNavTab,
  showBottomNav = true,
  backHref = "/",
}: BetaModulePlaceholderProps) {
  const betaModule = getBetaModule(moduleId);

  if (!betaModule) {
    notFound();
  }

  return (
    <BetaAppShell bottomNavTab={bottomNavTab} showBottomNav={showBottomNav}>
      <BetaPageHeader title={betaModule.name} backHref={backHref} />

      <main className="mx-auto w-full max-w-2xl px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
        <Card padding="lg" className="shadow-ds-medium">
          <div className="mb-ds-4 flex flex-wrap items-center gap-ds-2">
            <Badge variant="primary">Beta v{BETA_VERSION}</Badge>
            <Badge variant={statusVariants[betaModule.status]}>{statusLabels[betaModule.status]}</Badge>
          </div>

          <h2 className="text-xl font-semibold text-text-primary">{betaModule.name}</h2>
          <p className="mt-ds-2 text-sm leading-relaxed text-text-secondary">{betaModule.description}</p>

          <p className="mt-ds-5 text-xs text-text-muted">
            This module is in the ROVEXO Beta v{BETA_VERSION} scope. Implementation is tracked in{" "}
            <span className="font-medium text-text-secondary">ROADMAP.md</span>.
          </p>
        </Card>
      </main>
    </BetaAppShell>
  );
}
