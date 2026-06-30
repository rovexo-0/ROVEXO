import { executiveCommandMetadata, renderExecutiveCommandPage } from "@/lib/executive-command-engine/page";

export default async function SuperAdminExecutiveCommandPage() {
  return renderExecutiveCommandPage();
}

export async function generateMetadata() {
  return executiveCommandMetadata();
}
