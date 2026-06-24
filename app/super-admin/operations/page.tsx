import { AiOperationsCenter } from "@/features/super-admin/operations/AiOperationsCenter";
import { getAiOperationsSnapshot } from "@/lib/super-admin/operations/snapshot";

export default async function SuperAdminOperationsPage() {
  const snapshot = await getAiOperationsSnapshot();

  return <AiOperationsCenter initialSnapshot={snapshot} />;
}

export async function generateMetadata() {
  return {
    title: "AI Operations Center | Super Admin | ROVEXO",
    robots: { index: false, follow: false },
  };
}
