# ROVEXO Addresses — Master UI Specification

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc`  
**Owner contract:** Addresses v1.0 = **APPROVED (UI/UX LOCK)** — 2026-07-20

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | Addresses v1.0 |
| **Route(s)** | `/account/addresses` (official preview: `http://localhost:3010/account/addresses`) |
| **Canonical component** | `features/account/components/addresses/AddressesPage.tsx` |
| **Canonical styles** | `styles/rovexo/account-settings-ui.css` + Account Canonical shell |
| **Visual reference** | Owner Rules #1–#9 (this document) · `owner-review-screenshots/master-image-pack-v1` addresses frames |
| **Canvas reference** | 390 × 844 (iPhone reference) · Mobile First · 100% width |
| **Version** | 1.0 |
| **Status** | `Approved` (UI/UX LOCK) |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | ROVEXO Product Owner |
| **Approved date** | 2026-07-20 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-20 | Owner + Cursor | Addresses v1.0 UI/UX LOCK — Personal / Business exclusive tabs, Edit sheet, UK Address Lookup |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | `app/account/addresses/page.tsx` |
| Page | `features/account/components/addresses/AddressesPage.tsx` |
| Labels / type map | `lib/addresses/canonical.ts` |
| UK lookup | `lib/addresses/uk-lookup.ts` · `app/api/addresses/lookup/route.ts` |
| Repository | `lib/addresses/repository.ts` (unchanged table; type map only) |
| Styles | `styles/rovexo/account-settings-ui.css` |
| Master Engine | `business-addresses-tab` via `resolveFeatureVisibility` |
| Freeze | `.cursor/rules/addresses-v1-freeze.mdc` · `lib/addresses/freeze.ts` |
| Tests | `tests/addresses-v1-lock.test.ts` |

### Storage type map (SSOT — no schema rename)

| UI tab | Stored `address_type` | List title | Add CTA |
|--------|----------------------|------------|---------|
| Personal | `shipping` | Personal Addresses | Add Address |
| Business | `billing` | Business Addresses | Add Business Address |

### Explicit non-goals (LOCKED)

- Separate Buyer / Seller / Business account types  
- Showing Personal and Business lists at the same time  
- Permanent Delete Address control on the list card  
- Free-text UK address entry without Address Lookup  
- Desktop / tablet alternate redesigns  
- New parallel Addresses pages or `*_V2` components  

---

## 1. Master UI Specification

### 1.1 Page purpose

Manage saved delivery addresses. Personal addresses for every ROVEXO Account. Business addresses only after Business Verification. One tab visible at a time; one add CTA; UK First Address Lookup mandatory for UK addresses.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone 6.9" class | Visual QA baseline |
| Reference width | 390 px | |
| Reference height | 844 px | |
| Safe area top | system | |
| Safe area bottom | system + bottom nav | |
| Content max-width (mobile) | 100% · inset 16 px | |
| Content max-width (tablet) | 480 px centered | Same design |
| Content max-width (desktop) | 480 px centered | Wider viewport only |
| Page background | `#FFFFFF` | |

### 1.3 Layout order (section tree)

1. Header — `Addresses` · back → Settings  
2. Segment (conditional) — `Personal` \| `Business`  
   - Business tab **only** when Master Engine `business-addresses-tab` visible (verified Business Seller)  
   - Non-business: Personal only — **no** Business button  
3. Active list only  
   - Personal → **Personal Addresses**  
   - Business → **Business Addresses**  
4. Address cards (active type only)  
5. Full-width CTA  
   - Personal → **Add Address**  
   - Business → **Add Business Address**  
6. Add / Edit form (replaces list CTA when open) — UK Address Lookup flow  
7. Edit action sheet (on Edit) — not permanent Delete  

### 1.4 Grid

| Token | Value |
|-------|-------|
| Columns (mobile) | 1 |
| Columns (tablet) | 1 |
| Columns (desktop) | 1 |
| Gutter | 8 px (segment) |
| Page horizontal inset | 16 px |
| Section vertical gap | 16–24 px |

### 1.5 Global spacing system

| Token | Value (px) |
|-------|------------|
| `--space-xs` | 4 |
| `--space-sm` | 8 |
| `--space-md` | 12 |
| `--space-lg` | 16 |
| `--space-xl` | 24 |
| Section gap | 16–24 |
| Card internal padding | 14 × 16 |
| Row height (list / actions) | min 44–56 |

### 1.6 Global radius / shadow / colour pointers

