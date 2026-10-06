// Service worker tối thiểu: để trình duyệt điện thoại (Android) cho phép hiện thông báo nhắc học, và để bấm vào thông báo mở lại ứng dụng.
// Không lưu bộ nhớ đệm nên không bao giờ giữ bản cũ của ứng dụng.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const khach = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const k of khach) { if ("focus" in k) return k.focus(); }
    return self.clients.openWindow("/");
  })());
});
