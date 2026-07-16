# ROVEXO v1.0 — Universal UI System Master Specification

**Document type:** Platform-wide engineering UI specification and implementation gate  
**Authority:** `master-ui-specification-mode.mdc`, `global-ui-approval-gate.mdc`  
**Scope:** Presentation-layer unification only  
**Product directive:** ROVEXO v1.0 Universal UI Lock System Update, 15 July 2026

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | Universal UI System v1.1 compatibility layer |
| **Route(s)** | All user-facing marketplace routes except frozen Auth |
| **Canonical component** | Universal primitives under `components/ui/` and one canonical page header |
| **Canonical styles** | `styles/tokens.css` plus a new scoped universal semantic-token layer |
| **Visual reference** | Product Owner numeric directive, 15 July 2026 |
| **Canvas reference** | 440 × 956 iPhone Max; 390 × 844 iPhone; 412 × 915 Android; 430 × 932 PWA; 768 × 1024 tablet; 1440 × 900 desktop |
| **Version** | 1.1 |
| **Status** | Blocking fixes implemented and validated; awaiting Product Owner visual approval |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | ROVEXO Product Owner |
| **Approved date** | 2026-07-15 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-15 | Product Owner | Universal UI Lock directive |
| 1.1-spec | 2026-07-15 | Engineering | UI-only compatibility specification; no implementation authorized yet |
| 1.1-approved | 2026-07-15 | Product Owner | Final Implementation Contract approved; UI-only implementation authorized |
| 1.1-preview | 2026-07-15 | Engineering | Real implementation and five-device evidence complete; awaiting visual approval |
| 1.1-audit-fix | 2026-07-15 | Engineering | Restored protected contracts; completed Orders states, ratings, Search filters, six-device evidence, performance metrics and token audit |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Raw global tokens | `styles/tokens.css` |
| Universal semantic aliases | `styles/rovexo/universal-ui-v1.css` (new after approval) |
| Programmatic token references | `components/ui/tokens.ts` |
| Button / icon button | `components/ui/Button.tsx`, `components/ui/IconButton.tsx`, `components/ui/variants.ts` |
| Input | `components/ui/Input.tsx` |
| Card | `components/ui/Card.tsx` |
| Header | One approved canonical implementation; adapters replace the three current variants |
| Bottom navigation | `components/ui/BottomNavigation.tsx`, `styles/rovexo/bottom-nav-premium.css` |
| Listing card | `components/ui/ListingCard.tsx`, `components/ui/ListingCard.module.css` |
| Homepage | `components/home/RovexoHomePage.tsx`, `styles/rovexo/homepage-v1.css` |
| Search | `features/search/components/SearchResultsView.tsx`, `styles/rovexo/search-results-v1.css` |
| Product | `features/product-detail/ProductDetailPage.tsx`, `styles/rovexo/product-detail-v1.css` |
| Checkout | `features/checkout/components/CheckoutWizardV1.tsx`, `styles/rovexo/checkout-v1.css` |
| Inbox | `features/inbox/components/InboxPage.tsx`, `styles/rovexo/inbox-hub-v1.css` |
| Transaction thread | `features/inbox/components/ConversationHub.tsx`, `lib/inbox/conversation-view.ts`, `styles/rovexo/conversation-hub-v1.css` |
| Wallet | `features/wallet/components/WalletHubV1.tsx`, `styles/rovexo/wallet-hub-v1.css` |
| Orders | `features/orders/components/OrdersPage.tsx`, `styles/rovexo/orders-page-v1.css` |
| Account | `features/account-center/components/AccountCenterHome.tsx`, `styles/rovexo/account-canonical-v2.css` |
| Settings | `features/account-module/components/SettingsV1.tsx`, `styles/rovexo/account-settings-canonical.css` |
| Reviews | `features/account-module/components/ReviewsV1.tsx`, `features/orders/components/OrderReviewCard.tsx` |
| Tests | Existing module contracts plus new `tests/universal-ui-v1.test.ts` and responsive Playwright evidence |

