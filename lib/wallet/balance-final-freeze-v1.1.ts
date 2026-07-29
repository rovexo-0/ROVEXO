/**
 * ROVEXO BALANCE FINAL FREEZE v1.1
 * ABSOLUTE AUTHORITY · LEVEL 8 · SSOT · OWNER APPROVED · LOCKED
 *
 * Account → Balance (title) → /wallet → Wallet Financial Engine
 *
 * Blood XIII (2026-07-23 Owner): canonical hub route = `/wallet`.
 * Visible title remains "Balance". Legacy `/balance` redirects to `/wallet`.
 * ONE Balance title · ONE Wallet Engine · ZERO duplications
 */

export const BALANCE_FINAL_FREEZE_V1_1 = {
  version: "1.1",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  ssotReady: true,
  level: 8,
  /** Owner Blood XIII supersedes hub path only — title/engine unchanged. */
  routeSupersededBy: "lib/supreme-blood-code-xiii-v1.ts",

  equation: {
    balance: "Balance",
    engine: "Wallet Financial Engine",
    width: "100% Full Width",
    design: "Profile colours + icon family",
    routeChangeOnly: "/balance → /wallet",
    titleChangeOnly: "Wallet → Balance",
  } as const,

  visibleTitle: "Balance",
  canonicalRoute: "/wallet",
  legacyHubRedirect: "/balance",
  pageNameConstant: "BALANCE_PAGE_NAME",

  architecture: {
    profile: "/account",
    balance: "/wallet",
    engine: "Wallet Financial Engine",
    financialComponents: true,
    fullWidth: true,
  } as const,

  forbiddenUserLabels: [
    "Wallet",
    "Wallet v2",
    "Financial Hub",
    "Balance v2",
  ] as const,

  forbiddenUserRoutes: [
    "/account → Balance v2",
    "/account → Financial Hub",
    "/account → Wallet v2",
  ] as const,

  reuseOnly: {
    walletImplementation: true,
    walletComponents: true,
    walletLogic: true,
    designTokens: true,
    icons: true,
    colours: true,
    animations: true,
    responsiveness: true,
  } as const,

  keepExactly: [
    "Available Balance",
    "Available status badge",
    "Withdraw",
    "Bank Account",
    "Transactions",
    "Insights",
    "View All",
    "This Month",
    "Next Payout",
    "Transaction history",
    "Empty states",
    "Loading states",
    "Skeletons",
    "Financial calculations",
    "Bottom Navigation",
    "Wallet cards",
    "Wallet gradients",
    "Wallet shadows",
    "Wallet layouts",
    "Balance hero banking artwork",
  ] as const,

  /** Balance Visual Refinement v1.0 — removed from Balance hub presentation only. */
  removedFromHubPresentation: [
    "Connected Bank section",
    "Quick Actions",
    "Add Bank quick action",
    "Payment Methods quick action",
  ] as const,

  fullWidth: {
    width: "100%",
    maxWidth: "100%",
    minWidth: "100%",
    forbidden: [
      "max-width cards",
      "centered containers",
      "reduced width layouts",
      "duplicated layouts",
    ] as const,
  } as const,

  inheritFromProfile: [
    "colours",
    "spacing",
    "icon family",
    "typography",
    "padding system",
    "premium compact language",
    "responsiveness",
  ] as const,

  forbidden: [
    "new Balance system",
    "duplicate Wallet logic",
    "Balance v2",
    "Wallet v2",
    "Financial Hub",
    "Buyer Wallet",
    "Seller Wallet",
    "Wallet Pro",
    "Balance Pro",
    "Stripe modifications",
    "Supabase modifications",
    "Transactions logic changes",
    "Withdraw logic changes",
    "Payment Methods logic changes",
    "Bank Account logic changes",
    "Bottom Navigation changes",
    "blue redesign",
    "black redesign",
    "grey redesign",
    "material redesign",
    "bootstrap redesign",
    "architecture changes",
    "new financial systems",
  ] as const,

  financialRule: {
    noFinancialCodeChanges: true,
    preserve: [
      "Stripe logic",
      "Wallet Financial Engine",
      "Withdraw logic",
      "Transactions logic",
      "Payment methods logic",
      "Bank accounts logic",
      "Payout logic",
      "balances logic",
    ] as const,
  } as const,

  scalability: {
    oneEngineOnly: true,
    futureModulesUseSameEngine: [
      "Buyer Balance",
      "Seller Balance",
      "Business Balance",
      "Staff Balance",
      "Admin Balance",
      "Super Admin Balance",
    ] as const,
  } as const,

  ssot: {
    freeze: "lib/wallet/balance-final-freeze-v1.1.ts",
    legacyFreeze: "lib/wallet/balance-master-freeze-v1.ts",
    hub: "features/wallet/components/WalletHubV1.tsx",
    page: "features/wallet/components/WalletPage.tsx",
    route: "app/balance/page.tsx",
    legacyHubRedirect: "app/wallet/page.tsx",
    productionUi: "features/wallet/components/WalletHubV1.tsx",
    productionCss: "styles/rovexo/wallet-hub-v1.css",
    insights: "features/wallet/components/WalletInsights.tsx",
    recentTransactions: "features/wallet/components/WalletRecentTransactions.tsx",
    connectedBank: "features/wallet/components/WalletConnectedBank.tsx",
    balanceHub: "lib/wallet/balance-hub-v1.ts",
    canonicalRoutes: "lib/wallet/canonical-routes.ts",
    profileMenu: "lib/account-center/canonical-menu.ts",
  } as const,

  certification: {
    passOnlyAt: 100,
    required: [
      "Balance",
      "Route",
      "Wallet Engine",
      "Full Width",
      "Responsive",
      "Build",
      "TypeScript",
      "ESLint",
      "Financial Logic",
      "Stripe",
      "Supabase",
      "Profile Colours",
      "Profile Icons",
      "Wallet Components",
      "Zero Duplications",
      "Zero Architecture Changes",
    ] as const,
  } as const,
} as const;

export type BalanceFinalFreezeV11 = typeof BALANCE_FINAL_FREEZE_V1_1;

/** @deprecated Use BALANCE_FINAL_FREEZE_V1_1 — Blood XIII hub route = /wallet. */
export const BALANCE_MASTER_FREEZE_V1 = {
  ...BALANCE_FINAL_FREEZE_V1_1,
  version: "1.1",
} as const;
