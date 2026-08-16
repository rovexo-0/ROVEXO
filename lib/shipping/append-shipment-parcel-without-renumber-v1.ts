/**
 * Canonical append for an existing shipment record.
 * next = max(parcel_number) + 1. Never renumbers historical rows.
 */

export function nextAppendParcelNumber(
  existingParcelNumbers: readonly number[],
): number {
  let max = 0;
  for (const n of existingParcelNumbers) {
    if (Number.isInteger(n) && n > max) max = n;
  }
  return max + 1;
}
