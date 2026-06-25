import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { addressInputSchema } from "@/lib/account/schemas";
import {
  deleteUserAddress,
  setDefaultAddress,
  updateUserAddress,
} from "@/lib/addresses/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    if (body.action === "set_default") {
      const address = await setDefaultAddress(auth.user.id, id);
      return NextResponse.json({ address });
    }

    const parsed = addressInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid address." },
        { status: 400 },
      );
    }

    const address = await updateUserAddress(auth.user.id, id, parsed.data);
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ error: "Unable to update address." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await context.params;

  try {
    await deleteUserAddress(auth.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete address." }, { status: 500 });
  }
}
