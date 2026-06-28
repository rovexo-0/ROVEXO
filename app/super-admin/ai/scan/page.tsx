import { renderOmegaEnginePage, omegaEngineMetadata } from "@/lib/omega-command-center/engine-page";

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function SuperAdminAiScanPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  return renderOmegaEnginePage({
    engine: "scan",
    tab,
    title: "SCAN Analysis Engine",
    description: "Infrastructure, marketplace, API, and platform scanning — orchestrated by OMEGA.",
  });
}

export async function generateMetadata() {
  return omegaEngineMetadata("scan", "SCAN");
}
