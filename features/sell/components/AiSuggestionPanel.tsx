"use client";

import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import { applyPredictionToDraft } from "@/lib/ai-camera/apply";
import type { CategoryMatchResult, VisionPrediction } from "@/lib/ai-camera/types";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AiSuggestionPanelProps = {
  form: SellFormController;
};

function SuggestionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-ds-7 w-full rounded-ds-md border px-ds-3 py-ds-2 text-left text-sm",
        transitionFast,
        focusRing,
        selected
          ? "border-primary/30 bg-primary/5 text-text-primary"
          : "border-border bg-surface text-text-primary hover:bg-surface-muted",
      )}
    >
      {label}
    </button>
  );
}

function PredictionCard({
  prediction,
  index,
  selected,
  onApply,
}: {
  prediction: VisionPrediction;
  index: number;
  selected: boolean;
  onApply: () => void;
}) {
  const categoryLabel = prediction.category?.path.pathLabel ?? "Category unavailable";

  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "flex w-full flex-col gap-ds-2 rounded-ds-md border px-ds-3 py-ds-3 text-left",
        transitionFast,
        focusRing,
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface hover:bg-surface-muted",
      )}
    >
      <div className="flex items-start justify-between gap-ds-2">
        <span className="text-sm font-semibold text-text-primary">{prediction.title}</span>
        <span className="shrink-0 text-xs font-semibold text-text-secondary">
          {Math.round(prediction.confidence * 100)}%
        </span>
      </div>
      <p className="text-xs text-text-secondary">{categoryLabel}</p>
      {prediction.brand ? (
        <p className="text-xs text-text-secondary">Brand: {prediction.brand}</p>
      ) : null}
      {prediction.color ? (
        <p className="text-xs text-text-secondary">Colour: {prediction.color}</p>
      ) : null}
      {prediction.condition ? (
        <p className="text-xs text-text-secondary">Condition: {prediction.condition}</p>
      ) : null}
      <span className="text-xs font-medium text-primary">Use prediction {index + 1}</span>
    </button>
  );
}

export function AiSuggestionPanel({ form }: AiSuggestionPanelProps) {
  const { draft, updateDraft, setCategoryPath } = form;
  const analysis = draft.analysis;

  if (!analysis?.lowConfidence) return null;

  const { suggestions, predictions } = analysis;
  const hasSuggestions =
    predictions.length > 0 ||
    suggestions.titles.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.brands.length > 0 ||
    suggestions.descriptions.length > 0;

  if (!hasSuggestions) {
    return (
      <div className="rounded-ds-lg border border-border bg-surface-muted px-ds-4 py-ds-3">
        <p className="text-sm font-medium text-text-primary">
          We&apos;re not completely sure what this item is.
        </p>
        <p className="mt-ds-1 text-xs text-text-secondary">
          Please fill in the title, description, and category manually.
        </p>
      </div>
    );
  }

  const handleCategorySelect = (match: CategoryMatchResult) => {
    setCategoryPath(match.path);
  };

  const activePredictionIndex = predictions.findIndex(
    (prediction) =>
      prediction.title === draft.title &&
      prediction.description === draft.description &&
      (!prediction.category ||
        (draft.categoryPath &&
          toPathId(prediction.category.path) === toPathId(draft.categoryPath))),
  );

  return (
    <section
      aria-labelledby="ai-suggestions-heading"
      className="flex flex-col gap-ds-3 rounded-ds-lg border border-warning/30 bg-warning/5 px-ds-4 py-ds-3"
    >
      <div>
        <h3 id="ai-suggestions-heading" className="text-sm font-semibold text-text-primary">
          We&apos;re not completely sure
        </h3>
        <p className="mt-ds-1 text-xs text-text-secondary">
          Confidence was below 90%. Choose a full prediction or pick individual suggestions below.
        </p>
      </div>

      {predictions.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Top predictions
          </p>
          {predictions.map((prediction, index) => (
            <PredictionCard
              key={`${prediction.title}-${index}`}
              prediction={prediction}
              index={index}
              selected={activePredictionIndex === index}
              onApply={() => {
                const next = applyPredictionToDraft(draft, index);
                updateDraft({
                  title: next.title,
                  description: next.description,
                  brand: next.brand,
                  color: next.color,
                  material: next.material,
                  size: next.size,
                  condition: next.condition,
                  categoryPath: next.categoryPath,
                });
              }}
            />
          ))}
        </div>
      )}

      {suggestions.titles.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Titles</p>
          {suggestions.titles.map((title) => (
            <SuggestionButton
              key={title}
              label={title}
              selected={draft.title === title}
              onClick={() => updateDraft({ title })}
            />
          ))}
        </div>
      )}

      {suggestions.categories.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Categories
          </p>
          {suggestions.categories.map((match) => {
            const pathId = toPathId(match.path);
            return (
              <SuggestionButton
                key={pathId}
                label={`${match.path.pathLabel} (${Math.round(match.confidence * 100)}%)`}
                selected={
                  draft.categoryPath ? toPathId(draft.categoryPath) === pathId : false
                }
                onClick={() => handleCategorySelect(match)}
              />
            );
          })}
        </div>
      )}

      {suggestions.brands.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Brands</p>
          {suggestions.brands.map((brand) => (
            <SuggestionButton
              key={brand}
              label={brand}
              selected={draft.brand === brand}
              onClick={() => updateDraft({ brand })}
            />
          ))}
        </div>
      )}

      {suggestions.colours.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Colours
          </p>
          {suggestions.colours.map((colour) => (
            <SuggestionButton
              key={colour}
              label={colour}
              selected={draft.color === colour}
              onClick={() => updateDraft({ color: colour })}
            />
          ))}
        </div>
      )}

      {suggestions.conditions.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Condition
          </p>
          {suggestions.conditions.map((condition) => (
            <SuggestionButton
              key={condition}
              label={condition}
              selected={draft.condition === condition}
              onClick={() => updateDraft({ condition })}
            />
          ))}
        </div>
      )}

      {suggestions.descriptions.length > 0 && (
        <div className="flex flex-col gap-ds-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Descriptions
          </p>
          {suggestions.descriptions.map((description) => (
            <SuggestionButton
              key={description}
              label={description}
              selected={draft.description === description}
              onClick={() => updateDraft({ description })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
