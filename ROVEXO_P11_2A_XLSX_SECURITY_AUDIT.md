# ROVEXO P11.2A — XLSX SECURITY ROOT CAUSE AUDIT

**STATUS:** EVIDENCE ONLY · COMPLETE · AWAITING OWNER DECISION  
**DATE:** 2026-08-05  
**PARENT:** P11.2 Final Certification (score 9.5 · residual HIGH = `xlsx`)  
**METHOD:** npm audit · package metadata · repo import graph · API route auth tracing · build artifact scan · OSV/GHSA/CVE/SheetJS advisories  

```
NO CODE · NO UI · NO DB · NO API · NO DEPENDENCY UPGRADES · NO COMMIT · NO PUSH · NO DEPLOY
```

---

## Executive Summary

The remaining npm **HIGH** finding is the direct dependency **`xlsx@0.18.5`** (SheetJS Community Edition). It is affected by two advisories. There is **no fixed version on the public npm registry**. Patched builds exist only via the **SheetJS CDN** (outside normal `npm upgrade`).

In ROVEXO, the `xlsx` **library** is imported in **exactly two** TypeScript files (one production parser + one test). Runtime parsing is **server-only**, behind **authenticated seller/business/admin** APIs for Bring-Your-Item / seller migration XLSX import. It is **not** in client bundles. Super-admin UI strings that say `"xlsx"` are **format labels only** and do **not** load SheetJS.

**Actual ROVEXO exposure risk: Medium** (not Critical; not anonymous public).  
**Final Verdict: Accept** (with documented residual + optional future CDN upgrade when Owner authorizes dependency work).

---

## Step 1 — Identify

| Field | Evidence |
|-------|----------|
| **Package name** | `xlsx` (SheetJS Community Edition) |
| **Installed / current version** | **0.18.5** (`node_modules/xlsx/package.json`; `npm ls xlsx`) |
| **Declared in** | `package.json` → `"xlsx": "^0.18.5"` (direct dependency) |
| **Latest on npm registry** | **0.18.5** (no newer npm release) |
| **Patched version (npm)** | **None** — `npm audit` → `fixAvailable: false`, `range: "*"` |
| **Patched versions (SheetJS CDN — not npm)** | Prototype pollution: **≥ 0.19.3**; ReDoS: **≥ 0.20.2** (CDN tarballs) |

### Advisories

| ID | Title | CVE | GHSA | CVSS (npm/GHSA) | Published | Affected (advisory) | CWE |
|----|-------|-----|------|-----------------|-----------|---------------------|-----|
| 1 | Prototype Pollution in sheetJS | **CVE-2023-30533** | **GHSA-4r6h-8v6p-xvw6** | **7.8** High · `CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H` | **2023-04-24** | `< 0.19.3` (CE through 0.19.2) | CWE-1321 |
| 2 | SheetJS Regular Expression Denial of Service (ReDoS) | **CVE-2024-22363** | **GHSA-5pgg-2g8v-p4x9** | **7.5** High · `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H` | **2024-04-05** | `< 0.20.2` (CE through 0.20.1) | CWE-1333 |