---

## Compatibility and non-negotiable boundaries

### UI-only authorization

This specification authorizes presentation changes only after approval. It does not authorize changes to:

- database tables, migrations, RLS or persistence contracts;
- API request/response contracts;
- authentication, sessions or protected-route behavior;
- Stripe configuration, checkout settlement or payment confirmation;
- Sendcloud, carrier integrations or tracking ingestion;
- Wallet, escrow, fee, payout or ledger logic;
- buyer, seller, order, offer, refund, dispute or review business rules;
- existing transaction records.

### Frozen-module versioning

Current v1.0 Auth remains untouched. Homepage structure remains unchanged. Existing frozen Account, Settings, Checkout, Inbox, Transaction Hub and Listing Card implementations are not silently mutated; approved work is recorded as a v1.1 visual compatibility revision with updated module specifications and regression evidence.

### Platform Fee accuracy

The existing fee SSOT remains `calculatePlatformFee()` in `lib/orders/pricing.ts`, currently 5.5%. Examples in the Product Owner directive are illustrative, not replacement fee logic.

- `£165.00` item price renders as `£174.08 incl.` under the current fee.
- The inclusive line means item price plus Platform Fee only.
- Delivery remains separate until delivery cost is known.
- The UI must never hard-code example totals.

### Transaction-thread accuracy

The current persistence contract is one conversation per product + buyer + seller, not one conversation per order. Therefore v1.1 may truthfully promise:

> One unified thread per listing transaction context.

The UI may select an exact existing order through `?order=<orderId>` and render its lifecycle inline. It must not claim guaranteed order-isolated threads when multiple orders share one conversation.

Existing `/orders/[id]`, `/orders/[id]/tracking`, checkout and review surfaces remain deep-link, accessibility and recovery fallbacks. The standard user path stays inside the thread wherever existing UI data and APIs safely support it.

### Unified account architecture

The universal style does not create buyer, seller or business account types. It preserves the single ROVEXO Account and the canonical menu contract. Labels may be visually simplified, but capabilities remain action-based and no role switch is introduced.

---

## 1. Master UI Specification

### 1.1 Purpose

ROVEXO must read as one platform through a single typography, spacing, icon, navigation, card, button and input language. The system reduces visual drift without changing information architecture, business behavior or performance.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone 17 Pro Max | Primary visual baseline |
| Reference width | 440px | CSS viewport |
| Reference height | 956px | CSS viewport |
| Safe area top | `env(safe-area-inset-top)` | Added outside 60px header visual row |
| Safe area bottom | `env(safe-area-inset-bottom)` | Added outside 44px navigation visual row |
| Content max-width mobile | 440px | Full-width shell |
| Content max-width tablet | 768px | Same hierarchy; horizontal inset may expand |
| Content max-width desktop | 980px | Same design; no desktop alternate |
| Page background | `--uv1-background: #ffffff` | Light canonical platform surface |

### 1.3 Universal surface order

1. Safe-area inset, when applicable.
2. 60px canonical header.
3. Page content with 16px horizontal inset.
4. Sections separated by 24px.
5. Fixed 44px bottom navigation plus safe-area inset, where enabled.

Full-screen transaction threads keep the canonical thread header and composer; the bottom navigation remains hidden to protect composer interaction.

### 1.4 Surface trees

#### Homepage

1. Existing search-only header.
2. Existing category rail.
3. Existing non-empty listing/store sections in their approved order.
4. Existing bottom navigation.

No Homepage section, category or search hierarchy changes are permitted.

#### Search

1. Canonical 60px header/search row.
2. Query summary.
3. Compact filter controls.
4. Results.
5. Existing bottom navigation.

#### Product

1. Canonical 60px product header.
2. Existing gallery.
3. Product title and price.
4. Inclusive price line.
5. Existing condition, description, seller, protection and action content.
6. Existing product action bar.

