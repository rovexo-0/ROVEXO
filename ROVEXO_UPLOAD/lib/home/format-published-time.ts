const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function formatPublishedTime(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const published = new Date(iso).getTime();
  if (Number.isNaN(published)) return null;

  const elapsed = Date.now() - published;
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < DAY * 7) return `${Math.floor(elapsed / DAY)}d ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(published);
}
