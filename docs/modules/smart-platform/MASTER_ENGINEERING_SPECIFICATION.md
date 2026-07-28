# ROVEXO Global Smart Platform Engine — Master Engineering Spec

| Field | Value |
|---|---|
| **Module** | Global Smart Platform Engine v1.0 |
| **Status** | IMPLEMENTATION PASS — awaiting Owner approval |
| **SSOT** | `lib/smart-platform/` |
| **PRODUCTION_READY** | TRUE |
| **ACTIVE** | FALSE |

## Golden rule

| Mode | Behaviour |
|---|---|
| Local / QA / Demo / Certification / Visual / E2E | **SHOW EVERYTHING** |
| Production (after Owner activation) | **SHOW ONLY WHAT IS AVAILABLE** |

## Sub-engines

Visibility · Verified · Money · Security · Business · Payment · Profile · Settings · Wallet · Feature  

All: `PRODUCTION_READY=true`, `ACTIVE=false` until platform cutover.

## Future features

Register via `registerSmartFeature()` then `resolveFeatureVisibility()`.  
Never rewrite platform logic per feature. Never remove features — only show/hide.

## Money safety (when ACTIVE)

Fail closed if Identity / Verification / Payment / Security / Data Match / Withdraw / KYC / Fraud fail.

## Forbidden

No commit / push / deploy / live migrations / secret changes / production activation without Owner.
