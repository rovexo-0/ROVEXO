import { SecurityEngineAdmin } from "@/features/super-admin/security-engine/SecurityEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getSecurityEngineSnapshot } from "@/lib/security-engine/reader";

export default async function SuperAdminSecurityEnginePage() {
  const snapshot = await getSecurityEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Security Engine"
        description="Enterprise security and compliance — authentication, authorization, fraud detection, and audit."
      />
      <SecurityEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Security Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
