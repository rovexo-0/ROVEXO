export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateSendcloudEnvironmentOnStartup } = await import("@/lib/shipping/env");
  validateSendcloudEnvironmentOnStartup();
}
