# P9.1B — FAILCLOSED TRACE DIAGNOSTICS

**STATUS:** DIAGNOSTICS INSTALLED · **NO FIX** · **EXCEPTION CAPTURE PENDING OWNER REPRODUCE**  
**Law:** Cod Sânge · Diagnostics only · No publish / routing / DB / API / UI / Error Boundary behaviour change · No commit / push / deploy  

---

## Objective

Identify the **exact exception** that activates the global **"Something went wrong."** FailClosed page after a successful Publish (`POST /api/listings` 200).

P9.1 proved FailClosed is the surface and publish engine is not the FailClosed cause; the throwing exception was hidden by design. P9.1B adds **temporary console instrumentation** only.

---

## What was installed (removable)

| File | Role |
|---|---|
| `lib/diagnostics/failclosed-trace-p91b-v1.ts` | Trace payload builder + fetch/nav/rejection breadcrumbs · tag `[FAILCLOSED_TRACE]` |
| `components/diagnostics/FailClosedTraceBootstrap.tsx` | Mounts listeners · renders **null** |
| `app/layout.tsx` | Mounts `<FailClosedTraceBootstrap />` next to `ChunkLoadRecovery` |
| `app/error.tsx` | Logs ENTER / TRACE / EXIT · **same** FailClosedPanel UI |
| `app/global-error.tsx` | Same |
| `app/(platform)/listing/[slug]/error.tsx` | Same |

Search cleanup markers: `FAILCLOSED_TRACE` · `FAILCLOSED_TRACE_P91B` · `P9.1B TEMPORARY`

### Explicitly unchanged

- FailClosedPanel copy / density / layout / CSS  
- Publish Engine / SellProvider / routing / DB / API contracts  
- Error Boundary recovery (`reset`) behaviour  
- No commit / push / deploy  

---

## Log contract

Every activation emits console errors prefixed with **`[FAILCLOSED_TRACE]`**:

1. `[FAILCLOSED_TRACE] ENTER_ERROR_BOUNDARY` + payload  
2. `[FAILCLOSED_TRACE] TRACE` + flat field object  
3. On unmount: `[FAILCLOSED_TRACE] EXIT_ERROR_BOUNDARY` + payload  

Unhandled rejections (while bootstrap is live):

- `[FAILCLOSED_TRACE] UNHANDLED_REJECTION` + reason  

Bootstrap once:

- `[FAILCLOSED_TRACE] BOOTSTRAP_INSTALLED`

### TRACE fields

| Field | Source |
|---|---|
| `pathname` | `window.location.pathname` |
| `searchParams` | `window.location.search` |
| `routeSegment` | same as pathname (client) |
| `error.name` | `errorName` |
| `error.message` | `errorMessage` |
| `error.digest` | `errorDigest` (Server Component flight) |
| `stack` | `error.stack` if present |
| `componentStack` | reserved (Next route `error.tsx` does not pass React `componentStack`; null unless later wired) |
| `clientComponentName` | best-effort parse from stack |
| `originGuess` | `server-component` \| `client-component` \| `promise-rejection` \| `unknown` |
| `previousRoute` | breadcrumb |
| `previousSuccessfulNavigation` | breadcrumb |
| `previousSuccessfulApiRequest` | last `fetch` with 2xx (method + URL + status) |
| `lastRejectedPromiseReason` / `At` | last unhandledrejection |
| `timestamp` | ISO |
| `boundary` | which error file activated |

**UI still never shows** message / digest / stack (FailClosed law preserved).

---

## How to capture (Owner — Safari after Publish)

1. Open `http://localhost:3000/sell` (or official Owner URL once this build is visible there).  
2. Open **Web Inspector → Console** (filter: `FAILCLOSED_TRACE`).  
3. Confirm `BOOTSTRAP_INSTALLED` after load.  
4. Publish until FailClosed appears.  
5. Copy **all** `[FAILCLOSED_TRACE]` lines (ENTER + TRACE + any UNHANDLED_REJECTION).  
6. Note address bar URL at FailClosed.  
7. Paste into this report under § Capture results (or send to Cursor).

---

## Capture results

**STATUS: PENDING — not yet reproduced in this diagnostics session.**

| Field | Value |
|---|---|
| boundary | _pending_ |
| pathname | _pending_ |
| searchParams | _pending_ |
| error.name | _pending_ |
| error.message | _pending_ |
| error.digest | _pending_ |
| stack | _pending_ |
| originGuess | _pending_ |
| previousSuccessfulApiRequest | _pending_ (expect includes `POST /api/listings → 200`) |
| previousSuccessfulNavigation | _pending_ |

After Owner paste, this section becomes the **exact exception** for P9.1 RCA certification.

---

## Interpretation guide (after capture)

| Signal | Meaning |
|---|---|
| `boundary: app/error.tsx` + pathname `/sell` | Route-level FailClosed on Sell (post-`router.refresh` or client throw) |
| `boundary: …/listing/[slug]/error.tsx` | FailClosed on View Listing path |
| `boundary: app/global-error.tsx` | Root layout / provider crash |
| `errorDigest` set, thin/`digest` message | **Server Component** throw (Next digest) |
| `stack` + `clientComponentName` | **Client Component** throw |
| `originGuess: promise-rejection` + `lastRejectedPromiseReason` | Unhandled rejection correlated within 15s |
| `previousSuccessfulApiRequest` ends with `POST /api/listings → 200` | Confirms post-publish timing |

---

## Removal checklist (after capture — Owner-authorized)

1. Delete `lib/diagnostics/failclosed-trace-p91b-v1.ts`  
2. Delete `components/diagnostics/FailClosedTraceBootstrap.tsx`  
3. Revert `app/layout.tsx` bootstrap import/mount  
4. Restore `app/error.tsx` / `app/global-error.tsx` / listing `error.tsx` to pre-P9.1B (FailClosedPanel only)  
5. Ripgrep: zero hits for `FAILCLOSED_TRACE` / `failclosed-trace-p91b`

---

## Relation to P9.1

| P9.1 | P9.1B |
|---|---|
| Mapped FailClosed surface + ruled out publish engine | Instruments boundaries to expose hidden exception |
| Exact stack **blocked** by FailClosed | Exact stack **available in console** after one Safari reproduce |

**No fix until TRACE capture names the exception.**
