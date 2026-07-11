const HASH_SIZE = 8;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = src;
  });
}

function computeAverageHash(image: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = HASH_SIZE;
  canvas.height = HASH_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "";

  context.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE);
  const { data } = context.getImageData(0, 0, HASH_SIZE, HASH_SIZE);

  const gray: number[] = [];
  for (let index = 0; index < data.length; index += 4) {
    gray.push(data[index]! * 0.299 + data[index + 1]! * 0.587 + data[index + 2]! * 0.114);
  }

  const average = gray.reduce((sum, value) => sum + value, 0) / gray.length;
  return gray.map((value) => (value >= average ? "1" : "0")).join("");
}

function hammingDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) distance += 1;
  }
  return distance;
}

export async function computeImageHash(src: string): Promise<string | null> {
  try {
    const image = await loadImageElement(src);
    return computeAverageHash(image);
  } catch {
    return null;
  }
}

export function scoreImageSimilarity(queryHash: string, candidateHash: string): number {
  const distance = hammingDistance(queryHash, candidateHash);
  if (!Number.isFinite(distance)) return 0;
  const maxDistance = queryHash.length;
  return Math.max(0, 1 - distance / maxDistance);
}

export async function fileToDataUrl(file: File, maxEdge = 640): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function captureVideoFrame(video: HTMLVideoElement, maxEdge = 640): Promise<string> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error("Camera not ready");

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");

  context.drawImage(video, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", 0.82);
}
