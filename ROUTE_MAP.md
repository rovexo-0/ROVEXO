# ROUTE_MAP — My Account & Settings

**Audit date:** 2026-07-12  
**Method:** Playwright (Chromium, headless) click-through with authenticated temp user (`signInWithSessionCookies` pattern). Base URL: `http://127.0.0.1:13025`.  
**SSOT for menu hrefs:** `lib/account-center/canonical-menu.ts`, `features/account-module/components/SettingsV1.tsx`

## Layout chain (global)

There is **no** `app/account/layout.tsx`. All routes inherit only:

| Layout | Role |
|--------|------|
| `app/layout.tsx` | Root HTML, providers, fonts |

**Additional layouts (route-specific):**

| Layout | Applies to |
|--------|------------|
| `app/seller/layout.tsx` | `/seller/listings`, `/seller/tax` (passthrough — returns `children` only) |

## Shared shell components

| Shell | Used by | Imports |
|-------|---------|---------|
| `SettingsPageShell` | Settings hub, most settings child pages, Help Centre | `BetaAppShell`, `CanonicalPageLayout` |
| `AccountPageShell` | Privacy, security, preferences forms | `SettingsPageShell` → `BetaAppShell`, `CanonicalPageLayout` |
| `AccountModuleShell` | Orders, Saved, Reviews, Ideas, Listings, Followers, Promotion entry | `BetaAppShell`, `CanonicalPageLayout` |
| `AccountCenterPage` (hub only) | `/account` | `BetaAppShell`, `RovexoHeaderV2`, `ScrollContainer` |
| `CanonicalPageShell` | `/legal`, `/legal/[slug]` | (layout shell — not account module) |
| `WalletHubV1` | `/wallet` | `BetaAppShell`, `ScrollContainer`, `CanonicalPageHeader` |

`SettingsMenu` wrappers delegate to CDS: `CanonicalSection`, `CanonicalCard`, `CanonicalMenuRow`, `CanonicalButton`, `CanonicalInput`, `CanonicalSelector`, `CanonicalSwitch`, `CanonicalTextarea`, `CanonicalInfoBlock`.

---

# My Account (`/account`)

## Hub (landing)

**Click:** Open My Account (bottom nav / header)  
**Playwright URL:** `/account`

**Page:** `app/account/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountCenterPage.tsx`
- `AccountCenterHome.tsx`
- `AccountCanonicalProfile.tsx`
- `AccountStatsStrip.tsx`
- `AccountMenuSections.tsx`
- `AccountMenuRow.tsx`
- `AccountIcon.tsx` (via `components/account/AccountIcons`)
- `BetaAppShell.tsx`
- `RovexoHeaderV2.tsx`
- `ScrollContainer.tsx`
- `Avatar.tsx`

---

## Profile header

**Click:** Profile identity row (avatar + name)  
**Playwright URL:** `/account/profile`

**Page:** `app/account/profile/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `ProfileViewV1.tsx`
- `SettingsPageShell.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `CanonicalButtonLink.tsx`
- `Avatar.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Followers header

**Click:** Followers row (count + chevron)  
**Playwright URL:** `/account/followers`

**Page:** `app/account/followers/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountFollowersPage.tsx`
- `AccountModuleShell.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Stats strip — Listings

**Click:** Listings stat tile  
**Playwright URL:** `/seller/listings`  
*(Same destination as “My Listings” menu row.)*

**Page:** `app/seller/listings/page.tsx`

**Layout:**
- `app/layout.tsx`
- `app/seller/layout.tsx`

**Components:**
- `SellerListingsV1.tsx`
- `AccountModuleShell.tsx`
- `SafeImage.tsx`
- `ShareListingSheet.tsx`
- `CanonicalModal.tsx`
- `PromotionPicker.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Stats strip — Saved

**Click:** Saved stat tile  
**Playwright URL:** `/saved`

**Page:** `app/saved/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `SavedItemsV1.tsx`
- `AccountModuleShell.tsx`
- `ListingCard.tsx`
- `CanonicalButtonLink.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Stats strip — Orders

**Click:** Orders stat tile  
**Playwright URL:** `/orders`

**Page:** `app/orders/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `OrdersV1.tsx`
- `AccountModuleShell.tsx`
- `CanonicalInfoBlock.tsx`
- `CanonicalMenuRow.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Stats strip — Wallet

**Click:** Wallet stat tile  
**Playwright URL:** `/wallet`

**Page:** `app/wallet/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `WalletPage.tsx`
- `WalletHubV1.tsx`
- `BetaAppShell.tsx`
- `ScrollContainer.tsx`
- `CanonicalPageHeader.tsx`

