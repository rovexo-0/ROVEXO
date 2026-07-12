/**
 * Shared taxonomy utilities — slug, dedupe, validation helpers.
 */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function dedupeSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function dedupeByKey<T>(items: readonly T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Deterministic cartesian expansion — only valid combinations. */
export function expandCombinations(
  bases: readonly string[],
  prefixes: readonly string[],
  suffixes: readonly string[],
): string[] {
  const results: string[] = [];
  for (const base of bases) {
    results.push(base);
    for (const prefix of prefixes) {
      if (prefix) results.push(`${prefix} ${base}`);
    }
    for (const suffix of suffixes) {
      if (suffix) results.push(`${base} ${suffix}`);
    }
    for (const prefix of prefixes) {
      for (const suffix of suffixes) {
        if (prefix && suffix) results.push(`${prefix} ${base} ${suffix}`);
      }
    }
  }
  return dedupeSorted(results);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized;
  const num = Number.parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}
