import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaSettingsPage() {
  return renderOmegaEnterprisePage({
    tab: "settings",
    title: "OMEGA Settings",
    description: "Push notifications, ORI integration, and enterprise monitoring configuration.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("OMEGA Settings");
}
