import type { CommandCenterMetricFormat } from "@/lib/super-admin/command-center-v1/types";

export function formatCommandCenterMetric(
  value: string | number,
  format: CommandCenterMetricFormat = "number",
): string {
  if (typeof value === "string") return value;

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      }).format(value);
    case "percent":
      return `${value}%`;
    case "duration":
      return typeof value === "number" ? `${value}ms` : String(value);
    case "status":
      return String(value);
    case "text":
      return String(value);
    default:
      return new Intl.NumberFormat("en-GB").format(value);
  }
}
