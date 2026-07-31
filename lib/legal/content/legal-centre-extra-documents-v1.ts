import type { LegalDocument } from "@/lib/legal/types";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/document-shared";

/**
 * Legal Centre Consolidation v1.0 — additional canonical documents.
 * Buyer/Seller Protection, GDPR & Data Rights, Legal Changelog.
 * Do not duplicate Platform Fee, Privacy, or Terms bodies — link instead.
 */

export const LEGAL_CENTRE_EXTRA_DOCUMENTS: LegalDocument[] = [
  {
    slug: "buyer-protection",
    title: "Buyer Protection",
    summary: "How ROVEXO protects buyers — payments, delivery issues, refunds and disputes.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Buyer Protection

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Introduction

**What:** Buyer Protection explains the safeguards available when you buy through ROVEXO Checkout using your Personal Account.

**Why:** Buyers should know what is protected, what is not, and where to go next without reading every related policy twice.

**Important:** This document explains **buyer rights and protections only**. Contract detail lives in [Buyer Terms](/legal/buyer-terms) and [Terms & Conditions](/legal/terms-and-conditions).

## 2. Purpose

**What:** Describe on-platform payment protection, delivery and item issues, refunds, and dispute paths for buyers.

## 3. Who this applies to

**What:** Anyone purchasing on ROVEXO as a buyer with a Personal Account.

## 4. Definitions

**What:**

- **On-platform payment** — paying only through ROVEXO Checkout (Stripe).
- **Total Buyer Pays** — the Checkout total, including the buyer-paid [Platform Fee](/legal/platform-fee-policy).
- **Conversation Hub** — the order thread for messages, status and actions.

## 5. Detailed explanation

**What:** Buyer Protection applies to eligible purchases completed through ROVEXO Checkout.

**How:**

1. Pay only on ROVEXO — off-platform payments are not protected.
2. Keep communication in Messages / Conversation Hub.
3. Track delivery from Orders and the Hub.
4. Raise item-not-received or not-as-described issues using in-product actions.
5. Escalate through [Complaint & Dispute Resolution](/legal/complaint-dispute-resolution) and [Contact Support](/support) when needed.

**Notes:** Platform Fee amounts and calculation live only in the [Platform Fee Policy](/legal/platform-fee-policy) — this page does not repeat fee schedules.

**Important:** Seller Fee is £0. Buyers pay the Platform Fee as part of Checkout.

## 6. Step-by-step guidance

**How:**

1. Complete Checkout and save your confirmation.
2. Watch Notifications for shipping updates.
3. If delayed or wrong, message the seller in the Hub first where appropriate.
4. Open an issue / Contact Support with evidence (photos, tracking).
5. Follow refund outcomes under the [Returns & Refund Policy](/legal/returns-refund-policy).

## 7. Examples

**Example:** You pay via Checkout. The parcel never arrives. You open the Hub issue flow with tracking evidence — Buyer Protection paths apply.

**Example:** A seller asks for bank transfer in chat. Refuse, report, and do not pay — that payment would sit outside Buyer Protection.

## 8. Common mistakes

**What:** Paying outside ROVEXO; deleting chat evidence; ignoring tracking updates; expecting protection on prohibited items you knowingly purchased in breach of policy.

## 9. Frequently Asked Questions

- **Does Buyer Protection cover off-platform payments?** No.
- **Who pays the Platform Fee?** The buyer — see [Platform Fee Policy](/legal/platform-fee-policy).
- **Where are full buyer contract terms?** [Buyer Terms](/legal/buyer-terms).
- **What about shipping delays?** See [Shipping Policy](/legal/shipping-policy) and [Delivery Policy](/legal/delivery-policy).

## 10. Common questions

- **Is Seller Protection the same document?** No — see [Seller Protection](/legal/seller-protection).
- **Can I get a refund?** Follow [Returns & Refund Policy](/legal/returns-refund-policy) and Hub actions.

## 11. Related Documents

- [Terms & Conditions](/legal/terms-and-conditions)
- [Buyer Terms](/legal/buyer-terms)
- [Returns & Refund Policy](/legal/returns-refund-policy)
- [Platform Fee Policy](/legal/platform-fee-policy)
- [Shipping Policy](/legal/shipping-policy)
- [Delivery Policy](/legal/delivery-policy)
- [Complaint & Dispute Resolution](/legal/complaint-dispute-resolution)
- [Seller Protection](/legal/seller-protection)
- [Community Guidelines](/legal/community-guidelines)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "seller-protection",
    title: "Seller Protection",
    summary: "How ROVEXO supports sellers — payouts, false claims, prohibited goods and fulfilment duties.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Seller Protection

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Introduction

**What:** Seller Protection explains seller-side safeguards and obligations when you sell on ROVEXO with your Personal Account.

**Why:** Sellers need clarity on payouts, unfair claims, and compliance without duplicating Seller Terms.

**Important:** This document covers **seller obligations and protections**. Full commercial terms live in [Seller Terms](/legal/seller-terms).

## 2. Purpose

**What:** Explain Wallet proceeds, fulfilment duties, prohibited inventory risk, and how false or abusive buyer claims are handled.

## 3. Who this applies to

**What:** Anyone listing or fulfilling sales on ROVEXO.

## 4. Definitions

**What:**

- **Seller Fee = £0** — ROVEXO does not charge a seller commission on the item price.
- **Platform Fee** — paid by the buyer at Checkout; details only in [Platform Fee Policy](/legal/platform-fee-policy).
- **Available Balance** — Wallet funds you may withdraw under [Wallet Terms](/legal/wallet-terms).

## 5. Detailed explanation

**What:** Seller Protection assumes you list Allowed/Restricted goods honestly, ship on time with tracking where provided, and keep chat on ROVEXO.

**How:**

1. Follow [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items).
2. Fulfil paid orders via Orders / Conversation Hub and shipping flows.
3. Retain proof of postage and condition disclosures.
4. Respond to buyer issues factually inside the Hub.
5. Withdraw Available Balance under Wallet rules.

**Notes:** Do not copy Platform Fee schedules here — link the fee policy. Do not ask buyers to pay outside ROVEXO.

## 6. Step-by-step guidance

**How:**

1. Publish accurate listings via Sell.
2. After payment, create label / ship promptly.
3. Update tracking and keep evidence.
4. If a claim appears false, reply with evidence in the Hub and Support.
5. Withdraw when funds are Available.

## 7. Examples

**Example:** You ship with tracking on day two. Buyer claims non-receipt while tracking shows delivered — provide Hub evidence for review.

**Example:** You list a prohibited weapon — Seller Protection does not apply; the listing is removed under compliance rules.

## 8. Common mistakes

**What:** Off-platform payment requests; shipping without proof; listing prohibited items; adding a fake “seller fee” onto buyers.

## 9. Frequently Asked Questions

- **Is there a Seller Fee?** No — Seller Fee is £0.
- **Who pays Platform Fee?** The buyer — see [Platform Fee Policy](/legal/platform-fee-policy).
- **Where are full seller contract terms?** [Seller Terms](/legal/seller-terms).

## 10. Common questions

- **When can I withdraw?** When Balance shows Available — see [Wallet Terms](/legal/wallet-terms).
- **What if I am suspended?** See [Account Suspension Policy](/legal/account-suspension-policy).

## 11. Related Documents

- [Seller Terms](/legal/seller-terms)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Platform Fee Policy](/legal/platform-fee-policy)
- [Wallet Terms](/legal/wallet-terms)
- [Shipping Policy](/legal/shipping-policy)
- [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)
- [Acceptable Use Policy](/legal/acceptable-use-policy)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Complaint & Dispute Resolution](/legal/complaint-dispute-resolution)
- [Buyer Protection](/legal/buyer-protection)
- [Digital Platform Reporting & Tax Notice](/legal/digital-platform-reporting-tax-notice)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "gdpr-data-rights",
    title: "GDPR & Data Rights",
    summary: "UK GDPR rights on ROVEXO — access, correction, deletion, objection and how to exercise them.",
    category: "privacy",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# GDPR & Data Rights

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Introduction

