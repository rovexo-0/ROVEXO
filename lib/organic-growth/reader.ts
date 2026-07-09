import { buildOrganicGrowthDashboard, type OrganicGrowthDashboard } from "@/lib/organic-growth/dashboard";

export async function getOrganicGrowthSnapshot(): Promise<OrganicGrowthDashboard> {
  return buildOrganicGrowthDashboard();
}

export type { OrganicGrowthDashboard };
