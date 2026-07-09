export { DEFAULT_MOS_RULES } from "@/lib/marketplace-os/defaults";

export const MOS_CONTROL_CENTER_SECTIONS = [
  { id: "status", label: "Marketplace Status" },
  { id: "health", label: "System Health" },
  { id: "automation", label: "Automation Queue" },
  { id: "rules", label: "Active Rules" },
  { id: "decisions", label: "Recent Decisions" },
  { id: "alerts", label: "Alerts" },
  { id: "opportunities", label: "Opportunities" },
  { id: "inventory", label: "Inventory Status" },
  { id: "performance", label: "Performance" },
  { id: "config", label: "Configuration" },
] as const;
