/** Routes that render the sell listing form — no marketplace chrome. */
export const SELL_FLOW_PREFIXES = ["/sell"] as const;

const SELL_FLOW_PATTERNS = [
  /^\/seller\/listings\/[^/]+\/edit\/?$/,
] as const;

export function isSellFlowRoute(pathname: string): boolean {
  if (
    SELL_FLOW_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }

  return SELL_FLOW_PATTERNS.some((pattern) => pattern.test(pathname));
}
