import { PaymentSetupError } from "@/lib/payments/errors";

/** Safe JSON body reader — empty POST bodies must not throw (Add card used bare POST). */
export async function readJsonObjectBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  const text = await request.text();
  if (!text.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new PaymentSetupError("Request body must be a JSON object.", 400, "invalid_body");
  } catch (error) {
    if (error instanceof PaymentSetupError) throw error;
    throw new PaymentSetupError("Invalid JSON in request body.", 400, "invalid_json");
  }
}
