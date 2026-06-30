import type { AiOperationsSnapshot } from "@/lib/super-admin/operations/types";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function runAiOperationsAssistant(input: {
  message: string;
  snapshot: AiOperationsSnapshot;
}): Promise<string> {
  const prompt = input.message.trim().toLowerCase();
  const { summary, issues, performance, security, logs } = input.snapshot;

  if (prompt.includes("degraded") || prompt.includes("health")) {
    const issueList = issues.map((i) => `- ${i.problem}: ${i.cause}`).join("\n");
    return [
      `Platform health is **${summary.platformHealth}** with ${summary.activeAlerts} active alert(s).`,
      issueList ? `Detected issues:\n${issueList}` : "No open issues from the latest scan.",
      "Review Dependency health on /super-admin/monitoring for live check messages.",
    ].join("\n\n");
  }

  if (prompt.includes("log") || prompt.includes("error")) {
    const recent = [...(logs.api ?? []), ...(logs.system ?? [])].slice(0, 5);
    if (!recent.length) return "No API or system errors logged in the last 24 hours.";
    return [
      "Recent errors:",
      ...recent.map((entry) => `• [${entry.level}] ${entry.message} (${entry.createdAt})`),
    ].join("\n");
  }

  if (prompt.includes("security")) {
    return [
      `Rate limiting: ${security.rateLimitingEnabled ? "enabled (Redis)" : "memory fallback"}`,
      `Failed logins (24h): ${security.failedLogins24h}`,
      `Security headers: ${security.securityHeaders.join(", ")}`,
      `JWT / session status: ${security.jwtStatus}`,
    ].join("\n");
  }

  if (prompt.includes("performance") || prompt.includes("slow")) {
    return [
      `API latency: ${performance.apiLatencyMs}ms`,
      `Response time: ${performance.responseTimeMs}ms`,
      `Error rate index: ${performance.errorRate}%`,
      "Recommendations are listed in the AI Recommendations panel — prioritise caching and image pipeline optimisations.",
    ].join("\n");
  }

  if (prompt.includes("fix") || prompt.includes("repair")) {
    if (!issues.length) return "No repairs needed — latest scan is clean.";
    const top = issues[0]!;
    return [
      `Top issue: **${top.problem}**`,
      `Cause: ${top.cause}`,
      `Suggested fix: ${top.suggestedFix}`,
      "Use the AI Repair Center to generate a patch. Fixes are never applied without your confirmation.",
    ].join("\n\n");
  }

  if (prompt.includes("migration") || prompt.includes("sql")) {
    return [
      "For schema changes, create a new file under `supabase/migrations/` — never edit applied migrations.",
      "Example: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`",
      "Test with `supabase db push` on staging before production.",
    ].join("\n");
  }

  if (prompt.includes("api route")) {
    return [
      "API routes live under `app/api/` using Next.js Route Handlers.",
      "Super Admin routes must call `requireApiSuperAdmin()` before executing.",
      "See `app/api/super-admin/operations/route.ts` as a reference pattern.",
    ].join("\n");
  }

  return [
    "I'm the ROVEXO Super Admin AI Operations assistant.",
    `Current status: ${summary.platformHealth} · ${summary.activeAlerts} alerts · ${summary.criticalIssues} critical.`,
    "Ask me to explain health, logs, security, performance, repairs, SQL migrations, or API routes.",
  ].join("\n");
}
