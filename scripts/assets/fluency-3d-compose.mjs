import sharp from "sharp";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

export async function composeTransparentMaster(iconBuffer, master = 512, scale = 0.78) {
  const iconSize = Math.round(master * scale);
  const resizedIcon = await sharp(iconBuffer)
    .resize(iconSize, iconSize, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();

  const shadow = await sharp(resizedIcon)
    .ensureAlpha()
    .extractChannel("alpha")
    .blur(14)
    .toColourspace("b-w")
    .toBuffer();

  const shadowRgba = await sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: shadow, blend: "over", opacity: 0.18 }])
    .png()
    .toBuffer();

  const left = Math.round((master - iconSize) / 2);
  const top = Math.round((master - iconSize) / 2) + Math.round(master * 0.02);

  return sharp({
    create: { width: master, height: master, channels: 4, background: TRANSPARENT },
  })
    .composite([
      { input: shadowRgba, left, top: top + 8 },
      { input: resizedIcon, left, top },
    ])
    .png()
    .toBuffer();
}
