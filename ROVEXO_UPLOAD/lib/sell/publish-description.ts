const MIN_DESCRIPTION_LENGTH = 10;

export function buildPublishDescription(
  title: string,
  description: string,
  material?: string,
): string {
  const trimmed = description.trim();
  const materialNote = material?.trim() ? ` Material: ${material.trim()}.` : "";

  if (trimmed.length >= MIN_DESCRIPTION_LENGTH) {
    return trimmed + materialNote;
  }

  const titleText = title.trim();
  if (titleText.length >= MIN_DESCRIPTION_LENGTH) {
    return titleText + materialNote;
  }

  if (titleText.length > 0) {
    return `${titleText}. Listed on ROVEXO.${materialNote}`;
  }

  return `Listed on ROVEXO marketplace.${materialNote}`;
}