#### Checkout

1. Canonical 60px checkout header.
2. Existing delivery/payment/review step content.
3. Existing price summary and Platform Fee.
4. Existing 48px primary CTA.

The checkout step sequence and payment behavior do not change.

#### Inbox Hub

1. Canonical 60px header titled `Inbox`.
2. Two tabs only: `Messages`, `Notifications`.
3. Messages: compact chronological rows.
4. Notifications: compact chronological rows using the same row contract.
5. Existing bottom navigation.

Search, unread and archive functionality may remain available through compact contextual controls. Oversized persistent filter rails are removed from the default visual hierarchy.

#### Transaction thread

1. Canonical 60px thread header.
2. Compact product/transaction context row.
3. Unified chronological timeline.
4. Contextual transaction action card.
5. Existing message composer.

Timeline presentation may include existing offer, checkout-resume, payment, preparation, tracking, delivery, issue, confirmation, review and completion states. Every action must call existing APIs and enforce existing business rules.

#### Account and Settings

1. Canonical 60px header.
2. Profile summary where the existing route requires it.
3. Canonical menu sections and rows.
4. Logout as the final destructive action.
5. Existing bottom navigation.

Account menu information architecture remains governed by `lib/account-center/canonical-menu.ts` and unified-account rules.

### 1.5 Grid

| Token | Value |
|-------|-------|
| Homepage columns mobile | 2 |
| Homepage columns tablet | 2 |
| Homepage columns desktop | 2 |
| Standard grid gutter | 12px |
| Page horizontal inset | 16px |
| Section vertical gap | 24px |
| Card content gap | 8px |

### 1.6 Universal spacing system

The platform uses one 4px-derived scale. “Spacing 24px” is the canonical section gap, not a requirement to put 24px between every inline element.

| Token | Value |
|-------|-------|
| `--uv1-space-1` | 4px |
| `--uv1-space-2` | 8px |
| `--uv1-space-3` | 12px |
| `--uv1-space-4` | 16px |
| `--uv1-space-5` | 24px |
| `--uv1-space-6` | 32px |
| Section gap | 24px |
| Card internal padding | 16px |
| Page horizontal padding | 16px |
| Compact row internal gap | 12px |
| Inline metadata gap | 8px |

### 1.7 Universal dimensions

| Token | Value | Contract |
|-------|-------|----------|
| Header visual row | 60px | Safe area is additional |
| Bottom navigation visual row | 44px | Safe area is additional |
| Bottom navigation glyph | 24px | Home, Search, Inbox, Account |
| Sell glyph | 30px | Inside a 48px circular control |
| Standard icon | 24px | Navigation and actionable icons |
| Inline rating star | 12px | Explicit compact-rating exception |
| Header icon target | 44px | Centered in 60px row |
| Standard button | 48px | All standard actions |
| Input | 56px | Text, select and search inputs |
| Card radius | 14px | All canonical card surfaces |
| Button radius | 14px | Full-width and standard buttons |
| Input radius | 14px | Inputs and selects |
| List row minimum | 56px | Account/Settings rows |
| Compact Inbox row minimum | 68px | Message/notification rows |

The Product Owner’s “Sell button 28–30px” is implemented as a 30px visible plus glyph. The control remains 48px to preserve WCAG touch-target accessibility.

### 1.8 Radius, shadow and colour

| Token | Value |
|-------|-------|
| Card radius | 14px |
| Button radius | 14px |
| Input radius | 14px |
| Badge radius | 999px |
| Card shadow | none by default |
| Elevated shadow | `0 8px 24px rgb(15 23 42 / 8%)` |
| Accent | `#7c3aed` |
| Primary action gradient | Existing approved ROVEXO purple gradient |
| Background | `#ffffff` |
| Surface | `#ffffff` |
| Surface muted | `#f8fafc` |
| Text primary | `#0f172a` |
| Text secondary | `#64748b` |
| Border | `rgb(15 23 42 / 10%)` |
| Star | `#fbbf24` |

