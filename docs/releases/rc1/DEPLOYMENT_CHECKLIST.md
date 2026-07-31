# ROVEXO RC1 — Deployment Checklist

**Version:** `1.0.0-rc.1` · **Do not execute push/deploy without Owner authorization.**

| Step | Status | Notes |
|------|--------|-------|
| Git working tree clean | PENDING | Dirty until Owner-authorized commit |
| Branch selected (`develop` or release branch) | PENDING | Currently `develop` |
| Commit message references `1.0.0-rc.1` | PENDING | Not committed |
| Owner authorizes GitHub Push | PENDING | Explicit Owner required |
| Push to GitHub | PENDING | Forbidden until authorized |
| Owner authorizes Vercel Production Deploy | PENDING | Explicit Owner required |
| Vercel production environment selected | PENDING | |
| Deploy succeeds / build logs clean | PENDING | |
| Smoke test on https://www.rovexo.co.uk | PENDING | Post-deploy Phase D.2 |
| `/sitemap.xml` 200 after deploy | PENDING | KI-008 |
| Rollback plan ready | PASS | `ROLLBACK_GUIDE.md` |
| Owner approval recorded | PENDING | `OWNER_APPROVAL_SHEET.md` |
| Production LOCK | PENDING | Only after Phase D.2 + Owner |
