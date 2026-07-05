import type { CapacitorConfig } from "@capacitor/cli";

const staffUrl = process.env.STAFF_APP_URL ?? process.env.NEXT_PUBLIC_STAFF_URL ?? "https://staff.rovexo.co.uk";

const config: CapacitorConfig = {
  appId: "co.uk.rovexo.staff",
  appName: "ROVEXO Staff",
  webDir: "www",
  server: {
    url: staffUrl,
    cleartext: staffUrl.startsWith("http://"),
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
