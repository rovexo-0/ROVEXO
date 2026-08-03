# ROVEXO Bundle Engine v1.0 — Master UI Specification

| Field | Value |
|-------|-------|
| **Page / Module** | Bundle Engine (View Item extension · Sheet · Sticky Bar · Review) |
| **Route(s)** | `/listing/[slug]` (extension) · `/bundle/review` |
| **Canonical styles** | `styles/rovexo/product-detail-v1.css` (sheet/bar) · Review inherits Account / Full Width |
| **Version** | 1.0 |
| **Status** | **Approved** (Owner COD SÂNGE Master Spec — locked values) |
| **Approved by** | Owner |
| **Approved date** | 2026-08-01 |

---

## 1. Master UI Specification

### 1.1 Purpose

Extend frozen View Item with same-seller Bundle without redesigning listing, checkout, or messaging.

### 1.2 Canvas

| Token | Value |
|-------|-------|
| Reference device | iPhone 17 Pro Max · mobile first |
| Page horizontal inset (internal) | 16px |
| Sticky bar height | **60px** |
| Sheet height | **320px** |
| Sheet animation | **220ms** |
| Add to Bundle height | **48px** · 100% width · outline purple |
| Qty control height | **40px** · radius **12** |

### 1.3 Layout order — View Item (frozen + extensions)

1. Gallery / Header / Favourite / Share (unchanged)  
2. Title · Price (unchanged)  
3. Stock status **only if stock > 1**  
4. Total incl. · Views (unchanged)  
5. Seller Card (unchanged)  
6. Description (unchanged)  
7. Product Information (unchanged)  
8. Quantity **only if stock > 1**  
9. Sticky actions: Buy Now · Make Offer · **Add to Bundle**  
10. Bottom sheet / Sticky Bundle Bar (when active)

### 1.4–10. Deliverables (Owner-locked tokens)

| Component | Spec |
|-----------|------|
| Stock copy (stock > 1) | `In Stock` + `N available` · green · 13px · weight 500 |
| Qty | `[-] N [+]` · minus disabled at 1 · plus at stock · toast `Maximum stock reached` |
| Add to Bundle | 48px · full width · outline purple · left + icon · no redirect |
| Sheet | 320px · 220ms · backdrop blur · title `Added to Bundle` · Continue Shopping · Review Bundle |
| Sticky bar | 60px · above bottom nav · items · total · seller · Review |
| Seller conflict | Popup copy Owner-locked · Continue · Cancel |
| Review items | 80×80 · title · price · qty · live stock · delete |
| Review CTAs | Make Offer · Buy Now |

### Interaction

- Add to Bundle: optimistic sheet · no full-page load  
- Continue Shopping: dismiss · stay on listing  
- Review Bundle: `/bundle/review`  
- Sticky bar live via Bundle Engine sync event  

### Responsive

Same design · mobile first · tablet/desktop width only.  
iPhone SE → Pro Max · Android · Tablet · Desktop · portrait/landscape.

### Accessibility

Keyboard · VoiceOver · screen reader · focus trap in sheet · ARIA dialog · `prefers-reduced-motion` disables sheet/bar motion.

### Developer notes

- Reuse `ProductStoreSection` on Review — no second seller card  
- Reuse Checkout UI — items list only  
- DB is authority — never localStorage as authority  
- Do not modify frozen Sell / View Item layouts beyond this spec  

### QA checklist

- [ ] Stock hidden when stock = 1  
- [ ] Qty only when stock > 1  
- [ ] Sheet 320 / 220ms  
- [ ] Sticky bar 60 after first item  
- [ ] Other-seller popup  
- [ ] No View Item redesign  
- [ ] Scroll still clears sticky CTAs  

---

**Owner status:** APPROVED for implementation under Bundle Engine Master Spec.  
**Freeze:** Bundle UI not frozen until engineering freeze conditions PASS.
