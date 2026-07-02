import { jsonWithCache } from "@/lib/api/cache-headers";
import { buildCategoryTreeFromDatabase } from "@/lib/categories/build-tree-from-db";
import { getCategoryTree } from "@/lib/categories/queries";

const RETRY_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadTreeWithRecovery(maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const tree = await buildCategoryTreeFromDatabase();
      if (tree.length > 0) {
        return { tree, source: "database" as const };
      }
    } catch {
      if (attempt < maxAttempts - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  return { tree: getCategoryTree(), source: "static" as const };
}

export async function GET() {
  const result = await loadTreeWithRecovery();
  return jsonWithCache({ tree: result.tree, source: result.source }, "public-long");
}
