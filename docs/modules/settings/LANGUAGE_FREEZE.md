# Language module v1.0 — Freeze

| Field | Value |
|-------|-------|
| Module | Language |
| Version | v1.0 |
| STATUS | **FROZEN** |
| Canonical status | `CANONICAL_FROZEN_v1.0` |
| Freeze constant | `LANGUAGE_MODULE_STATUS` / `LANGUAGE_MODULE_FROZEN = true` |
| Spec | `docs/modules/settings/LANGUAGE_SPECIFICATION.md` |
| Freeze module | `lib/i18n/freeze.ts` |
| Guard tests | `tests/i18n.test.ts` |
| Freeze date | **2026-07-14** |

## Approved reference

Authoritative live preview (develop):

- https://rovexo-git-develop-rovexo.vercel.app/account/preferences/language

Current implementation approved as the canonical Language module v1.0.

## Frozen implementation surfaces

| Layer | Path / component |
|-------|------------------|
| Route | `/account/preferences/language` |
| Page | `AccountLanguagePage` |
| Picker | `LanguagePicker` |
| Provider | `LocaleProvider` (`lib/i18n/provider.tsx`) |
| Hooks | `useTranslation` (`t` / `tx`) |
| Display locales | `APP_DISPLAY_LOCALES` / `LANGUAGE_DISPLAY_LOCALES` |
| Message catalogs | `lib/i18n/messages/*` |
| UI phrases | `lib/i18n/ui-phrases.ts` |

## Rules for future development

### Allowed under Language v1.0

- Bug fixes that restore approved localization behaviour without changing mappings or UI
- Crash / crash-fallback fixes that preserve English fallback semantics

### Prohibited under Language v1.0

- UI / layout / typography / icon / colour / card / button / header changes on the Language page
- Changes to translation mappings or localization behaviour
- Adding / removing / reordering supported display languages
- Changing persistence keys, default locale, or English-fallback rules
- Touching Settings, My Account, Home, bottom navigation, routing, APIs, or database as part of Language v1.0 work

### Required for new language work

- Ship as **Language v1.1** (or later) with an explicit version bump
- Do not mutate frozen `CANONICAL_FROZEN_v1.0` artefacts in place

## Versioning

| Version | Status |
|---------|--------|
| Language v1.0 | `CANONICAL_FROZEN_v1.0` — current approved production |
| Language v1.1+ | Future work only |
