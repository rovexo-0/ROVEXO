"use client";

import { memo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AUCTIONS_LEARN_MORE_ITEMS } from "@/lib/auctions/coming-soon-content";

type AuctionsLearnMoreModalProps = {
  open: boolean;
  onClose: () => void;
};

export const AuctionsLearnMoreModal = memo(function AuctionsLearnMoreModal({
  open,
  onClose,
}: AuctionsLearnMoreModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Live Auctions on ROVEXO"
      footer={
        <Button type="button" variant="primary" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <ul className="auctions-soon-learn-list">
        {AUCTIONS_LEARN_MORE_ITEMS.map((item) => (
          <li key={item.title} className="auctions-soon-learn-list__item">
            <p className="auctions-soon-learn-list__title">{item.title}</p>
            <p className="auctions-soon-learn-list__text">{item.description}</p>
          </li>
        ))}
      </ul>
    </Dialog>
  );
});
