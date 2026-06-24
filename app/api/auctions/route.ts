import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Auctions are coming soon." }, { status: 404 });
}
