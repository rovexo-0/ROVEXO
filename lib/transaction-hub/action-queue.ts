const HUB_ACTION_QUEUE_KEY = "rovexo:transaction-hub-action-queue";

export type HubQueuedAction = {
  type: "add_to_cart";
  productSlug: string;
  queuedAt: number;
};

function readQueue(): HubQueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HUB_ACTION_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HubQueuedAction[];
  } catch {
    return [];
  }
}

function writeQueue(actions: HubQueuedAction[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HUB_ACTION_QUEUE_KEY, JSON.stringify(actions));
}

export function enqueueHubAction(action: Omit<HubQueuedAction, "queuedAt">): void {
  const queue = readQueue();
  if (
    action.type === "add_to_cart" &&
    queue.some((item) => item.type === "add_to_cart" && item.productSlug === action.productSlug)
  ) {
    return;
  }
  queue.push({ ...action, queuedAt: Date.now() });
  writeQueue(queue);
}

async function flushAction(action: HubQueuedAction): Promise<boolean> {
  if (action.type === "add_to_cart") {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", productSlug: action.productSlug }),
    });
    const payload = (await response.json()) as { success?: boolean };
    return response.ok && Boolean(payload.success);
  }
  return false;
}

export async function flushHubActionQueue(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const queue = readQueue();
  if (!queue.length) return 0;

  const remaining: HubQueuedAction[] = [];
  let flushed = 0;

  for (const action of queue) {
    try {
      const ok = await flushAction(action);
      if (ok) {
        flushed += 1;
      } else {
        remaining.push(action);
      }
    } catch {
      remaining.push(action);
    }
  }

  writeQueue(remaining);
  return flushed;
}

export function getHubActionQueueLength(): number {
  return readQueue().length;
}
