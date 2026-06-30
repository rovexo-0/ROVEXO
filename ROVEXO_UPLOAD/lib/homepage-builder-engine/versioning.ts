import type { HomepageBuilderDocument, HomepageDiffResult, HomepageVersionEntry } from "@/lib/homepage-builder-engine/types";

export function createVersionEntry(
  doc: HomepageBuilderDocument,
  publishedBy: string,
  changeSummary: string,
): HomepageVersionEntry {
  return {
    id: `hp-ver-${Date.now()}`,
    version: doc.version,
    publishedAt: new Date().toISOString(),
    publishedBy,
    label: doc.label,
    rollbackAvailable: true,
    changeSummary,
  };
}

export function bumpHomepageVersion(version: string, type: "patch" | "minor" | "major" = "patch"): string {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export function compareHomepageDocuments(from: HomepageBuilderDocument, to: HomepageBuilderDocument): HomepageDiffResult {
  const fromIds = new Set(from.sections.map((s) => s.id));
  const toIds = new Set(to.sections.map((s) => s.id));
  const added = [...toIds].filter((id) => !fromIds.has(id));
  const removed = [...fromIds].filter((id) => !toIds.has(id));
  const changed = to.sections
    .filter((s) => {
      const prev = from.sections.find((p) => p.id === s.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(s);
    })
    .map((s) => s.id);
  const reordered =
    from.sections.map((s) => s.id).join() !== to.sections.map((s) => s.id).join();
  return { added, removed, changed, reordered };
}

export function cloneHomepageDocument(doc: HomepageBuilderDocument, newId: string): HomepageBuilderDocument {
  return {
    ...doc,
    id: newId,
    label: "Draft",
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    lastPublishedAt: undefined,
    sections: doc.sections.map((s) => ({ ...s, published: false })),
    components: doc.components.map((c) => ({ ...c })),
  };
}

export function duplicateHomepageDocument(doc: HomepageBuilderDocument): HomepageBuilderDocument {
  return cloneHomepageDocument(doc, `${doc.id}-dup-${Date.now()}`);
}

export function detectPendingPublish(draft: HomepageBuilderDocument, live: HomepageBuilderDocument): boolean {
  return JSON.stringify(draft.sections) !== JSON.stringify(live.sections);
}

export function exportHomepageBundle(draft: HomepageBuilderDocument, live: HomepageBuilderDocument) {
  return {
    exportedAt: new Date().toISOString(),
    version: "2.0.0",
    draft,
    live,
  };
}

export function importHomepageBundle(
  bundle: { draft?: HomepageBuilderDocument; live?: HomepageBuilderDocument },
  fallback: HomepageBuilderDocument,
): HomepageBuilderDocument {
  return bundle.draft ?? bundle.live ?? fallback;
}
