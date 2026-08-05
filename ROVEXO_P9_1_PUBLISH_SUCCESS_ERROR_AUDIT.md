# P9.1 — PUBLISH SUCCESS ERROR AUDIT

**STATUS:** EVIDENCE AUDIT COMPLETE · **EXACT STACK NOT CAPTURED** · **NO FIX APPLIED**  
**Law:** Cod Sânge · Evidence first · No guess · No publish/DB/UI/business-logic changes · No commit/push/deploy  
**Host evidence:** `http://localhost:3000` (dev server terminal capture)  
**Owner report:** Safari shows global **"Something went wrong."** after successful publish  

---

## 1. Verdict (honest)

| Question | Answer |
|---|---|
| Is publish engine the FailClosed cause? | **NO** (ruled out) |
| Is there an auto-redirect after create publish? | **NO** (code + logs) |
| Did post-publish `GET /sell` (refresh) fail server-side in captured run? | **NO** — **HTTP 200** |
| Exact stack / component / failing request for Safari FailClosed? | **NOT PROVEN** — blocked by FailClosed (hides message/digest) + no Safari Web Inspector capture in this session |
| Fix proposed? | **NO** — forbidden until exact RCA proven |

**Root-cause certification:** **INCOMPLETE — OWNER SAFARI CONSOLE REQUIRED**

Do not treat any candidate below as certified RCA.

---

## 2. What “Something went wrong.” is (proven)

| Fact | Evidence |
|---|---|
| Copy SSOT | `lib/fail-closed/constants.ts` → `FAIL_CLOSED_COPY.title = "Something went wrong."` |
| Panel | `components/fail-closed/FailClosedPanel.tsx` |
| Global route error UI | `app/error.tsx` → `FailClosedPanel` density `page` |
| Root crash UI | `app/global-error.tsx` → same title, full-viewport |
| Listing segment error UI | `app/(platform)/listing/[slug]/error.tsx` → same title, density `section` |
| Sell segment error.tsx | **None** → sell falls through to **`app/error.tsx`** |
| FailClosed never shows | `error.message`, stack, or digest in UI |

→ Owner-visible surface is a **Next.js Error Boundary / FailClosed panel**, not Sell `formError`.

---

## 3. Post-publish create flow (code map — proven)

Canonical path: `features/sell/context/SellProvider.tsx` after `runPublishPipeline` succeeds (**create**, not edit):

1. `clearSellDraft()`
2. `createNewListingSession(...)` — revoke blobs, clear IDB photos, empty draft
3. Reset draft refs / state
4. `setPublishSuccess(successPayload)` → `PublishSuccessDialog` (`components/sell/PublishSuccessDialog.tsx`)
5. `router.refresh()` while still on **`/sell`** (comment: bust RSC cache for store/listings)
6. `trackListingPublished(...)` (GA only)

**Not executed on create success:**

- `router.push(/listing/...)` — only on **edit** path or later **View Listing** tap
- Auto-navigation to listing

**View Listing** (user gesture only):

1. Soft probe `GET /listing/{slug}` (up to 6×)
2. `router.push(path)` + `router.refresh()`
3. On catch → `window.location.assign(...)`

**Sell RSC:** `app/(platform)/sell/page.tsx`

```ts
await getProfile();
return <SellPage />;
```

`getProfile()` missing profile → `redirect("/auth/signout...")` (Next redirect — **not** FailClosed).  
Other throws → bubble → **`app/error.tsx`**.

---

## 4. Live runtime evidence (localhost:3000 terminal)

Captured after a real authenticated publish:

```
GET /api/account/profile-gate?intent=publish&returnTo=%2Fsell  200
POST /api/listings                                           200 in 2.8s
GET /sell                                                    200 in 255ms   ← post-success router.refresh()
POST /api/analytics/live-presence                            200
GET /api/inbox/badge                                         200
GET /                                                        200           ← dismiss-to-home path
```

**Absent after that POST:**

- `GET /listing/...`
- Page-route `500`
- Server stack / digest for `/sell` refresh
- ChunkLoadError lines in that window

**Also present earlier (pre-publish draft autosave — not FailClosed):**

```
POST /api/sell/draft 500 — Error: Enter a price of at least £0.01.
```

→ Draft price validation noise only; **not** the global FailClosed surface.

