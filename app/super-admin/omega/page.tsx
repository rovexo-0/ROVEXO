import { renderOmegaPage, omegaMetadata } from "@/lib/omega-command-center/page";

export default async function SuperAdminOmegaPage() {
  return renderOmegaPage({
    title: "OMEGA Command Center",
    description: "Unified Enterprise AI orchestration platform — the single AI entry point for ROVEXO.",
  });
}

export async function generateMetadata() {
  return omegaMetadata("Command Center");
}
