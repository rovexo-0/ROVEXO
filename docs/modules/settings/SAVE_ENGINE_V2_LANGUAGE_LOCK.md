# ROVEXO Save Engine v2.0 + Platform Language — Final Owner Lock

**STATUS: APPROVED | PERMANENT | ROVEXO v1.0**

## Save Engine v2.0

| Field | Value |
|-------|-------|
| SSOT | `lib/account/save-engine-v2.ts` |
| Account UI | `/account/profile` |
| Behaviour | Automatic save · toast only · no SAVE button |

Flow: change value → Saving… → Saved Successfully ✓ → auto-hide (0.8–1.5s)

Sensitive actions still require manual confirmation.

## Platform Language

| Field | Value |
|-------|-------|
| SSOT | `lib/i18n/platform-language.ts` |
| Language | **English (UK) only** |
| Multi-language | **REMOVED** |

Removed: Language Engine · Selector · Picker · Switcher · Preferences · all non-UK languages from UI.

## What changed

- Account Settings auto-save (v1.5 DOM)
- Language row / menus / pickers removed
- Locale forced to `en-GB`

## What did not change

- Auth · Stripe · Wallet money logic · UK marketplace · Currency independence
