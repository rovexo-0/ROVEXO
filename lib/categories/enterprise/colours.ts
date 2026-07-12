/**
 * Enterprise marketplace colour database — re-exports canonical SSOT from lib/colours.
 */

export type { MarketplaceColour } from "@/lib/colours";

export {
  MARKETPLACE_COLOURS,
  MARKETPLACE_PREMIUM_COLOURS,
  MARKETPLACE_BASIC_COLOURS,
  MARKETPLACE_EXPANDED_COLOURS,
  MARKETPLACE_COLOURS_BY_SCOPE,
  MARKETPLACE_COLOUR_LABELS,
  COLOUR_DATABASE,
  COLOUR_COUNT,
  validateColour,
  findColourByName,
} from "@/lib/colours";
