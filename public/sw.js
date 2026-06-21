self.addEventListener("push", (event) => {
  const payload = event.data?.json() as { title?: string; body?: string; href?: string } | undefined;
  const title = payload?.title ?? "ROVEXO";
  const options = {
    body: payload?.body ?? "",
    data: { href: payload?.href ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data?.href as string | undefined) ?? "/";
  event.waitUntil(clients.openWindow(href));
});
