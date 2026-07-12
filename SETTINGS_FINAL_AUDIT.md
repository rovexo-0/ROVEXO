# ROVEXO Settings + My Account — Final Canonical Audit

**Date:** 2026-07-12  
**Scope:** Every page opened from **Settings** and **My Account**  
**Design System:** `src/components/canonical` (CDS v1.0)  
**Shell SSOT:** `CanonicalPageLayout` via `SettingsPageShell` / `AccountModuleShell`

---

## Validation

| Check | Result |
|-------|--------|
| TypeScript | ✅ Pass |
| ESLint (account/settings/help/support/notifications) | ✅ Pass |
| Production build | ✅ Pass |
| Vitest (full suite) | ✅ **2644 / 2644** |
| Playwright — Account settings | ✅ Pass |

---

## Canonical primitives in use

| Component | Role |
|-----------|------|
| `CanonicalPageLayout` | Unified page shell (header, back, spacing, safe area) |
| `CanonicalPageHeader` | Header inside layout |
| `CanonicalSection` | Section titles + intro |
| `CanonicalCard` | List surfaces, form panels, content cards |
| `CanonicalMenuRow` | All navigable rows (Settings accordion, menus, lists) |
| `CanonicalInput` / `CanonicalTextarea` | All text, email, password, number, time, search fields |
| `CanonicalSelector` | Language, currency, region, country, support category, visibility |
| `CanonicalCheckbox` | Privacy marketing / activity toggles |
| `CanonicalRadioGroup` | Appearance (light/dark cards) |
| `CanonicalSwitch` | Notification toggles, buyer/shipping booleans |
| `CanonicalButton` / `CanonicalButtonLink` | Save, cancel, submit, navigation CTAs |
| `CanonicalModal` | Delete account, bank account, add card, delete listing, promotion pickers |
| `CanonicalInfoBlock` | Loading, success, error, empty, description states |

`SettingsMenu*` wrappers delegate to the CDS components above — no `CanonicalAccount*` legacy layer.

---

## Settings hub

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account/settings` | `SettingsV1` + `SettingsAccordion` | `SettingsPageShell` | ✅ Canonical |
| Delete Account (embedded) | `DeleteAccountFlow` | — | ✅ `CanonicalModal` + `CanonicalButton` |

---

## Settings → Profile

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account/profile` | `ProfileViewV1` | `SettingsPageShell` | ✅ Canonical |
| `/account/profile/edit` | `ProfileEditPage` | `AccountPageShell` | ✅ Canonical |
| Avatar upload | `AvatarUploader` | (child) | ✅ `CanonicalButton` |
| Email change | `EmailChangeForm` | (child) | ✅ `CanonicalInput` + `CanonicalButton` |
| Password change | `PasswordChangeForm` | (child) | ✅ `CanonicalInput` + `CanonicalButton` |

---

## Settings → Payments

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account/payment-methods` | `PaymentMethodsPage` | `SettingsPageShell` | ✅ Canonical |
| Add card modal | `CardSetupSheet` | (child) | ✅ `CanonicalModal` |
| `/account/settings/bank-account` | `SettingsBankAccountV1` | `SettingsPageShell` | ✅ Canonical |
| Bank account modal | `BankAccountForm` | (child) | ✅ `CanonicalModal` + `CanonicalInput` |
| `/seller/tax` | `SellerTaxRegistrationPage` | (seller route) | ✅ Uses account shell pattern* |

\*Seller tax route unchanged in logic; opened from Settings accordion.

---

## Settings → Notifications

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/notifications/settings` | `NotificationSettingsPage` | `SettingsPageShell` | ✅ Canonical |
| `/notifications/preferences` | `NotificationPreferencesPage` | `SettingsPageShell` | ✅ Canonical |

---

## Settings → Privacy & Security

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account/privacy` | `AccountPrivacyPage` | `AccountPageShell` | ✅ Canonical |
| `/account/security` | `AccountSecurityPage` | `AccountPageShell` | ✅ Canonical |
| `/account/blocked-users` | `AccountBlockedUsersPage` | `AccountPageShell` | ✅ Canonical |
| Download data | Link → `/support?category=data-export` | `SupportPage` | ✅ Canonical |

---

## Settings → Preferences

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account/preferences/language` | `AccountLanguagePage` | `AccountPageShell` | ✅ `CanonicalSelector` via `LanguagePicker` |
| `/account/preferences/currency` | `AccountCurrencyPage` | `AccountPageShell` | ✅ Canonical |
| `/account/preferences/timezone` | `AccountTimezonePage` | `AccountPageShell` | ✅ Canonical |
| `/account/preferences/appearance` | `AccountAppearancePage` | `AccountPageShell` | ✅ `CanonicalRadioGroup` via `AppearancePicker` |
| `/account/buyer/preferences` | `AccountBuyerPreferencesPage` | `AccountPageShell` | ✅ Canonical |
| `/legal/accessibility-statement` | Legal page | Legal shell | External legal route |

---

