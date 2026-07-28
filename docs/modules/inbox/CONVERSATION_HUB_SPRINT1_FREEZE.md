# ROVEXO Conversation Hub — Sprint 1 FREEZE

| Field | Value |
|-------|-------|
| STATUS | **APPROVED · FROZEN** |
| Approved | 2026-07-23 (Product Owner) |
| Surface | `/inbox/conversation/[conversationId]` |
| SSOT | `lib/inbox/conversation-hub-sprint1-freeze-v1.ts` |
| UI | `features/inbox/components/ConversationHub.tsx` |

## Canonical rule

```
ONE ORDER = ONE TIMELINE = ONE TRANSACTION HUB
```

### Buyer equation

```
Item price
+ Shipping
+ Platform Fee
= Total Buyer Pays
→ PAY NOW • £final_total
```

### Seller equation

```
Selling price
→ Buyer paid
→ Print label (later sprint)
→ Payment released (automatic)
```

Seller **never** sees: Platform Fee · Buyer subtotal · Buyer shipping · Total buyer pays · Buyer payment breakdown.

## Pay Now

| Allowed | Forbidden |
|---------|-----------|
| `Pay now • £7.53` | `Pay now • £6.50` (listing-only) |

Pay Now **always** displays the final total paid by the buyer.

## Buyer may see

Item price · Shipping · Platform Fee · Total Buyer Pays · Pay Now · Order status · Offer history · Messages · Tracking · Review

## Seller may see

Selling price · Offer history · Messages · Order status · Tracking · Payment released · Wallet updates

## Automation target

100% automatic: Stripe · Tracking · Labels · Delivery · Escrow · Wallet · Notifications · Reviews · Payment release · HMRC / financial / tax reports — without daily admin intervention.

Admin is **optional only** (emergency freeze / legal / fraud).

## Flows (locked contract — later sprints implement remaining steps)

See `CONVERSATION_HUB_SPRINT1_*_FLOW` constants in the SSOT file.

## Forbidden after freeze

Redesign · duplicate Conversation Hub · second payment UI · seller-visible buyer totals · Pay Now showing item price only