**Sources:** `npm audit --json` · [OSV GHSA-4r6h-8v6p-xvw6](https://osv.dev/vulnerability/GHSA-4r6h-8v6p-xvw6) · [OSV GHSA-5pgg-2g8v-p4x9](https://osv.dev/vulnerability/GHSA-5pgg-2g8v-p4x9) · [cdn.sheetjs.com/advisories/CVE-2023-30533](https://cdn.sheetjs.com/advisories/CVE-2023-30533) · [cdn.sheetjs.com/advisories/CVE-2024-22363](https://cdn.sheetjs.com/advisories/CVE-2024-22363)

**Advisory note (vendor):** Workflows that **only export** spreadsheets (write path) are unaffected by prototype pollution; **reading** specially crafted files is the trigger. ROVEXO’s production use is **read** (`XLSX.read`).

---

## Step 2 — Trace Usage

### Direct `import * as XLSX from "xlsx"` (complete)

| File | Role | Functions using library |
|------|------|-------------------------|
| `lib/seller/migration/connectors/file/xlsx-parser.ts` | **Production server** | `XLSX.read`, `XLSX.utils.sheet_to_json` via `parseXlsxBuffer`, `previewXlsxContent`, `listingsFromXlsxContent`, `countXlsxRows` |
| `tests/tier1b-connectors.test.ts` | **Tests only** | Builds sample workbooks with `XLSX.utils.*` / `XLSX.write`; calls parser helpers |

**No other TypeScript/JavaScript files import the `xlsx` package.** Verified by repo-wide search for `from "xlsx"` / `require("xlsx")`.

### Call graph (production)

```
xlsx package
  └── xlsx-parser.ts
        ├── createXlsxConnector (file-xlsx.ts)
        │     └── factory.ts case "file_xlsx"
        │           └── migration engine fetchListings / estimate / validate
        │                 └── POST /api/seller/migration (importMethod: "xlsx")
        └── previewXlsxContent
              └── POST /api/seller/migration/connectors/xlsx/preview
```

| File | Import / use | Runtime path | Frequency |
|------|--------------|--------------|-----------|
| `lib/seller/migration/connectors/file/xlsx-parser.ts` | `import * as XLSX from "xlsx"` | Server module loaded when XLSX migration/preview runs | On-demand (import jobs / preview) |
| `lib/seller/migration/connectors/implementations/file-xlsx.ts` | Imports parser helpers (not package directly) | Connector validate/estimate/fetch | Per XLSX migration job |
| `lib/seller/migration/connectors/factory.ts` | `createXlsxConnector` | When connector definition `implementation === "file_xlsx"` | On-demand |
| `app/api/seller/migration/connectors/xlsx/preview/route.ts` | `previewXlsxContent` | **POST** authenticated preview | On-demand (seller UI) |
| `app/api/seller/migration/route.ts` | Allows `importMethod: "xlsx"` | **POST** create/start job → engine → connector | On-demand |
| `app/api/seller/migration/connectors/xlsx/mapping/route.ts` | Mapping settings only | **GET/PATCH** — **does not call** `XLSX.read` | N/A for advisory |
| `tests/tier1b-connectors.test.ts` | Direct + parser | Vitest | CI / local test |

### Environment classification

| Surface | Uses `xlsx` library? |
|---------|----------------------|
| **Production (server)** | **YES** — seller migration XLSX import/preview |
| **Admin / Super Admin export UI labels `"xlsx"`** | **NO** — string format only; no `import "xlsx"` in incident/executive/compliance engines |
| **Client / browser bundles** | **NO SheetJS** — `.next/static` has **0** files containing `SheetJS`; hits are UI labels (`"xlsx"` format buttons/icons) |
| **Build-only tooling** | **NO** |
| **Dev-only** | **NO** (beyond running the same server code locally) |
| **Tests** | **YES** — `tests/tier1b-connectors.test.ts` |

Build evidence: SheetJS appears under `.next/server/chunks/lib_seller_migration_connectors_file_xlsx-parser_ts_*.js` (server), not in client static chunks as the library.

---

## Step 3 — Exploitability

### Can an attacker reach `XLSX.read`?

| Attacker profile | Reachable? | Path |
|------------------|------------|------|
| Anonymous / public internet | **NO** | Preview and migration APIs require `requireApiAuth` + role |
| Guest | **NO** | 401 |
| Authenticated buyer (role buyer only) | **NO** | Role gate: `seller` \| `business` \| `admin` |
| Authenticated **seller / business / admin** | **YES** | Upload crafted spreadsheet content via preview or migration job |
| Super-admin clicking “xlsx” export format | **Not via this package** | Format enum only; no SheetJS import found |

### Auth / gates (evidence)

**Preview** — `app/api/seller/migration/connectors/xlsx/preview/route.ts`:

1. `requireApiAuth()`  
2. `requireApiRole(["seller", "business", "admin"])`  
3. `isStoreMigrationEnabled()` → 404 if Bring-Your-Item kill-switched  
4. Then `previewXlsxContent(buffer, …)` → `XLSX.read`

**Migration job** — `app/api/seller/migration/route.ts`:

1. `requireApiAuth()`  
2. `requireApiRole(["seller", "business", "admin"])`  
3. Accepts `importMethod: "xlsx"` + optional `fileContent` (Zod max **5_000_000** chars)  
4. **Does not** call `isStoreMigrationEnabled()` on this route (preview/mapping do)  
5. Engine → `createXlsxConnector` → `listingsFromXlsxContent` → `XLSX.read`

### Existing mitigations (already in code — not changed this audit)

| Mitigation | Location |
|------------|----------|
| Max parse buffer **5 MiB** | `XLSX_MAX_BYTES` in `xlsx-parser.ts` |
| Request body string max **5_000_000** | Preview + migration Zod schemas |
| Auth + role | Both API paths |
| Feature kill-switch | `NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED` / `BRING_YOUR_ITEM_ENABLED` (preview/mapping); default ON |
| Server-only parse | No client SheetJS |

### Proof: not reachable from anonymous production traffic

1. No public unauthenticated route imports or calls `xlsx-parser`.  
2. Client JS does not embed SheetJS (`SheetJS` count in `.next/static` = **0**).  
3. Homepage / Checkout / Wallet / Orders / Auth flows do not import `xlsx`.  
4. Exploitation requires a **valid seller/business/admin session** and a **crafted file** submitted to migration/preview APIs.

### What an authenticated seller *could* do

| Advisory | Realistic effect in ROVEXO |
|----------|----------------------------|
| **CVE-2024-22363 ReDoS** | CPU spike / worker stall while parsing malicious spreadsheet (availability to that process/instance) |
| **CVE-2023-30533 Prototype pollution** | Pollute `Object.prototype` during parse in the Node process — impact depends on subsequent request handling in the same isolate; vendor rates High; ROVEXO path is authenticated upload, not anonymous |

This is **self-service / compromised-seller** reachability — **not** drive-by anonymous RCE on the public homepage.

---

## Step 4 — Upstream Status

| Question | Fact |
|----------|------|
| Does `npm audit fix` / `npm view xlsx` offer a patched release? | **NO** — latest npm = **0.18.5**; `fixAvailable: false` |
| Why? | SheetJS CE **no longer published/maintained on npm**; GitHub/npm hosting dispute / CDN distribution model (documented in GHSA text and SheetJS issue traffic) |
| Do patched builds exist anywhere? | **YES** — official **https://cdn.sheetjs.com/** tarballs (e.g. install URL form `https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz` per vendor remediation for ReDoS; ≥0.19.3 for pollution) |
| Speculative community forks on npm? | **Not recommended** — public commentary flags untrusted third-party “xlsx-enhanced” packages; this audit does **not** endorse them |

**Conclusion:** Blind `npm upgrade xlsx` is **impossible**. A real upgrade is a **CDN pin** (or commercial SheetJS) — a deliberate dependency policy change, not a registry bump.

---

## Step 5 — Alternatives (evaluation only — not implemented)

| Option | Pros | Cons | Fits Owner “no code now”? |
|--------|------|------|---------------------------|
| **Temporary mitigation** (size limits, auth, kill-switch) | **Already present** | Does not clear npm audit HIGH | Status quo |
| **Feature isolation / disable BYI XLSX** | Removes runtime reach | Product impact; still leaves dep in `package.json` unless removed | Needs Owner product decision |
| **Library replacement** (ExcelJS, etc.) | Can clear advisory | Code change · regression · out of this audit | Deferred sprint |
| **Sandboxing** (worker / separate process / timeout) | Limits ReDoS blast | Infra/code change | Deferred |
| **Admin-only restriction** | Shrinks who can upload | Sellers lose XLSX import; product change | Owner decision |
| **CDN upgrade to ≥0.20.2** | Addresses both CVEs per vendor | Not npm; supply-chain / lockfile process change; needs Owner-approved dependency work | Deferred |

---

## Step 6 — Risk (ROVEXO-actual)

| Lens | Rating |
|------|--------|
| Advisory severity (npm/GHSA) | **High** |
| Anonymous production traffic | **Not exploitable** |
| Authenticated seller upload path | **Exploitable in principle** (ReDoS / pollution on parse) |
| Money / Checkout / Wallet / Orders cores | **Not on this code path** |
| Client XSS via this package | **No** (server-only) |
| **ROVEXO exposure classification** | **Medium** |

Rationale: High CVSS assumes broader network/unauthenticated or local high-impact models. ROVEXO confines `XLSX.read` to authenticated seller migration with size caps and server-only execution. Residual is real but bounded.

---

## Possible Fixes (catalog — not executed)

1. **Accept residual** — keep 0.18.5; document in security cert (current posture).  
2. **Defer CDN upgrade** — pin `xlsx@≥0.20.2` from `cdn.sheetjs.com` when Owner authorizes dependency change + regression tests on migration.  
3. **Replace parser** — ExcelJS / custom CSV-only policy.  
4. **Disable XLSX import** — remove method + drop dependency from `package.json`.  
5. **Harden further without upgrade** — stricter timeouts, isolate parse in worker, rate-limit preview harder (still won’t clear npm HIGH while package remains).

---

## Recommended Action

| Priority | Action |
|----------|--------|
| **Now** | **Accept** residual for certification continuity; treat as authenticated migration risk, not public Critical. |
| **Next Owner-approved security sprint** | Prefer **CDN upgrade to ≥0.20.2** *or* **Replace** parser; re-run `npm audit` / migration Vitest. |
| **Do not** | Blind npm upgrade (no package exists). Do not install untrusted npm forks. |

---

## Final Verdict

| Field | Value |
|-------|-------|
| **Current version** | `xlsx@0.18.5` |
| **Advisory** | GHSA-4r6h-8v6p-xvw6 + GHSA-5pgg-2g8v-p4x9 |
| **CVE** | CVE-2023-30533 + CVE-2024-22363 |
| **Usage** | Seller migration XLSX import/preview (server) + one Vitest file |
| **Exploitability** | Authenticated seller/business/admin only; not anonymous |
| **Production exposure** | **Medium** |
| **npm fix** | **None** |
| **CDN fix** | Exists (≥0.20.2) — not applied (this audit forbids upgrades) |

# **FINAL VERDICT: Accept**

**Secondary (future, Owner-gated): Defer → CDN Upgrade (≥0.20.2) or Replace.**

Not: Upgrade (via npm — impossible).  
Not: Mitigate-as-primary (mitigations already exist; advisory remains).  
Not: Replace (out of scope; no implementation this phase).

---

## Certification impact

| Item | Status |
|------|--------|
| P11.2 score 9.5 residual HIGH | Explained: **accepted Medium exposure**, not silent Critical |
| Commit / Push / Deploy | **Still Owner-gated** — this audit authorizes **none** |

**STOP.** Evidence only. Await Owner decision.
