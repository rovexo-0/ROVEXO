import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

describe("Google Analytics 4 production build output", () => {
  it("embeds gtag script and measurement ID in prerendered HTML", () => {
    const htmlPath = path.join(process.cwd(), ".next/server/pages/404.html");
    if (!existsSync(htmlPath)) {
      return;
    }

    const html = readFileSync(htmlPath, "utf8");
    expect(html).toContain("G-RNEMD5BT0S");
    expect(html).toContain("googletagmanager.com/gtag/js?id=G-RNEMD5BT0S");
  });
});
