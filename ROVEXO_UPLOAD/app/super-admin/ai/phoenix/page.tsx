import { renderOmegaEnginePage, omegaEngineMetadata } from "@/lib/omega-command-center/engine-page";

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function SuperAdminAiPhoenixPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  return renderOmegaEnginePage({
    engine: "phoenix",
    tab,
    title: "PHOENIX Recovery Engine",
    description: "Recovery, rollback, restore, and self-healing — orchestrated by OMEGA.",
  });
}

export async function generateMetadata() {
  return omegaEngineMetadata("phoenix", "PHOENIX");
}
