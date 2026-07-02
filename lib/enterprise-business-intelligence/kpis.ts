import type { KpiMetric, KpiPeriod } from "@/lib/enterprise-business-intelligence/types";
import { KPI_PERIODS } from "@/lib/enterprise-business-intelligence/registry";

export function isValidKpiPeriod(value: string): value is KpiPeriod {
  return (KPI_PERIODS as readonly string[]).includes(value);
}

export function createKpi(
  label: string,
  value: number,
  previousValue: number,
  period: KpiPeriod,
  unit: KpiMetric["unit"] = "count",
): KpiMetric {
  const changePercent = previousValue === 0 ? 0 : Math.round(((value - previousValue) / previousValue) * 100);
  return {
    id: `kpi-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    value,
    previousValue,
    changePercent,
    period,
    unit,
  };
}

export function createDefaultKpis(period: KpiPeriod = "monthly"): KpiMetric[] {
  return [
    createKpi("Revenue", 2847500, 2650000, period, "currency"),
    createKpi("Orders", 18420, 17200, period, "count"),
    createKpi("GMV", 4120000, 3890000, period, "currency"),
    createKpi("Conversion Rate", 3.8, 3.5, period, "percent"),
    createKpi("Active Buyers", 42800, 40100, period, "count"),
    createKpi("Active Sellers", 12400, 11800, period, "count"),
    createKpi("Visitors", 892000, 845000, period, "count"),
    createKpi("Platform Health", 94, 91, period, "score"),
  ];
}

export function recalculateKpis(kpis: KpiMetric[], period: KpiPeriod): KpiMetric[] {
  return kpis.map((k) => ({ ...k, period }));
}

export function kpiTrendPositive(kpi: KpiMetric): boolean {
  return kpi.changePercent >= 0;
}

export function aggregateKpiScore(kpis: KpiMetric[]): number {
  if (kpis.length === 0) return 0;
  const positive = kpis.filter(kpiTrendPositive).length;
  return Math.round((positive / kpis.length) * 100);
}
