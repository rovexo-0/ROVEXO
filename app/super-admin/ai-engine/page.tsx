import { AiEngineAdmin } from "@/features/super-admin/ai-engine/AiEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAiEngineSnapshot } from "@/lib/ai-engine/reader";

export default async function SuperAdminAiEnginePage() {
  const snapshot = await getAiEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="AI Engine"
        description="Enterprise AI orchestration — providers, permissions, automation, and monitoring."
      />
      <AiEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "AI Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
