import { renderDevelopmentPage, developmentMetadata } from "@/lib/enterprise-development-center/page";

export default async function SuperAdminDevelopmentPage() {
  return renderDevelopmentPage({
    tab: "dashboard",
    title: "Enterprise Development Center",
    description: "Live engineering overview — projects, modules, builds, and enterprise validation.",
  });
}

export async function generateMetadata() {
  return developmentMetadata("Dashboard");
}
