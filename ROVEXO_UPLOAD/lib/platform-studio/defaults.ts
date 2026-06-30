import type {
  PlatformStudioAutomation,
  PlatformStudioComponentEntry,
  PlatformStudioDashboard,
  PlatformStudioDocument,
  PlatformStudioFieldConfig,
  PlatformStudioForm,
  PlatformStudioHistoryEntry,
  PlatformStudioPage,
  PlatformStudioRole,
  PlatformStudioWorkflow,
} from "@/lib/platform-studio/types";

const now = () => new Date().toISOString();

export function createDefaultPlatformStudioDocument(label = "ROVEXO Platform"): PlatformStudioDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    forms: createDefaultForms(),
    workflows: createDefaultWorkflows(),
    dashboards: createDefaultDashboards(),
    automations: createDefaultAutomations(),
    roles: createDefaultRoles(),
    fieldConfigs: createDefaultFieldConfigs(),
    pages: createDefaultPages(),
    componentRegistry: createDefaultComponentRegistry(),
    auditLog: [],
  };
}

export function createDefaultPlatformStudioHistory(): PlatformStudioHistoryEntry[] {
  return [];
}

function createDefaultForms(): PlatformStudioForm[] {
  return [
    {
      id: "seller-verification",
      moduleId: "seller",
      name: "Seller Verification",
      description: "Identity and business verification intake",
      status: "published",
      version: 1,
      updatedAt: now(),
      fields: [
        { id: "full-name", type: "text", label: "Full name", required: true, hidden: false, order: 0 },
        { id: "email", type: "email", label: "Email", required: true, hidden: false, order: 1 },
        { id: "phone", type: "phone", label: "Phone", required: true, hidden: false, order: 2 },
        { id: "country", type: "country", label: "Country", required: true, hidden: false, order: 3 },
        { id: "id-upload", type: "document-upload", label: "ID document", required: true, hidden: false, order: 4 },
        { id: "signature", type: "signature", label: "Signature", required: false, hidden: false, order: 5 },
      ],
    },
    {
      id: "listing-quick-create",
      moduleId: "seller",
      name: "Quick Listing Form",
      status: "draft",
      version: 1,
      updatedAt: now(),
      fields: [
        { id: "title", type: "text", label: "Title", required: true, hidden: false, order: 0 },
        { id: "price", type: "currency", label: "Price", required: true, hidden: false, order: 1 },
        { id: "description", type: "rich-text", label: "Description", required: false, hidden: false, order: 2 },
        { id: "photos", type: "image-upload", label: "Photos", required: true, hidden: false, order: 3 },
        { id: "category", type: "dropdown", label: "Category", required: true, hidden: false, order: 4 },
        { id: "ai-title", type: "ai-input", label: "AI title suggestions", required: false, hidden: false, order: 5 },
      ],
    },
  ];
}

function createDefaultWorkflows(): PlatformStudioWorkflow[] {
  return [
    {
      id: "seller-verification-flow",
      moduleId: "seller",
      name: "Seller Verification",
      status: "published",
      version: 1,
      updatedAt: now(),
      steps: [
        { id: "start", type: "action", label: "Form submitted", config: {}, next: ["review"] },
        { id: "review", type: "approval", label: "Admin approval", config: { role: "super_admin" }, next: ["notify"] },
        { id: "notify", type: "notification", label: "Notify seller", config: { channel: "email" } },
      ],
    },
    {
      id: "order-flow",
      moduleId: "orders",
      name: "Order Flow",
      status: "published",
      version: 1,
      updatedAt: now(),
      steps: [
        { id: "paid", type: "condition", label: "Order paid", config: { status: "paid" }, next: ["notify-seller"] },
        { id: "notify-seller", type: "email", label: "Email seller", config: {}, next: ["ship"] },
        { id: "ship", type: "action", label: "Await shipment", config: {} },
      ],
    },
    {
      id: "wallet-release",
      moduleId: "wallet",
      name: "Wallet Release",
      status: "draft",
      version: 1,
      updatedAt: now(),
      steps: [
        { id: "delivered", type: "condition", label: "Shipping delivered", config: {}, next: ["release"] },
        { id: "release", type: "action", label: "Release funds", config: {} },
      ],
    },
  ];
}

