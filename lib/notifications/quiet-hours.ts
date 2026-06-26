export function isWithinQuietHours(input: {
  enabled: boolean;
  start: string;
  end: string;
  now?: Date;
}): boolean {
  if (!input.enabled) return false;

  const now = input.now ?? new Date();
  const [startHour, startMinute] = input.start.split(":").map(Number);
  const [endHour, endMinute] = input.end.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes === endMinutes) return false;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
