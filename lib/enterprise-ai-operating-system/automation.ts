export const AUTOMATION_SUGGESTIONS = [
  "cleanup",
  "optimisation",
  "archiving",
  "scaling",
  "backups",
  "health-checks",
  "security-checks",
  "dependency-validation",
  "configuration-validation",
] as const;

export type AutomationSuggestion = (typeof AUTOMATION_SUGGESTIONS)[number];

export function listAutomationSuggestions(): AutomationSuggestion[] {
  return [...AUTOMATION_SUGGESTIONS];
}

export function buildAutomationQueue(suggestions: AutomationSuggestion[]): Array<{ id: string; action: AutomationSuggestion; status: "queued" | "suggested" }> {
  return suggestions.map((action, i) => ({
    id: `auto-${action}-${i}`,
    action,
    status: "suggested" as const,
  }));
}

export function suggestAutomationsForModule(moduleId: string): AutomationSuggestion[] {
  if (moduleId.includes("recovery")) return ["backups", "health-checks"];
  if (moduleId.includes("security")) return ["security-checks", "configuration-validation"];
  if (moduleId.includes("workflow")) return ["dependency-validation", "health-checks"];
  return ["optimisation", "health-checks"];
}
