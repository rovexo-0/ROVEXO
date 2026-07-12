/** LAUNCH_CERTIFICATION_MASTER_SPEC v1.1 — Document 1 + Document 2 SSOT */

export const LAUNCH_CERTIFICATION_VERSION = "v1.1" as const;

export const LAUNCH_CERTIFICATION_COPY = {
  deploymentNotLaunch:
    "Production Deployment ≠ Official Launch. Deployment begins Certification. Certification authorizes Launch.",
  launchBlocked:
    "Official Launch is approved ONLY when 100% Certification Passed with 0 Critical Bugs.",
} as const;

/** Production certification environment — www.rovexo.co.uk stack. */
export const CERTIFICATION_ENVIRONMENT = {
  productionUrl: "https://www.rovexo.co.uk",
  services: [
    "production_server",
    "production_database",
    "production_storage",
    "production_cdn",
    "production_email",
    "production_stripe",
    "production_parcel2go",
    "production_notifications",
    "production_monitoring",
  ],
} as const;

/** Private mode rules during certification phase. */
export const PRIVATE_MODE_RULES = {
  searchEngines: "noindex",
  advertisements: false,
  publicAnnouncement: false,
  access: "invited_testers_only",
  publicRegistration: false,
  guestBrowsing: "optional",
} as const;

/** Buyer demo certification flow — Document 1 § BUYER DEMO TEST. */
export const BUYER_DEMO_TEST_STEPS = [
  "login",
  "logout",
  "registration",
  "verification",
  "search",
  "categories",
  "favourite",
  "chat",
  "add_to_cart",
  "make_offer",
  "buy_now",
  "checkout",
  "payment",
  "order_history",
  "tracking",
  "review",
  "notifications",
  "everything_ok",
  "logout",
] as const;

/** Seller demo certification flow — Document 1 § SELLER DEMO TEST. */
export const SELLER_DEMO_TEST_STEPS = [
  "login",
  "publish_listing",
  "edit_listing",
  "delete_listing",
  "offers",
  "orders",
  "generate_shipping_label",
  "share_label",
  "print_label",
  "download_pdf",
  "tracking",
  "wallet",
  "withdraw",
  "notifications",
  "reviews",
  "logout",
] as const;

/** Admin certification flow — Document 1 § ADMIN TEST. */
export const ADMIN_DEMO_TEST_STEPS = [
  "users",
  "listings",
  "orders",
  "payments",
  "reports",
  "flags",
  "moderation",
  "refunds",
  "support",
] as const;

/** Super Admin certification flow — Document 1 § SUPER ADMIN TEST. */
export const SUPER_ADMIN_DEMO_TEST_STEPS = [
  "platform_fee",
  "company_wallet",
  "analytics",
  "finance",
  "categories",
  "brands",
  "marketplace_knowledge_base",
  "theme_manager",
  "performance",
  "security",
  "system_health",
] as const;

/** Full transaction certification — Document 1 § FULL TRANSACTION TEST. */
export const FULL_TRANSACTION_TEST_STEPS = [
  "seller_publishes_listing",
  "buyer_finds_listing",
  "buyer_sends_offer",
  "seller_accepts",
  "checkout",
  "payment",
  "order_created",
  "shipping_label_generated",
  "share_label",
  "print_label",
  "parcel_dispatched",
  "tracking_updates",
  "delivered",
  "buyer_confirms_everything_ok",
  "funds_released",
  "seller_wallet",
  "withdraw",
  "company_platform_fee_verified",
  "transaction_completed",
] as const;

/** Negative test scenarios — Document 1 § NEGATIVE TESTS. */
export const NEGATIVE_TEST_SCENARIOS = [
  "cancel_payment",
  "decline_offer",
  "expired_offer",
  "delete_listing_during_negotiation",
  "network_interruption",
  "duplicate_taps",
  "lost_internet",
  "browser_refresh",
  "device_restart",
  "session_timeout",
] as const;

export const DEVICE_CERTIFICATION_TARGETS = [
  "iphone",
  "ipad",
  "samsung",
  "google_pixel",
  "android_tablet",
  "mac",
  "windows",
  "chromeos",
] as const;

export const BROWSER_CERTIFICATION_TARGETS = [
  "safari",
  "chrome",
  "edge",
  "firefox",
  "samsung_internet",
  "pwa",
] as const;

export const PERFORMANCE_CERTIFICATION_SURFACES = [
  "homepage",
  "search",
  "product_details",
  "sell",
  "checkout",
  "chat",
  "wallet",
  "tracking",
] as const;

export const SECURITY_CERTIFICATION_AREAS = [
  "authentication",
  "authorization",
  "payments",
  "storage",
  "uploads",
  "api_protection",
  "rate_limiting",
  "csrf",
  "xss",
  "sql_injection",
  "permission_validation",
  "audit_logs",
] as const;

export const ACCESSIBILITY_CERTIFICATION_AREAS = [
  "wcag_aa",
  "voiceover",
  "talkback",
  "keyboard_navigation",
  "focus_order",
  "contrast",
  "dynamic_text",
  "reduced_motion",
] as const;

export const SEO_CERTIFICATION_AREAS = [
  "canonical_urls",
  "meta_tags",
  "structured_data",
  "sitemap",
  "robots",
  "open_graph",
  "twitter_cards",
  "indexing_rules",
] as const;

/** Production bug policy — Document 1 § PRODUCTION BUG POLICY. */
export const PRODUCTION_BUG_POLICY = {
  critical: { label: "Critical", launchBlocker: true, action: "launch_blocker" },
  high: { label: "High", launchBlocker: false, action: "must_fix_before_launch" },
  medium: { label: "Medium", launchBlocker: false, action: "review_before_launch" },
  low: { label: "Low", launchBlocker: false, action: "may_schedule_after_launch" },
} as const;

/** Module certification checklist — Document 1 § CERTIFICATION CHECKLIST. */
export const CERTIFICATION_CHECKLIST = [
  { id: "sell", label: "Sell", requiredStatus: "pass" as const },
  { id: "product_details", label: "Product Details", requiredStatus: "pass" as const },
  { id: "checkout", label: "Checkout", requiredStatus: "pass" as const },
  { id: "transaction_hub", label: "Transaction Hub", requiredStatus: "pass" as const },
  { id: "wallet", label: "Wallet", requiredStatus: "pass" as const },
  { id: "orders", label: "Orders", requiredStatus: "pass" as const },
  { id: "tracking", label: "Tracking", requiredStatus: "pass" as const },
  { id: "notifications", label: "Notifications", requiredStatus: "pass" as const },
  { id: "reviews", label: "Reviews", requiredStatus: "pass" as const },
  { id: "admin", label: "Admin", requiredStatus: "pass" as const },
  { id: "super_admin", label: "Super Admin", requiredStatus: "pass" as const },
  { id: "seo", label: "SEO", requiredStatus: "pass" as const },
  { id: "security", label: "Security", requiredStatus: "pass" as const },
  { id: "performance", label: "Performance", requiredStatus: "pass" as const },
  { id: "accessibility", label: "Accessibility", requiredStatus: "pass" as const },
] as const;

/** Final approval gates — Document 1 § FINAL APPROVAL. */
export const FINAL_APPROVAL_GATES = [
  "certification_100_percent_passed",
  "zero_critical_bugs",
  "zero_data_loss",
  "zero_payment_issues",
  "zero_security_issues",
  "zero_broken_user_flows",
] as const;
