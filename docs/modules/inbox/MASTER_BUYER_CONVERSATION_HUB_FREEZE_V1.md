# ROVEXO Master Buyer Conversation Hub Freeze v1.0

| Field | Value |
|-------|-------|
| STATUS | **PERMANENT FREEZE APPROVED · ABSOLUTE LAW** |
| Approved | 2026-07-23 |
| SSOT | `lib/inbox/master-buyer-conversation-hub-freeze-v1.ts` |
| UI | `features/inbox/components/ConversationHub.tsx` |
| Preview | `https://preview.rovexo.co.uk/inbox` · `http://localhost:3010/inbox` |

## Absolute law

- Owner-approved image = **CANONICAL MASTER UI**  
- No alternate Buyer Conversation Hub UI without Owner approval  
- Code PASS ≠ Product PASS  
- Product PASS = Code + Tests + Preview + Visual PASS + Owner Approval + Certification  
- White / Empty / Missing Image / Missing BUY NOW sticky / Missing sticky action = **Product FAIL**  
- Zero Regression = permanently mandatory  

## UI freeze (nothing may be removed)

```
HEADER
→ PRODUCT IMAGE
→ TITLE
→ PRICE
→ TOTAL BUYER PAYS
→ ORDER STATUS
→ SELLER INFORMATION
→ ORDER SUMMARY
→ OFFER HISTORY
→ CHAT
→ MESSAGE INPUT
→ STICKY ACTION BUTTON
```

## Buyer freeze

Must see: Product Image · Title · Item price · Total buyer pays (incl.) · Order Status · Seller Information · Order Summary · Offer History · Messages · Write message · **BUY NOW • £final_total**

Also (per contract): Platform fee · Shipping · Tracking · Everything OK · Issue Center · Reviews · Refund status · Payment status

## Seller freeze

**Never:** Platform fee · Buyer total · Buyer breakdown · Shipping fee paid by buyer · Total buyer pays  

**Only:** Item price → Paid → Print Label → Track parcel → Delivered → Payment pending → Payment released → Withdraw

## Payment freeze

MAKE OFFER → DECLINED → ACCEPTED → BUY NOW → PAYMENT SUCCESS → ESCROW → PRINT LABEL → TRACKING → DELIVERED → EVERYTHING OK → PAYMENT RELEASE → SELLER WALLET → WITHDRAW → REVIEW → COMPLETED

## Issue Center freeze

DELIVERED → I HAVE AN ISSUE → PAYMENT HOLD → AUTOMATIC REVIEW → BUYER EVIDENCE → SELLER RESPONSE → AI ENGINE → AUTOMATIC DECISION → REFUND or PAYMENT RELEASE

## Automation freeze

ROVEXO v1.0 target = **100% automated** (payments, escrow, tracking, notifications, reviews, release, refunds, HMRC, wallet, Sendcloud, Stripe, fraud/risk/verification, issue center, statistics).

## Super Admin freeze

Not required for platform operation. Optional only: ON/OFF · EMERGENCY STOP · GLOBAL ON/OFF · MANUAL HOLD/RELEASE/REFUND/PAYMENT RELEASE.

## Priority 0 before commit

NO white/empty · NO build/CSS/TS fail · NO responsive/image/button/preview fail → OWNER APPROVAL → FREEZE → TEST → CERTIFICATION → COMMIT → PUSH → DEPLOY

## Permanent law

If Owner cannot SEE + CLICK + SCROLL + PAY + BUY + SELL + TRACK + TEST → **the product does not exist.**

Parent architecture law: Supreme Blood Code V — One Order = One Hub = One Page (`lib/supreme-blood-code-v-v1.ts`).
