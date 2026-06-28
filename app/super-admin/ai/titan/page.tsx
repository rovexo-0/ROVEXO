import { renderOmegaEnginePage, omegaEngineMetadata } from "@/lib/omega-command-center/engine-page";

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function SuperAdminAiTitanPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  return renderOmegaEnginePage({
    engine: "titan",
    tab,
    title: "TITAN Automation Engine",
    description: "Workflow automation, optimization, and background jobs — orchestrated by OMEGA.",
  });
}

export async function generateMetadata() {
  return omegaEngineMetadata("titan", "TITAN");
}
