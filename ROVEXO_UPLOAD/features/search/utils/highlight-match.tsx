import type { ReactNode } from "react";

export function highlightMatch(text: string, query: string): ReactNode {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return text;

  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(normalized);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary/15 px-0.5 font-semibold text-primary not-italic">
        {text.slice(index, index + normalized.length)}
      </mark>
      {text.slice(index + normalized.length)}
    </>
  );
}
