const NOT_SET = /^\(not set\)$/i;

export function cleanGa4Label(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || NOT_SET.test(trimmed)) return null;
  return trimmed;
}

export function titleCaseLabel(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeDeviceCategory(raw: string | null | undefined): string {
  const value = cleanGa4Label(raw)?.toLowerCase() ?? "";
  if (value === "desktop") return "Desktop";
  if (value === "mobile") return "Mobile";
  if (value === "tablet") return "Tablet";
  if (value.includes("fold")) return "Foldable";
  if (!value) return "Unknown";
  return titleCaseLabel(value);
}

export function normalizeBrowser(raw: string | null | undefined): string {
  const value = cleanGa4Label(raw) ?? "";
  const lower = value.toLowerCase();
  if (!value) return "Unknown";
  if (lower.includes("chrome")) return "Chrome";
  if (lower.includes("safari") && !lower.includes("chrome")) return "Safari";
  if (lower.includes("firefox")) return "Firefox";
  if (lower.includes("edg")) return "Edge";
  if (lower.includes("opera") || lower.includes("opr")) return "Opera";
  if (lower.includes("samsung")) return "Samsung Internet";
  if (lower.includes("brave")) return "Brave";
  if (lower.includes("arc")) return "Arc";
  return titleCaseLabel(value);
}

export function normalizeOperatingSystem(raw: string | null | undefined): string {
  const value = cleanGa4Label(raw) ?? "";
  const lower = value.toLowerCase();
  if (!value) return "Unknown";
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("mac")) return "macOS";
  if (lower.includes("ios")) return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("linux")) return lower.includes("ubuntu") ? "Ubuntu" : "Linux";
  if (lower.includes("chrome os") || lower.includes("cros")) return "ChromeOS";
  return titleCaseLabel(value);
}

export function normalizeTrafficSource(source: string | null, medium: string | null): string {
  const src = (cleanGa4Label(source) ?? "").toLowerCase();
  const med = (cleanGa4Label(medium) ?? "").toLowerCase();

  if (!src && !med) return "Direct";
  if (src === "(direct)" || med === "(none)" || med === "direct") return "Direct";
  if (med.includes("email")) return "Email";
  if (src.includes("facebook") || med.includes("facebook")) return "Facebook";
  if (src.includes("instagram") || med.includes("instagram")) return "Instagram";
  if (src.includes("tiktok") || med.includes("tiktok")) return "TikTok";
  if (src.includes("pinterest") || med.includes("pinterest")) return "Pinterest";
  if (src.includes("youtube") || med.includes("youtube")) return "YouTube";
  if (med.includes("cpc") || med.includes("ppc") || med.includes("paid")) {
    if (src.includes("google")) return "Google Ads";
    return "Other";
  }
  if (src.includes("google") && med.includes("organic")) return "Organic Search";
  if (src.includes("google")) return "Google Search";
  if (med.includes("referral")) return "Referral";
  if (med.includes("organic")) return "Organic Search";
  if (src.includes("rovexo")) return "Internal";
  return titleCaseLabel(src || med || "Other");
}

export function withPercentages<T extends { activeUsers: number }>(
  rows: Array<T & { id: string; label: string }>,
): Array<T & { id: string; label: string; percentage: number }> {
  const total = rows.reduce((sum, row) => sum + row.activeUsers, 0) || 1;
  return rows
    .map((row) => ({
      ...row,
      percentage: Math.round((row.activeUsers / total) * 1000) / 10,
    }))
    .sort((left, right) => right.activeUsers - left.activeUsers);
}