---

## 2. Component Dimension Table

### Component: Canonical Header

| Field | Value |
|-------|-------|
| Purpose | Consistent title, back and optional trailing action |
| X / Y | Top of route; safe-area aware |
| Width | 100% |
| Height | 60px plus top safe area |
| Padding | 0 16px |
| Margin / Gap | 0 / 12px |
| Radius / Shadow | 0 / none |
| Background / Border | White / 1px bottom border |
| Icon / Size / Stroke | Lucide; 24px; 2px |
| Title font | Geist |
| Weight / Size / Line height | 650 / 16px / 22px |
| Letter spacing | -0.01em |
| Alignment | Vertically centered |
| Pressed / Hover | 0.72 opacity / muted surface |
| Focus | 2px accent ring, 2px offset |
| Disabled / Loading / Empty | Disabled 0.5; loading preserves 60px; N/A |
| Animation | 120ms ease |
| Navigation | Existing route behavior |
| Responsive | Same component and height everywhere |

### Component: Standard Button

| Field | Value |
|-------|-------|
| Purpose | Primary, secondary, outline, ghost and destructive actions |
| Width | Content or 100% |
| Height | 48px |
| Padding / Gap | 0 16px / 8px |
| Radius | 14px |
| Shadow | None; elevated primary may use approved soft shadow |
| Background / Border | Variant token / 1px where applicable |
| Icon | Lucide, 24px, 2px stroke |
| Label | Geist 14px, 650, 20px line height |
| Alignment | Center |
| Pressed / Hover | 0.98 scale / 3% brightness or muted surface |
| Focus | 2px accent ring |
| Disabled / Loading | 0.5 opacity; dimensions unchanged |
| Animation | 120ms ease |
| Navigation | Existing action or route only |
| Responsive | Identical dimensions |

### Component: Standard Input

| Field | Value |
|-------|-------|
| Purpose | Text, search, email, password, number and select entry |
| Width / Height | 100% / 56px |
| Padding / Gap | 0 16px / 8px |
| Radius | 14px |
| Shadow | None |
| Background / Border | White / 1px canonical border |
| Icon | 24px when present |
| Text | Geist 14px, 450, 20px line height |
| Label | Geist 14px, 600, 20px line height |
| Focus | Accent border plus 2px ring |
| Disabled | Muted surface, 0.65 opacity |
| Loading / Empty | Skeleton keeps 56px; placeholder uses secondary text |
| Animation | 120ms ease |
| Responsive | Identical dimensions |

### Component: Canonical Card

| Field | Value |
|-------|-------|
| Purpose | Shared content and transaction surface |
| Width / Height | 100% / content |
| Padding / Gap | 16px / 12px |
| Radius | 14px |
| Shadow | None by default |
| Background / Border | White / 1px canonical border |
| Icon | 24px |
| Title / Body | 16px section title / 14px body |
| Pressed / Hover | 0.995 scale / border emphasis only when interactive |
| Focus | 2px accent ring |
| Disabled / Loading / Empty | Preserve geometry; canonical muted treatment |
| Animation | 120ms ease |
| Navigation | Existing route only |
| Responsive | Same surface; width changes only |

### Component: Bottom Navigation

| Field | Value |
|-------|-------|
| Purpose | Home, Search, Sell, Inbox, Account |
| X / Y | Fixed bottom |
| Width / Height | 100% / 44px plus safe area |
| Padding / Gap | 0 / 0 |
| Radius / Shadow | 0 / none |
| Background / Border | White / 1px top border |
| Icons | Lucide 24px, 2px stroke |
| Sell | 48px circular control; 30px plus glyph |
| Labels | Geist 10px, 500, 10px line height |
| Alignment | Five equal columns |
| Pressed / Hover | 0.72 opacity / accent |
| Focus | Visible inset ring |
| Badge | Compact 16px minimum |
| Animation | 120ms ease |
| Navigation | Existing canonical hrefs unchanged |
| Responsive | Same dimensions on iPhone, Android, Pixel, tablet and PWA |

