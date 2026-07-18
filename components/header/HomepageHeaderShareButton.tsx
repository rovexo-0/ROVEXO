"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MegaphoneLineIcon } from "@/components/icons/RvxLineIcons";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import {
  HOMEPAGE_SHARE,
  getHomepageEmailShareUrl,
  getHomepageFacebookShareUrl,
  getHomepageMessengerShareUrl,
  getHomepageTelegramShareUrl,
  getHomepageWhatsAppShareUrl,
  getHomepageXShareUrl,
} from "@/lib/share/homepage";

type ShareChannel = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void | Promise<void>;
};

function ChannelGlyph({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-surface-muted text-text-primary">
      {children}
    </span>
  );
}

async function canUseNativeShare(): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare({
        title: HOMEPAGE_SHARE.title,
        text: HOMEPAGE_SHARE.text,
        url: HOMEPAGE_SHARE.url,
      });
    } catch {
      return true;
    }
  }
  return true;
}

export function HomepageHeaderShareButton({ className }: { className?: string }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const showCopiedToast = useCallback(() => {
    setToast("Link copied");
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(HOMEPAGE_SHARE.url);
      showCopiedToast();
    } catch {
      setToast("Unable to copy link");
      window.setTimeout(() => setToast(null), 2000);
    }
  }, [showCopiedToast]);

  const tryNativeShare = useCallback(async (): Promise<boolean> => {
    if (!(await canUseNativeShare())) return false;
    try {
      await navigator.share({
        title: HOMEPAGE_SHARE.title,
        text: HOMEPAGE_SHARE.text,
        url: HOMEPAGE_SHARE.url,
      });
      return true;
    } catch (error) {
      // User cancelled — treat as handled so we don't open the fallback sheet.
      if (error instanceof DOMException && error.name === "AbortError") {
        return true;
      }
      return false;
    }
  }, []);

  const onShareClick = useCallback(async () => {
    const shared = await tryNativeShare();
    if (!shared) setModalOpen(true);
  }, [tryNativeShare]);

  useEffect(() => {
    if (!modalOpen) return;
    dialogRef.current?.querySelector<HTMLElement>("button, a")?.focus();
  }, [modalOpen]);

  const channels: ShareChannel[] = [
    {
      id: "copy",
      label: "Copy Link",
      onClick: async () => {
        await copyLink();
      },
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: getHomepageWhatsAppShareUrl(),
    },
    {
      id: "facebook",
      label: "Facebook",
      href: getHomepageFacebookShareUrl(),
    },
    {
      id: "messenger",
      label: "Messenger",
      href: getHomepageMessengerShareUrl(),
    },
    {
      id: "telegram",
      label: "Telegram",
      href: getHomepageTelegramShareUrl(),
    },
    {
      id: "email",
      label: "Email",
      href: getHomepageEmailShareUrl(),
    },
    {
      id: "x",
      label: "X",
      href: getHomepageXShareUrl(),
    },
    {
      id: "more",
      label: "More Apps",
      onClick: async () => {
        const shared = await tryNativeShare();
        if (!shared) await copyLink();
      },
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Share"
        onClick={() => void onShareClick()}
        className={cn(
          "rx-h2__action rx-h2__action--share",
          "active:scale-[0.94]",
          transitionFast,
          focusRing,
          className,
        )}
      >
        <span className="rx-h2__action-icon">
          <MegaphoneLineIcon className="rx-h2__lucide h-5 w-5" />
        </span>
      </button>

      {toast ? (
        <p
          role="status"
          aria-live="polite"
          className="rx-h2-share-toast"
        >
          {toast}
        </p>
      ) : null}

      <ModalContainer
        open={modalOpen}
        onClose={closeModal}
        variant="sheet"
        zIndex={200}
        ariaLabelledBy={titleId}
        panelClassName="relative w-full rounded-t-ds-xl bg-surface p-ds-5 sm:rounded-ds-xl"
      >
          <div ref={dialogRef}>
            <div className="mb-ds-4 flex items-start justify-between gap-ds-3">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-text-primary">
                  Share ROVEXO
                </h2>
                <p className="mt-ds-1 text-sm text-text-secondary">{HOMEPAGE_SHARE.text}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-full text-text-secondary hover:bg-surface-muted",
                  focusRing,
                )}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-4 gap-ds-3">
              {channels.map((channel) =>
                channel.href ? (
                  <a
                    key={channel.id}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex min-h-11 flex-col items-center gap-ds-2 rounded-ds-md p-ds-2 text-center hover:bg-surface-muted",
                      focusRing,
                      transitionFast,
                    )}
                  >
                    <ChannelGlyph>
                      <ShareChannelIcon id={channel.id} />
                    </ChannelGlyph>
                    <span className="text-[11px] font-medium text-text-secondary">{channel.label}</span>
                  </a>
                ) : (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => void channel.onClick?.()}
                    className={cn(
                      "flex min-h-11 flex-col items-center gap-ds-2 rounded-ds-md p-ds-2 text-center hover:bg-surface-muted",
                      focusRing,
                      transitionFast,
                    )}
                  >
                    <ChannelGlyph>
                      <ShareChannelIcon id={channel.id} />
                    </ChannelGlyph>
                    <span className="text-[11px] font-medium text-text-secondary">{channel.label}</span>
                  </button>
                ),
              )}
            </div>
          </div>
      </ModalContainer>
    </>
  );
}

function ShareChannelIcon({ id }: { id: string }) {
  switch (id) {
    case "copy":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 0 1-4.178-1.145l-.3-.178-2.867.853.855-2.795-.196-.312A8.174 8.174 0 0 1 3.818 12c0-4.514 3.668-8.182 8.182-8.182S20.182 7.486 20.182 12 16.514 20.182 12 20.182z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "messenger":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.907 1.436 5.502 3.678 7.177V22l3.366-1.848c.896.248 1.844.381 2.956.381 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm.995 12.717-2.564-2.737-4.931 2.737 5.431-5.776 2.627 2.737 4.868-2.737-5.431 5.776z" />
        </svg>
      );
    case "telegram":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case "email":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      );
    case "x":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.71-8.835L1.254 2.25H8.08l4.252 5.662L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      );
    case "more":
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        </svg>
      );
  }
}
