"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { getListingShareUrl } from "@/lib/share/listing-url";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { trackShareListing } from "@/lib/analytics/marketplace-events";

type ShareListingSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  productId?: string;
  price?: number;
};

type ShareChannel = {
  id: string;
  label: string;
  href: (url: string, title: string) => string;
  icon: React.ReactNode;
};

function ShareChannelIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-ds-lg bg-surface-muted text-text-primary">
      {children}
    </span>
  );
}

const channels: ShareChannel[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
    icon: (
      <ShareChannelIcon>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 0 1-4.178-1.145l-.3-.178-2.867.853.855-2.795-.196-.312A8.174 8.174 0 0 1 3.818 12c0-4.514 3.668-8.182 8.182-8.182S20.182 7.486 20.182 12 16.514 20.182 12 20.182z" />
        </svg>
      </ShareChannelIcon>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: (
      <ShareChannelIcon>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </ShareChannelIcon>
    ),
  },
  {
    id: "messenger",
    label: "Messenger",
    href: (url) => `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(url)}`,
    icon: (
      <ShareChannelIcon>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.907 1.436 5.502 3.678 7.177V22l3.366-1.848c.896.248 1.844.381 2.956.381 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm.995 12.717-2.564-2.737-4.931 2.737 5.431-5.776 2.627 2.737 4.868-2.737-5.431 5.776z" />
        </svg>
      </ShareChannelIcon>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    href: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: (
      <ShareChannelIcon>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </ShareChannelIcon>
    ),
  },
  {
    id: "email",
    label: "Email",
    href: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    icon: (
      <ShareChannelIcon>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      </ShareChannelIcon>
    ),
  },
];

export function ShareListingSheet({ open, onClose, title, slug, productId, price }: ShareListingSheetProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const shareUrl = getListingShareUrl(slug);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Link copied");
      if (productId) {
        trackShareListing({ itemId: productId, itemName: title, price, method: "copy_link" });
      }
      window.setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("Unable to copy link");
    }
  }, [productId, price, shareUrl, title]);

  const nativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        if (productId) {
          trackShareListing({ itemId: productId, itemName: title, price, method: "native" });
        }
        onClose();
        return;
      } catch {
        // User cancelled or unsupported — fall through.
      }
    }
    void copyLink();
  }, [copyLink, onClose, productId, price, shareUrl, title]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        aria-label="Close share menu"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-listing-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-ds-xl border border-border bg-surface p-ds-5 shadow-ds-floating sm:rounded-ds-xl",
          transitionFast,
        )}
      >
        <div className="mb-ds-4 flex items-start justify-between gap-ds-3">
          <div>
            <h2 id="share-listing-title" className="text-lg font-semibold text-text-primary">
              Share listing
            </h2>
            <p className="mt-ds-1 line-clamp-2 text-sm text-text-secondary">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-full text-text-secondary hover:bg-surface-muted",
              focusRing,
            )}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={() => void nativeShare()}
          className={cn(
            "mb-ds-4 flex w-full items-center justify-center gap-ds-2 rounded-ds-lg bg-primary px-ds-4 py-ds-3 text-sm font-semibold text-primary-foreground",
            focusRing,
            transitionFast,
          )}
        >
          Share
        </button>

        <div className="grid grid-cols-4 gap-ds-3">
          {channels.map((channel) => (
            <a
              key={channel.id}
              href={channel.href(shareUrl, title)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (productId) {
                  trackShareListing({
                    itemId: productId,
                    itemName: title,
                    price,
                    method: channel.id,
                  });
                }
              }}
              className={cn(
                "flex flex-col items-center gap-ds-2 rounded-ds-md p-ds-2 text-center hover:bg-surface-muted",
                focusRing,
                transitionFast,
              )}
            >
              {channel.icon}
              <span className="text-[11px] font-medium text-text-secondary">{channel.label}</span>
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void copyLink()}
          className={cn(
            "mt-ds-4 flex w-full items-center justify-between rounded-ds-lg border border-border bg-surface-muted px-ds-4 py-ds-3 text-left text-sm",
            focusRing,
            transitionFast,
          )}
        >
          <span className="truncate text-text-secondary">{shareUrl}</span>
          <span className="ml-ds-2 shrink-0 font-semibold text-primary">Copy</span>
        </button>

        {feedback ? (
          <p role="status" className="mt-ds-3 text-center text-sm font-medium text-primary">
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}
