/**
 * ROVEXO v1 inline line icons — clean stroke icons matching the canonical
 * Messages + Notifications design reference. Colour comes from `currentColor`
 * and size is controlled by the surrounding CSS (svg width/height).
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function SearchLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function BellLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17S18 14.5 18 8Z" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

export function CartLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  );
}

export function ComposeLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20h8" />
      <path d="M16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4Z" />
    </svg>
  );
}

export function BackLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 19 8 12l7-7" />
    </svg>
  );
}

export function MoreLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </svg>
  );
}

export function GalleryLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" />
    </svg>
  );
}

export function SendLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12 20 5l-4.5 15-3.5-6.5L4.5 12Z" />
    </svg>
  );
}

export function ChevronRightLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function DoubleCheckLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m1.5 13 4 4 8-9" />
      <path d="m11 15 1.5 1.5 8-9" />
    </svg>
  );
}

export function CheckLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 12 5 5 11-12" />
    </svg>
  );
}

/* ── Notification type icons ─────────────────────────────────────── */

export function HeartLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-7-4.6-9.2-9C1.3 8 2.7 4.5 6 4.5c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.3 0 4.7 3.5 3.2 6.5C19 15.4 12 20 12 20Z" />
    </svg>
  );
}

export function ChatLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function BagLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 8h12l-.8 11a1.5 1.5 0 0 1-1.5 1.4H8.3A1.5 1.5 0 0 1 6.8 19L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function TruckLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function StarLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3.5 2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.6l5.9-.8L12 3.5Z" />
    </svg>
  );
}

export function TagLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12.5 11 5a2 2 0 0 1 1.4-.6H19a1.5 1.5 0 0 1 1.5 1.5v6.6a2 2 0 0 1-.6 1.4l-7.5 7.5a1.5 1.5 0 0 1-2.1 0l-6.3-6.3a1.5 1.5 0 0 1 0-2.1Z" />
      <circle cx="16" cy="8" r="1.2" />
    </svg>
  );
}

export function PeopleLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 13.5a5.5 5.5 0 0 1 3 5" />
    </svg>
  );
}

export function CreditCardLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 9.5h18" />
    </svg>
  );
}

export function ShieldLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 19 6v5c0 5-3 8-7 9.5C8 19 5 16 5 11V6l7-2.5Z" />
    </svg>
  );
}

export function MegaphoneLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z" />
      <path d="M18 9a3 3 0 0 1 0 6" />
    </svg>
  );
}

export function InfoLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/* ── Account module icons ────────────────────────────────────────── */

export function UserLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function WalletLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a1 1 0 0 1 1 1v1.5" />
      <rect x="3.5" y="7.5" width="17" height="11.5" rx="2.5" />
      <path d="M16.5 12.5h2.2a.8.8 0 0 1 .8.8v1.4a.8.8 0 0 1-.8.8h-2.2a1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

export function SettingsLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
    </svg>
  );
}

export function LogoutLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

export function MailLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function LockLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function PhoneLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 4.5 4.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
    </svg>
  );
}

export function EditLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17l-1 3Z" />
      <path d="m13.5 6.5 3 3" />
    </svg>
  );
}

export function BankLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m3.5 9 8.5-5 8.5 5" />
      <path d="M5 9v8m4-8v8m6-8v8m4-8v8" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function GlobeLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17Z" />
    </svg>
  );
}

export function PoundLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 20h9" />
      <path d="M9 20c1.5-1 2-2.4 2-4.2V9.5a3.5 3.5 0 0 1 6.2-2.2" />
      <path d="M7.5 13h6" />
    </svg>
  );
}

export function MoonLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function DocumentLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v5h5" />
      <path d="M8.5 13h7M8.5 16.5h7" />
    </svg>
  );
}

export function HeadsetLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
      <rect x="3.5" y="13" width="4" height="6" rx="1.6" />
      <rect x="16.5" y="13" width="4" height="6" rx="1.6" />
      <path d="M20 19v.5a3 3 0 0 1-3 3h-2.5" />
    </svg>
  );
}

export function EyeLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function LocationLineIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
