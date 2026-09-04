import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_ICON_EMOJI,
  PLATFORM_EMOJI,
  PLATFORM_EMOJI_SYSTEM,
  accountIconEmoji,
} from "@/lib/icons/platform-emoji-v1";
import { listMarketplaceIconKeys } from "@/lib/icons/marketplace-line-catalog";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Global platform emoji icon system", () => {
  it("exposes one canonical emoji map covering Account keys", () => {
    expect(PLATFORM_EMOJI_SYSTEM).toBe("GLOBAL_PLATFORM_ICON_SYSTEM");
    expect(PLATFORM_EMOJI.home).toBe("🏠");
    expect(PLATFORM_EMOJI.search).toBe("🔎");
    expect(PLATFORM_EMOJI.inbox).toBe("💬");
    expect(PLATFORM_EMOJI.wallet).toBe("💳");
    expect(accountIconEmoji("saved")).toBe("❤️");
    for (const key of listMarketplaceIconKeys()) {
      expect(ACCOUNT_ICON_EMOJI[key]).toBeTruthy();
    }
  });

  it("renders AccountIcon and line icons as emoji, not SVG paths", () => {
    expect(read("components/account/AccountIcons.tsx")).toContain("PlatformEmoji");
    expect(read("components/account/AccountIcons.tsx")).not.toContain("<svg");
    expect(read("components/icons/RvxLineIcons.tsx")).toContain("PlatformEmoji");
    expect(read("components/icons/RvxLineIcons.tsx")).not.toContain("<svg");
    expect(read("features/account-center/components/ProfileMenuIcons.tsx")).toContain("PROFILE_ICON_EMOJI");
    expect(read("features/account-center/components/ProfileMenuIcons.tsx")).not.toContain("<svg");
  });

  it("forbids lucide in live PWA feature/component trees", () => {
    const files = [
      "features/profile/components/ViewProfilePage.tsx",
      "features/store-sharing/StoreShareActions.tsx",
      "components/ui/BottomNavV2Icon.tsx",
      "components/ui/ListingCard.tsx",
      "features/wallet/components/WalletHubV1.tsx",
    ];
    for (const file of files) {
      expect(read(file)).not.toContain('from "lucide-react"');
    }
  });
});
