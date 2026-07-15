# ROVEXO Welcome v2.0 — Master UI Specification

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc`  
**Rule:** Welcome v2.0 is the singular canonical `/welcome` implementation and is permanently locked.

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | Welcome v2.0 |
| **Route(s)** | `/welcome` |
| **Canonical component** | `features/auth/components/WelcomeScreen.tsx` |
| **Canonical styles** | `styles/rovexo/welcome-v2.css` |
| **Visual reference** | Official artifact `welcome-v2-final-official-release-candidate.png` |
| **Canvas reference** | 430 × 932 logical px |
| **Version** | 2.0 |
| **Status** | Officially released · canonical · permanently locked |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | ROVEXO Product Owner |
| **Approved date** | 2026-07-15 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 2.0-final | 2026-07-15 | Cursor | Canonical release, validation, freeze, and lock |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | `app/(auth)/welcome/page.tsx` |
| Page / hub component | `features/auth/components/WelcomeScreen.tsx` |
| Section components | Colocated presentation elements in `WelcomeScreen.tsx` only |
| Styles | `styles/rovexo/welcome-v2.css` |
| Tests | `tests/auth-welcome-v1.test.ts` · `e2e/welcome-v2.spec.ts` |

---

## 1. Master UI Specification

### 1.1 Page purpose

Convert a guest arriving from Splash into one of two intentional actions:
**Continue** to Register or **Sign In** to Login. Communicate a premium,
trustworthy marketplace within three seconds without changing authentication,
session management, routing semantics, or Welcome v1.0.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone 17 Pro Max | Mobile-first authority |
| Reference width | 430px | Logical viewport |
| Reference height | 932px | Logical viewport |
| Safe area top | 59px | Included through `env(safe-area-inset-top)` |
| Safe area bottom | 34px | Included through `env(safe-area-inset-bottom)` |
| Content max-width (mobile) | 398px | 16px side inset |
| Content max-width (tablet) | 430px | Same single-column design |
| Content max-width (desktop) | 430px | Wider viewport only; no redesign |
| Page background | `#FFFFFF` | Light mode only |

### 1.3 Layout order (immutable)

1. ROVEXO wordmark
2. BUY • SELL • GROW.
3. One premium metallic marketplace sculpture
4. `The open marketplace for real value.`
5. `Buy, sell, and grow across curated assets and opportunities.`
6. Continue button
7. Sign In link
8. Privacy Policy, Terms of Service, and Cookie Policy

No social providers, badge, card, banner, advertisement, or additional copy is permitted.

### 1.4 Grid

| Token | Value |
|-------|-------|
| Columns (mobile) | 1 |
| Columns (tablet) | 1 |
| Columns (desktop) | 1 |
| Gutter | 0px |
| Page horizontal inset | 16px mobile; 24px tablet/desktop |
| Section vertical gap | 32px |

### 1.5 Global spacing system

| Token | Value (px) |
|-------|------------|
| `--welcome-v2-space-xs` | 8 |
| `--welcome-v2-space-sm` | 12 |
| `--welcome-v2-space-md` | 16 |
| `--welcome-v2-space-lg` | 24 |
| `--welcome-v2-space-xl` | 32 |
| Section gap | 32 |
| Card internal padding | N/A — cards prohibited |
| Row height (list) | N/A — lists prohibited |

### 1.6 Global radius / shadow / colour pointers

| Token | Value |
|-------|-------|
| Radius card | N/A |
| Radius button | 14px |
| Radius badge | N/A |
| Shadow card | none |
| Shadow elevated | none |
| Brand gradient | none |
| Surface | `#FFFFFF` |
| Text primary | `#09090B` |
| Text muted | `#71717A` |
| Border | `#E4E4E7` |

---

## 2. Component Dimension Table

### Component: Page Frame

