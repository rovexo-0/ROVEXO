export { INTELLIGENCE_MODULE_IDS } from "@/lib/marketplace-intelligence/defaults";

export const INTELLIGENCE_DASHBOARD_SECTIONS = [
  { id: "health", label: "Marketplace Health" },
  { id: "categories", label: "Category Health" },
  { id: "sellers", label: "Seller Health" },
  { id: "buyers", label: "Buyer Activity" },
  { id: "listings", label: "Listing Quality" },
  { id: "search", label: "Search Quality" },
  { id: "inventory", label: "Inventory Health" },
  { id: "opportunities", label: "Opportunities" },
  { id: "trends", label: "Trends" },
  { id: "featured", label: "Featured" },
  { id: "config", label: "Configuration" },
] as const;
