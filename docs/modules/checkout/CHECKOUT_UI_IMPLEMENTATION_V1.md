# ROVEXO v1.0 — CHECKOUT_UI_IMPLEMENTATION

**DOCUMENT TYPE:** Implementation Specification  
**STATUS:** CANONICAL  
**VERSION:** v1.0  
**OWNER:** ROVEXO  

**PURPOSE:** Adapt the backend to the approved Checkout UI.  
The Checkout UI is LOCKED. No visual modifications are permitted.  
Backend logic must adapt to the approved interface.

**Companion SSOT:** `docs/modules/checkout/MASTER_CHECKOUT_ARCHITECTURE_V1.md`

---

## UI STATUS — LOCKED

THE CHECKOUT DESIGN IS APPROVED.  
THE PAYMENT SUCCESS DESIGN IS APPROVED.

**DO NOT MODIFY:** Layout · Spacing · Typography · Colors · Icons · Buttons · Sections · Component order · Margins · Padding · Responsive · Animation · Pixel dimensions.

**NO VISUAL CHANGES.**

---

## CANONICAL USER FLOW

```
Product → BUY NOW → Checkout → PAY → Stripe Payment → Payment Successful → DONE → END
```

### SCREEN 1 — CHECKOUT (display only)

Product Image → Product Name → Product Price → Address → Delivery Option → Delivery Details → Contact Details → Payment Method → Price Summary → PAY Button → Secure Checkout  

**Forbidden on UI:** extra panels · debug · internal IDs · system status · DB values · technical information.

### SCREEN 2 — PAYMENT SUCCESSFUL (display only)

Success Icon → Payment Successful → Thank you for shopping with Rovexo. → Purchased Product Card → DONE  

**Forbidden:** extra buttons · menus · debug · internal IDs.

**DONE** → Close Success → Open Buyer Orders (or configured post-payment destination).

---

## BACKEND (UI must never decide business logic)

### Checkout load

Verify Listing → Buyer → Seller → Inventory → Price → Platform Fee → Shipping  
→ Reserve Inventory → Create Checkout Session → Create Stripe PI → Create Stripe Checkout Session  
→ Render approved Checkout UI  

Any fail → Release Reservation → Public Error → Stop  

### PAY pressed

Disable · prevent double-click · verify session · reservation · PI → Start Stripe → Wait  

### Payment success (Stripe confirmed)

Verify webhook · status · amount · currency · listing · buyer · reservation · session · idempotency  
→ Create Order → Transaction → Escrow → Mark Sold → Clear reserved → Notify Seller → Shipping Job  
→ Render approved Payment Successful screen  

### Payment failure

Release reservation → Destroy Checkout Session → NO Order/Tx/Escrow → Return Checkout → Public Error  

### Engines

| Engine | Responsibility |
|--------|----------------|
| Inventory | Reserve · Release · Mark Sold |
| Checkout Session | Create · Validate · Expire · Destroy |
| Payment | PI · Stripe Checkout · Webhook · Verify |
| Order | Create **only after** payment success |
| Transaction | Create **only after** payment success |
| Escrow | Open **only after** payment success |
| Shipping | Job **only after** payment success |

### Absolute Law

UI NEVER: creates Order/Transaction/Escrow · modifies Inventory · decides business logic.  
UI ONLY displays backend state.

### Implementation Rules

KEEP approved UI.  
CONNECT every component to canonical backend.  
REMOVE every dependency on legacy Pending Order model.  
Use only: Checkout Session → Stripe → Payment Success → Order → Transaction → Escrow → Shipping.

---

## CERTIFICATION CHECKLIST

Checkout UI · Inventory Lock · Checkout Session · Stripe Session · Stripe Payment · Payment Success · Order · Transaction · Escrow · Seller Notification · Shipping · Buyer Orders → PASS/FAIL  

On FAIL: Exact File · Function · Line · Root Cause only.  
NO UI modifications. BACKEND ADAPTATION ONLY.
