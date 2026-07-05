import { App } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";

const staffUrl = import.meta.env.VITE_STAFF_URL || "https://staff.rovexo.co.uk";

async function registerPush() {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    await fetch(`${staffUrl}/api/staff-enterprise/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        platform: /iPhone|iPad/i.test(navigator.userAgent) ? "ios" : "android",
        pushToken: token.value,
        deviceName: navigator.userAgent.slice(0, 120),
      }),
    });
  });
}

window.location.replace(staffUrl);
void registerPush();

App.addListener("appStateChange", ({ isActive }) => {
  if (isActive) window.location.replace(staffUrl);
});
