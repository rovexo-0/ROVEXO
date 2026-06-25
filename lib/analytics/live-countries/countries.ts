const DISPLAY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.toLowerCase() === "(not set)") return null;
  const code = trimmed.toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(code)) return null;
  if (code === "XX" || code === "ZZ") return null;
  return code.length === 2 ? code : code.slice(0, 2);
}

export function countryCodeToFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  const points = [...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

export function getCountryName(code: string, fallback?: string): string {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return fallback?.trim() || "Unknown";
  return DISPLAY_NAMES.of(normalized) ?? fallback?.trim() ?? normalized;
}
