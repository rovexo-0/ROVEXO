import { NextResponse } from "next/server";

/** Consumer AI Assistant API removed — Help Centre / Contact Support only. */
export async function POST() {
  return NextResponse.json(
    { error: "Assistant removed. Use Help Centre or Contact Support.", redirect: "/help" },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Assistant removed. Use Help Centre or Contact Support.", redirect: "/help" },
    { status: 410 },
  );
}
