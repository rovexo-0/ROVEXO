import type { ReactNode } from "react";

export type DashboardMenuItem = {
  title: string;
  href?: string;
  icon: ReactNode;
  badge?: number;
};

export type DashboardSummaryCard = {
  label: string;
  value: number;
  format?: "currency" | "number";
};

export type DashboardPerformanceMetric = {
  id: string;
  label: string;
  format?: "currency" | "number";
};

export type DashboardPerformancePoint = {
  label: string;
  values: Record<string, number>;
};

export type DashboardPerformance = {
  periodLabel: string;
  totals: Record<string, number>;
  points: DashboardPerformancePoint[];
  metrics: DashboardPerformanceMetric[];
};

export type DashboardRecentOrder = {
  id: string;
  href: string;
  productTitle: string;
  productImageUrl: string;
  price: number;
  status: import("@/lib/orders/types").OrderStatus;
  createdAt: string;
  sku?: string;
};
