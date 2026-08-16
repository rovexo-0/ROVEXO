"use client";

/**
 * Delivered-only issue reason + evidence step.
 * Submits through the existing report_issue action. Not a second dispute system.
 */

import { useId } from "react";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { sanitizeNativeImagePickerId } from "@/lib/media/native-image-picker";
import {
  BUYER_ISSUE_REASON_OPTIONS,
  BUYER_ISSUE_REASON_V1,
  canSubmitBuyerIssue,
  getBuyerIssueReasonOption,
  type BuyerIssueReasonId,
} from "@/lib/inbox/buyer-issue-reason-v1";

export type BuyerIssueReasonCardProps = {
  reasonId: BuyerIssueReasonId | null;
  description: string;
  photoPreviews: readonly string[];
  busy?: boolean;
  onReasonChange: (reasonId: BuyerIssueReasonId) => void;
  onDescriptionChange: (value: string) => void;
  onPhotosSelected: (files: FileList) => void;
  onRemovePhoto: (index: number) => void;
  onSubmit: () => void;
};

export function BuyerIssueReasonCard({
  reasonId,
  description,
  photoPreviews,
  busy = false,
  onReasonChange,
  onDescriptionChange,
  onPhotosSelected,
  onRemovePhoto,
  onSubmit,
}: BuyerIssueReasonCardProps) {
  const pickerId = sanitizeNativeImagePickerId(`buyer-issue-evidence-${useId()}`);
  const selected = getBuyerIssueReasonOption(reasonId);
  const explanationLabel =
    selected?.explanation === "short"
      ? BUYER_ISSUE_REASON_V1.explanationLabel
      : BUYER_ISSUE_REASON_V1.descriptionLabel;
  const canSubmit = canSubmitBuyerIssue({
    reasonId,
    description,
    photoCount: photoPreviews.length,
  });
  const photosLabel = selected?.photoRequired
    ? BUYER_ISSUE_REASON_V1.photosRequiredLabel
    : selected?.photos === "optional"
      ? BUYER_ISSUE_REASON_V1.photosOptionalLabel
      : selected?.multiplePhotos
        ? BUYER_ISSUE_REASON_V1.photosMultipleLabel
        : BUYER_ISSUE_REASON_V1.photosLabel;

  return (
    <section
      className="conv-hub__issue-reason"
      data-buyer-issue-reason="v1"
      aria-label={BUYER_ISSUE_REASON_V1.selectorTitle}
    >
      <p className="conv-hub__issue-reason-title">{BUYER_ISSUE_REASON_V1.selectorTitle}</p>
      <div className="conv-hub__issue-reason-options" role="radiogroup">
        {BUYER_ISSUE_REASON_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={reasonId === option.id}
            className={
              reasonId === option.id
                ? "conv-hub__issue-reason-option conv-hub__issue-reason-option--active"
                : "conv-hub__issue-reason-option"
            }
            data-issue-reason={option.id}
            disabled={busy}
            onClick={() => onReasonChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className="conv-hub__issue-reason-fields"
          data-issue-reason-fields={selected.id}
          data-damage-photos-required={selected.damagePhotosRequired ? "true" : "false"}
        >
          <label className="conv-hub__issue-reason-label" htmlFor="buyer-issue-description">
            {explanationLabel}
          </label>
          <textarea
            id="buyer-issue-description"
            className="conv-hub__issue-reason-textarea"
            rows={3}
            value={description}
            disabled={busy}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />

          <p className="conv-hub__issue-reason-label">{photosLabel}</p>
          {selected.photoRequired && photoPreviews.length === 0 ? (
            <p className="conv-hub__issue-reason-hint" data-damage-photo-hint="true">
              {BUYER_ISSUE_REASON_V1.photosRequiredHint}
            </p>
          ) : null}
          <div className="conv-hub__issue-reason-photos">
            {photoPreviews.map((src, index) => (
              <span key={`${src}-${index}`} className="conv-hub__issue-reason-photo">
                {/* Local object URL — plain img bypasses next/image remote restrictions. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="conv-hub__issue-reason-photo-img" />
                <button
                  type="button"
                  className="conv-hub__issue-reason-photo-remove"
                  aria-label="Remove photo"
                  disabled={busy}
                  onClick={() => onRemovePhoto(index)}
                >
                  Remove
                </button>
              </span>
            ))}
            <label className="conv-hub__issue-reason-add-photo" htmlFor={pickerId}>
              Add photo
            </label>
            <NativeImageFileInput
              id={pickerId}
              intent="gallery"
              placement="associated"
              multiple={selected.multiplePhotos}
              disabled={busy}
              onFilesSelected={onPhotosSelected}
            />
          </div>

          <button
            type="button"
            className="conv-hub__issue-reason-submit"
            data-issue-reason-submit="true"
            disabled={busy || !canSubmit}
            onClick={onSubmit}
          >
            {BUYER_ISSUE_REASON_V1.submitLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}