## Settings → Addresses & About

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account/addresses` | `AddressBookPage` | `SettingsPageShell` | ✅ Canonical (add/edit forms) |
| `/account/settings/about` | `SettingsAboutV1` | `SettingsPageShell` | ✅ Canonical |

---

## Settings → Legal (external routes)

| Route | Notes |
|-------|-------|
| `/legal`, `/legal/terms-and-conditions`, `/legal/privacy-policy`, `/legal/cookie-policy` | Legal module — linked from Settings accordion |

---

## My Account hub children

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/account` | `AccountCenterHome` | Hub (locked) | Not modified — hub only |
| `/seller/listings` | `SellerListingsV1` | `AccountModuleShell` | ✅ Canonical modal for delete |
| `/orders` | `OrdersV1` | `AccountModuleShell` | ✅ Canonical menu rows |
| `/saved` | `SavedItemsV1` | `AccountModuleShell` | ✅ Canonical empty state + grid |
| `/account/reviews` | `ReviewsV1` | `AccountModuleShell` | ✅ Canonical sections |
| `/account/promotion-tools` | `PromotionToolsV1` | `SettingsPageShell` | ✅ Canonical |
| `/account/promotion-tools/[entry]` | `PromotionToolEntryV1` | `AccountModuleShell` | ✅ Canonical pickers |
| `/help` | `HelpCentrePage` | `SettingsPageShell` | ✅ Canonical |
| `/account/ideas` | `RovexoIdeasPage` | `AccountModuleShell` | ✅ Canonical form |
| `/account/followers` | `AccountFollowersPage` | `AccountModuleShell` | ✅ Canonical |
| `/account/bring-your-item` | `BringYourItemPage` / `BringYourItemComingSoonPage` | `AccountModuleShell` | ✅ Canonical |
| `/buyer`, `/seller` | `AccountCenterModulePage` | `AccountModuleShell` | ✅ Canonical layout shell |

---

## Help & Support (account-linked)

| Route | Component | Shell | Status |
|-------|-----------|-------|--------|
| `/help/faq` | `HelpFaqPage` | `SettingsPageShell` | ✅ Canonical |
| `/help/policies` | `HelpPoliciesPage` | `SettingsPageShell` | ✅ Canonical |
| `/help/[slug]` | `HelpArticlePage` | `SettingsPageShell` | ✅ Canonical |
| `/help/category/[slug]` | `DecisionTreeWizard` | `SettingsPageShell` | ✅ Canonical |
| `/support` | `app/support/page.tsx` + `SupportForm` | `SettingsPageShell` | ✅ Canonical |
| `/support/success` | `SupportSuccessPage` | `SettingsPageShell` | ✅ Canonical |
| Help assistant | `HelpAssistant` | (child) | ✅ `CanonicalCard` + `CanonicalTextarea` + `CanonicalButton` |

---

## Modals & child flows (recursive)

| Flow | Component | Canonical modal |
|------|-----------|-----------------|
| Settings → Delete Account | `DeleteAccountFlow` | ✅ |
| Settings → Payments → Add card | `CardSetupSheet` | ✅ |
| Settings → Bank Account → Add/Remove | `BankAccountForm` | ✅ |
| My Listings → Delete | `SellerListingsV1` | ✅ |
| Promotion Tools → Listing/Package pickers | `PromotionListingPicker`, `PromotionPackagePicker` | ✅ |

---

## Removed legacy patterns (account/settings scope)

- ❌ `acm-settings__*` form classes
- ❌ `ModalContainer` / legacy `Dialog` / `ConfirmDialog` on account/settings flows
- ❌ `Button` from `@/components/ui/Button` on migrated account/settings pages
- ❌ Raw `<select>` on language, support, buyer region (replaced with `CanonicalSelector`)
- ❌ Raw checkboxes on privacy (replaced with `CanonicalCheckbox`)
- ❌ `rx-dash-header` / `HubPageMain` on notification preferences
- ❌ `CanonicalAccountMenuRow` / `CanonicalAccountSection` in `SettingsMenu`
- ❌ Legacy help subpage headers (`CanonicalPageHeader` only) — now `SettingsPageShell`

---

## Intentional exceptions

| Item | Reason |
|------|--------|
| `ListingCard` on Saved Items | Marketplace listing grid — product display, not settings chrome |
| Stripe Payment Element | Third-party embed inside `CanonicalModal` |
| `NativeImageFileInput` | Platform file picker for ideas screenshot |
| Legal pages (`/legal/*`) | Separate legal module; linked from Settings only |
| `AccountCenterHome` hub | Locked per project rules — not modified |

---

## Conclusion

**All Settings and My Account child pages now share one continuous Canonical experience:**

- Same `CanonicalPageLayout` shell (header, back button, title, spacing)
- Same section/card/row primitives
- Same form controls (`CanonicalInput`, `CanonicalSelector`, `CanonicalSwitch`, `CanonicalCheckbox`, `CanonicalRadioGroup`)
- Same buttons and confirmation modals
- Same info/success/error messaging via `CanonicalInfoBlock`

Ready for Wallet, Sell, and Checkout CDS migration.
