# ROVEXO My Profile v8.0

**STATUS:** IMPLEMENTED · Owner visual / freeze pending  
**SSOT:** `features/profile/components/ViewProfilePage.tsx`

## Share

**Removed completely** from My Profile (icon, button, `navigator.share`, menu item).

## Header

`Back` · **My Profile** / **@username** · **More (···)** only

## More menu

**Own:** Edit Profile → `/account/edit-profile` · Change Picture → `/account/profile/avatar` · Add/Edit Bio → `/account/profile/bio` · Copy Profile Link · Settings → `/settings` · Cancel  

**Other:** Follow · Message · Copy Profile Link · Block · Report · Cancel  

## Bio

250 characters · `/account/profile/bio` · empty: “Add your bio.”

## Gates

Typecheck / ESLint / Vitest: PASS (last run)  
Playwright / Freeze: **NOT PASS** until Owner verifies
