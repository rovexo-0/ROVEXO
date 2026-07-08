export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateShippoEnvironmentOnStartup } = await import("@/lib/shipping/env");
  validateShippoEnvironmentOnStartup();

  const { validateParcel2GoEnvironmentOnStartup } = await import("@/src/services/shipping/env");
  validateParcel2GoEnvironmentOnStartup();
}
