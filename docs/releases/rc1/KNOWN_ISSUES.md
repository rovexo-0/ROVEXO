# ROVEXO RC1 — Known Issues Register

**Version:** `1.0.0-rc.1` · **Status:** Official verified issues only  
**Rule:** Speculative items are forbidden.

| ID | Issue | Evidence | Status |
|----|-------|----------|--------|
| KI-001 | Supabase OAuth providers (Google / Apple / Facebook) not enabled for production social login | Production certification SSOT · `400 validation_failed` / provider not enabled | **DEFERRED (Owner Approved RC1-OD-001)** — next cycle; removed from RC1 release blockers |
| KI-002 | Public Login/Register social buttons absent by policy (Cluster 6 email-only UI) | Auth UI freezes · Cluster 6 lock | BY DESIGN (v1.0) |
| KI-003 | Push notifications require real-device permission + delivery certification | Phase D.1 Owner gate | PENDING (Owner devices) |
| KI-004 | Live PWA install / standalone / update not Owner-certified on iPhone / Android / Desktop | Phase D.1 Owner gate | PENDING (Owner devices) |
| KI-005 | Live email send matrix + SPF/DKIM/DMARC inbox placement not certified this phase | Phase D.1 Owner gate | PENDING (Owner / ops) |
| KI-006 | HMRC Reporting Centre Owner walkthrough PASS · report ledger **DEFERRED** (RC1-OD-HMRC-001 Option B) · module **PASS+FREEZE** | Agent HMRC report `docs/releases/rc1/HMRC_CERTIFICATION_KI006.md` | **CLOSED (RC1)** |
| KI-007 | Owner visual certification matrix open (iPhone / Android / Tablet / Desktop) | Phase D.1 Owner gate | PENDING (Owner) |
| KI-008 | Live `/sitemap.xml` returns 404 while child sitemaps return 200 | Live HTTP probe 2026-07-30 | PENDING DEPLOY (workspace fix: rewrite → `/api/seo/sitemap-index`) |
| KI-009 | Live still serves `/legal/business-seller-terms` as 200 (C.1 redirect not on live) | Live HTTP probe | PENDING DEPLOY |
| KI-010 | Phase D QA data reset apply not Owner-approved | Phase D dry-run only | PENDING (Owner) |
| KI-011 | Phase D.2 post-deploy certification blocked (no Owner push/deploy) | Phase D.2 SSOT `BLOCKED` | WAITING |
| KI-013 | Optional Redis env present but Upstash ping returns 401 — shown as Degraded + memory fallback (not Unhealthy) for RC1 | Live `/api/health` probe | BY DESIGN (RC1 optional) until Owner configures valid Upstash |
| KI-014 | Email partially configured (RESEND_API_KEY xor EMAIL_FROM) — Degraded until both set | Live `/api/health` | PENDING (ops) · KI-005 |

## Explicitly not listed

- Speculative performance regressions without measurement
- Unverified payment provider failures
- Hypothetical third-party outages
