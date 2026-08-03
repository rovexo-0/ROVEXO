import { renderOmegaEnginePage, omegaEngineMetadata } from "@/lib/omega-command-center/engine-page";

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function SuperAdminAiGuardianPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  return renderOmegaEnginePage({
    engine: "guardian",
    tab,
    title: "GUARDIAN Compliance Engine",
    description: "Compliance, policies, audit, GDPR, and enterprise rules — orchestrated by OMEGA.",
  });
}

export async function generateMetadata() {
  return omegaEngineMetadata("guardian", "GUARDIAN");
}
