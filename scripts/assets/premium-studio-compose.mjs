import sharp from "sharp";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Remove near-white studio backgrounds for transparent product icons */
export async function isolateStudioBackground(buffer, master, threshold = 246) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .resize(master, master, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .modulate({ brightness: 1.03, saturation: 1.06 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    } else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
      data[i + 3] = Math.max(0, data[i + 3] - 90);
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

/**
 * Unified premium studio master — photorealistic product isolation,
 * consistent scale, soft ground shadow, normalized exposure.
 */
export async function composePremiumStudioMaster(buffer, master = 1024, scale = 0.8) {
  const iconSize = Math.round(master * scale);
  const isolated = await isolateStudioBackground(buffer, master);
  const resizedIcon = await isolated
    .clone()
    .resize(iconSize, iconSize, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();

  const shadow = await sharp(resizedIcon)
    .ensureAlpha()
    .extractChannel("alpha")
    .blur(16)
    .toColourspace("b-w")
    .toBuffer();

  const shadowRgba = await sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: shadow, blend: "over", opacity: 0.2 }])
    .png()
    .toBuffer();

  const left = Math.round((master - iconSize) / 2);
  const top = Math.round((master - iconSize) / 2) + Math.round(master * 0.02);

  return sharp({
    create: { width: master, height: master, channels: 4, background: TRANSPARENT },
  })
    .composite([
      { input: shadowRgba, left, top: top + 10 },
      { input: resizedIcon, left, top },
    ])
    .png()
    .toBuffer();
}
