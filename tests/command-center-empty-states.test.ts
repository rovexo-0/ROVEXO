import { describe, expect, it } from "vitest";
import type { CommandCenterMetric } from "@/lib/super-admin/command-center-v1/types";
import {
  isChartSeriesEmpty,
  resolveChartHeaderDisplay,
  resolveMetricDisplay,
} from "@/features/super-admin/command-center-v1/lib/resolve-metric-display";

function metric(partial: CommandCenterMetric): CommandCenterMetric {
  return partial;
}

describe("Command Center empty metric display", () => {
  it("replaces zero counts with contextual empty states and badges", () => {
    const usersOnline = resolveMetricDisplay(
      metric({ id: "usersOnline", label: "Users Online", value: 0, format: "number" }),
    );
    expect(usersOnline.kind).toBe("empty");
    expect(usersOnline.displayText).toBe("Waiting for first login");
    expect(usersOnline.badge?.label).toBe("Waiting");

    const bandwidth = resolveMetricDisplay(
      metric({ id: "bandwidthMbps", label: "Bandwidth", value: 0, format: "number" }),
    );
    expect(bandwidth.displayText).toBe("Bandwidth telemetry unavailable");
    expect(bandwidth.badge?.variant).toBe("unavailable");
    expect(bandwidth.tooltip).toContain("Bandwidth telemetry provider");
  });

  it("preserves real positive production values", () => {
    const revenue = resolveMetricDisplay(
      metric({ id: "revenueToday", label: "Revenue Today", value: 1250.5, format: "currency" }),
    );
    expect(revenue.kind).toBe("value");
    expect(revenue.displayText).toContain("£1,25");
  });

  it("preserves configured health status strings", () => {
    const api = resolveMetricDisplay(metric({ id: "api", label: "API", value: "Healthy", format: "status" }));
    expect(api.kind).toBe("value");
    expect(api.displayText).toBe("Healthy");
  });

  it("marks unavailable configuration states", () => {
    const ga = resolveMetricDisplay(
      metric({ id: "googleAnalytics", label: "Google Analytics", value: "Not configured", format: "status" }),
    );
    expect(ga.kind).toBe("empty");
    expect(ga.badge?.label).toBe("Unavailable");
  });

  it("maps security zeros to secure status messaging", () => {
    const threats = resolveMetricDisplay(
      metric({ id: "failedLogins", label: "Failed Logins", value: 0, format: "number" }),
    );
    expect(threats.displayText).toBe("No threats detected");
    expect(threats.badge?.label).toBe("System Secure");
  });

  it("detects empty chart series without rendering misleading zero trends", () => {
    expect(isChartSeriesEmpty([0, 0, 0, 0])).toBe(true);
    expect(isChartSeriesEmpty([0, 2, 0, 1])).toBe(false);

    const header = resolveChartHeaderDisplay("revenue", [0, 0, 0]);
    expect(header.kind).toBe("empty");
    expect(header.badge?.label).toBe("Collecting");
  });
});