| Field | Value |
|-------|-------|
| Purpose | Safe-area-aware full-height conversion surface |
| X position | 0px |
| Y position | 0px |
| Width | 100vw |
| Height | `100dvh` minimum |
| Padding | top `max(24px, env(safe-area-inset-top))`; right/left 16px; bottom `max(24px, env(safe-area-inset-bottom))` |
| Margin | 0 |
| Gap | 32px |
| Border radius | 0 |
| Shadow | none |
| Background | `#FFFFFF` |
| Border | none |
| Icon | none |
| Icon size | N/A |
| Icon stroke | N/A |
| Title font | Geist Sans |
| Body font | Geist Sans |
| Font weight | N/A |
| Font size | N/A |
| Line height | N/A |
| Letter spacing | N/A |
| Alignment | centered, single column |
| Pressed state | N/A |
| Hover state | N/A |
| Focus state | N/A |
| Disabled state | N/A |
| Loading state | Keep brand and actions stable; button-local label only |
| Empty state | N/A |
| Animation | 240ms page-content opacity reveal; no scale or movement |
| Navigation | N/A |
| Responsive behaviour | Content remains one column; max-width only changes |

### Component: Brand Block

| Field | Value |
|-------|-------|
| Purpose | Establish ROVEXO identity immediately |
| X position | centered in content column |
| Y position | first content item |
| Width | 100% |
| Height | 66px |
| Padding | 0 |
| Margin | 0 |
| Gap | 14px |
| Border radius | 0 |
| Shadow | none |
| Background | transparent |
| Border | none |
| Icon | none; RX app icon prohibited |
| Icon size | N/A |
| Icon stroke | N/A |
| Title font | Geist Sans |
| Body font | Geist Sans |
| Font weight | wordmark 800; tagline 500 |
| Font size | wordmark 42px; tagline 10px |
| Line height | wordmark 42px; tagline 14px |
| Letter spacing | wordmark `-0.055em`; tagline `0.19em` |
| Alignment | center |
| Pressed state | N/A |
| Hover state | N/A |
| Focus state | N/A |
| Disabled state | N/A |
| Loading state | always visible |
| Empty state | prohibited |
| Animation | Wordmark visible at first paint; tagline reveal at 1.5s; reduced motion: static |
| Navigation | none |
| Responsive behaviour | Identical type and spacing at every breakpoint |

### Component: Premium Marketplace Sculpture

| Field | Value |
|-------|-------|
| Purpose | Convey a curated premium marketplace without explanatory copy |
| X position | centered |
| Y position | after Brand Block |
| Width | `min(330px, 100%)` |
| Height | `clamp(230px, 31dvh, 276px)` |
| Padding | 0 |
| Margin | 0 |
| Gap | N/A |
| Border radius | 0 |
| Shadow | none |
| Background | transparent white |
| Border | none |
| Icon | none |
| Icon size | N/A |
| Icon stroke | N/A |
| Title font | N/A |
| Body font | N/A |
| Font weight | N/A |
| Font size | N/A |
| Line height | N/A |
| Letter spacing | N/A |
| Alignment | center |
| Pressed state | N/A |
| Hover state | N/A |
| Focus state | N/A |
| Disabled state | N/A |
| Loading state | CSS-rendered at first paint with reserved dimensions; no layout shift |
| Empty state | Prohibited |
| Animation | Reveal at 1s; 8s transform-only 2–3° float; reduced motion: static |
| Navigation | none |
| Responsive behaviour | Width scales down only; composition is identical |

**Sculpture direction:** one dark metallic open ring with three sparse geometric
elements, realistic contact shadows, metallic reflections, and restrained
`#7C3AED` ambient light. No people, text, logos, cards, cartoon styling, neon,
gaming effects, or futuristic overload.

### Component: Continue Button