### Component: Universal Listing Card Metadata

| Field | Value |
|-------|-------|
| Purpose | Immediate price transparency, condition and seller trust |
| Width / Height | Card width / content |
| Padding / Gap | Existing card body padding / 4px |
| Radius | Card remains 14px only after v1.1 Listing Card approval |
| Price | 16px, 700, primary text |
| Inclusive price | 12px, 550, secondary text |
| Condition | 11px, 650, uppercase |
| Rating | 12px, 650; 12px star |
| Alignment | Price stack left; condition left; rating right |
| Rating values | `★5.0` through `★1.0`; no reviews `★NEW` |
| Fee | Calculated with existing `calculatePlatformFee()` |
| Empty | Missing condition omitted; missing reviews show `★NEW` |
| Responsive | Same content and hierarchy on every surface |

The Homepage card body is:

1. Product title.
2. Item price.
3. Inclusive price.
4. Condition and compact rating on one row.

No seller name, location, shipping text, view count or explicit “Platform Fee” label is added to Homepage cards.

### Component: Compact Inbox Row

| Field | Value |
|-------|-------|
| Purpose | Scan messages or notifications quickly |
| Width / Height | 100% / minimum 68px |
| Padding / Gap | 12px 16px / 12px |
| Radius / Shadow | 0 / none |
| Background / Border | White / 1px bottom divider |
| Thumbnail | 44px, 12px radius; `SafeImage` or `Avatar` |
| Icon | 24px |
| Title | 14px, 650, 20px |
| Preview | 14px, 450, 20px; one line |
| Time | 12px, 500, 16px |
| Unread | 6px accent dot plus 650 title |
| Pressed / Hover | Muted surface |
| Focus | Inset accent ring |
| Swipe actions | Existing behavior; compact 48px actions |
| Empty / Loading | Canonical compact empty state / row skeleton |
| Navigation | Existing conversation or notification href |
| Responsive | Same row; content max-width changes only |

### Component: Transaction Timeline Event

| Field | Value |
|-------|-------|
| Purpose | Present existing transaction lifecycle inside the thread |
| Width / Height | 100% / content |
| Padding / Gap | 16px / 8px |
| Radius | 14px |
| Background / Border | White or muted / 1px border |
| Icon | 24px status icon |
| Title / Body | 14px 650 / 14px 450 |
| Metadata | 12px, secondary |
| Actions | 48px standard buttons; maximum two primary choices per row |
| Focus / Disabled / Loading | Universal control states |
| Animation | 120ms; no motion when reduced |
| Navigation | Inline first; fallback route only for full details/recovery |
| Responsive | Same event hierarchy |

### Component: Account / Settings Row

