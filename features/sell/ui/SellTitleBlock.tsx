"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { sellInput, sellInvalid, focusRing } from "@/features/sell/ui/sell-classes";
import { SellSection, SellInlineError } from "@/features/sell/ui/SellPrimitives";
import { bumpPendingTextVersion } from "@/lib/sell/pending-text-store";
import { clampListingTitle, LISTING_TITLE_MAX, validateListingTitle } from "@/lib/sell/listing-title";
import { useSell } from "@/features/sell/context/SellProvider";

const PENDING_BUMP_MS = 300;

export const SellTitleBlock = memo(function SellTitleBlock() {
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
    <SellSection title="Title" aria-label="Title">
      <div className="flex flex-col gap-ds-1">
        <label htmlFor={titleId} className="px-ds-1 text-xs font-medium text-text-muted">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id={titleId}
          type="text"
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
          }}
          placeholder="Tell buyers what you're selling"
          maxLength={LISTING_TITLE_MAX}
          autoComplete="off"
          enterKeyHint="next"
          aria-label="Listing title"
          className={cn(sellInput, focusRing, sellInvalid(Boolean(titleError)))}
        />
        <div className="flex items-center justify-between gap-ds-2">
          <SellInlineError message={titleError} />
          <p className="ml-auto text-xs tabular-nums text-text-muted">{title.length} / {LISTING_TITLE_MAX}</p>
        </div>
      </div>
    </SellSection>
  );
});
