# ROVEXO Smart Visibility Engine — Master Engineering Spec

| Field | Value |
|---|---|
| **Module** | Smart Visibility Engine v1.0 |
| **Status** | IMPLEMENTATION PASS — awaiting Owner approval |
| **SSOT** | `lib/smart-visibility/` |
| **PRODUCTION_READY** | TRUE |
| **ACTIVE** | FALSE |

## Behaviour

| Environment | Behaviour |
|---|---|
| Local / QA / Demo / E2E / Visual / Security certification | **SHOW EVERYTHING** |
| Production (after Owner activation) | Apply production visibility rules |

## Production rules (implemented, not active)

- 0 listings → hide Holiday Mode + Promote Listings
- 1+ listings → show Holiday Mode + Promote Listings
- Not business verified → hide Business Bank Account
- Business verified → show Business Bank Account
- No payment method → hide Withdraw
- Not verified → hide Verified Badge
- Verified → show Verified Badge
- No balance → disable Withdraw
- No transactions → empty state

## Activation

`SMART_VISIBILITY_ENGINE_ACTIVE` remains `false` until Owner production cutover.
Do not activate for development, QA, or certification.
