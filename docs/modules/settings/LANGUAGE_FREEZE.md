# Language module — Freeze

| Field | Value |
|-------|-------|
| Module | Language Engine |
| Version | **2.0** |
| STATUS | **PERMANENT OWNER LOCK** |
| SSOT | `lib/i18n/language-engine-v2.ts` |
| Coverage gate | `lib/i18n/translation-coverage.ts` |
| Spec | `docs/modules/settings/LANGUAGE_ENGINE_V2.md` |
| Guard tests | `tests/language-engine-v2.test.ts` · `tests/i18n.test.ts` |

## Rules

- One user = one language = entire platform
- Fail closed → English (UK)
- 100% translated or 0% production
- UK First: language independent of marketplace/currency/country
- Never translate UGC / identifiers