| Field | Value |
|-------|-------|
| Purpose | Primary conversion to Register |
| X position | centered |
| Y position | after illustration |
| Width | 100%, max 398px |
| Height | 52px |
| Padding | 0 20px |
| Margin | 0 |
| Gap | N/A |
| Border radius | 12px |
| Shadow | Soft realistic two-layer black shadow |
| Background | `#09090B` |
| Border | 1px solid `#09090B` |
| Icon | none |
| Icon size | N/A |
| Icon stroke | N/A |
| Title font | Geist Sans |
| Body font | N/A |
| Font weight | 650 |
| Font size | 16px |
| Line height | 24px |
| Letter spacing | `-0.01em` |
| Alignment | center |
| Pressed state | 97% scale over 80ms premium easing |
| Hover state | background `#18181B` |
| Focus state | 2px `#7C3AED` outline with 2px offset |
| Disabled state | opacity 0.45; pointer disabled |
| Loading state | label changes to `Continuing…`; dimensions fixed |
| Empty state | prohibited |
| Animation | background/outline 160ms ease-out; press 80ms `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Navigation | Existing canonical Register route |
| Responsive behaviour | Identical; width follows content column |

### Component: Sign In Link

| Field | Value |
|-------|-------|
| Purpose | Secondary conversion to Login |
| X position | centered |
| Y position | 12px after Continue |
| Width | 100%, max 398px |
| Height | 44px |
| Padding | 0 20px |
| Margin | 0 |
| Gap | N/A |
| Border radius | 0 |
| Shadow | none |
| Background | `#FFFFFF` |
| Border | none |
| Icon | none |
| Icon size | N/A |
| Icon stroke | N/A |
| Title font | Geist Sans |
| Body font | N/A |
| Font weight | 650 |
| Font size | 16px |
| Line height | 24px |
| Letter spacing | `-0.01em` |
| Alignment | center |
| Pressed state | 97% scale |
| Hover state | 68% opacity |
| Focus state | 2px `#7C3AED` outline with 2px offset |
| Disabled state | opacity 0.45; pointer disabled |
| Loading state | N/A — navigation link |
| Empty state | prohibited |
| Animation | opacity 160ms ease-out; press 80ms premium easing |
| Navigation | Existing canonical Login route |
| Responsive behaviour | Identical; width follows content column |

### Component: Legal Footer

| Field | Value |
|-------|-------|
| Purpose | Provide required Terms and Privacy access |
| X position | centered |
| Y position | 28px after actions |
| Width | 100%, max 360px |
| Height | 40px minimum |
| Padding | 0 |
| Margin | 0 |
| Gap | 8px |
| Border radius | 0 |
| Shadow | none |
| Background | transparent |
| Border | none |
| Icon | none |
| Icon size | N/A |
| Icon stroke | N/A |
| Title font | N/A |
| Body font | Geist Sans |
| Font weight | 450; links 600 |
| Font size | 12px |
| Line height | 18px |
| Letter spacing | 0 |
| Alignment | center |
| Pressed state | link opacity 0.7 |
| Hover state | link underline visible |
| Focus state | 2px `#7C3AED` outline |
| Disabled state | N/A |
| Loading state | N/A |
| Empty state | prohibited |
| Animation | opacity/underline 160ms ease-out |
| Navigation | Existing Privacy, Terms of Service, and Cookie Policy routes |
| Responsive behaviour | Wraps to two lines without changing order |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Page content | safe area + 24px | 16px | safe area + 24px | 16px | 32px | Centered max-width column |
| Brand section | 0 | 0 | 0 | 0 | 14px | Wordmark then tagline |
| Hero illustration | 0 | 0 | 0 | 0 | N/A | Fixed ratio, no card |
| Button group | 0 | 0 | 0 | 0 | 12px | Continue then Sign In |
| Legal footer | 28px | 0 | 0 | 0 | 8px | Terms then Privacy |

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Wordmark | Geist Sans | 800 | 42px | 42px | `-0.055em` | `#09090B`; X `#7C3AED` | center |
| Tagline | Geist Sans | 650 | 10px | 14px | `0.19em` | `#7C3AED` | center |
| Heading | Geist Sans | 690 | 22–25px | 1.16 | `-0.032em` | `#09090B` | center |
| Supporting copy | Geist Sans | 450 | 12px | 1.48 | `-0.006em` | `#5F5F67` | center |
| Primary button | Geist Sans | 620 | 14px | 1 | 0 | `#FFFFFF` | center |
| Sign In | Geist Sans | 620 | 14px | 1 | 0 | `#09090B` | center |
| Legal body | Geist Sans | 450 | 12px | 18px | 0 | `#71717A` | center |
| Legal links | Geist Sans | 600 | 12px | 18px | 0 | `#3F3F46` | center |

All other template typography roles are N/A.

---

## 5. Colour Table

| Token | Hex | Usage |
|-------|-----|-------|
| `--welcome-v2-bg` | `#FFFFFF` | Page and secondary button |
| `--welcome-v2-ink` | `#09090B` | Wordmark and primary button |
| `--welcome-v2-accent` | `#7C3AED` | Wordmark X and focus ring only |
| `--welcome-v2-muted` | `#71717A` | Legal body |
| `--welcome-v2-tagline` | `#7C3AED` | BUY • SELL • GROW. |
| `--welcome-v2-border` | `#D4D4D8` | Secondary button border |
| `--welcome-v2-hover` | `#F4F4F5` | Secondary pressed state |

