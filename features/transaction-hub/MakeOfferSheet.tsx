"use client";

import type { ConversationProduct } from "@/lib/messages/types";
import { OfferComposerSheet } from "@/features/transaction-hub/OfferComposerSheet";

type MakeOfferSheetProps = {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  product: ConversationProduct;
};

export function MakeOfferSheet({ open, onClose, conversationId, product }: MakeOfferSheetProps) {
  return (
    <OfferComposerSheet
      open={open}
      onClose={onClose}
      conversationId={conversationId}
      product={{
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
      }}
    />
  );
}
