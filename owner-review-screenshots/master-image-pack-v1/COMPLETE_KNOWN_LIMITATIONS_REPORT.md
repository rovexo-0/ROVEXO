# ROVEXO v1.0 — Complete Known Limitations Report

## Blocking production (by policy — not bugs)

1. Product Owner has not approved production deploy / official release.
2. No production secret pull; admin Full Demo Playwright remains skipped without service role.
3. This deliverable stops at **Vercel Master Preview READY** — not production.

## Non-blocking residual

| Item | Impact |
|------|--------|
| SSR admin client log noise without service role | Noise only; certification green |
| Login/Register CSS class names retain `--premium` freeze markers | Presentation locked; not marketing redesign |
| Direct `vercel deploy` large upload previously timed out | Prefer git push → Vercel Preview build |
| Master Image Pack binaries large | Preview site may vercelignore pack; reports committed |

## Out of scope for this preview

- New features / redesigns
- Restoring Splash / Welcome
- EU live market activation
- Production money path live certification beyond contract tests
