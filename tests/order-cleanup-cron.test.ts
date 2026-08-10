import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ops/production-status", () => ({
  recordCronJobRun: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ops/logger", () => ({
  logCronEvent: vi.fn(),
  logOpsEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("order cleanup cron", () => {
  it("records orders/cleanup job name separately from maintenance", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { recordCronJobRun } = await import("@/lib/ops/production-status");
    const { runOrderCleanupJob } = await import("@/lib/orders/cleanup");

    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      lt: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.lt.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockResolvedValue({ data: [] });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await runOrderCleanupJob();

    expect(result).toEqual({ cleaned: 0 });
    expect(recordCronJobRun).toHaveBeenCalledWith(
      expect.objectContaining({
        jobName: "orders/cleanup",
        status: "success",
      }),
    );
  });
});
