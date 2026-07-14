import { describe, expect, it } from "vitest";
import { buildNotificationGroupKey, resolveNotificationPriority } from "@/lib/notifications/grouping";
import { CANONICAL_NOTIFICATION_CATALOG } from "@/lib/notifications/catalog";

describe("Notifications performance contracts v1.0", () => {
  it("builds stable group keys without query-string noise", () => {
    const key = buildNotificationGroupKey({
      userId: "user-a",
      type: "order",
      href: "/orders/abc?view=tracking&x=1",
    });
    expect(key).toBe("user-a:order:/orders/abc");
  });

  it("keeps high-priority events prioritised for instant push paths", () => {
    expect(resolveNotificationPriority("new_order")).toBe("high");
    expect(resolveNotificationPriority("new_message")).toBe("high");
    expect(resolveNotificationPriority("promotion")).toBe("low");
  });

  it("keeps catalog size within a bounded set for smart refresh", () => {
    expect(CANONICAL_NOTIFICATION_CATALOG.length).toBeLessThanOrEqual(40);
    expect(CANONICAL_NOTIFICATION_CATALOG.length).toBeGreaterThanOrEqual(30);
  });
});
