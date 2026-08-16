# ROVEXO — FINAL PRODUCTION DEPLOY LIST

**STATUS:** READY
**Authority:** Owner COD SÂNGE · 10/10 items
**Official URL:** https://www.rovexo.co.uk
**COMMIT:** NO · **PUSH:** NO · **DEPLOY:** NO until Owner authorizes the single Production Deploy

This is the **SINGLE** production release list. Do not deploy as separate one-off operations.

```
DEPLOY_LIST_STATUS=READY
DEPLOY_LIST_ITEMS=10
ALL_ITEMS_CERTIFIED=YES
ALL_ITEMS_READY=YES
REAL_RELEASE_BLOCKERS=0
PRODUCTION_RELEASE_BLOCKED=NO
```

---

## FINAL PRODUCTION RELEASE

| Field | Value |
|---|---|
| DEPLOY_LIST_STATUS | READY |
| DEPLOY_LIST_ITEMS | 10 |
| ALL_ITEMS_CERTIFIED | YES |
| REAL_RELEASE_BLOCKERS | 0 |
| PRODUCTION_RELEASE_BLOCKED | NO |

---

## ITEM 1 — STORE SHARE

**STATUS:** READY
**ITEM_1_STORE_SHARE=READY**

Dynamic ROVEXO Store Share card:

- dynamic avatar
- dynamic username
- dynamic display name
- verification
- followers
- active listings
- description
- canonical Store URL
- dynamic OG title
- dynamic OG description
- dynamic OG URL
- public PNG OG image
- 1200×630

Facebook:

- mobile `navigator.share`
- desktop `sharer.php`
- no Graph API
- no automatic posting

WhatsApp / Telegram / Messenger / QR / Copy Link preserved.

### Production files

- `lib/store-sharing/store-share-v1.ts`
- `features/store-sharing/StoreShareSheet.tsx`
- `app/api/seo/og/route.ts`
- `app/robots.ts`
- `lib/seo/engine/metadata.ts`
- `app/(platform)/user/[username]/page.tsx`
- `docs/modules/store-sharing/MASTER_ENGINEERING_SPECIFICATION.md`
- `tests/store-share-v1.test.ts`
- `tests/store-share-dynamic-card-v1.test.ts`

---

## ITEM 2 — TRACK PARCEL

**STATUS:** READY
**ITEM_2_TRACKING_ROUTING=READY**

Canonical router: `getTrackingUrl()`

- Royal Mail → Royal Mail tracking URL + tracking number
- Evri → Evri tracking URL + tracking number
- Missing tracking → informational toast → no navigation
- Hardcoded universal Evri destination removed

### Production files

- `lib/orders/status.ts` (`getTrackingUrl` — existing SSOT, not a second builder)
- `features/inbox/components/ConversationHub.tsx`
- `tests/track-parcel-carrier-routing-v1.test.ts`
- `tests/transaction-status-card-v1.test.ts`
- `tests/seller-issue-visibility-v1.test.ts`

---

## ITEM 3 — ROYAL MAIL RECOVERY ARCHITECTURE

**STATUS:** READY
**ITEM_3_ROYAL_MAIL_RECOVERY=READY**

Reusable recovery architecture only. The live recovery of existing order `RVX8343A7C7` is **already completed** and is **not** a future deployment task. Do not execute recovery again.

- append parcel without renumbering
- failed historical parcels excluded
- active preparing parcel selected
- canonical parcel resolver
- existing parcel rows preserved
- no duplicate announce/label path

`RVX8343A7C7` historical state remains preserved:

- Parcel 4: InPost
- Parcel 5: Royal Mail
- Tracking: `MZ539415387GB`
- Historical Sendcloud `699970376` must remain untouched
- Historical data must not be rewritten

### Production files

- `lib/shipping/append-shipment-parcel-without-renumber-v1.ts`
- `lib/shipping/parcels-repository.ts`
- `lib/shipping/resolve-shipment-parcel-for-label-v1.ts`
- `lib/shipping/store.ts`
- `lib/shipping/types.ts`
- `lib/shipping/label-generation.server.ts`
- `tests/append-shipment-parcel-without-renumber-v1.test.ts`
- `tests/resolve-shipment-parcel-for-label-recovery-v1.test.ts`
- `tests/sendcloud-p7-25-reuse-canonical-parcel-label-v1.test.ts`

---

## ITEM 4 — PARCEL SIZE V2

**STATUS:** READY
**ITEM_4_PARCEL_SIZE_V2=READY**

Canonical owner-approved bands:

| Size | Weight | Max dimensions | Quote / new-order weight |
|---|---|---|---|
| SMALL | 0–1 kg | 45 × 35 × 16 cm | 1 kg |
| MEDIUM | 1–2 kg | 61 × 46 × 46 cm | 2 kg |
| LARGE | 2–15 kg | Max length 120 cm | 15 kg |