| Token | Value |
|-------|-------|
| Radius card | inherited Account Canonical |
| Radius button | Design System CTA |
| Radius badge | pill |
| Shadow card | none (minimal) |
| Brand purple | `#9333ea` / `--cds-color-primary` |
| Surface | `#FFFFFF` |
| Text primary | `#0f172a` |
| Text muted | `#64748b` |
| Border | `rgb(15 23 42 / 0.08)` |

---

## Owner Rules (CANONICAL — LOCKED)

### REGULA #1 — Exclusive tab content

**Personal** shows exclusively: Personal Addresses · Add Address  
**Business** shows exclusively: Business Addresses · Add Business Address  

### REGULA #2 — Non–Business Seller

No Business tab. Personal list + Add Address only.

### REGULA #3 — After Business Verification

Show `Personal | Business` segment. Each tab exclusive as Rule #1.

### REGULA #4 — Personal Address card

```
DEFAULT                    (badge when default)
{Full name}
{Address line}
{City}
{Postcode}
{Country}
                      Edit
```

### REGULA #5 — Business Address card

```
DEFAULT BUSINESS           (badge when default)
{Company name}
Company No {XXXXXXXX}
{Address line}
{City}
{Postcode}
{Country}
                      Edit
```

Company number from verified business profile when available (display overlay — no duplicate DB column required for v1.0).

### REGULA #6 — Mutual exclusion

Never two add buttons at once. Never both address types at once. No useless scroll.

### REGULA #7 — Edit sheet (Delete not permanent)

Edit → opens:

```
Edit Address
- Edit Address
- Set as Default
- Delete Address
Cancel
```

### REGULA #8 — UK FIRST Address Lookup (mandatory for UK)

```
Country: United Kingdom
Address Lookup:
Postcode → Search Address → Select Address → Save
```

Address Lookup is **mandatory** for all UK addresses. No free-form UK line entry without a selected lookup result (edit of an existing selected address may re-run lookup).

### REGULA #9 — UI rules

Mobile First · minimalist · premium · full-width buttons · no unnecessary icons · no duplicated information · max two presses for important actions · unified ROVEXO Design System.

---

## 2. Component Dimension Table

### Component: Personal | Business Segment

| Field | Value |
|-------|-------|
| Purpose | Switch exclusive address scope |
| Width | 100% |
| Height | min 44 px options |
| Padding | 4 px track |
| Gap | 8 px |
| Border radius | `--cds-radius-lg` |
| Background | muted surface |
| Active option | white · primary text · soft shadow |
| Icon | none |
| Responsive behaviour | Identical; max-width only |

### Component: Address Card

| Field | Value |
|-------|-------|
| Purpose | Show one saved address |
| Width | 100% |
| Padding | 14 × 16 px |
| Gap | 12 px |
| Badge | `DEFAULT` (Personal) · `DEFAULT BUSINESS` (Business) |
| Name font | 15 px / 600 |
| Body font | 14 px / 400 · muted · multi-line |
| Actions on card | **Edit** only (no Delete) |
| Responsive behaviour | Identical |

### Component: Add CTA

| Field | Value |
|-------|-------|
| Purpose | Open add flow for active tab only |
| Width | 100% |
| Label Personal | Add Address |
| Label Business | Add Business Address |
| Icon | none |

### Component: Edit Action Sheet

| Field | Value |
|-------|-------|
| Purpose | Secondary actions without permanent Delete |
| Rows | Edit Address · Set as Default · Delete Address |
| Footer | Cancel |
| Delete | Destructive styling; confirm before execute |

### Component: UK Address Lookup Form

| Field | Value |
|-------|-------|
| Country | United Kingdom (default; UK First) |
| Postcode | Required |
| Search Address | Full-width button |
| Select Address | List of lookup results |
| Name / Company | Required (Personal: name · Business: company name) |
| Save | Full-width primary |
| Cancel | Full-width ghost |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Page content | 0 | 16 | 24 | 16 | 16–24 | Account shell |
| Segment | 0 | 0 | 0 | 0 | 8 | |
| Address card | 14 | 16 | 14 | 16 | 12 | |
| CTA | 8 | 0 | 4 | 0 | 8 | Full width |

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Page title | System UI | 700 | 16 | 22 | 0 | primary | center |
| Section title | System UI | 600 | 16 | 22 | 0 | primary | left |
| Card name | System UI | 600 | 15 | 20 | 0 | primary | left |
| Card body | System UI | 400 | 14 | 20 | 0 | muted | left |
| Badge | System UI | 600 | 12 | 16 | 0 | purple | center |
| Button | System UI | 600 | 15 | 20 | 0 | on CTA | center |
| Text action | System UI | 500 | 14 | 20 | 0 | primary / danger | left |