---

## 5. Category matrix (evidence only)

| Category | Status | Evidence |
|---|---|---|
| **Publish engine** | **RULED OUT** as FailClosed cause | POST 200 + listing created (Owner + logs). Pipeline errors caught → `setFormError` / toast path. `parsePublishSuccessResponse` throw is inside `publishListing` try/catch → formError, not `app/error.tsx`. |
| **Redirect (auto)** | **RULED OUT** for create | No `router.push` after create. Logs: stay on `/sell` then optional `/`. |
| **Server render `/sell` refresh** | **RULED OUT in captured run** | `GET /sell` **200** immediately after POST. |
| **getProfile → signout redirect** | **RULED OUT for FailClosed** | Missing profile uses `redirect()`, not FailClosed copy. |
| **Hydration** | **UNPROVEN** | No Safari console / React hydration error captured. |
| **Error Boundary** | **SURFACE PROVEN** · **trigger UNPROVEN** | UI = FailClosed via `app/error.tsx` / `global-error.tsx` / listing `error.tsx`. Activating throw unknown. |
| **Subsequent API** | **No failing page API in captured run** | Badge / presence / homepage APIs **200**. Draft **500**s were **before** publish. |
| **Safari-specific** | **CLAIMED by Owner** · **not reproduced here** | Agent capture is localhost server log (browser UA unknown). Prior P3.1: Safari ChunkLoadError under Turbopack HMR — recovery reloads; if cooldown spent, may leave unhandled chunk failure (not proven for this publish). |
| **Next.js framework** | **POSSIBLE amplifier** · **not proven** | Soft navigation + `router.refresh()` + `revalidatePath` storm after publish (`lib/listings/revalidate-published-listing.ts`). Client FailClosed can activate with flight still logging HTTP 200. |
| **View Listing → listing RSC** | **POSSIBLE if Owner taps View** | `listing/[slug]/error.tsx` same copy. Captured run had **no** listing GET — so not that run’s path. |

---

## 6. Exact stack / component / failing request

| Required deliverable | Result |
|---|---|
| Exact stack trace | **BLOCKED** — FailClosed strips message/digest; no Safari Web Inspector dump attached |
| Exact component | **BLOCKED** — surface is FailClosed panel; throwing component unknown |
| Exact route | **Partially constrained** — post-create code stays on `/sell`; FailClosed without View Listing ⇒ segment **`/sell` → `app/error.tsx`** or root **`global-error`**. With View Listing ⇒ **`/listing/[slug]` → listing `error.tsx`** |
| Exact failing request | **BLOCKED** — captured post-publish page/API requests were **200**; client-only throw would not appear as a failed document request |

---

## 7. Why exact RCA cannot be certified without Owner Safari evidence

1. FailClosed **by design** never renders `error.message` / stack / digest (`app/error.tsx`, `global-error.tsx`).
2. Next soft navigation can activate the client error boundary **while** RSC document requests log **200** (matches captured `GET /sell 200`).
3. This session has **server logs**, not Safari Console / Network HAR / React component stack.
4. Inventing a stack would violate Cod Sânge (“Do not guess”).

---

## 8. Evidence still required (Owner — one Safari reproduce)

On **iPhone Safari** (or Mac Safari + Web Inspector):

1. Open Console + Network before Publish.
2. Publish until FailClosed appears.
3. Capture **immediately**:
   - Console: first red error (full text + stack)
   - Network: any **failed** document/RSC/`_next/static` or `?_rsc=` request (URL + status)
   - Address bar URL at FailClosed moment (`/sell` vs `/listing/...` vs other)
   - Whether **View Listing** was tapped (yes/no)
4. Screenshot of FailClosed (page vs section chrome helps distinguish `app/error.tsx` vs listing `error.tsx`).

Optional (Owner-authorized only — not done): temporary server log of `error.digest` in `app/error.tsx` — UI-only diagnostic, still no publish pipeline change.

---

## 9. What was not changed

- Publish pipeline / business logic / database / UI  
- Commit / push / deploy  
- No “fix” proposed

---

## 10. Next gate

```
OWNER SAFARI CONSOLE + NETWORK EVIDENCE
  → map throw → single root cause
  → Owner authorizes smallest fix
  → then implement
```

Until then: **RCA = NOT CERTIFIED**.