---

## My Listings (MANAGE menu)

**Click:** My Listings  
**Playwright URL:** `/seller/listings`

**Page:** `app/seller/listings/page.tsx`

**Layout:**
- `app/layout.tsx`
- `app/seller/layout.tsx`

**Components:** *(same as Stats strip — Listings)*

---

## Orders (MANAGE menu)

**Click:** Orders  
**Playwright URL:** `/orders`

**Page:** `app/orders/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as Stats strip — Orders)*

---

## Saved Items (MANAGE menu)

**Click:** Saved Items  
**Playwright URL:** `/saved`

**Page:** `app/saved/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as Stats strip — Saved)*

---

## My Reviews (MANAGE menu)

**Click:** My Reviews  
**Playwright URL:** `/account/reviews`

**Page:** `app/account/reviews/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `ReviewsV1.tsx`
- `AccountModuleShell.tsx`
- `CanonicalCard.tsx`
- `CanonicalInfoBlock.tsx`
- `CanonicalSection.tsx`
- `Avatar.tsx`
- `Rating.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Wallet (MANAGE menu)

**Click:** Wallet  
**Playwright URL:** `/wallet`

**Page:** `app/wallet/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as Stats strip — Wallet)*

---

## Settings (ACCOUNT menu)

**Click:** Settings  
**Playwright URL:** `/account/settings`

**Page:** `app/account/settings/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(see Settings hub below)*

---

## Promotion Tools (ACCOUNT menu)

**Click:** Promotion Tools  
**Playwright URL:** `/account/promotion-tools`

**Page:** `app/account/promotion-tools/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `PromotionToolsV1.tsx`
- `SettingsPageShell.tsx`
- `SettingsPageBody.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `PromotionListingPicker.tsx`
- `PromotionPackagePicker.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

**Note:** Promotion tool rows use `onClick` (modals/checkout), not route navigation. Legacy dynamic route `app/account/promotion-tools/[entry]/page.tsx` → `PromotionToolEntryV1.tsx` exists but is **not** linked from the canonical hub menu.

---

## Help Centre (SUPPORT menu)

**Click:** Help Centre  
**Playwright URL:** `/help`

**Page:** `app/help/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `HelpCentrePage.tsx`
- `SettingsPageShell.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `HelpAssistant.tsx`
- `HelpCentreCategoryGrid.tsx` (`HelpCentreCanonicalSection.tsx`)
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Ideas (SUPPORT menu)

**Click:** Ideas  
**Playwright URL:** `/account/ideas`

**Page:** `app/account/ideas/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `RovexoIdeasPage.tsx`
- `AccountModuleShell.tsx`
- `CanonicalButton.tsx`
- `CanonicalInput.tsx`
- `CanonicalTextarea.tsx`
- `CanonicalSelector.tsx`
- `NativeImageFileInput.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Sign Out (SYSTEM — not a route)

**Click:** Sign Out  
**Playwright URL:** *(no navigation — server action)*  
**Action:** `signOut()` via `AccountMenuSections.tsx` → `lib/auth/actions`

---

# Settings (`/account/settings`)

## Hub (landing)

**Click:** Settings hub (from My Account or direct)  
**Playwright URL:** `/account/settings`

**Page:** `app/account/settings/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `SettingsV1.tsx`
- `SettingsPageShell.tsx`
- `SettingsPageBody.tsx`
- `SettingsAccordion.tsx`
- `SettingsMenu.tsx` → `CanonicalCard`, `CanonicalMenuRow`
- `DeleteAccountFlow.tsx`
- `CanonicalButtonLink.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Profile → Profile

**Click:** Accordion **Profile** → **Profile**  
**Playwright URL:** `/account/profile` *(SSOT; accordion click collides with bottom-nav “Profile” label in strict mode — destination confirmed via My Account header click)*

**Page:** `app/account/profile/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as My Account — Profile header)*

---

## Profile → Addresses

**Click:** Accordion **Profile** → **Addresses**  
**Playwright URL:** `/account/addresses`

