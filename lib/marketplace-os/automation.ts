import type { MosDocument } from "@/lib/marketplace-os/types";
import { runMarketplaceOrchestration } from "@/lib/marketplace-os/orchestration";

export type AutomationQueueItem = {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  priority: number;
  retries: number;
};

/** Automation Center — executes deterministic workflows with retry and audit. */
export async function runMosAutomation(document: MosDocument): Promise<{
  queue: AutomationQueueItem[];
  result: Awaited<ReturnType<typeof runMarketplaceOrchestration>>;
}> {
  const queue: AutomationQueueItem[] = document.rules
    .filter((rule) => rule.enabled)
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      status: "running" as const,
      priority: rule.priority,
      retries: 0,
    }));

  let result = await runMarketplaceOrchestration(document);
  let retries = 0;

  while (result.status === "partial" && retries < document.thresholds.maxAutomationRetries) {
    retries += 1;
    result = await runMarketplaceOrchestration(document);
  }

  const completedQueue = queue.map((item) => ({
    ...item,
    status: result.status === "blocked" ? ("failed" as const) : ("completed" as const),
    retries,
  }));

  return { queue: completedQueue, result };
}
