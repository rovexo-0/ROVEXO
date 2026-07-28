# ROVEXO GLOBAL FAIL CLOSED ENGINE v1.0 (LOCK)

| Field | Value |
|---|---|
| **Module** | ROVEXO GLOBAL FAIL CLOSED ENGINE v1.0 |
| **Status** | IMPLEMENTATION PASS — awaiting Owner production cutover |
| **SSOT** | `lib/fail-closed/` · Master Engine `lib/master-engine/fail-closed.ts` |
| **UI** | `components/fail-closed/FailClosedPanel.tsx` |

## Golden rule

If something fails, the user must believe information is **temporarily unavailable** — never that the platform is broken.

Never: white screen · crash · broken nav · secret / ENV / API / DB / stack exposure.

## Owner copy

- Something went wrong.
- Some information is temporarily unavailable.
- Please try again shortly.
- **Retry**

Or: We're updating this section. / Please try again shortly. / **Retry**

## Behaviour

Header · navigation · skeletons · soft fail · friendly message · Retry · preserve design system.

## Activation

Crash prevention is **always active** (local + production).  
Feature visibility “SHOW EVERYTHING” in non-production modes is unchanged (Master Engine).

## Surfaces

Homepage · Profile · View Profile · Settings · Wallet · Promote · Store Showcase · Verification · Payment Methods · Banks · Search · Product · Orders · Inbox · Checkout · Shipping · entire platform route `error.tsx` coverage.
