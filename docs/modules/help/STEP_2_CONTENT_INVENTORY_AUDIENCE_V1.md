# Help / Legal / Support — Step 2 Content Inventory + Audience Foundation

**STATUS: REVIEW**  
**Scope:** In-code audience model and inventory. No CMS. No Legal rewrite. No migrations.

## What changed

- Added `audience?: "shared" | "individual" | "business"` to existing Help/Legal in-code types.
- One filter SSOT: `lib/help/help-content-audience-v1.ts`
- One server resolver: `resolveViewerHelpAudiences()` using `getAuthContext` + `loadActiveSellerContext(userId)`
- `searchHelpCentre()` now filters by audience (default guest = shared only)
- Help routes are `force-dynamic` and do not render out-of-audience title/summary/content
- Support tickets stamp `accountType` from seller context; client value is discarded
- Legacy unused topics stay in-code but are excluded from current search/category rendering

## What did not change

- Legal wording, effective dates, versioning
- Privacy Policy vs Settings Privacy (still separate)
- Auth, Stripe, Checkout, Shipping, Wallet, Inbox, Orders, Inventory, Sell, Homepage
- `support_tickets` schema, rate limits, Zod categories, uploads
- `content_reports` and Protection cases (still separate)
- No Legal CMS, no `help_articles` application reads, no second search engine

## Classification policy

- **shared:** guests + Individual + Business (canonical marketplace actions)
- **individual:** Individual-specific only (none live in current Help articles)
- **business:** genuinely Business-specific — currently `business-storefront-tips` only

## Inventory SSOT

`lib/help/help-content-inventory-v1.ts` — derived from live Help/Legal/Support constants.

## Privacy

| Surface | Route |
|---|---|
| Privacy Policy | `/legal/privacy-policy` |
| Privacy controls | `/account/privacy` |

## Owner / legal review

All Legal documents remain shared and flagged for Owner/legal review (Phase C.1 Personal Account-only wording vs live Business `seller_context`). Do not invent Business legal terms.
