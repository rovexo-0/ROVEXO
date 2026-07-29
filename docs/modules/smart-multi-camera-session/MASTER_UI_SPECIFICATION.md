# ROVEXO Smart Multi Camera Session v1.0 — Master UI Specification

| Field | Value |
|-------|-------|
| **Page / Module** | Smart Multi Camera Session |
| **Route(s)** | In-session overlay from `/sell` (Take Photos) — no separate public route required |
| **Canonical component** | TBD at implementation (single session shell only) |
| **Canonical styles** | TBD under Sell / media session CSS (one system) |
| **Visual reference** | `docs/modules/smart-multi-camera-session/assets/smart-multi-camera-session-v1-owner-master.png` |
| **Canvas reference** | iPhone portrait · full bleed camera |
| **Version** | 1.0 |
| **Status** | `Awaiting approval` — Owner master image attached · Absolute Law locked |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | — |
| **Approved date** | — |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-28 | COD SÂNGE | Initial Master UI Spec from Owner master image |

### Canonical implementation map

| Layer | Path |
|-------|------|
| SSOT | `lib/media/smart-multi-camera-session-v1.ts` |
| Engineering Spec | `docs/modules/smart-multi-camera-session/MASTER_ENGINEERING_SPECIFICATION.md` |
| Owner master | `assets/smart-multi-camera-session-v1-owner-master.png` |
| Tests | `tests/smart-multi-camera-session-v1.test.ts` |

---

## 1. Master UI Specification

### 1.1 Page purpose

Continuous in-app camera session so the seller captures 1–8 photos, edits (delete / reorder / cover), then confirms **once** with **Next** — triggering **one** complete-session upload and return to Sell.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone (Owner master) | Portrait |
| Layout | Full-bleed black camera chrome | Edge to edge |
| Safe area top | System + top bar | Close / Flash / Switch / Next |
| Safe area bottom | Home indicator + shutter | Large white shutter |
| Background | Live camera preview | Full screen |

### 1.3 Layout order (section tree)

1. **Top bar** — Close (left) · Flash + Switch Camera (centre) · Next (right, purple)
2. **Full-screen live camera preview**
3. **Photo thumbnail rail** — captured thumbs + Add more
4. **Big shutter button** (centred bottom)

### 1.4 Grid

Single column full width. Thumbnail rail = horizontal scroll. No cards. No counter.

---

## 2. Component Dimension Table

| Component | Purpose | Notes from master |
|-----------|---------|-------------------|
| Close | Exit session without Next upload | White text, top-left |
| Flash | Toggle flash / Auto | Lightning + A |
| Switch Camera | Front / rear | Circular arrows |
| Next | Confirm complete session → upload | Purple text, top-right |
| Live preview | Device camera stream | Full screen |
| Thumbnail | Captured photo preview | Square crop · × delete |
| Cover | First photo | Purple border |
| Add more | Affordance while &lt; 8 | Dashed border · camera icon · “Add more” |
| Shutter | Capture | Large solid white circle |

Exact px values: measure from Owner master before Implementation; do not invent.

---

## 3. Spacing / Typography / Colour

| Token | Spec |
|-------|------|
| Chrome | Black camera UI |
| Next | ROVEXO purple |
| Cover border | ROVEXO purple |
| Delete × | White on dark translucent circle |
| Shutter | White filled circle |
| Add more | Dashed white border · white icon/label |
| Counter | **FORBIDDEN** |

---

## 4. Interaction Specification

| Action | Result |
|--------|--------|
| Tap shutter | Capture → thumbnail appears instantly |
| Tap × on thumb | Instant delete · slide left · no confirm · no blank |
| Press-hold + drag thumb | Reorder · first = cover |
| Tap Add more | Focus shutter / continue capture (no leave) |
| Tap Next | Validate ≥1 · upload complete session · return Sell |
| Tap Close | Exit session · fail-closed preserve / discard policy per engine (no partial publish) |
| Upload fail | Remain on session · retry · nothing lost |

---

## 5. Responsive Specification

| Surface | Behaviour |
|---------|-----------|
| iPhone | Owner master 1:1 |
| Android | Same layout · native camera stream |
| Tablet / desktop | Full viewport session · same stack order |

---

## 6. Accessibility Specification

| Requirement | Rule |
|-------------|------|
| Buttons | Named: Close, Flash, Switch Camera, Next, Delete photo N, Shutter, Add more |
| Focus | Visible on interactive controls |
| Motion | Respect `prefers-reduced-motion` for slide-left |
| Live region | Optional polite announce on capture/delete — never a visible counter UI |

---

## 7. Developer Notes

- One implementation only — no Camera v2 / parallel pickers for this session.
- Upload **only** after Next — never after each capture.
- Inherit Photo Delete UX v1.0 for × behaviour.
- Implementation **blocked** until Image Pipeline CERTIFIED (SSOT gate).

---

## 8. QA Checklist

- [ ] No leave-camera-per-photo loop
- [ ] Thumbnails instant
- [ ] Delete: instant, slide left, no blank, no popup
- [ ] Reorder → first is cover (purple)
- [ ] Max 8 · Add more disappears at 8
- [ ] Next uploads all session photos once
- [ ] Upload fail → stay in session · retry
- [ ] Return to Sell with photos
- [ ] Android Production PASS
- [ ] iPhone Production PASS
- [ ] Owner visual PASS vs master image

---

## Approval gate

**Status:** Awaiting Owner approval of this Master UI Spec + master image.  
No Freeze · Commit of session UI · Production CERTIFIED claim until Owner approves Design Lock and implementation gate PASSes.
