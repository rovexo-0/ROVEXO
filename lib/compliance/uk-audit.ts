export type UkComplianceArea =
  | "buyer"
  | "seller"
  | "business"
  | "wallet"
  | "checkout"
  | "shipping"
  | "notifications"
  | "personal_data"
  | "categories"
  | "restricted_products"
  | "tax_reporting"
  | "digital_platform_reporting"
  | "privacy"
  | "data_retention"
  | "moderation"
  | "product_safety"
  | "platform_fees"
  | "dispute_resolution";

export type UkComplianceStatus = "implemented" | "partial" | "missing";

export type UkComplianceFinding = {
  area: UkComplianceArea;
  status: UkComplianceStatus;
  requirement: string;
  implementation: string;
};

/** UK marketplace compliance audit SSOT — reviewed against implemented platform features. */
export const UK_COMPLIANCE_AUDIT: UkComplianceFinding[] = [
  {
    area: "buyer",
    status: "implemented",
    requirement: "Consumer checkout and order rights",
    implementation: "Checkout wizard, Orders, Returns & Refund Policy, Buyer Terms",
  },
  {
    area: "seller",
    status: "implemented",
    requirement: "Seller obligations and payouts",
    implementation: "Seller Terms, Wallet, withdraw flow, tax profile",
  },
  {
    area: "business",
    status: "implemented",
    requirement: "Business seller disclosures",
    implementation: "Business Seller Terms, business verification on profile",
  },
  {
    area: "wallet",
    status: "implemented",
    requirement: "Financial records and statements",
    implementation: "Wallet hub, monthly/annual statements, PDF export",
  },
  {
    area: "checkout",
    status: "implemented",
    requirement: "Transparent pricing and fees",
    implementation: "Platform Fee Policy, checkout summary",
  },
  {
    area: "shipping",
    status: "implemented",
    requirement: "Delivery expectations",
    implementation: "Shipping Policy, order tracking links",
  },
  {
    area: "notifications",
    status: "implemented",
    requirement: "Marketing and service communications",
    implementation: "Notification settings, quiet hours, UK GDPR privacy policy",
  },
  {
    area: "personal_data",
    status: "implemented",
    requirement: "UK GDPR rights and controller identity",
    implementation: "Privacy Policy, Settings privacy controls, delete account",
  },
  {
    area: "categories",
    status: "partial",
    requirement: "Category governance",
    implementation: "Category detection and moderation queue; ongoing catalogue review",
  },
  {
    area: "restricted_products",
    status: "implemented",
    requirement: "Prohibited items enforcement",
    implementation: "Prohibited & Restricted Items Policy, listing moderation, report tools",
  },
  {
    area: "tax_reporting",
    status: "implemented",
    requirement: "Seller tax information collection",
    implementation: "Seller tax registration, UTR/VAT fields, annual statements",
  },
  {
    area: "digital_platform_reporting",
    status: "implemented",
    requirement: "Platform operator reporting architecture",
    implementation: "Digital Platform Reporting notice, compliance export CSV, audit logs",
  },
  {
    area: "privacy",
    status: "implemented",
    requirement: "Cookie and privacy transparency",
    implementation: "Cookie Policy, Privacy Policy, /cookies redirect",
  },
  {
    area: "data_retention",
    status: "implemented",
    requirement: "Defined retention periods",
    implementation: "Data Retention Policy",
  },
  {
    area: "moderation",
    status: "implemented",
    requirement: "Content moderation and appeals",
    implementation: "Moderation dashboard, report APIs, Account Suspension Policy",
  },
  {
    area: "product_safety",
    status: "implemented",
    requirement: "Unsafe product reporting",
    implementation: "Report Listing/Seller UI, moderation pipeline",
  },
  {
    area: "platform_fees",
    status: "implemented",
    requirement: "Fee disclosure",
    implementation: "Platform Fee Policy, wallet fee lines",
  },
  {
    area: "dispute_resolution",
    status: "implemented",
    requirement: "Complaint handling",
    implementation: "Complaint & Dispute Resolution Policy, Contact Support",
  },
];

export function summarizeUkComplianceAudit(): {
  implemented: number;
  partial: number;
  missing: number;
  total: number;
} {
  const implemented = UK_COMPLIANCE_AUDIT.filter((item) => item.status === "implemented").length;
  const partial = UK_COMPLIANCE_AUDIT.filter((item) => item.status === "partial").length;
  const missing = UK_COMPLIANCE_AUDIT.filter((item) => item.status === "missing").length;
  return { implemented, partial, missing, total: UK_COMPLIANCE_AUDIT.length };
}
