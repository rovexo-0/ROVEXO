import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { SCAN_DIRS, walkFiles } from "@/lib/design-studio-v1/scan-utils";
import type { DependencyGraphNode } from "@/lib/design-studio-v1/types";

type GraphOptions = { rootDir?: string; assetPath?: string };

const DEFAULT_CHAIN = [
  { id: "logo", label: "Logo", type: "asset" as const },
  { id: "header", label: "Header", type: "component" as const },
  { id: "homepage", label: "Homepage", type: "page" as const },
  { id: "landing", label: "Landing Page", type: "page" as const },
  { id: "email", label: "Email", type: "surface" as const },
  { id: "notification", label: "Notification", type: "surface" as const },
  { id: "pwa", label: "PWA", type: "surface" as const },
  { id: "android", label: "Android", type: "platform" as const },
  { id: "ios", label: "iOS", type: "platform" as const },
];

function findDependents(rootDir: string, assetNeedle: string): string[] {
  const dependents: string[] = [];
  for (const dir of SCAN_DIRS) {
    for (const filePath of walkFiles(join(rootDir, dir))) {
      const content = readFileSync(filePath, "utf8");
      if (content.includes(assetNeedle)) {
        dependents.push(relative(rootDir, filePath).replace(/\\/g, "/"));
      }
    }
  }
  return dependents.slice(0, 20);
}

export function buildDependencyGraph(options: GraphOptions = {}): DependencyGraphNode[] {
  const rootDir = options.rootDir ?? process.cwd();
  const assetPath = options.assetPath ?? "/icons";
  const dependents = findDependents(rootDir, assetPath.replace(/^\//, ""));

  return DEFAULT_CHAIN.map((node, index) => ({
    ...node,
    depth: index,
    dependents: index === 0 ? dependents : index === 1 ? dependents.filter((d) => d.includes("header")) : [],
    impactScore: Math.max(10, 100 - index * 10),
  }));
}

export function analyzeReplacementImpact(
  graph: DependencyGraphNode[],
): { totalImpact: number; affectedSurfaces: number; recommendation: string } {
  const affectedSurfaces = graph.reduce((sum, node) => sum + node.dependents.length, 0);
  const totalImpact = graph.reduce((sum, node) => sum + node.impactScore, 0);
  const recommendation =
    affectedSurfaces > 10
      ? "High impact — review dependency graph before global replace"
      : "Low impact — safe for global replace via Publish Center";

  return { totalImpact, affectedSurfaces, recommendation };
}
