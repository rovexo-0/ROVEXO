/**
 * Browser-side dominant colour detection — deterministic RGB distance, zero AI.
 */

const COLOUR_PALETTE: Array<{ name: string; rgb: [number, number, number] }> = [
  { name: "Black", rgb: [20, 20, 20] },
  { name: "White", rgb: [240, 240, 240] },
  { name: "Grey", rgb: [128, 128, 128] },
  { name: "Silver", rgb: [192, 192, 192] },
  { name: "Red", rgb: [180, 40, 40] },
  { name: "Blue", rgb: [40, 80, 180] },
  { name: "Green", rgb: [40, 140, 60] },
  { name: "Brown", rgb: [120, 80, 50] },
  { name: "Beige", rgb: [210, 190, 160] },
  { name: "Pink", rgb: [230, 150, 170] },
  { name: "Purple", rgb: [120, 60, 160] },
  { name: "Yellow", rgb: [230, 210, 60] },
  { name: "Orange", rgb: [220, 120, 40] },
  { name: "Tan", rgb: [180, 140, 100] },
  { name: "Navy", rgb: [30, 40, 90] },
];

function colourDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function nearestColour(rgb: [number, number, number]): string | null {
  let best = COLOUR_PALETTE[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of COLOUR_PALETTE) {
    const distance = colourDistance(rgb, entry.rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  if (bestDistance > 120) return null;
  return best.name;
}

/** Sample average RGB from an image file via canvas (client-only). */
export async function detectColourFromImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
        }
        resolve(nearestColour([Math.round(r / pixels), Math.round(g / pixels), Math.round(b / pixels)]));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    image.src = url;
  });
}
