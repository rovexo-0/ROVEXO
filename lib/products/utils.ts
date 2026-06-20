export function normalizeCondition(condition: string): string {
  const normalized = condition.trim().toLowerCase();
  if (normalized === "excellent") return "Very Good";
  if (normalized === "like new") return "Like New";
  if (normalized === "vintage") return "Good";
  return condition.trim();
}
