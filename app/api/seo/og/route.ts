import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "ROVEXO").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") ?? "UK Marketplace").slice(0, 120);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <text x="60" y="280" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${escapeXml(title)}</text>
  <text x="60" y="350" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="32">${escapeXml(subtitle)}</text>
  <text x="60" y="560" fill="#6366f1" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">ROVEXO</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