**What:** This page explains your UK data protection rights when using ROVEXO and how to exercise them.

**Why:** Rights should be easy to find without repeating the full [Privacy Policy](/legal/privacy-policy).

**Important:** Detailed processing purposes, categories of data, and retention periods live in Privacy Policy and [Data Retention Policy](/legal/data-retention-policy). This document focuses on **rights and how to use them**.

## 2. Purpose

**What:** List your rights and the practical steps to request them via Settings and Support.

## 3. Who this applies to

**What:** Individuals with a ROVEXO Personal Account (and visitors where cookies/preferences apply — see [Cookie Policy](/legal/cookie-policy)).

## 4. Definitions

**What:**

- **Controller** — see operator details in the [Privacy Policy](/legal/privacy-policy).
- **Data subject request** — a request to exercise a GDPR right.
- **Settings privacy controls** — in-product preference tools under Settings → Privacy.

## 5. Detailed explanation

**What:** Depending on UK GDPR, you may have rights to access, rectification, erasure, restriction, portability, objection, and rights related to automated decision-making where applicable.

**How:**

1. Use **Settings → Privacy** for available self-serve controls.
2. Update profile details you can edit yourself.
3. For formal rights requests, contact [Contact Support](/support) with subject **GDPR / Data Rights**.
4. We may need to verify your identity before fulfilling a request.
5. Legal retention, fraud, or accounting needs may limit erasure — explained in [Data Retention Policy](/legal/data-retention-policy).

