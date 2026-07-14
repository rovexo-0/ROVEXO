# ROVEXO Language — Module Specification

**STATUS:**  
**CANONICAL_FROZEN_v1.0**

| Field | Value |
|-------|-------|
| Module | Language |
| Version | v1.0 |
| Freeze | `LANGUAGE_MODULE_STATUS` = `CANONICAL_FROZEN_v1.0` (`lib/i18n/freeze.ts`) |
| Freeze doc | `docs/modules/settings/LANGUAGE_FREEZE.md` |
| Route | `/account/preferences/language` |
| Freeze date | 2026-07-14 |

## Current implementation approved

Language module v1.0 is approved exactly as shipped on develop at freeze time.  
Future changes must ship as **Language v1.1+** only.

## Route

| Route | Purpose |
|-------|---------|
| `/account/preferences/language` | Language preference selector (canonical) |

## Supported languages (display UI)

Exposed via `APP_DISPLAY_LOCALES` / `LANGUAGE_DISPLAY_LOCALES`:

| Code | Language |
|------|----------|
| `en-GB` | English (United Kingdom) — default |
| `ro-RO` | Romanian |
| `de-DE` | German |
| `fr-FR` | French |
| `it-IT` | Italian |
| `es-ES` | Spanish |
| `pl-PL` | Polish |

## Localization behaviour

### Engine

- `LocaleProvider` holds the active `localeCode`
- `useTranslation().t(key)` resolves structured message keys (`lib/i18n/messages`)
- `useTranslation().tx(text)` resolves literal English UI phrases (`lib/i18n/ui-phrases`)
- Shared chrome consumers (bottom nav labels, canonical shells / menu rows / sections, language page confirmation) read the active locale live — no refresh required

### English fallback

- Missing message keys → English UK (`en-GB`) catalog value
- Missing UI phrases → original English source string
- Locales without a native / phrase catalog → English source strings
- No crashes on missing keys

### Persistence

| Layer | Behaviour |
|-------|-----------|
| `localStorage` key `rovexo-locale` | Primary client store |
| Cookie `rovexo-locale` | Survives browser restart (`max-age` 1 year, `path=/`, `SameSite=Lax`) |
| `PATCH /api/settings` (`localeCode`) | Account-backed sync when authenticated |
| Default | `en-GB` |

Persists across refresh, browser restart, logout/login, and new sessions (local + server settings when available).

### Startup loading

1. Pre-paint script may set `<html lang>` / `dir` from stored locale (see root layout)
2. `LocaleProvider` hydrates from `localStorage`, then cookie, else `en-GB`
3. On mount, authenticated sessions may reconcile from `GET /api/settings` when the server `localeCode` differs from local storage
4. Selection applies immediately via locale change event + document `lang` / `dir` update

## Canonical files

| Role | Path |
|------|------|
| Freeze markers | `lib/i18n/freeze.ts` |
| Display locales | `lib/i18n/app-locales.ts` |
| Provider | `lib/i18n/provider.tsx` |
| Hook | `lib/i18n/use-translation.ts` |
| Messages | `lib/i18n/messages/*` |
| UI phrases | `lib/i18n/ui-phrases.ts` |
| Page | `features/account/components/AccountLanguagePage.tsx` |
| Picker | `features/settings/components/LanguagePicker.tsx` |
| Tests | `tests/i18n.test.ts` |

## Explicit non-goals under v1.0 freeze

- Visual redesign of the Language page or any other surface
- Expanding/reducing the seven display languages
- Rewriting translation mappings or engine behaviour
- Database schema or API contract changes for language
