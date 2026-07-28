# ROVEXO Notifications — Master Specification

**STATUS:**  
**CANONICAL_v1.0**

| Field | Value |
|-------|-------|
| Module | Notifications |
| Version | v1.0 |
| Status constant | `NOTIFICATIONS_MODULE_STATUS` = `CANONICAL_v1.0` |
| Catalog | `lib/notifications/catalog.ts` |
| Controls | `lib/notifications/controls.ts` |
| Markers | `lib/notifications/canonical.ts` |
| Live list surface | Inbox Hub `/inbox?tab=notifications` (Inbox v1.0 frozen) |
| Canonical list component | `features/inbox/components/InboxPage.tsx` (Notifications tab) |
| Settings UI | `/notifications/settings` |
| Freeze date | 2026-07-14 |

## Scope

Notifications v1.0 is the **only** canonical notifications domain for ROVEXO:

- Event catalog (buyer / seller / marketplace)
- Channels: in-app · push · email
- User controls
- Navigation actions
- List component · settings · empty states
- Idempotent emit + realtime refresh

**No duplicate hubs.** `/notifications` remains a legacy redirect into Inbox Hub (frozen).

## Catalog audiences

### Buyer
Purchase successful · Payment successful · Order confirmed · Order shipped · Tracking updated · Delivered · Refund completed · Offer accepted / declined / expired · Item back in stock · Favorite item price changed

### Seller
New order · New message · Offer received / accepted / declined / expired · Shipping deadline reminder · Item sold · Buyer reported issue · Refund requested · Payout completed

### Marketplace
Account verified · Business verified · Promotional campaigns · Feature announcements · Security alerts · Policy updates · Legal updates

## Notification shape (required fields)

Every notification must resolve:

| Field | Source |
|-------|--------|
| Title | Catalog / emitter |
| Description | Catalog `description` / `subtitle` |
| Timestamp | `createdAt` |
| Related entity | Catalog `entity` + payload ids |
| Status | Catalog `status` |
| Navigation action | Catalog `actionLabel` + href |

### Action examples

| Event | Action |
|-------|--------|
| New order | Open order details |
| Tracking updated | Open tracking page |
| Offer accepted (buyer) | Open checkout |
| New message | Open conversation |

## User controls

| Control | Maps to settings |
|---------|------------------|
| Push Notifications | `pushEnabled` |
| Email Notifications | all `email*` fields |
| Order Notifications | `orders` (+ `emailOrders`) |
| Offer Notifications | `offers` |
| Marketing Notifications | `marketing` / `promotions` / `emailMarketing` |
| Security Notifications | `system` |

## Channels

- **In App** — notifications table + Inbox Hub Notifications tab (`InboxPage`)
- **Push** — deliver pipeline when `pushEnabled`
- **Email** — deliver pipeline when email* controls enabled

## Performance contract

- Instant local apply on mark/delete (optimistic)
- Background sync via RealtimeNotificationProvider
- Zero duplicates via `idempotency_key` on `notification_events`
- Smart refresh on visibility / reconnect
- Infinite scroll (client page chunks) in Inbox Hub Notifications tab
- No UI freeze (transitions for load-more)

## Empty states

- **No Notifications Yet** — Your notifications will appear here.
- **No Order Notifications** — Order updates will appear here.

## Explicit non-goals

- Do not redesign frozen Inbox Hub chrome
- Do not modify Settings hub / Language / Account freezes
- Do not change DB `notification_type` enum in v1.0 (catalog maps onto existing types)
