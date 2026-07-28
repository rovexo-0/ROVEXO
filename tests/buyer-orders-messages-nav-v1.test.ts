import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getMessageHref } from "@/lib/orders/status";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Buyer Orders → Messages Hub navigation adaptation", () => {
  it("Bought rows open Messages Hub via getMessageHref; Sold stays on seller detail", () => {
    const page = readSource("features/orders/components/OrdersPage.tsx");
    expect(page).toContain('getMessageHref(order.id, "buyer")');
    expect(page).toContain("`/seller/orders/${order.id}`");
    expect(page).not.toMatch(
      /tab === "sold" \? `\/seller\/orders\/\$\{order\.id\}` : `\/orders\/\$\{order\.id\}`/,
    );
  });

  it("getMessageHref preloads order context on Inbox deep-link", () => {
    expect(getMessageHref("ord-abc", "buyer")).toBe("/inbox?order=ord-abc");
  });

  it("does not rewrite Messages Hub / ConversationHub for this adaptation", () => {
    const page = readSource("features/orders/components/OrdersPage.tsx");
    expect(page).not.toContain("ConversationHub");
    expect(page).not.toContain("TransactionActionBar");
  });
});