function createDefaultDashboards(): PlatformStudioDashboard[] {
  return [
    {
      id: "admin-overview",
      moduleId: "mission-control",
      name: "Admin Dashboard",
      audience: "admin",
      status: "published",
      version: 1,
      updatedAt: now(),
      widgets: [
        { id: "w1", type: "platform-health", label: "Platform Health", x: 0, y: 0, width: 4, height: 2 },
        { id: "w2", type: "orders", label: "Orders", x: 4, y: 0, width: 4, height: 2 },
        { id: "w3", type: "revenue", label: "Revenue", x: 8, y: 0, width: 4, height: 2 },
        { id: "w4", type: "live-users", label: "Live Users", x: 0, y: 2, width: 6, height: 2 },
        { id: "w5", type: "recent-activity", label: "Recent Activity", x: 6, y: 2, width: 6, height: 2 },
      ],
    },
    {
      id: "seller-dashboard",
      moduleId: "seller",
      name: "Seller Dashboard",
      audience: "seller",
      status: "published",
      version: 1,
      updatedAt: now(),
      widgets: [
        { id: "s1", type: "products", label: "My Listings", x: 0, y: 0, width: 6, height: 2 },
        { id: "s2", type: "orders", label: "Orders", x: 6, y: 0, width: 6, height: 2 },
        { id: "s3", type: "wallet", label: "Wallet", x: 0, y: 2, width: 12, height: 2 },
      ],
    },
  ];
}

function createDefaultAutomations(): PlatformStudioAutomation[] {
  return [
    {
      id: "seller-verified-unlock",
      moduleId: "seller",
      name: "IF Seller Verified THEN Unlock Features",
      trigger: { type: "seller.verified", label: "Seller verified" },
      conditions: [{ id: "c1", expression: "verification.status == approved" }],
      actions: [{ id: "a1", type: "unlock-features", label: "Unlock seller features" }],
      aiEnabled: false,
      status: "published",
      version: 1,
      updatedAt: now(),
    },
    {
      id: "order-paid-notify",
      moduleId: "orders",
      name: "IF Order Paid THEN Notify Seller",
      trigger: { type: "order.paid", label: "Order paid" },
      conditions: [],
      actions: [
        { id: "a1", type: "notify", label: "Notify seller", config: { channel: "push" } },
        { id: "a2", type: "email", label: "Send email", config: {} },
      ],
      aiEnabled: false,
      status: "published",
      version: 1,
      updatedAt: now(),
    },
    {
      id: "report-notify-mods",
      moduleId: "support",
      name: "IF Report Submitted THEN Notify Moderators",
      trigger: { type: "report.submitted", label: "Report submitted" },
      conditions: [{ id: "c1", expression: "report.severity >= high" }],
      actions: [{ id: "a1", type: "internal-message", label: "Alert moderators" }],
      aiEnabled: true,
      status: "draft",
      version: 1,
      updatedAt: now(),
    },
  ];
}

function createDefaultRoles(): PlatformStudioRole[] {
  return [
    {
      id: "super-admin",
      name: "Super Admin",
      description: "Full platform control",
      permissions: [
        "read", "write", "publish", "delete", "approve", "reject", "refund", "withdraw", "moderate",
        "manage-ai", "manage-theme", "manage-assets", "manage-users", "manage-orders", "manage-shipping", "manage-payments",
      ],
      status: "published",
    },
    {
      id: "support-agent",
      name: "Support Agent",
      permissions: ["read", "write", "moderate"],
      status: "published",
    },
    {
      id: "theme-editor",
      name: "Theme Editor",
      permissions: ["read", "write", "manage-theme", "manage-assets", "publish"],
      status: "draft",
    },
  ];
}

function createDefaultFieldConfigs(): PlatformStudioFieldConfig[] {
  return [
    { id: "listing-title", moduleId: "seller", fieldKey: "title", label: "Listing title", hidden: false, required: true },
    { id: "listing-price", moduleId: "seller", fieldKey: "price", label: "Price", hidden: false, required: true, validation: { min: 0 } },
    { id: "order-tracking", moduleId: "shipping", fieldKey: "trackingNumber", label: "Tracking number", hidden: false, required: false },
    { id: "wallet-balance", moduleId: "wallet", fieldKey: "balance", label: "Available balance", hidden: false, required: false },
  ];
}

function createDefaultPages(): PlatformStudioPage[] {
  return [
    { id: "homepage", name: "Homepage", pageType: "homepage", route: "/", componentIds: ["hero-slider", "category-rail"], status: "published", version: 1, updatedAt: now() },
    { id: "support-landing", name: "Support Landing", pageType: "support", route: "/support", componentIds: ["support-widget"], status: "draft", version: 1, updatedAt: now() },
    { id: "legal-privacy", name: "Privacy Policy", pageType: "legal", route: "/legal", componentIds: [], status: "published", version: 1, updatedAt: now() },
  ];
}

function createDefaultComponentRegistry(): PlatformStudioComponentEntry[] {
  return [
    { id: "comp-hero", type: "hero-slider", moduleId: "homepage", label: "Hero Slider", version: 1, shared: true, archived: false, updatedAt: now() },
    { id: "comp-category-rail", type: "category-rail", moduleId: "categories", label: "Category Rail", version: 1, shared: true, archived: false, updatedAt: now() },
    { id: "comp-order-table", type: "table", moduleId: "orders", label: "Orders Table", version: 1, shared: false, archived: false, updatedAt: now() },
  ];
}
