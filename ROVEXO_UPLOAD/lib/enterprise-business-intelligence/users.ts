import type { LeaderboardEntry, UserAnalytics } from "@/lib/enterprise-business-intelligence/types";

export function createDefaultUserAnalytics(): UserAnalytics {
  return {
    registrations: 4280,
    retentionRate: 68.5,
    churnRate: 4.2,
    trustScoreAvg: 87.3,
    businessAccounts: 1240,
    verifiedAccounts: 8920,
    topCountries: [
      { id: "gb", label: "United Kingdom", value: 34200, rank: 1, changePercent: 8 },
      { id: "us", label: "United States", value: 28400, rank: 2, changePercent: 12 },
      { id: "de", label: "Germany", value: 15600, rank: 3, changePercent: 5 },
    ],
    topLanguages: [
      { id: "en", label: "English", value: 52000, rank: 1 },
      { id: "de", label: "German", value: 8400, rank: 2 },
      { id: "fr", label: "French", value: 6200, rank: 3 },
    ],
    topDevices: [
      { id: "mobile", label: "Mobile", value: 58400, rank: 1, changePercent: 15 },
      { id: "desktop", label: "Desktop", value: 31200, rank: 2, changePercent: -3 },
      { id: "tablet", label: "Tablet", value: 4800, rank: 3 },
    ],
  };
}

export function registrationGrowth(users: UserAnalytics): number {
  return users.registrations;
}

export function verifiedRate(users: UserAnalytics): number {
  const total = users.registrations + users.businessAccounts * 10;
  if (total === 0) return 0;
  return Math.round((users.verifiedAccounts / total) * 100);
}
