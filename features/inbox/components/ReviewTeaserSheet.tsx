"use client";

type ReviewTeaserSheetProps = {
  open: boolean;
  rating: number;
  summary: string;
  body?: string;
  onClose: () => void;
};

/** Compact review teaser expands to full text in-sheet — never leaves conversation. */
export function ReviewTeaserSheet({ open, rating, summary, body, onClose }: ReviewTeaserSheetProps) {
  if (!open) return null;

  const stars = "★".repeat(Math.min(5, Math.max(0, Math.round(rating)))) +
    "☆".repeat(Math.max(0, 5 - Math.round(rating)));

  return (
    <div className="conv-hub__review-sheet" role="dialog" aria-modal="true" aria-labelledby="conv-hub-review-title">
      <button type="button" className="conv-hub__fee-backdrop" aria-label="Close review" onClick={onClose} />
      <div className="conv-hub__fee-panel">
        <p id="conv-hub-review-title" className="conv-hub__review-stars" aria-label={`${rating} out of 5`}>
          {stars}
        </p>
        <p className="conv-hub__review-summary">{summary}</p>
        {body ? <p className="conv-hub__review-body">{body}</p> : null}
        <button type="button" className="conv-hub__fee-ok" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
