import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocSettingsPage() {
  return renderSocPage({ tab: "settings", title: "SOC Settings", description: "Automations, lockdown, MFA, and export controls." });
}

export async function generateMetadata() {
  return socMetadata("Settings");
}
