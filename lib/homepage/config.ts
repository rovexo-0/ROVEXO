export type HomepageMode = "production" | "closed_beta" | "demo";

export function resolveHomepageMode(): HomepageMode {
  // Bracket access — Next must not bake these to undefined at build time.
  const closedBeta =
    process.env["ROVEXO_HOMEPAGE_CLOSED_BETA"] === "1" ||
    process.env["NEXT_PUBLIC_ROVEXO_HOMEPAGE_CLOSED_BETA"] === "1";
  if (closedBeta) {
    return "closed_beta";
  }

  const demo =
    process.env["ROVEXO_HOMEPAGE_DEMO"] === "1" ||
    process.env["NEXT_PUBLIC_ROVEXO_HOMEPAGE_DEMO"] === "1" ||
    process.env["PLAYWRIGHT_E2E"] === "1";
  if (demo) {
    return "demo";
  }

  return "production";
}

export function isClosedBetaHomepageMode(): boolean {
  return resolveHomepageMode() === "closed_beta";
}

export function isHomepageEligibilityLoggingEnabled(): boolean {
  return process.env.ROVEXO_HOMEPAGE_ELIGIBILITY_LOG === "1";
}

export function parseApprovedTesterEmails(): Set<string> {
  const raw = process.env.ROVEXO_APPROVED_TESTER_EMAILS?.trim() ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}
