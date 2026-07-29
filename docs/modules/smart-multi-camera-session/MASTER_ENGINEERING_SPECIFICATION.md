# ROVEXO Smart Multi Camera Session v1.0 — Master Engineering Specification

| Field | Value |
|---|---|
| **Module** | Smart Multi Camera Session |
| **Version** | 1.0 |
| **Status** | **REVIEW** — Master Engineering Specification · Absolute Law (COD SÂNGE) |
| **Page status** | REVIEW |
| **SSOT** | `lib/media/smart-multi-camera-session-v1.ts` |
| **UI Spec** | `docs/modules/smart-multi-camera-session/MASTER_UI_SPECIFICATION.md` |
| **Owner master image** | `docs/modules/smart-multi-camera-session/assets/smart-multi-camera-session-v1-owner-master.png` |
| **Prerequisite** | Smart Mobile Image Pipeline → **CERTIFIED** on Production Android + iPhone |
| **Entry** | Sell → Take Photos |
| **Return** | Sell Photo Rail (session photos already in draft after ONE upload) |

---

## Absolute Law

```
ONE CAMERA SESSION
ONE PHOTO RAIL
ONE NEXT BUTTON
ONE UPLOAD
ONE RETURN TO SELL
```

**Primary goal:** The seller MUST NEVER leave the camera after every photo.  
The camera remains open until the seller chooses **Next** or **Close**.

---

## Mission

```
ONE CAMERA SESSION
→ CAPTURE MULTIPLE PHOTOS
→ EDIT BEFORE LEAVING CAMERA
→ ONE CONFIRMATION (Next)
→ ONE UPLOAD
→ RETURN TO SELL
```

---

## Session flow

```
SELL
→ Take Photos
→ Smart Multi Camera Session opens
→ Take Photo
→ Thumbnail appears instantly
→ Take Next Photo
→ Thumbnail appears
→ Repeat (1…8)
→ Delete if needed
→ Reorder if needed
→ NEXT
→ Upload starts (complete session only)
→ Return to Sell Page
```

---

## UI layout (Owner master)

```
TOP BAR
  Close | Flash | Switch Camera | Next (purple)
------------------------------------------------------------
FULL SCREEN LIVE CAMERA PREVIEW
------------------------------------------------------------
PHOTO THUMBNAIL RAIL
  [Cover][Photo][Photo]…[Add more]
------------------------------------------------------------
BIG SHUTTER BUTTON
```

Owner master image is the **only** visual source of truth until UI Spec is Owner-approved.

---

## Design rules (forbidden)

| Forbidden | Absolute |
|---|---|
| Counter | NO |
| Popups | NO |
| Confirm dialogs | NO |
| Upload after every photo | NO |
| Empty / blank slots | NO |
| Page refresh | NO |
| Leaving camera mid capture loop | NO |
| Duplicate uploads | NO |

---

## Photo limit

| Bound | Value |
|---|---|
| Minimum (to confirm Next) | **1** |
| Maximum | **8** |

---

## Thumbnail rail

Every captured photo appears **instantly**.

Each thumbnail:

- Preview
- Delete (×) — top-right
- Cover indicator — **first** photo (purple border)
- Smooth animation

Trailing slot: **Add more** (dashed, camera icon) while under max.

---

## Delete UX

Inherits **Photo Delete UX v1.0**:

```
Tap × → Remove immediately → Slide left → No confirmation → No blank space
→ Memory released → Cancelled upload removed
```

---

## Reorder

```
Press and hold → Drag → Drop → Order updates instantly → First photo = Cover
```

---

## Next button

**Next NEVER uploads one image.**  
**Next uploads the COMPLETE SESSION.**

---

## Upload engine

```
NEXT
→ Validate Session
→ Compress
→ Prepare Upload Queue
→ Parallel Upload
→ Storage Validation
→ Database Update
→ Return Success
→ Back To Sell
```

---

## Fail closed

If upload fails:

- Remain on Session
- Nothing lost
- Retry available
- No partial publish

---

## Performance

| Requirement | Target |
|---|---|
| Animation | 60 FPS |
| Thumbnail | Instant |
| Memory | Low · blob cleanup |
| Cancelled uploads | Cleanup |
| Processing | Background after Next |

---

## Compatibility (PASS REQUIRED)

- Android Native
- iPhone Native
- Responsive

---

## Certification chain

```
TypeScript → ESLint → Tests → Production Build → Production Deploy
→ Android Validation → iPhone Validation → OWNER CERTIFICATION
```

Any fail → STOP → evidence → root cause → targeted fix → re-deploy → re-test.

---

## Implementation gate

| Condition | Result |
|---|---|
| Image Pipeline `finalStatus !== CERTIFIED` | **NO UI IMPLEMENTATION** |
| Master Spec locked + Image Pipeline CERTIFIED | Implementation authorized |
| Android + iPhone + Owner PASS | Module CERTIFIED |

Cursor must never implement the session UI before the Image Pipeline gate PASSes, unless Owner issues an explicit override COD.

---

## What changed (this COD)

| Change | Why |
|---|---|
| Locked Absolute Law + mission + UI layout from Owner master | Spec singularity |
| NO counter · custom session chrome · Next = complete session upload | Align with Owner mockup |
| Spec status REVIEW · implementation still gated | Fail-closed evolution |

## What did not change

| Preserved |
|---|
| Sell Absolute Authority / Blood XXII Sell freeze surfaces outside this module |
| Photo Delete UX v1.0 laws (inherited) |
| Smart Mobile Image Pipeline fail-closed JPEG / Blob upload laws |
| Implementation gate until Image Pipeline CERTIFIED |

## Impact

| Area | Impact |
|---|---|
| Performance | Spec targets 60 FPS · blob cleanup · no per-capture upload |
| Responsive | Full-screen session · mobile first · Owner master |
| Security | Camera permission · no duplicate uploads · fail-closed |
| Database | Photos persist only after successful complete-session upload |

---

## Final status

**MASTER ENGINEERING SPECIFICATION — ABSOLUTE LAW LOCKED.**  
**UI IMPLEMENTATION — BLOCKED** until Smart Mobile Image Pipeline is CERTIFIED (unless Owner override).  
**PRODUCT CERTIFIED — NO** until Android + iPhone + Owner PASS.
