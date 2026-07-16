# ROVEXO Inbox Hub — Master UI Specification

**Routes:** `/inbox` · `/inbox/conversation/[conversationId]`  
**Canonical UI:** `InboxPage` + `ConversationHub`  
**Styles:** `styles/rovexo/inbox-hub-v1.css` · `styles/rovexo/conversation-hub-v1.css`  
**SSOT modules:** `lib/inbox/*`  
**Status:** **FROZEN** — `CANONICAL_FROZEN_v1.0`  
**Markers:** `data-inbox-freeze="FROZEN"` · `data-conversation-freeze="FROZEN"`

## Universal UI v1.1 compatibility amendment

Approved 2026-07-15. The v1.0 behavior and markers remain frozen; presentation now consumes Universal UI v1.1. Inbox uses 68px-minimum divider rows with 44px media, 14px body text and no card shadow. Filter chips are removed. Exact order context is selected with `?order=<id>` or only when one unambiguous order matches. Tracking, delivery confirmation, disputes and reviews remain inline; legacy detail routes remain recovery fallbacks.

## Freeze rule

Inbox Hub v1.0 is the single source of truth for marketplace communication.

- Legacy `/messages`, `/messages/[id]`, `/notifications` remain redirects only.
- No duplicate hubs, alternative layouts, or redesign after freeze.
- Future work ships only as **Inbox Hub v1.1**.

## Locked surface

| Surface | Component | Route |
|---------|-----------|-------|
| List hub | `features/inbox/components/InboxPage.tsx` | `/inbox` |
| Conversation hub | `features/inbox/components/ConversationHub.tsx` | `/inbox/conversation/[conversationId]` |
| Bottom nav | `components/ui/BottomNavigation.tsx` Inbox tab → `/inbox` | combined unread badge |

## Locked visual tokens (list)

| Token | Value |
|-------|-------|
| Header | 64px · controls 40×40 |
| Tabs | 44px · weight 700 · underline 3px pill |
| Cards | radius 20 · pad 20 · Wallet shadow |
| Thumb | 64×64 · radius 14 · overlapping 28 avatar |
| Purple | `#6d28d9` |
| Page pad-x | 16 (24 desktop) |
| Max-width | 440 → 720 → 860 |

## Locked conversation rail

Paid · Packed · Shipped · Delivered · Completed

## Locked behaviour notes (v1.0)

- Tracking / logistics events render only when a linked order exists.
- Swipe-right threshold marks conversation read (Pin remains an explicit swipe action).
- Disputes filter deferred to v1.1 (no fabricated dispute rows).
- Offer Accept is seller-only (API + UI aligned).

## Validation at freeze

- TypeScript · ESLint · Build · Inbox/Conversation unit tests