---

## 5. Colour Table

| Token | Hex / gradient | Usage |
|-------|----------------|-------|
| Surface | `#FFFFFF` | Page / cards |
| Text primary | `#0f172a` | Titles, Edit |
| Text muted | `#64748b` | Address lines |
| Brand | `#9333ea` | Badge, active accents |
| Danger | `--cds-color-danger` | Delete Address |
| Border | `rgb(15 23 42 / 0.08)` | Dividers |

---

## 6. Interaction Specification

| Control | Default | Hover | Pressed | Focus | Disabled | Loading | Notes |
|---------|---------|-------|---------|-------|----------|---------|-------|
| Segment tab | muted | — | active white | focus ring | N/A | N/A | Switches list + CTA |
| Edit | text | — | open sheet | focus ring | — | — | Max 2 presses to Delete |
| Set as Default | row | — | PATCH set_default | focus ring | if already default | brief | |
| Delete Address | danger row | — | confirm → DELETE | focus ring | — | — | Not on card |
| Search Address | primary CTA | — | lookup API | focus ring | empty postcode | Searching… | UK mandatory |
| Save | primary CTA | — | POST/PATCH | focus ring | no selection | Saving… | |

Transitions: Design System fast duration / ease.

---

## 7. Responsive Specification

| Breakpoint | Max content width | Columns allowed to change | Must stay identical |
|------------|-------------------|---------------------------|---------------------|
| Mobile | 100% | — | Hierarchy, type, colours, section order |
| Tablet | 480 px | max-width only | Same |
| Desktop | 480 px | max-width only | Same |
| PWA | mobile rules | — | Same |

**Prohibited:** desktop redesign, alternate themes, dual Mobile/Desktop components.

---

## 8. Accessibility Specification

| Requirement | Spec |
|-------------|------|
| Keyboard | Tabs, Edit sheet, form, Cancel reachable |
| Focus ring | Design System focus |
| ARIA | `tablist` / `tab` on segment; `dialog` on Edit sheet |
| Tap target min | 44 px |
| Contrast | WCAG AA |
| Reduced motion | Instant; no decorative motion required |
| Screen reader order | Header → tabs → list → CTA / form |

---

## 9. Developer Notes

- Single canonical page: `AddressesPage` (`features/account/components/addresses/`)  
- Mandatory components: AddressesTabs · AddressCard · PersonalAddresses · BusinessAddresses · AddressForm · BusinessAddressForm · EditAddress · AddressesPage  
- Single route: `/account/addresses`  
- Do not create `AddressesPageV2` / parallel buyer address UIs for Settings  
- `AddressBookPage.tsx` is a thin re-export only (compat)  
- `BuyerAddresses` remains a dashboard summary link only — not a second editor  
- Business tab: `resolveFeatureVisibility("business-addresses-tab", { isBusinessVerified })` only  
- DOM: `data-addresses-ui="v1.0-ui-lock"`  
- Image safety: N/A (no product images)  
- UI-only: no Auth / Stripe / Sendcloud / Wallet / schema changes  

---

## 10. QA Checklist

- [ ] Spec status is **Approved** before coding  
- [ ] Non–Business Seller: no Business tab  
- [ ] Business verified: Personal \| Business exclusive lists  
- [ ] Personal CTA = Add Address; Business CTA = Add Business Address  
- [ ] Card shows Edit only (no permanent Delete)  
- [ ] Edit sheet: Edit Address · Set as Default · Delete Address · Cancel  
- [ ] DEFAULT / DEFAULT BUSINESS badges correct  
- [ ] UK Address Lookup mandatory path works  
- [ ] iPhone / Samsung / Desktop / PWA same design (max-width only)  
- [ ] TypeScript / ESLint / Vitest lock tests pass  
- [ ] Official preview: `http://localhost:3010/account/addresses`  

---

## Approval

| Role | Name | Date | Signature / note |
|------|------|------|------------------|
| Product / Owner | ROVEXO Product Owner | 2026-07-20 | APPROVED (UI/UX LOCK) |
| Design | — | 2026-07-20 | Locked via Owner Rules #1–#9 |
| Engineering | — | 2026-07-20 | Implement 1:1 to this spec |

**STATUS: Addresses v1.0 = APPROVED (UI/UX LOCK)**
