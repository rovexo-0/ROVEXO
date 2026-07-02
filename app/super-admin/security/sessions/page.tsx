import { renderSocPage, socMetadata } from "@/lib/enterprise-security-operations-center/page";

export default async function SuperAdminSocSessionsPage() {
  return renderSocPage({ tab: "sessions", title: "Session Security", description: "Active sessions, suspicious activity, remote logout." });
}

export async function generateMetadata() {
  return socMetadata("Sessions");
}