**Notes:** Do not paste the full Privacy Policy here — always link it.

## 6. Step-by-step guidance

**How:**

1. Open Settings → Privacy.
2. Adjust marketing/notification preferences where available.
3. Email or Support-ticket a clear rights request if self-serve is not enough.
4. Keep your account email reachable for verification.

## 7. Examples

**Example:** You want a copy of your account data → Support request “Subject access request” with your account email.

**Example:** You want marketing stopped → use Settings privacy/notification controls first.

## 8. Common mistakes

**What:** Opening multiple duplicate GDPR tickets; requesting deletion while open disputes/orders still require retention; confusing cookie banners with full erasure.

## 9. Frequently Asked Questions

- **Where is the full privacy notice?** [Privacy Policy](/legal/privacy-policy).
- **Where are cookies explained?** [Cookie Policy](/legal/cookie-policy).
- **Does deletion remove legal records immediately?** Not always — see Data Retention Policy.

## 10. Common questions

- **How long do you keep data?** [Data Retention Policy](/legal/data-retention-policy).
- **Who is the platform operator?** Stated in Privacy Policy / Terms.

## 11. Related Documents

- [Privacy Policy](/legal/privacy-policy)
- [Cookie Policy](/legal/cookie-policy)
- [Data Retention Policy](/legal/data-retention-policy)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "legal-changelog",
    title: "Legal Changelog / Version History",
    summary: "Version history for ROVEXO legal documents — what changed and when.",
    category: "governance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Legal Changelog / Version History

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Introduction

**What:** This changelog records material updates to ROVEXO Legal Centre documents.

**Why:** Users and auditors need a single place to see when policies changed without duplicating each policy’s full text.

## 2. Purpose

**What:** Publish dated notes for Legal Centre updates. Each policy’s live text remains the canonical version at its own URL.

## 3. Who this applies to

**What:** All ROVEXO users and anyone reviewing Legal Centre history.

## 4. Definitions

**What:**

- **Effective date** — the date a policy version applies.
- **Canonical document** — the single live page under \`/legal/{slug}\`.

## 5. Detailed explanation

**What:** When ROVEXO updates a legal document, the live page is rewritten in place and a summary entry is added here.

**How:** Read this changelog for history, then open the linked policy for the full current text.

## 6. Step-by-step guidance

**How:**

1. Scan the dated entries below.
2. Open the linked policy for full wording.
3. Contact Support if you need clarification about a past version.

## 7. Examples

**Example:** Platform Fee Policy clarifies buyer-paid fee and Seller Fee £0 — see fee policy page for full rules.

## 8. Common mistakes

**What:** Treating this changelog as a substitute for reading the live policy; assuming an old screenshot overrides the current canonical page.

## 9. Version history

### 30 July 2026 — Legal Centre Consolidation v1.0

**What:** Settings Legal section reduced to a single **Legal Information** entry. Legal Centre becomes the only navigation hub for policies.

**How:** Added Buyer Protection, Seller Protection, GDPR & Data Rights, and this Legal Changelog. Expanded Prohibited & Restricted Items into the compliance manual. Confirmed Seller Fee = £0 and buyer-paid Platform Fee in fee-related documents.

**Related:** [Legal Information](/legal) · [Platform Fee Policy](/legal/platform-fee-policy) · [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)

### 30 July 2026 — Phase C.3 Legal Documentation Rewrite

**What:** Professional structure applied across the Legal Centre (What/How/Common questions/Related Documents).

## 10. Common questions

- **Which text wins if changelog and policy differ?** The live policy page at \`/legal/{slug}\`.
- **Where is the Legal hub?** [Legal Information](/legal) from Settings.

## 11. Related Documents

- [Terms & Conditions](/legal/terms-and-conditions)
- [Privacy Policy](/legal/privacy-policy)
- [Platform Fee Policy](/legal/platform-fee-policy)
- [Buyer Protection](/legal/buyer-protection)
- [Seller Protection](/legal/seller-protection)
- [GDPR & Data Rights](/legal/gdpr-data-rights)
- [Legal Information](/legal)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
];
