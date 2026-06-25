import {
  normalizeBrowser,
  normalizeDeviceCategory,
  normalizeOperatingSystem,
} from "@/lib/analytics/live-center/normalize";

export type ParsedUserAgent = {
  deviceCategory: string;
  browser: string;
  operatingSystem: string;
};

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = userAgent?.trim() ?? "";

  let deviceCategory = "Desktop";
  if (/ipad|tablet|kindle|silk/i.test(ua)) deviceCategory = "Tablet";
  else if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) deviceCategory = "Mobile";
  if (/fold|flip/i.test(ua)) deviceCategory = "Foldable";

  let browser = "Unknown";
  if (/brave/i.test(ua)) browser = "Brave";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/arc/i.test(ua)) browser = "Arc";
  else if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/crios|chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = "Safari";

  let operatingSystem = "Unknown";
  if (/windows nt/i.test(ua)) operatingSystem = "Windows";
  else if (/iphone|ipad|ipod|mac os x/i.test(ua) && !/android/i.test(ua)) {
    operatingSystem = /iphone|ipad|ipod/i.test(ua) ? "iOS" : "macOS";
  } else if (/android/i.test(ua)) operatingSystem = "Android";
  else if (/cros/i.test(ua)) operatingSystem = "ChromeOS";
  else if (/ubuntu/i.test(ua)) operatingSystem = "Ubuntu";
  else if (/linux/i.test(ua)) operatingSystem = "Linux";

  if (!ua) {
    return {
      deviceCategory: "Unknown",
      browser: "Unknown",
      operatingSystem: "Unknown",
    };
  }

  return {
    deviceCategory: normalizeDeviceCategory(deviceCategory),
    browser: normalizeBrowser(browser),
    operatingSystem: normalizeOperatingSystem(operatingSystem),
  };
}

export function inferTrafficSource(referrer: string | null | undefined): string {
  if (!referrer?.trim()) return "Direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "Google Search";
    if (host.includes("facebook.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("tiktok.")) return "TikTok";
    if (host.includes("pinterest.")) return "Pinterest";
    if (host.includes("youtube.") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("rovexo")) return "Internal";
    return "Referral";
  } catch {
    return "Referral";
  }
}

export function sanitizeClientText(value: string | null | undefined, max = 120): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[<>"'`]/g, "").trim().slice(0, max);
  return cleaned || null;
}
