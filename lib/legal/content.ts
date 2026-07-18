import { OFFICIAL_EMAIL } from "@/lib/email/constants";

export const LEGAL_OPERATOR_NAME = "DNS EUROPA LTD";

export const LEGAL_SUPPORT_EMAIL = OFFICIAL_EMAIL;

export const LEGAL_WEBSITE_URL = "https://www.rovexo.co.uk";

/** England & Wales marketplace operator jurisdiction. */
export const LEGAL_JURISDICTION = "England and Wales";

/**
 * Optional Companies House number — set NEXT_PUBLIC_COMPANIES_HOUSE_NUMBER in env.
 * Never invent a number; omit when unset.
 */
export const LEGAL_COMPANY_NUMBER =
  process.env.NEXT_PUBLIC_COMPANIES_HOUSE_NUMBER?.trim() || null;

/**
 * Optional registered office — set NEXT_PUBLIC_LEGAL_REGISTERED_OFFICE in env.
 */
export const LEGAL_REGISTERED_OFFICE =
  process.env.NEXT_PUBLIC_LEGAL_REGISTERED_OFFICE?.trim() || null;

export const PLATFORM_OPERATOR_NOTICE = `ROVEXO is owned and operated by ${LEGAL_OPERATOR_NAME}.`;

export const TERMS_PLATFORM_OPERATOR_MARKDOWN = `## Platform Operator

ROVEXO is owned and operated by DNS EUROPA LTD.

DNS EUROPA LTD provides the marketplace technology, seller onboarding, payment infrastructure and customer support.

Payments are processed securely through Stripe.

Independent sellers remain responsible for their listings and fulfilment.

Jurisdiction: ${LEGAL_JURISDICTION}.`;

export const PRIVACY_DATA_CONTROLLER_MARKDOWN = `## Data Controller

DNS EUROPA LTD is the data controller for personal information processed through the ROVEXO platform in accordance with UK GDPR.`;