| Field | Value |
|-------|-------|
| Purpose | Uniform menu navigation |
| Width / Height | 100% / minimum 56px |
| Padding / Gap | 0 16px / 12px |
| Radius / Shadow | 0 inside 14px group / none |
| Background / Border | White / bottom divider |
| Icon | 24px |
| Chevron | 24px |
| Label | 14px, 600, 20px |
| Subtitle | 12px, 450, 16px |
| Pressed / Hover | Muted surface |
| Focus | Inset accent ring |
| Disabled / Loading / Empty | Canonical states |
| Navigation | Existing canonical menu href |
| Responsive | Identical |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Page content | 24 | 16 | nav clearance + 24 | 16 | 24 | Header excluded |
| Section | 0 | 0 | 0 | 0 | 24 | Universal section rhythm |
| Card | 16 | 16 | 16 | 16 | 12 | Canonical |
| Button group | 0 | 0 | 0 | 0 | 8 | Wrap only when necessary |
| List row | 0 | 16 | 0 | 16 | 12 | 56px minimum |
| Inbox row | 12 | 16 | 12 | 16 | 12 | 68px minimum |
| Transaction event | 16 | 16 | 16 | 16 | 8 | Inline thread event |
| Inline metadata | 0 | 0 | 0 | 0 | 8 | Condition/rating |

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Page title | Geist | 650 | 16px | 22px | -0.01em | Primary | Start/center by header |
| Section title | Geist | 650 | 16px | 22px | -0.01em | Primary | Start |
| Card title | Geist | 650 | 14px | 20px | -0.005em | Primary | Start |
| Card amount | Geist | 700 | 16px | 20px | -0.01em | Primary/accent | Start |
| Inclusive amount | Geist | 550 | 12px | 16px | 0 | Secondary | Start |
| Body | Geist | 450 | 14px | 20px | 0 | Primary | Start |
| Metadata | Geist | 500 | 12px | 16px | 0 | Secondary | Start |
| Condition | Geist | 650 | 11px | 16px | 0.02em | Secondary | Start |
| Compact rating | Geist | 650 | 12px | 16px | 0 | Primary | End |
| Button label | Geist | 650 | 14px | 20px | 0 | Variant | Center |
| Navigation label | Geist | 500 | 10px | 10px | 0 | Primary/active | Center |

Large monetary hero values already required by Wallet or Product hierarchy may retain their module-approved display size. They must use the same family, colour and spacing tokens and are not redefined as body text.

---

## 5. Colour Table

| Token | Value | Usage |
|-------|-------|-------|
| `--uv1-background` | `#ffffff` | Page |
| `--uv1-surface` | `#ffffff` | Cards/rows |
| `--uv1-surface-muted` | `#f8fafc` | Hover, grouped background |
| `--uv1-text-primary` | `#0f172a` | Main copy |
| `--uv1-text-secondary` | `#64748b` | Metadata |
| `--uv1-border` | `rgb(15 23 42 / 10%)` | Dividers/cards |
| `--uv1-accent` | `#7c3aed` | Active/focus |
| `--uv1-success` | Existing DS success | Completed/delivered |
| `--uv1-warning` | Existing DS warning | Attention |
| `--uv1-danger` | Existing DS danger | Destructive/error |
| `--uv1-star` | `#fbbf24` | Compact rating |

No new dark theme or module-specific colour language is introduced.

---

## 6. Interaction Specification

| Control | Default | Hover | Pressed | Focus | Disabled | Loading | Notes |
|---------|---------|-------|---------|-------|----------|---------|-------|
| Button | Variant surface | +3% brightness | 0.98 scale | 2px ring | 0.5 opacity | Label replaced; size fixed | Existing action only |
| Input | White border | Border emphasis | N/A | Accent ring | Muted | Inline spinner optional | 56px |
| Card link | White | Border emphasis | 0.995 scale | Inset ring | N/A | Skeleton | No raised hover drift |
| Inbox row | White | Muted | 0.98 opacity | Inset ring | N/A | Row skeleton | Existing swipe retained |
| Bottom nav | Primary text | Accent | 0.72 opacity | Inset ring | N/A | N/A | 44px shell |
| Transaction action | Existing eligibility | Standard | Standard | Standard | Existing rule | Existing request state | No optimistic business-state fabrication |
| Tracking copy | Secondary | Muted | 0.72 opacity | Ring | No number = disabled | N/A | Uses Clipboard API |

Transitions are 120ms ease for colour, opacity and transform. Existing route transitions remain. Reduced motion disables transforms and non-essential animation.

### Transaction thread interaction sequence

