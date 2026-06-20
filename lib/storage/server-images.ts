export function buildProductImagePath(
  sellerId: string,
  productId: string,
  filename: string,
): string {
  return `${sellerId}/${productId}/${filename}`;
}

export function buildTempImagePath(
  sellerId: string,
  sessionId: string,
  filename: string,
): string {
  return `${sellerId}/temp/${sessionId}/${filename}`;
}
