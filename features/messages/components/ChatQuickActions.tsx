"use client";

import { useRouter } from "next/navigation";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { ConversationProduct, SenderRole } from "@/lib/messages/types";

type ChatQuickActionsProps = {
  viewerRole: SenderRole;
  product: ConversationProduct;
};

export function ChatQuickActions({ viewerRole, product }: ChatQuickActionsProps) {
  const router = useRouter();

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/listing/${product.slug}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: product.title, url }).catch(() => undefined);
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url).catch(() => undefined);
    }
  };

  if (viewerRole === "buyer") {
    return (
      <div className="flex gap-ds-2 overflow-x-auto px-ds-4 pb-ds-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryChip label="Buy Now" onClick={() => router.push(`/checkout/${product.slug}`)} />
        <CategoryChip label="Make Offer" />
        <CategoryChip label="View Listing" href={`/listing/${product.slug}`} />
      </div>
    );
  }

  return (
    <div className="flex gap-ds-2 overflow-x-auto px-ds-4 pb-ds-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <CategoryChip label="Mark as Sold" />
      <CategoryChip label="Make Offer" />
      <CategoryChip label="Share Listing" onClick={() => void handleShare()} />
    </div>
  );
}