**Page:** `app/account/addresses/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AddressBookPage.tsx`
- `SettingsPageShell.tsx`
- `SettingsPageBody.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `SettingsFormPanel.tsx`
- `CanonicalButton.tsx`
- `CanonicalInput.tsx`
- `CanonicalSelector.tsx`
- `CanonicalInfoBlock.tsx`
- `CardSetupSheet.tsx` *(if invoked)*
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Payments → Payment Methods

**Click:** Accordion **Payments** → **Payment Methods**  
**Playwright URL:** `/account/payment-methods`

**Page:** `app/account/payment-methods/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `PaymentMethodsPage.tsx`
- `SettingsPageShell.tsx`
- `SettingsPageBody.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `SettingsEmptyState.tsx`
- `CardSetupSheet.tsx`
- `CanonicalModal.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Payments → Bank Account

**Click:** Accordion **Payments** → **Bank Account**  
**Playwright URL:** `/account/settings/bank-account`

**Page:** `app/account/settings/bank-account/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `SettingsBankAccountV1.tsx` *(exported from `SettingsV1.tsx`)*
- `SettingsPageShell.tsx`
- `SettingsPageBody.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `BankAccountForm.tsx` *(lazy-loaded from `features/wallet/components/`)*
- `CanonicalButtonLink.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Payments → Tax Information

**Click:** Accordion **Payments** → **Tax Information**  
**Playwright URL:** `/seller/tax`  
**Note:** Non-sellers are server-redirected to `/account` (`app/seller/tax/page.tsx`).

**Page:** `app/seller/tax/page.tsx`

**Layout:**
- `app/layout.tsx`
- `app/seller/layout.tsx`

**Components:**
- `SellerTaxRegistrationPage.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageHeader.tsx`
- `HubPageMain.tsx`
- `Button.tsx`
- `Card.tsx`

---

## Notifications → Notification Preferences

**Click:** Accordion **Notifications** → **Notification Preferences**  
**Playwright URL:** `/notifications/settings`

**Page:** `app/notifications/settings/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `NotificationSettingsPage.tsx`
- `SettingsPageShell.tsx`
- `SettingsMenuRow.tsx`
- `SettingSection.tsx`
- `SettingToggle.tsx`
- `CanonicalInfoBlock.tsx`
- `CanonicalInput.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Notifications → Marketing Preferences

**Click:** Accordion **Notifications** → **Marketing Preferences**  
**Playwright URL:** `/account/privacy`

**Page:** `app/account/privacy/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountPrivacyPage.tsx`
- `AccountPageShell.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `SettingsFormPanel.tsx`
- `CanonicalButton.tsx`
- `CanonicalCheckbox.tsx`
- `CanonicalInfoBlock.tsx`
- `CanonicalSelector.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Privacy & Security → Privacy

**Click:** Accordion **Privacy & Security** → **Privacy**  
**Playwright URL:** `/account/privacy`

**Page:** `app/account/privacy/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as Marketing Preferences)*

---

## Privacy & Security → Security

**Click:** Accordion **Privacy & Security** → **Security**  
**Playwright URL:** `/account/security`

**Page:** `app/account/security/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountSecurityPage.tsx`
- `AccountPageShell.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsMenuRow.tsx`
- `PasswordChangeForm.tsx`
- `CanonicalInfoBlock.tsx`
- `CanonicalInput.tsx`
- `CanonicalButton.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Privacy & Security → Connected Accounts

**Click:** Accordion **Privacy & Security** → **Connected Accounts**  
**Playwright URL:** `/account/security` *(same page as Security)*

**Page:** `app/account/security/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as Security)*

---

## Privacy & Security → Devices & Sessions

**Click:** Accordion **Privacy & Security** → **Devices & Sessions**  
**Playwright URL:** `/account/security` *(same page as Security)*

**Page:** `app/account/security/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:** *(same as Security)*

---

## Privacy & Security → Blocked Users

**Click:** Accordion **Privacy & Security** → **Blocked Users**  
**Playwright URL:** `/account/blocked-users`

**Page:** `app/account/blocked-users/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountBlockedUsersPage.tsx`
- `AccountPageShell.tsx`
- `SettingsMenuSection.tsx`
- `SettingsMenuCard.tsx`
- `SettingsFormPanel.tsx`
- `CanonicalButton.tsx`
- `CanonicalInput.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Preferences → Language

