"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { CanonicalCard, CanonicalInput } from "@/src/components/canonical";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { clampListingTitle, LISTING_TITLE_MAX, validateListingTitle } from "@/lib/sell/listing-title";
import { isTitleStepComplete } from "@/lib/sell/sell-progressive-flow";
import { useSell } from "@/features/sell/context/SellProvider";

const PENDING_BUMP_MS = 300;

export const SellTitleBlock = memo(function SellTitleBlock({
  onStepComplete,
}: {
  onStepComplete?: () => void;
}) {
  const { draft, showValidation, pendingTitleRef, flushTitleCommitRef, syncTitleToDraft } = useSell();
  const titleId = useId();
  const [title, setTitle] = useState(draft.title);
  const titleRef = useRef(title);
  const typingTitle = useRef(false);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    titleRef.current = title;
  });

  useEffect(() => {
    flushTitleCommitRef.current = () => {
      typingTitle.current = false;
      syncTitleToDraft(titleRef.current);
    };
    return () => {
      flushTitleCommitRef.current = null;
    };
  }, [flushTitleCommitRef, syncTitleToDraft]);

  useEffect(() => {
    if (typingTitle.current) return;
    setTitle((current) => (current === draft.title ? current : draft.title));
    pendingTitleRef.current = draft.title;
  }, [draft.title, pendingTitleRef]);

  useEffect(() => () => {
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
  }, []);

  const scheduleBump = () => {
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
    bumpTimer.current = setTimeout(() => {
      bumpTimer.current = null;
      bumpPendingTextVersion();
    }, PENDING_BUMP_MS);
  };

  const flushBump = () => {
    if (bumpTimer.current) {
      clearTimeout(bumpTimer.current);
      bumpTimer.current = null;
    }
    bumpPendingTextVersion();
  };

  const titleError = showValidation ? validateListingTitle(title, { required: showValidation }) : undefined;

  return (
    <CanonicalCard variant="medium" className="p-ds-4">
      <CanonicalInput
      id={titleId}
      label="Title"
      value={title}
      onChange={(event) => {
        const next = clampListingTitle(event.target.value);
        typingTitle.current = true;
        setTitle(next);
        pendingTitleRef.current = next;
        scheduleBump();
      }}
      onBlur={() => {
        typingTitle.current = false;
        syncTitleToDraft(titleRef.current);
        flushBump();
        if (isTitleStepComplete(titleRef.current)) {
          onStepComplete?.();
        }
      }}
      placeholder="What are you selling?"
      maxLength={LISTING_TITLE_MAX}
      autoComplete="off"
      enterKeyHint="next"
      aria-label="Listing title"
      error={titleError}
      />
    </CanonicalCard>
  );
});
