export function isPromotionActive(until: string | null | undefined): boolean {
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

export function formatPromotionRemaining(until: string | null | undefined): string | null {
  if (!until) return null;

  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return null;

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function computePromotionScore(
  bumpCount: number,
  bumpedUntil: string | null,
  featuredUntil: string | null,
): number {
  let score = 0;
  if (isPromotionActive(featuredUntil)) score += 1000;
  if (isPromotionActive(bumpedUntil)) score += 500 + bumpCount * 10;
  return score;
}