1. Buyer submits an offer using existing offer API.
2. Recipient accepts, declines or counters under existing authorization.
3. Accepted offer exposes existing checkout entry/resume.
4. Stripe-confirmed payment is presented as an inline event.
5. Seller preparation and tracking actions call existing order APIs.
6. Existing carrier/order status is presented inline.
7. Delivered order shows existing `Confirm` and `I have an issue` actions.
8. `Confirm` calls existing `confirm_ok`.
9. Existing completed-order review form renders inline.
10. Review submission uses existing review API.
11. Completed state remains visible in the thread.

If the order context is missing or ambiguous, transaction-specific actions are withheld and the UI falls back to the existing route.

---

## 7. Responsive Specification

| Breakpoint | Max content width | Allowed changes | Must remain identical |
|------------|-------------------|-----------------|-----------------------|
| iPhone / small mobile | 440px | None beyond natural wrapping | Type, radii, controls, order, colours |
| Samsung / Pixel | 440px | Natural text wrapping | Same |
| Tablet | 768px | Max-width, columns, horizontal inset | Same design and dimensions |
| Desktop | 980px | Max-width, existing approved columns | Same hierarchy and card language |
| PWA | 440px | Safe-area/standalone chrome | Same as mobile |

Prohibited:

- separate mobile, tablet or desktop components;
- desktop-only dark cards or alternate visual hierarchy;
- route-specific typography systems;
- shrinking touch targets below 44px;
- changing Homepage section order or View All’s locked two-column rule.

---

## 8. Accessibility Specification

| Requirement | Specification |
|-------------|---------------|
| Keyboard | Logical DOM order; all actions reachable |
| Focus ring | 2px accent with 2px offset or inset equivalent |
| ARIA labels | Icon-only controls name their action; rating reads `Seller rating 5.0` or `Seller has no reviews yet` |
| Tap target | 44 × 44px minimum; standard buttons remain 48px |
| Contrast | WCAG AA |
| Reduced motion | No non-essential transform/animation |
| Screen reader order | Header → title/context → content/timeline → actions → composer/nav |
| Dynamic updates | Existing live regions for messages, checkout and notifications retained |
| Images | `SafeImage` or `Avatar` only |
| Fee transparency | Inclusive total announced immediately after item price |
| Status | Colour never carries status alone |

---

## 9. Developer Notes

1. Add a scoped `--uv1-*` semantic token contract. Do not globally rewrite `--ds-*` values because frozen Auth consumes them.
2. Convert `--cds-*` and `--pcu-*` to compatibility aliases only after route-level visual regression proves parity.
3. No direct `next/image`; use `SafeImage` or `Avatar`.
4. No API, database, auth, payment, shipping, Wallet, escrow or business-logic edits.
5. Keep canonical route handlers and deep links.
6. Homepage Listing Card v1.1 sets condition and inclusive total visible and formats no-review rating as `NEW`.
7. Inclusive price always calls the existing fee formatter; no duplicated fee constants.
8. Inbox uses one compact row component for Messages and Notifications.
9. Transaction context may be selected with `?order=<id>` only after validating that the existing order belongs to the conversation’s product and participants.
10. Never show transaction-specific actions for an ambiguous conversation/order match.
11. Existing order/tracking/review pages remain compatibility fallbacks.
12. Preserve the ROVEXO Account architecture and canonical menu SSOT.
13. Preserve instant interactions and avoid additional initial network requests. UI joins reuse already-required data or lazy-load after thread entry.
14. Version attributes:
    - `data-universal-ui="v1.1"`
    - `data-universal-ui-status="preview"`
    - module-specific frozen attributes remain until final approval.

### Required module-spec amendments after approval

- Homepage v1.1 visual amendment.
- Listing Card v1.1 visual amendment.
- Inbox / Transaction Hub v1.1.
- Checkout v1.1 visual amendment.
- Account and Settings v1.1 visual amendment.
- Wallet and Orders visual-QA amendments.
- New Search, Product, Reviews and Header/Navigation specifications where missing.

---

## 10. QA Checklist

### Specification gate

- [x] Product Owner explicitly approves this Master UI Specification.
- [x] Frozen-module v1.1 amendments are approved.
- [x] Implementation begins only after both approvals.