Stored IDs remain: `small` · `medium` · `large`
Historical `xl` remains supported only where required for compatibility.

- No migration
- No backfill
- No historical shipment rewrite

### Production files

- `lib/shipping/canonical-parcel-size-v1.ts`
- `lib/shipping/index.ts`
- `lib/shipping/parcels.ts`
- `lib/shipping/pricing/sendcloud-mappers.ts`
- `features/sell/types.ts`
- `features/sell/ui/SellParcelBlock.tsx`
- `features/sell/ui/sell-picker-presentation-v1.ts`
- `tests/parcel-size-canonical-v1.test.ts`
- `tests/parcel-size-owner-approved-bands-v1.test.ts`
- `tests/sell-parcel-size-ux-v1.test.ts`
- `tests/final-preview-certification-v1.test.ts`
- `tests/sendcloud-p7-21-parcel-measurements-label-v1.test.ts`
- `tests/sendcloud-parcel-tier-hydrate-label-v1.test.ts`
- `tests/shipping-v1-0-full-reset-sendcloud-ssot.test.ts`

---

## ITEM 5 — BUYER SHIPPING MARKUP

**STATUS:** READY
**ITEM_5_BUYER_MARKUP_15P=READY**

Buyer shipping: Sendcloud provider price + £0.15
Applied exactly once.

- Sendcloud raw provider price remains unchanged
- Total Pay uses the already-marked-up buyer shipping price
- Platform fee remains 5.5% of item price only
- Seller payout remains unchanged
- No double markup

### Production files

- `lib/shipping/pricing/buyer-shipping-price-v1.ts`
- `lib/checkout/delivery.ts`
- `lib/checkout/map-provider-quotes-to-checkout-v1.ts`
- `lib/checkout/types.ts`
- `lib/orders/checkout.ts`
- `tests/buyer-shipping-markup-v2-internal-label-fee-removed.test.ts`
- `tests/canonical-carrier-quote-selection-v1.test.ts`
- `tests/checkout-carrier-grouping-v1.test.ts`
- `tests/checkout-carrier-price-icon-audit-v1.test.ts`
- `tests/checkout-carrier-selection-cert-v1.test.ts`
- `tests/v1-0-carrier-cleanup-checkout-pricing-v1.test.ts`

---

## ITEM 6 — INTERNAL LABEL FEE REMOVAL

**STATUS:** READY
**ITEM_6_INTERNAL_LABEL_FEE_REMOVAL=READY**

Remove the obsolete internal £0.15 label stamp from the production financial/write path.

- `INTERNAL_LABEL_PLATFORM_FEE_PENCE` production write = NO
- production financial read = NO
- historical DB column preserved
- historical rows untouched
- no migration
- no backfill

Do **NOT** drop: `shipping_labels_v1.internal_platform_fee_pence`

### Production files

- `lib/shipping/labels/fee.ts` — **DELETED** (must not be recreated)
- `lib/shipping/labels/service.server.ts`
- `lib/shipping/labels/service.ts`
- `lib/shipping/store.ts` / `lib/shipping/parcels-repository.ts` (column not written)
- `tests/buyer-shipping-markup-v2-internal-label-fee-removed.test.ts`
- `tests/shipping-engine-v1.test.ts`

---

## ITEM 7 — CLIPBOARD FALLBACK

**STATUS:** READY
**ITEM_7_CLIPBOARD_FALLBACK=READY**

Canonical helper: `copyText()`

```
navigator.clipboard.writeText()
→ textarea + execCommand fallback
→ boolean result
```

Used by:

- Copy Link
- Instagram Store Message
- More fallback
- Visit Store

Must work on `http://localhost:3000` and LAN HTTP `http://192.168.1.150:3000`.
Production HTTPS continues using Clipboard API first.

### Production files

- `lib/store-sharing/store-share-v1.ts` (`copyText`)
- `features/store-sharing/StoreShareSheet.tsx`
- `features/store/components/StoreVisitPageV2.tsx`
- `tests/store-share-clipboard-v1.test.ts`

---

## ITEM 8 — PROFILE HEADER CLEANUP

**STATUS:** READY
**ITEM_8_PROFILE_HEADER_CLEANUP=READY**

Remove only the header buttons:

- Edit Profile
- Edit Bio

Preserve:

- Share Store
- overflow Edit Profile
- overflow Add/Edit Bio
- About editing

Canonical Profile layout unchanged.

### Production files

- `features/profile/components/ViewProfilePage.tsx`
- `tests/my-profile-v8.test.ts`

---

