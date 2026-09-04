"use client";

import type { ReactNode } from "react";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { StoreShareChannel } from "@/lib/store-sharing/store-share-v1";

type StoreShareActionsProps = {
  onChannel: (channel: StoreShareChannel) => void;
};

function BrandIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="store-share-actions__svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

const CHANNELS: {
  id: StoreShareChannel;
  label: string;
  kind: "brand" | "ui";
  icon: ReactNode;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    kind: "brand",
    icon: (
      <BrandIcon>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 0 1-4.178-1.145l-.3-.178-2.867.853.855-2.795-.196-.312A8.174 8.174 0 0 1 3.818 12c0-4.514 3.668-8.182 8.182-8.182S20.182 7.486 20.182 12 16.514 20.182 12 20.182z" />
      </BrandIcon>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    kind: "brand",
    icon: (
      <BrandIcon>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </BrandIcon>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    kind: "brand",
    icon: (
      <BrandIcon>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </BrandIcon>
    ),
  },
  {
    id: "messenger",
    label: "Messenger",
    kind: "brand",
    icon: (
      <BrandIcon>
        <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.907 1.436 5.502 3.678 7.177V22l3.366-1.848c.896.248 1.844.381 2.956.381 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm.995 12.717-2.564-2.737-4.931 2.737 5.431-5.776 2.627 2.737 4.868-2.737-5.431 5.776z" />
      </BrandIcon>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    kind: "brand",
    icon: (
      <BrandIcon>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </BrandIcon>
    ),
  },
  {
    id: "copy_link",
    label: "Copy Link",
    kind: "ui",
    icon: <PlatformEmoji emoji={PLATFORM_EMOJI.copy} className="store-share-actions__svg" />,
  },
  {
    id: "qr",
    label: "QR Code",
    kind: "ui",
    icon: <PlatformEmoji emoji={PLATFORM_EMOJI.qr} className="store-share-actions__svg" />,
  },
  {
    id: "more",
    label: "More",
    kind: "ui",
    icon: <PlatformEmoji emoji={PLATFORM_EMOJI.share} className="store-share-actions__svg" />,
  },
];

export function StoreShareActions({ onChannel }: StoreShareActionsProps) {
  return (
    <div className="store-share-actions" data-store-share-actions="v1">
      {CHANNELS.map((channel) => (
        <button
          key={channel.id}
          type="button"
          className={cn("store-share-actions__item", focusRing)}
          onClick={() => onChannel(channel.id)}
        >
          <span
            className="store-share-actions__icon"
            data-store-share-icon={channel.id}
            data-store-share-icon-kind={channel.kind}
            aria-hidden="true"
          >
            {channel.icon}
          </span>
          <span>{channel.label}</span>
        </button>
      ))}
    </div>
  );
}
