self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Water Tank Alert";
  const options = {
    body: data.body || "Check your water tank status",
    icon: "/thumbnail.png",
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

// Optional: handle notification click
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/")); // open your app
});
