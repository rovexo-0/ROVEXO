"use client";

import { useCallback, useEffect, useState } from "react";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { trackStoreShare } from "@/lib/analytics/marketplace-events";
import {
  STORE_SHARE_COPY,
  buildStoreFacebookShareUrl,
  buildStoreMessengerShareUrl,
  buildStoreShareNativePayload,
  buildStoreShareText,
  buildStoreShareUtmUrl,
  buildStoreTelegramShareUrl,
  buildStoreWhatsAppShareUrl,
  copyText,
  isStoreShareMobileViewport,
  resolveStoreFacebookShareMode,
  type StoreShareChannel,
  type StoreShareData,
} from "@/lib/store-sharing/store-share-v1";
import { StoreShareCard } from "@/features/store-sharing/StoreShareCard";
import { StoreShareActions } from "@/features/store-sharing/StoreShareActions";
import { StoreQRCode } from "@/features/store-sharing/StoreQRCode";
import "@/styles/rovexo/store-share-v1.css";

type StoreShareSheetProps = {
  open: boolean;
  onClose: () => void;
  data: StoreShareData;
};

export function StoreShareSheet({ open, onClose, data }: StoreShareSheetProps) {
  const { pushToast } = useToast();
  const [showQr, setShowQr] = useState(false);
  const shareText = buildStoreShareText(data.storeUrl);
  const nativePayload = buildStoreShareNativePayload(data);

  useEffect(() => {
    if (!open) return;
    trackStoreShare("store_share_opened", { username: data.username });
  }, [open, data.username]);

  const copyStoreLink = useCallback(async () => {
    const copied = await copyText(data.storeUrl);
    if (!copied) {
      pushToast({ title: "Unable to copy link.", variant: "error" });
      return false;
    }
    trackStoreShare("store_share_copy_link", { username: data.username });
    pushToast({ title: STORE_SHARE_COPY.copied, variant: "success" });
    return true;
  }, [data.storeUrl, data.username, pushToast]);

  const nativeShare = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return false;
    }
    try {
      await navigator.share(nativePayload);
      trackStoreShare("store_share_native", { username: data.username });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return true;
      }
      return false;
    }
  }, [data.username, nativePayload]);

  const onChannel = useCallback(
    async (channel: StoreShareChannel) => {
      if (channel === "copy_link") {
        await copyStoreLink();
        return;
      }

      if (channel === "qr") {
        setShowQr((current) => !current);
        trackStoreShare("store_share_qr", { username: data.username });
        return;
      }

      if (channel === "instagram") {
        const copied = await copyText(shareText);
        if (!copied) {
          pushToast({ title: "Unable to copy store message.", variant: "error" });
          return;
        }
        trackStoreShare("store_share_instagram", { username: data.username });
        pushToast({ title: STORE_SHARE_COPY.instagramHint, variant: "success" });
        return;
      }

      if (channel === "more") {
        const shared = await nativeShare();
        if (!shared) {
          await copyStoreLink();
        }
        return;
      }

      if (channel === "facebook") {
        trackStoreShare("store_share_facebook", { username: data.username });
        const isMobile = isStoreShareMobileViewport(window.innerWidth);
        const mode = resolveStoreFacebookShareMode({
          hasNativeShare: typeof navigator.share === "function",
          isMobileViewport: isMobile,
        });
        if (mode === "native") {
          const shared = await nativeShare();
          if (shared) return;
        }
        window.open(buildStoreFacebookShareUrl(data.storeUrl), "_blank", "noopener,noreferrer");
        return;
      }

      const utmUrl = buildStoreShareUtmUrl(data.storeUrl, channel);
      const href =
        channel === "whatsapp"
          ? buildStoreWhatsAppShareUrl(utmUrl)
          : channel === "messenger"
            ? buildStoreMessengerShareUrl(data.storeUrl)
            : channel === "telegram"
              ? buildStoreTelegramShareUrl(utmUrl, shareText)
              : null;

      if (channel === "whatsapp") trackStoreShare("store_share_whatsapp", { username: data.username });
      if (channel === "messenger") trackStoreShare("store_share_messenger", { username: data.username });
      if (channel === "telegram") trackStoreShare("store_share_telegram", { username: data.username });

      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    },
    [copyStoreLink, data.storeUrl, data.username, nativeShare, pushToast, shareText],
  );

  return (
    <ModalContainer
      open={open}
      onClose={() => {
        setShowQr(false);
        onClose();
      }}
      zIndex={200}
      ariaLabelledBy="store-share-title"
      panelClassName={cn("store-share-sheet rounded-t-ds-xl p-ds-5 sm:rounded-ds-xl", "rx-enter")}
    >
      <div className="store-share-sheet__header">
        <div>
          <h2 id="store-share-title" className="store-share-sheet__title">
            {STORE_SHARE_COPY.sheetTitle(data.displayName)}
          </h2>
          <p className="store-share-sheet__desc">{STORE_SHARE_COPY.sheetDescription}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowQr(false);
            onClose();
          }}
          aria-label="Close"
          className={cn("store-share-sheet__close", focusRing)}
        >
          ×
        </button>
      </div>

      <StoreShareCard data={data} />

      <button
        type="button"
        className={cn("store-share-sheet__native", focusRing)}
        onClick={() => void nativeShare().then((shared) => {
          if (!shared) void copyStoreLink();
        })}
      >
        Share
      </button>

      <StoreShareActions onChannel={(channel) => void onChannel(channel)} />

      {showQr ? <StoreQRCode data={data} /> : null}
    </ModalContainer>
  );
}
