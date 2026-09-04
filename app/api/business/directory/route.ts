import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { listBusinessDirectory } from "@/lib/business/directory";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const companies = await listBusinessDirectory();
    return NextResponse.json({ companies });
  } catch {
    return NextResponse.json({ error: "Unable to load directory." }, { status: 500 });
  }
}
