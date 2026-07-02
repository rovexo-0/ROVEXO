import type { ReleaseNotes } from "@/lib/enterprise-deployment-center/types";

export function generateReleaseNotes(version: string): ReleaseNotes {
  return {
    version,
    newFeatures: ["Enterprise Deployment Center", "Blue/green deployment strategies"],
    improvements: ["Workflow engine integration", "AI release validation"],
    bugFixes: ["Fixed staging sync delay"],
    securityFixes: ["Patched dependency CVE-2025-001"],
    performanceChanges: ["Reduced build validation time by 15%"],
    databaseChanges: ["Added deployment audit indexes"],
    apiChanges: ["/api/super-admin/deployment endpoints"],
    breakingChanges: [],
    rollbackInstructions: [`Revert to previous production bundle via Rollback Center`, `Run: deployment rollback --version ${version}`],
  };
}

export function formatReleaseNotesMarkdown(notes: ReleaseNotes): string {
  const sections = [
    `# Release ${notes.version}`,
    "## New Features",
    ...notes.newFeatures.map((f) => `- ${f}`),
    "## Improvements",
    ...notes.improvements.map((i) => `- ${i}`),
    "## Bug Fixes",
    ...notes.bugFixes.map((b) => `- ${b}`),
    "## Security",
    ...notes.securityFixes.map((s) => `- ${s}`),
    "## Rollback",
    ...notes.rollbackInstructions.map((r) => `- ${r}`),
  ];
  return sections.join("\n");
}

export function hasBreakingChanges(notes: ReleaseNotes): boolean {
  return notes.breakingChanges.length > 0;
}