**Click:** Accordion **Preferences** → **Language**  
**Playwright URL:** `/account/preferences/language` *(SSOT from `SettingsV1.tsx`; Playwright click flaky — row shows value suffix “English”)*

**Page:** `app/account/preferences/language/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountLanguagePage.tsx`
- `AccountPageShell.tsx`
- `LanguagePicker.tsx`
- `SettingsMenuSection.tsx`
- `SettingsFormPanel.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Preferences → Currency

**Click:** Accordion **Preferences** → **Currency**  
**Playwright URL:** `/account/preferences/currency` *(SSOT; Playwright click flaky — row shows value suffix “GBP”)*

**Page:** `app/account/preferences/currency/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `AccountCurrencyPage.tsx`
- `AccountPageShell.tsx`
- `SettingsMenuSection.tsx`
- `SettingsFormPanel.tsx`
- `CanonicalButton.tsx`
- `CanonicalSelector.tsx`
- `CanonicalInfoBlock.tsx`
- `BetaAppShell.tsx`
- `CanonicalPageLayout.tsx`

---

## Preferences → Accessibility

**Click:** Accordion **Preferences** → **Accessibility**  
**Playwright URL:** `/legal/accessibility-statement`

**Page:** `app/legal/[slug]/page.tsx` *(slug = `accessibility-statement`)*

**Layout:**
- `app/layout.tsx`

**Components:**
- `CanonicalPageShell.tsx`
- `LegalDocumentPage.tsx`
- `Card.tsx`

---

## Legal → Legal Documents

**Click:** Accordion **Legal** → **Legal Documents**  
**Playwright URL:** `/legal`

**Page:** `app/legal/page.tsx`

**Layout:**
- `app/layout.tsx`

**Components:**
- `CanonicalPageShell.tsx`
- `Card.tsx`

---

## Legal → Terms

**Click:** Accordion **Legal** → **Terms**  
**Playwright URL:** `/legal/terms-and-conditions`

**Page:** `app/legal/[slug]/page.tsx` *(slug = `terms-and-conditions`)*

**Layout:**
- `app/layout.tsx`

**Components:**
- `CanonicalPageShell.tsx`
- `LegalDocumentPage.tsx`
- `Card.tsx`

---

## Legal → Privacy Policy

**Click:** Accordion **Legal** → **Privacy Policy**  
**Playwright URL:** `/legal/privacy-policy`

**Page:** `app/legal/[slug]/page.tsx` *(slug = `privacy-policy`)*

**Layout:**
- `app/layout.tsx`

**Components:**
- `CanonicalPageShell.tsx`
- `LegalDocumentPage.tsx`
- `Card.tsx`

---

## Legal → Cookie Policy

**Click:** Accordion **Legal** → **Cookie Policy**  
**Playwright URL:** `/legal/cookie-policy`

**Page:** `app/legal/[slug]/page.tsx` *(slug = `cookie-policy`)*

**Layout:**
- `app/layout.tsx`

**Components:**
- `CanonicalPageShell.tsx`
- `LegalDocumentPage.tsx`
- `Card.tsx`

---

## Delete Account (in-page — not a route)

**Click:** **Delete Account** standalone button below accordion  
**Playwright URL:** `/account/settings#delete-account` *(stays on settings; opens modal)*

**Page:** `app/account/settings/page.tsx` *(no navigation)*

**Layout:**
- `app/layout.tsx`

**Components:**
- `DeleteAccountFlow.tsx`
- `SettingsMenuRow.tsx`
- `CanonicalModal.tsx`
- `CanonicalButton.tsx`
- `CanonicalInput.tsx`

---

# Redirect-only account routes (not in menus)

| Source | Redirect target |
|--------|-----------------|
| `/account/verification` | `/account/settings` |
| `/account/wallet` | `/wallet` |
| `/account/orders` | `/orders` |
| `/account/edit` | `/account/profile` |
| `/account/seller/shipping` | `/account/settings` |
| `/account/profile/edit` | Renders `ProfileEditPage.tsx` (deep link; hub links to `/account/profile`) |

---

# Playwright click summary

| Section | Clicks | Verified URL |
|---------|--------|--------------|
| My Account hub | 15 | 15/15 |
| Settings accordion | 19 rows + Delete | 32/35 *(3 flaky selector collisions; URLs confirmed via SSOT or duplicate clicks)* |
| **Total** | **35** | **32 Playwright + 3 SSOT** |
