"use client";

import Link from "next/link";
import { SellerEmptyState } from "@/components/seller/SellerEmptyState";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerMessagesCard() {
  const { data } = useSellerDashboard();
  const { messages } = data;

  return (
    <SellerSection id="seller-messages" title="Messages" href="/messages">
      <div className="seller-card">
        <div className="seller-metric-grid">
          <div className="seller-metric"><p className="seller-metric__value">{messages.unread}</p><p className="seller-metric__label">Unread</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{messages.buyerQuestions}</p><p className="seller-metric__label">Buyer questions</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{messages.offers}</p><p className="seller-metric__label">Offers</p></div>
          <div className="seller-metric"><p className="seller-metric__value">{messages.negotiations}</p><p className="seller-metric__label">Negotiations</p></div>
        </div>
      </div>
      {messages.preview.length === 0 ? (
        <SellerEmptyState title="No conversations" message="Buyer messages will appear here." />
      ) : (
        messages.preview.map((conversation) => (
          <Link key={conversation.id} href={`/messages/${conversation.id}`} className="seller-list-row">
            <div className="min-w-0">
              <p className="seller-list-row__title">{conversation.participant.name}</p>
              <p className="seller-list-row__meta">{conversation.lastMessage}</p>
            </div>
          </Link>
        ))
      )}
    </SellerSection>
  );
}
