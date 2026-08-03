import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocDevicesPage() {
  return renderSocPage({ tab: "devices", title: "Device Security", description: "Trusted devices, fingerprints, lock and revoke." });
}

export async function generateMetadata() {
  return socMetadata("Devices");
}