---

## 6. Interaction Specification

| Control | Default | Hover | Pressed | Focus | Disabled | Loading | Notes |
|---------|---------|-------|---------|-------|----------|---------|-------|
| Continue | black fill | `#18181B` | 97% scale | purple 2px ring | N/A | N/A | Existing Register destination |
| Sign In | text link | 68% opacity | 97% scale | purple 2px ring | N/A | N/A | Existing Login destination |
| Terms | muted link | underline | 70% opacity | purple 2px ring | N/A | N/A | Existing route |
| Privacy | muted link | underline | 70% opacity | purple 2px ring | N/A | N/A | Existing route |

Controls use 160ms ease-out and 80ms press feedback. The staged reveal completes
at 3 seconds. The sculpture uses transform-only 8-second floating movement with
2–3° rotation. No bounce, parallax, neon, aggressive glow, or motion-dependent information.

---

## 7. Responsive Specification

| Breakpoint | Max content width | Columns allowed to change | Must stay identical |
|------------|-------------------|---------------------------|---------------------|
| Mobile `<768px` | 398px | none | Colours, hierarchy, type, radii, section order, visual |
| Tablet `768–1023px` | 430px | none | Same |
| Desktop `≥1024px` | 430px | none | Same; wider surrounding whitespace only |
| PWA | 398px | none | Same as mobile viewport rules |

**Prohibited:** separate device components, desktop redesign, alternate theme,
dark surface, reordered actions, different illustration crop, or typography
changes by breakpoint.

---

## 8. Accessibility Specification

| Requirement | Spec |
|-------------|------|
| Keyboard | Logical order: Continue → Sign In → Terms → Privacy |
| Focus ring | 2px `#7C3AED`, 2px offset, never clipped |
| ARIA labels | Wordmark announces `ROVEXO`; illustration has concise marketplace alt text |
| Tap target min | 48×48px; buttons are 56px |
| Contrast | WCAG 2.2 AA minimum |
| Reduced motion | Disable all reveal transitions; content immediately visible |
| Screen reader order | Brand → illustration → Continue → Sign In → legal |
| Zoom/reflow | 200% zoom without horizontal scroll or lost controls |

---

## 9. Developer Notes

- Welcome v2.0 atomically replaces Welcome v1.0 at the existing canonical route.
- Single canonical component: `features/auth/components/WelcomeScreen.tsx`.
- Single canonical stylesheet: `styles/rovexo/welcome-v2.css`.
- The sculpture is CSS-rendered and requires no image source.
- Reuse existing canonical Register, Login, Terms, and Privacy destinations.
- Do not modify Supabase, auth actions, middleware, Splash, Login, or Register.
- No duplicate session handling, guest entry logic, or authentication system.
- Locked DOM:
  `data-auth-screen="welcome-v2"` · `data-auth-ui="v2.0-official-release"` ·
  `data-welcome-lock="CANONICAL-V2"`.
- No parallel or archived routed Welcome implementation is permitted.

---

## 10. QA Checklist

- [x] Owner explicitly approved the final official release and freeze
- [x] Exactly one final official preview generated
- [x] Singular implementation matches the approved release candidate
- [x] iPhone 17 Pro Max validation passes
- [x] Samsung Galaxy S Ultra validation passes
- [x] Desktop is wider only; design remains identical
- [x] PWA matches mobile layout and manifest validates
- [x] CSS sculpture reserves dimensions before load
- [x] No unauthorized copy, controls, cards, social providers, or badges
- [x] Continue reaches Register; Sign In reaches Login
- [x] Privacy, Terms, and Cookie links resolve
- [x] Keyboard, focus, contrast, reduced motion, and WCAG AA automation pass
- [x] TypeScript, ESLint, Vitest, production build, and browser QA pass
- [x] Canonical freeze and permanent lock recorded

---

## Approval

| Role | Name | Date | Signature / note |
|------|------|------|------------------|
| Design | ROVEXO Product Owner | 2026-07-15 | Final official release approved |
| Engineering | Cursor | 2026-07-15 | Implementation and validation complete |
| Product / Owner | ROVEXO Product Owner | 2026-07-15 | Official freeze, deploy, and lock authorized |
