# Help / Legal / About / Support — Step 3 E2E Certification

**STATUS: REVIEW**  
**STEP_3_E2E: NOT PASS**  
**Host:** `http://localhost:3000` (Chromium Playwright)  
**Scope:** Real-browser hardening of existing Help / Legal / Privacy / About / Support. No CMS. No Legal rewrite. No migrations. No commit.

## What changed

- Playwright spec: `e2e/help-step-3-e2e-hardening.spec.ts`
- `HelpCategoryHubPage` is a client component so seller-context refresh can run
- Denied / hidden Help metadata uses generic title + `noIndex` + `omitCanonical`
- Individual Support probe: invalid category → 400 (no ticket write)

## What did not change

- Help / Legal / Support / Privacy engines
- Legal wording
- Auth, Stripe, Checkout, Shipping, Wallet, Inbox, Orders
- No Help CMS, no Legal CMS, no `/help-v2`
- No production writes, migrations, commit, push, or deploy

## Executable result

| Gate | Result |
|---|---|
| Guest desktop / mobile / narrow | PASS |
| Guest IA, search, legal aliases, About, sitemap | PASS |
| Individual Help / Legal / Privacy / Safety / About / Support form | PASS |
| Guest + Individual Business-article leak / metadata | PASS |
| Business Help + real switch UI | NOT EXECUTED — Full Demo seller shows Upgrade to Business |
| Support ticket create | NOT EXECUTED — no safe local-only write path; localhost may share production DB |

Browser infrastructure was available. This is **not** `BLOCKED_EXTERNAL`.

## Owner items

- Complete Full Demo seller Business onboarding (or provide an Owner-approved Business-ready demo account) before Business / switch E2E can run
- Legal Phase C.1 Personal Account-only wording vs live `seller_context` — do not rewrite Legal here
- Protection timing hours, shipping quotes, promote/featured/bumps — Help documents live behaviour only
