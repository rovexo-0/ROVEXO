# UI Polish Pass v1.0 — Visual Approval Pack

Open screenshots in `screenshots/` and read `UI_POLISH_GAP_REPORT.md` for the honest gap list.

**Regenerate screenshots** (production server required):

```bash
npm run build
node scripts/playwright-prestart.mjs 3026
AUDIT_BASE_URL=http://127.0.0.1:3026 node scripts/module2-ui-polish-screenshots.mjs
```

**Demo logins:** `buyer01@demo.rovexo.co.uk`, `business01@demo.rovexo.co.uk`, `superadmin@demo.rovexo.co.uk` — password `RovexoDemo2026!`