### Universal contract

- [x] One scoped semantic token SSOT.
- [x] Header visual row is 60px.
- [x] Bottom navigation visual row is 44px plus safe area.
- [x] Navigation icons are 24px.
- [x] Sell glyph is 30px inside an accessible 48px control.
- [x] Standard buttons are 48px.
- [x] Inputs are 56px.
- [x] Canonical cards and controls use 14px radius.
- [x] Section gap is 24px.
- [x] Internal card/page padding is 16px.
- [x] Body text is 14px.
- [x] Section titles are 16px.

### Functional preservation

- [x] Authentication unchanged.
- [x] APIs and database unchanged.
- [x] Stripe and Sendcloud unchanged.
- [x] Wallet and escrow logic unchanged.
- [x] Offer, order, tracking, delivery, issue, refund and review rules unchanged.
- [x] Homepage hierarchy unchanged.
- [x] Checkout flow unchanged.
- [x] Existing canonical fallback routes still work.
- [x] No existing transaction records are mutated by migration scripts.

### Surface QA

- [x] Homepage shows item price, accurate inclusive price, condition and compact rating.
- [x] Search uses universal primitives.
- [x] Product uses universal primitives and accurate inclusive price.
- [x] Checkout uses universal primitives without behavioral changes.
- [x] Wallet presentation is unified without logic changes.
- [x] Messages and Notifications use the same compact row.
- [x] Transaction lifecycle is visible inline when order context is unambiguous.
- [x] Tracking summary/actions are visible inline and detailed fallback remains.
- [x] Orders, Account, Settings and Reviews use the universal language.
- [x] Bottom navigation remains readable on iPhone, Samsung/Pixel-class Android, tablet and PWA.

### Performance and engineering QA

- [x] No additional Homepage initial request.
- [x] No duplicate Inbox initial request.
- [ ] No hydration mismatch.
- [ ] CLS ≤ 0.01.
- [ ] Existing instant interactions remain within their current budgets.
- [ ] TypeScript, ESLint, Vitest and Playwright pass.
- [ ] WCAG AA and reduced-motion tests pass.
- [x] Image safety tests pass.

### Required real-implementation evidence

Before implementation, capture the current real UI. After implementation, capture the same state, data and viewport.

Required before/after surfaces:

1. Homepage.
2. Search.
3. Product Page.
4. Checkout.
5. Wallet.
6. Messages.
7. Notifications.
8. Transaction Thread.
9. Tracking.
10. Orders.
11. My Account.
12. Settings.
13. Reviews.
14. Bottom Navigation.

Required devices:

- iPhone 17 Pro Max.
- Samsung Galaxy Ultra.
- Pixel-class Android.
- Tablet.
- Desktop.
- PWA standalone.

Evidence must be raw captures from the real implementation, plus interaction recordings for offer → counter → accept → checkout → payment return → tracking → delivered → confirm/issue → review → completed. No concept art, generated mockups or placeholder layouts.

Evidence manifests:

- Before: `reports/homepage-v1-live-experience/manifest.json`
- After: `reports/universal-ui-v1/after/manifest.json`
- Comparison and coverage: `reports/universal-ui-v1/comparison-manifest.json`

### Release gate

- [ ] Product Owner approves all before/after evidence.
- [ ] Freeze is explicitly authorized.
- [ ] Commit is explicitly authorized.
- [ ] Push is explicitly authorized.
- [ ] Preview deployment is explicitly authorized.
- [ ] Production validation passes.
- [ ] Production deployment is explicitly authorized.

Until every checked gate is complete: no freeze, commit, push, merge, deployment or production lock.

---

## Approval

| Role | Name | Date | Signature / note |
|------|------|------|------------------|
| Design | Pending | Pending | |
| Engineering | Pending | Pending | |
| Product / Owner | Pending | Pending | Explicit approval required before implementation |
