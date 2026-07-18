import { NextResponse } from "next/server";

/** Help Assistant chat API removed — browse Help Centre articles instead. */
export async function POST() {
  return NextResponse.json(
    { error: "Help Assistant removed. Search Help Centre or Contact Support.", redirect: "/help" },
    { status: 410 },
  );
}
