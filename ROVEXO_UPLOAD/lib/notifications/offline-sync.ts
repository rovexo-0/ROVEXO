const OFFLINE_QUEUE_KEY = "rovexo:notification-offline-queue";

export type OfflineNotificationAction =
  | { type: "mark_read"; ids: string[] }
  | { type: "mark_all_read" }
  | { type: "delete_read" };

function readQueue(): OfflineNotificationAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineNotificationAction[];
  } catch {
    return [];
  }
}

function writeQueue(actions: OfflineNotificationAction[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(actions));
}

export function enqueueOfflineNotificationAction(action: OfflineNotificationAction): void {
  const queue = readQueue();
  queue.push(action);
  writeQueue(queue);
}

async function flushAction(action: OfflineNotificationAction): Promise<boolean> {
  if (action.type === "mark_read") {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: action.ids, read: true }),
    });
    return response.ok;
  }

  if (action.type === "mark_all_read") {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    return response.ok;
  }

  const response = await fetch("/api/notifications", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clearRead: true }),
  });
  return response.ok;
}

export async function flushOfflineNotificationQueue(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const queue = readQueue();
  if (!queue.length) return 0;

  const remaining: OfflineNotificationAction[] = [];
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
