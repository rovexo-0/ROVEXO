import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/session";

const emailChangeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = emailChangeSchema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase.auth.updateUser({ email: body.email });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user?.email) {
      await supabase.from("profiles").update({ email: data.user.email }).eq("id", auth.user.id);
    }

    return NextResponse.json({
      email: data.user?.email ?? body.email,
      message: "Confirmation email sent. Verify your new address to complete the change.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid email." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update email." }, { status: 500 });
  }
}
