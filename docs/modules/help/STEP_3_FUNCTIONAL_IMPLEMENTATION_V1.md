# Help / Legal / About / Support — Step 3 Functional Implementation

**STATUS: REVIEW**  
**Scope:** In-place Help/About/Legal/Support UX. No CMS. No Legal rewrite. No migrations. No commit.

## What changed

- Help homepage: current categories, search, FAQ / Privacy Policy / Privacy Settings / Legal / About / Contact Support / Report
- Business storefront article shown only when server-resolved audience includes `business`
- Article pages: breadcrumbs, summary, content, last updated, related (audience-filtered), Contact Support, existing yes/no prompt
- Help search remains `searchHelpCentre()` only; audience + legacy topic exclusion from Step 2
- About page (`/about`) uses Account design system and links only to existing Help / Legal / Support / Search / Sell / Trust
- Individual ↔ Business switch refreshes Help via `SELLER_CONTEXT_CHANGED_EVENT` → `router.refresh()` (server audience remains authority)
- Markdown hrefs reject `javascript:`, protocol-relative, and non-http(s)/mailto schemes
- Stale Help/FAQ copy aligned to live behaviour (fees, shipping quotes, promotions not live, one ROVEXO account)

## What did not change

- Legal wording, effective date, aliases, in-code SSOT
- Privacy Policy vs Privacy Settings (still separate engines and routes)
- Auth, Stripe, Checkout, Shipping, Wallet, Inbox, Orders, Inventory, Sell, Homepage
- `support_tickets`, rate limits, Zod categories, uploads, ticket numbering
- `content_reports` and Protection cases (still separate)
- No Legal CMS, no Help CMS, no `/help-v2`, no second search or ticket engine

## Privacy

| Surface | Route |
|---|---|
| Privacy Policy | `/legal/privacy-policy` |
| Privacy Settings | `/account/privacy` |

## Owner / legal flags (not rewritten)

- Legal Phase C.1 Personal Account-only wording vs live Business `seller_context`
- Protection timing hours remain in product/legal — Help does not invent hours
- Shipping: live quotes / label flow only — no invented carriers
- Promote / featured / bumps remain not a live v1 product
