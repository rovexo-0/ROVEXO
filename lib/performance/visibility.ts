export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible" && !document.hidden;
}

export function subscribeDocumentVisibility(onChange: (visible: boolean) => void): () => void {
  if (typeof document === "undefined") return () => undefined;

  const handler = () => onChange(isDocumentVisible());
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}

export function runWhenVisible(task: () => void): void {
  if (isDocumentVisible()) task();
}
