# View Item + Bundle + Multi Stock — Master UI Specification v1.0

**STATUS: FROZEN · OWNER UI/UX LOCK (VIEW ITEM v1.0)**  
**Route:** `/listing/[slug]` · `/bundle/review`  
**Canonical page:** `features/product-detail/ProductDetailPage.tsx`  
**Styles:** `styles/rovexo/product-detail-v1.css` · bundle CSS in same family  
**SSOT:** `lib/product-detail/view-item-ui-ux-freeze-v1.ts` · `lib/product-detail/view-item-final-ui-lock-v1.ts` · `lib/product-detail/view-item-bundle-multi-stock-v1.ts`

## 1. Purpose

Extend the frozen ROVEXO Product Page with multi-stock quantity, product information rows, Delivery removal, and same-seller Bundle — without redesigning ROVEXO design language.

## 2. Layout order (View Item — FINAL UI LOCK)

1. Chrome + Image Gallery  
2. Title  
3. Price  
4. Stock Status (once under price only)  
5. Total incl.  
6. View Counter  
7. Seller Card  
8. Description (Vinted-style)  
9. Category · Brand · Condition · Material · Colour · Size · Storage · Network · Compatibility · Season · Uploaded  
   (dynamic field map — render only when populated; never empty rows; never Stock row)  
10. Quantity (only when stock > 1)  
11. Sticky Action Bar: Buy Now · Make Offer · Add to Bundle  
12. Sticky Bundle Bar (when bundle active) — content clearance expands  

**Forbidden on View Item body:** Delivery · duplicated Stock · Similar Items section · empty Product Information placeholders  

## 3–10. Deliverables (locked tokens)

| Area | Spec |
|---|---|
| Description title | 16px / 600 |
| Description body | 15px / 400 / LH 24px · expand · Read more only > ~12 lines |
| Info rows | 56px · 1px divider · title left · value right |
| Category / Brand | clickable purple |
| Other attributes | read-only |
| Stock = 1 | ✓ In Stock · Only 1 available · no qty |
| Stock > 1 | ✓ In Stock · N available · Quantity stepper |
| Qty control | H 44 · btn 44×44 · radius 12 · grey border · 100ms |
| Add to Bundle | full width 48px · outline purple · radius 14 |
| Bundle sheet | H 320 · 220ms |
| Bundle bar | H 60 · purple · above bottom nav |
| Delivery | **removed from View Item** (Checkout / Tracking only) |

## Forbidden

Redesign · new design language · Follow restoration · Add to Cart · Delivery on PDP · duplicate conversation hubs

## Post-implementation

TypeScript · ESLint · Build · Responsive · Regression · **Owner approval before commit/push/deploy**
