import "server-only";

type MarketplaceLogLevel = "info" | "warn" | "error";

export function logMarketplaceEvent(
  level: MarketplaceLogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const payload = {
    scope: "marketplace-connector",
    level,
    message,
    ...context,
    at: new Date().toISOString(),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  console.info(JSON.stringify(payload));
}
