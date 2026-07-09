import { MosControlCenter } from "@/features/super-admin/marketplace-os/MosControlCenter";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { buildMosControlCenterSnapshot } from "@/lib/marketplace-os/dashboard";
import { getMosDraft } from "@/lib/marketplace-os/engine";

export default async function SuperAdminMarketplaceOsPage() {
  const [snapshot, draftDocument] = await Promise.all([
    buildMosControlCenterSnapshot(),
    getMosDraft(),
  ]);

  return (
    <>
      <SuperAdminPageHeader
        title="Marketplace Operating System"
        description="Central orchestration layer — coordinates SEO, organic growth, intelligence, search, homepage and more."
      />
      <MosControlCenter initialSnapshot={snapshot} draftDocument={draftDocument} />
    </>
  );
}
