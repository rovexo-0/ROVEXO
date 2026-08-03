import { AiOperationsCenter } from "@/features/super-admin/operations/AiOperationsCenter";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAiOperationsSnapshot } from "@/lib/super-admin/operations/snapshot";

export default async function SuperAdminAiOperationsPage() {
  const snapshot = await getAiOperationsSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="AI Operations Center"
        description="AI platform scan, self-healing, repair center, and emergency diagnostics."
      />
      <AiOperationsCenter initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "AI Operations Center | Super Admin | ROVEXO",
    robots: { index: false, follow: false },
  };
}