## ITEM 9 — ACTIVE CARRIER IN ORDER DETAILS

**STATUS:** READY
**ITEM_9_ACTIVE_CARRIER_DISPLAY=READY**

Canonical resolver: `resolveOrderDisplayCarrier()`

Precedence:

1. active ready label carrier
2. active/current parcel carrier
3. historical `orders.delivery_carrier`
4. empty

Fail closed on missing/invalid carrier.

For `RVX8343A7C7`:

- Historical carrier: InPost
- Active carrier: Royal Mail
- Order Details must display: **Royal Mail**

Do **NOT** rewrite `orders.delivery_carrier`.
Historical InPost remains preserved.

### Production files

- `lib/orders/resolve-order-display-carrier-v1.ts`
- `features/orders/components/OrderDetailView.tsx`
- `app/api/orders/[id]/shipment/route.ts` (read-only GET for buyer + seller)
- `features/inbox/components/ConversationHub.tsx` (`activeLabelCarrier`)
- `tests/order-details-active-carrier-display-v1.test.ts`
- `tests/carrier-persistence-one-order-one-carrier-v1.test.ts`

---

## ITEM 10 — CANCEL ORDER SAFETY

**STATUS:** READY
**ITEM_10_CANCEL_ORDER_SAFETY=READY**

Cancel Order must remain carrier-independent.
Cancellation eligibility is based on actual order/shipping state, not the displayed carrier name.

If a ready shipping label exists → cancellation blocked.

For `RVX8343A7C7`: ready Royal Mail label → Cancel Order blocked. Therefore:

- no Stripe refund
- no Sendcloud cancellation
- no order mutation
- no label mutation
- no parcel mutation

Double-cancel protection remains.
Stripe refund remains idempotent.
Sendcloud cancellation only occurs after an eligible confirmed refund.
Fail closed on unsafe/conflicting state.

No cancel-order source files are in this release dirty tree. This item is an audit/safety lock on the already-certified cancellation path.

---

## FINAL QA EVIDENCE

| Gate | Result |
|---|---|
| Typecheck | PASS |
| Lint | PASS |
| Production Build | PASS |
| Focused tests | PASS |
| Regression tests | PASS |
| Playwright | EXECUTED |
| Playwright browser | PASS |
| Playwright safe suite | 150 PASS / 19 classified non-release-blocking failures / 4 skipped |

19 Playwright failures forensic classification:

| Class | Count |
|---|---|
| Release-related | 0 |
| Pre-existing unrelated | 1 |
| Environment | 0 |
| Fixture | 0 |
| Obsolete tests | 18 |
| Inconclusive | 0 |

```
REAL_RELEASE_BLOCKERS=0
```

The 19 failures **MUST NOT** be modified merely to manufacture a PASS.

---

## DATABASE / PROVIDER SAFETY

```
DATABASE_SCHEMA_CHANGED=NO
MIGRATION=NO
BACKFILL=NO
HISTORICAL_DATA_CHANGED=NO
SENDCLOUD_MUTATION=NO
STRIPE_MUTATION=NO
EVRI_MUTATION=NO
ROYAL_MAIL_MUTATION=NO
INPOST_MUTATION=NO
```

---

## RELEASE SCOPE

Every dirty file must belong to Items 1–10 or this document.

- Unrelated files: **NONE**
- Unknown files: **NONE**
- Migrations: **NONE**

Do not include QA-only scripts, screenshots, or the completed live recovery operation as a deploy task.

---

## LIVE RECOVERY — COMPLETED — DO NOT ADD

Order `RVX8343A7C7` live recovery is done and must not be queued again:

- Parcel 4 InPost — preserved unchanged
- Parcel 5 Royal Mail
- Tracking `MZ539415387GB`
- Historical data must not be rewritten

---

## FINAL STATUS

```
ITEM_1_STORE_SHARE=READY
ITEM_2_TRACKING_ROUTING=READY
ITEM_3_ROYAL_MAIL_RECOVERY=READY
ITEM_4_PARCEL_SIZE_V2=READY
ITEM_5_BUYER_MARKUP_15P=READY
ITEM_6_INTERNAL_LABEL_FEE_REMOVAL=READY
ITEM_7_CLIPBOARD_FALLBACK=READY
ITEM_8_PROFILE_HEADER_CLEANUP=READY
ITEM_9_ACTIVE_CARRIER_DISPLAY=READY
ITEM_10_CANCEL_ORDER_SAFETY=READY
DEPLOY_LIST_ITEMS=10
ALL_ITEMS_READY=YES
REAL_RELEASE_BLOCKERS=0
PRODUCTION_RELEASE_BLOCKED=NO
COMMIT=NO
PUSH=NO
DEPLOY=NO
```
