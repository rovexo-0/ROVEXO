# MFA_UI_DIAGNOSTIC.md

**TITLE:** MFA UI DIAGNOSTIC  
**DATE:** 2026-08-03  
**MODE:** Evidence only · No code changes · No database changes · No commits · No push  
**ROUTE:** `/account/security/two-factor`

---

## ROOT CAUSE

The enrollment UI is **not hidden by a runtime flag**.  
The page the Owner is describing is the **committed Support-only stub**.

| Source | Lines | Shows “Not enabled yet” + Contact Support | Shows Enable 2FA / QR / verify |
|---|---|---|---|
| `HEAD` / `origin/develop` | **98** | **YES** | **NO** |
| Local worktree (uncommitted) | **540** | NO | YES |

**Exact file:** `features/account/components/AccountTwoFactorPage.tsx`  

**Exact condition (committed stub):** there is **no** `Enable 2FA` button and **no** enroll phase. When MFA is off, the stub **always** renders Support copy + Contact Support / Help Centre rows.

**Exact reason enrollment UI is not visible:**  
Owner is viewing the **git-committed** implementation (or a deploy built from it). That version never mounts QR / TOTP verify / recovery UI. The full enrollment implementation exists only as a **local uncommitted modification** (`git status`: `M features/account/components/AccountTwoFactorPage.tsx`) and has **not** been committed, pushed, or deployed.

---

## Answers

### 1. Is the Enable 2FA button intentionally hidden?

**On the committed page: it does not exist** (not CSS-hidden).

Evidence (`git show HEAD:features/account/components/AccountTwoFactorPage.tsx`):

- Description when disabled: `"Not enabled yet."`
- Section: `"How to manage 2FA"`
- Copy directs user to **Contact Support** / Help Centre
- **Zero** references to `startEnroll`, `Enable 2FA`, QR, or recovery codes

On the **local uncommitted** file: Enable 2FA is shown when `phase === "status" && !isEnabled && status loaded` (`data-testid="mfa-enable"`). Not feature-flagged.

---

### 2. Which component renders this page?

| Layer | File | Role |
|---|---|---|
| Route | `app/account/security/two-factor/page.tsx` | `return <AccountTwoFactorPage />` |
| Page UI | `features/account/components/AccountTwoFactorPage.tsx` | Sole page body |
| Entry link | `features/account/components/AccountSecurityPage.tsx` | `href="/account/security/two-factor"` |

No alternate two-factor page component.

---

### 3. Which condition prevents the enrollment UI from rendering?

**Committed stub (what Owner describes):**

No conditional gate hides enrollment — enrollment UI was **never implemented** in that file version. The disabled branch always renders Support messaging.

Relevant committed structure:

```tsx
description={enabled ? "Authenticator app is enabled." : "Not enabled yet."}
// ...
<CanonicalSection title="How to manage 2FA">
  <CanonicalInfoBlock>
    {enabled ? "…protected…" : "…Contact Support from Help Centre to enable…"}
  </CanonicalInfoBlock>
  <CanonicalMenuRow title="Contact Support" href="/support?category=security" />
  <CanonicalMenuRow title="Help Centre" href="/help" />
</CanonicalSection>
```

**Local uncommitted file (if running with that source):** enrollment is gated only by UI phase/state:

- `phase === "enroll" && enroll` → QR + secret + verify  
- Enable button: `!isEnabled` after status load  
- No env/feature-flag check in that component

---

### 4. Feature flag / permission / env / runtime check?

**None found** that block enrollment UI on this page.

| Check | Result |
|---|---|
| Feature flag in `AccountTwoFactorPage` | **Absent** |
| `process.env` MFA UI gate | **Absent** (only `MFA_RECOVERY_PEPPER` in recovery crypto server-side) |
| Master Engine feature visibility for this page | **No** `two-factor` / MFA UI gate in master-engine for this route |
| Permission role check in page | **Absent** |
| Auth required | Middleware/login redirect for guests (307 → login) — not the Support stub |

`MFA_TOTP_V1` SSOT paths/APIs exist under `lib/auth/mfa/`; they do **not** toggle this stub UI.

---

### 5. Which existing component implements QR / TOTP verify / Recovery?

| Capability | Where |
|---|---|
| QR generation + secret | **Same** `AccountTwoFactorPage` (worktree) via `POST /api/auth/mfa/enroll` |
| TOTP verify (enable) | **Same** page via `POST /api/auth/mfa/verify-enrollment` |
| Recovery codes display/download | **Same** page after successful verify (`recovery_show` phase) |
| Login MFA challenge (post-login) | `features/auth/components/MfaChallengeScreen.tsx` on `/login/mfa` |
| Backend | `app/api/auth/mfa/enroll`, `verify-enrollment`, `disable`, `recovery/regenerate`, `status`, etc. |

Committed `AccountTwoFactorPage` implements **none** of QR / enroll verify / recovery UI.

---

### 6. Is that component mounted anywhere?

| Surface | Mounted? |
|---|---|
| `/account/security/two-factor` → `AccountTwoFactorPage` | **YES** (always this component) |
| Enrollment UI **inside** that component (committed) | **NO** — stub only |
| Enrollment UI **inside** that component (local uncommitted) | **YES** — in worktree file |
| `/login/mfa` → `MfaChallengeScreen` | **YES** (challenge after login; not enrollment) |

`AccountTwoFactorPage` is imported **only** from `app/account/security/two-factor/page.tsx`.

---

## Git / deploy evidence

```text
git status:  M features/account/components/AccountTwoFactorPage.tsx
diff vs HEAD: +490 / −48 lines (stub → full enrollment UI)
HEAD / origin/develop: Contact Support stub (98 lines)
HEAD: Enable 2FA / startEnroll = FALSE
origin/develop: Enable 2FA / startEnroll = FALSE
```

Production build artefacts under `.next/server` / `.next/static`: **no** `Enable 2FA` / `mfa-enable` markers for this flow; consistent with last build from stub source.

Local `.next/dev` chunks **do** contain `Enable 2FA` / `mfa-enable` (compiled from worktree) — so a **logged-in** local session on a hot-reloaded worktree should show Enable 2FA, **not** Contact Support.

If Owner still sees Contact Support:

1. Viewing **https://www.rovexo.co.uk** (or any deploy from `origin/develop`) → committed stub, **or**  
2. Viewing localhost but an old tab/process without the modified file, **or**  
3. Not on this worktree.

Owner-quoted strings match **HEAD** exactly: `Not enabled yet` + `Contact Support`.

---

## Final diagnostic statement

```
ROOT CAUSE =
  Committed AccountTwoFactorPage is a Support-only stub.
  Enrollment UI is local/uncommitted only → not what Owner sees on committed/deployed app.

Exact file =
  features/account/components/AccountTwoFactorPage.tsx
  (rendered by app/account/security/two-factor/page.tsx)

Exact condition =
  HEAD/origin implementation has no Enable/enroll branches;
  disabled state always renders “Not enabled yet” + Contact Support.

Exact reason enrollment UI is not visible =
  That UI is not present in the committed source the Owner is viewing;
  it is not blocked by a feature flag.
```

---

*No code modifications. No database modifications. No commits. No push.*
