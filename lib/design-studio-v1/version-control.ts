import { getPlatformVisualHistory } from "@/lib/platform-visual/reader";
import type { VersionControlEntry } from "@/lib/design-studio-v1/types";

export async function getDesignStudioVersionHistory(): Promise<VersionControlEntry[]> {
  const history = await getPlatformVisualHistory();
  return history.map((entry) => ({
    id: entry.id,
    label: entry.label,
    publishedAt: entry.publishedAt,
    publishedBy: entry.publishedBy,
    rollbackAvailable: entry.rollbackAvailable,
    version: entry.bundle.version,
  }));
}
