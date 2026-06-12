self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Portfolio Launcher';
  const scopeUrl = self.registration.scope;
  const iconUrl = new URL('icon-192.png', scopeUrl).href;
  const options = {
    body: payload.body || '새 메시지가 도착했습니다.',
    icon: iconUrl,
    badge: iconUrl,
    data: {
      url: payload.url || scopeUrl,
      messageId: payload.messageId || null
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || self.registration.scope, self.registration.scope).href;

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existingClient = clientList.find((client) => client.url === targetUrl);

    if (existingClient) {
      return existingClient.focus();
    }

    return self.clients.openWindow(targetUrl);
  })());
});
