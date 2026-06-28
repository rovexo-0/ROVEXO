import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { OmegaEngineAdmin } from "@/features/super-admin/omega-command-center/OmegaEngineAdmin";
import { buildEngineSnapshot } from "@/lib/omega-command-center/engines";
import type { OmegaEngineId } from "@/lib/omega-command-center/types";
import { OMEGA_ENGINE_ROUTES } from "@/lib/omega-command-center/registry";

type OmegaEnginePageProps = { engine: OmegaEngineId; tab?: string; title: string; description: string };

export async function renderOmegaEnginePage({ engine, tab, title, description }: OmegaEnginePageProps) {
  const engineMeta = OMEGA_ENGINE_ROUTES.find((e) => e.id === engine);
  const snapshot = buildEngineSnapshot(engine, tab ?? "");
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <OmegaEngineAdmin
        engine={engine}
        engineLabel={engineMeta?.label ?? engine.toUpperCase()}
        engineIcon={engineMeta?.icon ?? "🤖"}
        initialSnapshot={snapshot}
      />
    </>
  );
}

export function omegaEngineMetadata(engine: string, title: string) {
  return { title: `${title} · ${engine.toUpperCase()} · OMEGA` };
}
