import type { MessageStatus } from "@/lib/messages/types";
import {
  ChatLineIcon,
  CheckLineIcon,
  DoubleCheckLineIcon,
  GalleryLineIcon,
  MoreLineIcon,
  SearchLineIcon,
} from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type IconProps = { className?: string };

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  if (status === "read" || status === "delivered") {
    return <DoubleCheckLineIcon className="h-3.5 w-3.5" />;
  }
  return <CheckLineIcon className="h-3.5 w-3.5" />;
}

export function SearchIcon(props: IconProps) {
  return <SearchLineIcon {...props} />;
}

export function MoreIcon(props: IconProps) {
  return <MoreLineIcon {...props} />;
}

export function EmptyMessagesIcon(props: IconProps) {
  return <ChatLineIcon className="h-12 w-12" {...props} />;
}

export function PlusIcon(props: IconProps) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.plus} {...props} />;
}

export function CameraIcon(props: IconProps) {
  return <GalleryLineIcon {...props} />;
}
