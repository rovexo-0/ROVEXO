import {
  SEARCH_ENGINE_INDEXES,
  SEARCH_ENGINE_MODULE_IDS,
  SEARCH_ENGINE_SORT_OPTIONS,
  SEARCH_ENGINE_TYPES,
} from "@/lib/search-engine/registry";
import type { SearchEngineDocument, SearchEngineHistoryEntry } from "@/lib/search-engine/types";

const now = () => new Date().toISOString();

export function createDefaultSearchEngineDocument(label = "ROVEXO Search Engine"): SearchEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    modules: SEARCH_ENGINE_MODULE_IDS.map((m) => ({ ...m, enabled: true })),
    searchTypes: SEARCH_ENGINE_TYPES.map((t) => ({
      ...t,
      enabled: t.id !== "voice" && t.id !== "image" && t.id !== "semantic",
    })),
    filters: {
      category: true,
      subcategory: true,
      brand: true,
      condition: true,
      price: true,
      location: true,
      distance: true,
      sellerRating: true,
      businessSeller: true,
      verifiedSeller: true,
      delivery: true,
      collection: true,
      auction: true,
      buyNow: true,
      recentlyAdded: true,
      featuredListings: true,
      availability: true,
    },
    sortOptions: SEARCH_ENGINE_SORT_OPTIONS.map((s) => ({ ...s, enabled: true })),
    indexes: SEARCH_ENGINE_INDEXES.map((i) => ({ ...i, enabled: true })),
    performance: {
      instantResults: true,
      lazyLoading: true,
      caching: true,
      incrementalIndexing: true,
      fastRefresh: true,
      optimizedQueries: true,
    },
    apiSecurity: {
      roleBasedAccess: true,
      permissionValidation: true,
      rateLimiting: true,
      secureQueries: true,
      auditLogging: true,
    },
    aiAssistant: {
      globalEnabled: false,
      semanticSearch: true,
      querySuggestions: true,
      searchRanking: true,
      searchOptimization: true,
      typoCorrection: true,
      intentDetection: true,
      naturalLanguageSearch: true,
      execution: "local",
    },
    integrations: {
      ordersEngine: true,
      shippingEngine: true,
      walletEngine: true,
      paymentsEngine: true,
      protectionEngine: true,
      messagesEngine: true,
      notificationsEngine: true,
      analyticsEngine: true,
      securityEngine: true,
      missionControl: true,
    },
    futureReady: [
      "VIN Search",
      "OEM Number Search",
      "Barcode Search",
      "QR Search",
      "Image Recognition Search",
      "Voice Search",
      "Personalized Search",
      "Recommendation Engine",
    ],
    auditLog: [],
  };
}

export function createDefaultSearchEngineHistory(): SearchEngineHistoryEntry[] {
  return [];
}
