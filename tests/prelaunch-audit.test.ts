import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Pre-launch production config", () => {
  it("uses Vercel Hobby-compatible cron schedules (at most once per day)", () => {
    const vercel = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"));
    for (const cron of vercel.crons) {
      expect(cron.schedule).not.toMatch(/\*\//);
      expect(cron.schedule).toMatch(/^\S+ \S+ \* \* \*$/);
    }
    expect(vercel.crons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/api/cron/migration/process",
          schedule: "0 4 * * *",
        }),
        expect.objectContaining({
          path: "/api/cron/migration/publish",
          schedule: "0 5 * * *",
        }),
      ]),
    );
  });

  it("includes vercel cron schedules for maintenance and order cleanup", () => {
    const vercel = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"));
    expect(vercel.crons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/api/cron/maintenance",
          schedule: "0 6 * * *",
        }),
        expect.objectContaining({
          path: "/api/cron/orders/cleanup",
          schedule: "0 3 * * *",
        }),
      ]),
    );
  });

  it("runs order cleanup cron independently from maintenance", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/api/cron/orders/cleanup/route.ts"),
      "utf8",
    );
    expect(source).toContain("runOrderCleanupJob");
    expect(source).not.toContain("runProductionMaintenance");
  });

  it("documents required env vars in .env.example", () => {
    const example = readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
    expect(example).toContain("NEXT_PUBLIC_APP_URL");
    expect(example).toContain("CRON_SECRET");
    expect(example).toContain("UPSTASH_REDIS_REST_URL");
  });

  it("validates protection case creation server-side", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/protection/service.ts"),
      "utf8",
    );
    expect(source).toContain("order.buyer_id !== input.buyerId");
    expect(source).toContain("DISPUTABLE_ORDER_STATUSES");
    expect(source).not.toMatch(/sellerId: input\.sellerId/);
  });

  it("requires authenticated profile for seller orders routes (unified account)", () => {
    const listSource = readFileSync(path.join(process.cwd(), "app/seller/orders/page.tsx"), "utf8");
    expect(listSource).toContain("getProfile()");
    expect(listSource).toContain("fetchOrdersForUser");

    const detailSource = readFileSync(path.join(process.cwd(), "app/seller/orders/[id]/page.tsx"), "utf8");
    expect(detailSource).toContain("getProfile()");
    expect(detailSource).toContain("fetchOrderForUser");
  });

  it("blocks checkout when seller is on vacation", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/orders/checkout.ts"), "utf8");
    expect(source).toContain("vacation_mode");
    expect(source).toContain("on vacation");
    expect(source).toContain("expires_at");
  });
});
