import type { TrafficAnalytics } from "@/lib/enterprise-business-intelligence/types";
import { TRAFFIC_SOURCES } from "@/lib/enterprise-business-intelligence/registry";

export function createDefaultTrafficAnalytics(): TrafficAnalytics {
  const totalSessions = 1240000;
  const sourceSessions = [420000, 310000, 180000, 150000, 120000, 60000];
  const sourceTotal = sourceSessions.reduce((a, b) => a + b, 0);

  return {
    visitors: 892000,
    sessions: totalSessions,
    bounceRate: 32.4,
    searches: 428000,
    searchSuccessRate: 78.5,
    pageViews: 3840000,
    sources: TRAFFIC_SOURCES.map((source, i) => ({
      source,
      sessions: sourceSessions[i] ?? 0,
      percent: Math.round(((sourceSessions[i] ?? 0) / sourceTotal) * 100),
    })),
    countries: [
      { id: "gb", label: "United Kingdom", value: 412000, rank: 1 },
      { id: "us", label: "United States", value: 298000, rank: 2 },
      { id: "de", label: "Germany", value: 156000, rank: 3 },
    ],
    devices: [
      { id: "mobile", label: "Mobile", value: 720000, rank: 1 },
      { id: "desktop", label: "Desktop", value: 420000, rank: 2 },
      { id: "tablet", label: "Tablet", value: 100000, rank: 3 },
    ],
    browsers: [
      { id: "chrome", label: "Chrome", value: 580000, rank: 1 },
      { id: "safari", label: "Safari", value: 320000, rank: 2 },
      { id: "firefox", label: "Firefox", value: 180000, rank: 3 },
    ],
  };
}

export function conversionFromTraffic(traffic: TrafficAnalytics, orders: number): number {
  if (traffic.visitors === 0) return 0;
  return Math.round((orders / traffic.visitors) * 1000) / 10;
}
