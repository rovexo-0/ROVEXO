import { renderOmegaEnginePage, omegaEngineMetadata } from "@/lib/omega-command-center/engine-page";

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function SuperAdminAiAtlasPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  return renderOmegaEnginePage({
    engine: "atlas",
    tab,
    title: "ATLAS Infrastructure Map",
    description: "Services, dependencies, topology, and API mapping — orchestrated by OMEGA.",
  });
}

export async function generateMetadata() {
  return omegaEngineMetadata("atlas", "ATLAS");
}
