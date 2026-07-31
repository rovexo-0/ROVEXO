# SENDCLOUD WEBHOOK IDEMPOTENCY v1.0 — CERTIFICATION REPORT

**Status:** Implementation complete · Owner visual / production migrate pending  
**Law:** Fail closed · Exactly-once delivery · No Commerce/Escrow/Resolution redesign

## Chosen Event Identity

Sendcloud **does not** publish a dedicated webhook event UUID for `parcel-status-changed`.

Official docs: payload mirrors parcel retrieve; includes **timestamp** for ordering.

**Chosen official composite (no invented UUID, no payload hash as identity):**

```
webhook_event_id = "{parcel.id}:{status.id}:{timestamp}"
```

| Field | Source |
|-------|--------|
| `parcel.id` | Official Sendcloud parcel id |
| `status.id` | Official Sendcloud status id |
| `timestamp` | Official webhook timestamp |

Missing any of the three → **HTTP 400** (fail closed).

## Files Modified / Added

| Path | Change |
|------|--------|
| `supabase/migrations/20260731140000_sendcloud_webhook_idempotency_v1.sql` | **NEW** table + PK unique |
| `lib/shipping/sendcloud/webhook-idempotency-v1.ts` | **NEW** extract / claim / complete / release |
| `lib/shipping/sendcloud/webhooks.ts` | Wire claim before side effects (HMAC **unchanged**) |
| `app/api/webhooks/sendcloud/route.ts` | Duplicate `200` + statusCode-aware errors |
| `lib/shipping/sendcloud/index.ts` | Export SSOT helpers |
| `lib/supabase/types/database.ts` | Table types |
| `tests/sendcloud-webhook-ops-v1.test.ts` | Certification tests |

## Database

**Table:** `public.sendcloud_webhook_events`

| Column | Notes |
|--------|-------|
| `webhook_event_id` | **PRIMARY KEY** (UNIQUE) |
| `tracking_number` | nullable |
| `order_id` | nullable uuid |
| `event_type` | required |
| `processed_at` | timestamptz |
| `payload_hash` | optional (sha256 of identity string) |
| `source` | `sendcloud` |
| `metadata` | jsonb |
| `status` | `processing` \| `completed` \| `failed` |

**Indexes:** `processed_at`, `order_id`, `tracking_number`  
**RLS:** enabled · service_role only

## Processing Flow

```
Receive → Verify HMAC (certified, unchanged) → Validate parcel
  → Extract Event ID (fail closed)
  → Atomic INSERT claim
      ├─ 23505 → HTTP 200 { received:true, duplicate:true }  (NO side effects)
      └─ claimed → updateShippingRecordStatus
                 → onShippingRecordStatusChanged
                 → complete claim
                 (on error → release claim for Sendcloud retry)
```

## Not Modified

- HMAC verification body
- Commerce Engine
- Escrow Engine
- Resolution Engine
- Shipping store business APIs (called as before, once)

## Tests

`tests/sendcloud-webhook-ops-v1.test.ts`

- first webhook processed + side effects
- duplicate ignored (no second side effects)
- concurrent claim → one claimed / one duplicate
- different status/timestamp → different ids
- missing id rejected
- invalid signature rejected (existing)

## Gates

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint (touched files) | **PASS** |
| Vitest `tests/sendcloud-webhook-ops-v1.test.ts` | **PASS** (11) |
| Build | Run separately for release package; typecheck PASS |

**Engineering idempotency:** PASS  
**Owner PASS + FREEZE:** Requires migration applied on target DB + Owner sign-off (not auto-flipped).
