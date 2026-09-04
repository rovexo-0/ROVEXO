/**
 * ROVEXO inline icons — global emoji system (same export names as the former line SVGs).
 */
import { PlatformEmoji, type PlatformEmojiProps } from "@/components/icons/PlatformEmoji";
import { LINE_ICON_EMOJI, PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type IconProps = Omit<PlatformEmojiProps, "emoji">;

function line(emoji: string) {
  return function LineEmojiIcon(props: IconProps) {
    return <PlatformEmoji emoji={emoji} {...props} />;
  };
}

export const SearchLineIcon = line(LINE_ICON_EMOJI.SearchLineIcon);
export const BrowseCategoriesLineIcon = line(LINE_ICON_EMOJI.BrowseCategoriesLineIcon);
export const BellLineIcon = line(LINE_ICON_EMOJI.BellLineIcon);
export const CartLineIcon = line(LINE_ICON_EMOJI.CartLineIcon);
export const ComposeLineIcon = line(LINE_ICON_EMOJI.ComposeLineIcon);
export const CameraLineIcon = line(LINE_ICON_EMOJI.CameraLineIcon);
export const BackLineIcon = line(LINE_ICON_EMOJI.BackLineIcon);
export const MoreLineIcon = line(LINE_ICON_EMOJI.MoreLineIcon);
export const GalleryLineIcon = line(LINE_ICON_EMOJI.GalleryLineIcon);
export const SendLineIcon = line(LINE_ICON_EMOJI.SendLineIcon);
export const ChevronRightLineIcon = line(LINE_ICON_EMOJI.ChevronRightLineIcon);
export const DoubleCheckLineIcon = line(LINE_ICON_EMOJI.DoubleCheckLineIcon);
export const CheckLineIcon = line(LINE_ICON_EMOJI.CheckLineIcon);
export const HeartLineIcon = line(LINE_ICON_EMOJI.HeartLineIcon);
export const ChatLineIcon = line(LINE_ICON_EMOJI.ChatLineIcon);
export const BagLineIcon = line(LINE_ICON_EMOJI.BagLineIcon);
export const TruckLineIcon = line(LINE_ICON_EMOJI.TruckLineIcon);
export const StarLineIcon = line(LINE_ICON_EMOJI.StarLineIcon);
export const TagLineIcon = line(LINE_ICON_EMOJI.TagLineIcon);
export const PeopleLineIcon = line(LINE_ICON_EMOJI.PeopleLineIcon);
export const CreditCardLineIcon = line(LINE_ICON_EMOJI.CreditCardLineIcon);
export const ShieldLineIcon = line(LINE_ICON_EMOJI.ShieldLineIcon);
export const MegaphoneLineIcon = line(LINE_ICON_EMOJI.MegaphoneLineIcon);
export const InfoLineIcon = line(LINE_ICON_EMOJI.InfoLineIcon);
export const UserLineIcon = line(LINE_ICON_EMOJI.UserLineIcon);
export const WalletLineIcon = line(LINE_ICON_EMOJI.WalletLineIcon);
export const SettingsLineIcon = line(LINE_ICON_EMOJI.SettingsLineIcon);
export const LogoutLineIcon = line(LINE_ICON_EMOJI.LogoutLineIcon);
export const MailLineIcon = line(LINE_ICON_EMOJI.MailLineIcon);
export const LockLineIcon = line(LINE_ICON_EMOJI.LockLineIcon);
export const PhoneLineIcon = line(LINE_ICON_EMOJI.PhoneLineIcon);
export const EditLineIcon = line(LINE_ICON_EMOJI.EditLineIcon);
export const BankLineIcon = line(LINE_ICON_EMOJI.BankLineIcon);
export const GlobeLineIcon = line(LINE_ICON_EMOJI.GlobeLineIcon);
export const PoundLineIcon = line(LINE_ICON_EMOJI.PoundLineIcon);
export const MoonLineIcon = line(LINE_ICON_EMOJI.MoonLineIcon);
export const DocumentLineIcon = line(LINE_ICON_EMOJI.DocumentLineIcon);
export const HeadsetLineIcon = line(LINE_ICON_EMOJI.HeadsetLineIcon);
export const EyeLineIcon = line(LINE_ICON_EMOJI.EyeLineIcon);
export const LocationLineIcon = line(LINE_ICON_EMOJI.LocationLineIcon);
export const BanLineIcon = line(LINE_ICON_EMOJI.BanLineIcon);
export const ShareNodesLineIcon = line(LINE_ICON_EMOJI.ShareNodesLineIcon);

export { PLATFORM_EMOJI };
