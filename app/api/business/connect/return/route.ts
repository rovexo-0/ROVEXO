import { NextResponse } from "next/server";

/**
 * Unauthenticated Stripe return bridge.
 * Stripe redirects here over HTTPS; the page opens the Native app scheme.
 * Never exposes secrets. Never marks Business verified.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") === "refresh" ? "refresh" : "success";
  const deepLink = `rovexo://business/connect?status=${status}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Return to ROVEXO</title>
  <meta http-equiv="refresh" content="0;url=${deepLink}" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px 20px; color: #111; background: #fff; }
    a { color: #9333ea; font-weight: 600; }
  </style>
</head>
<body>
  <p>Returning to ROVEXO…</p>
  <p><a href="${deepLink}">Open ROVEXO</a></p>
  <script>window.location.replace(${JSON.stringify(deepLink)});</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
