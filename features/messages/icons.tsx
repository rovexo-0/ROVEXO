import type { MessageStatus } from "@/lib/messages/types";
import {
  ChatLineIcon,
  CheckLineIcon,
  DoubleCheckLineIcon,
  GalleryLineIcon,
  MoreLineIcon,
  SearchLineIcon,
} from "@/components/icons/RvxLineIcons";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

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

function PlusLineIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return <PlusLineIcon {...props} />;
}

export function CameraIcon(props: IconProps) {
  return <GalleryLineIcon {...props} />;
}
