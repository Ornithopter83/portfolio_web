import { vapidPublicKey } from '../config';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('이 브라우저는 Service Worker를 지원하지 않습니다.');
  }

  const serviceWorkerUrl = new URL('sw.js', window.location.origin + import.meta.env.BASE_URL);
  return navigator.serviceWorker.register(serviceWorkerUrl.href, {
    scope: import.meta.env.BASE_URL
  });
}

export async function subscribeToPush() {
  if (!vapidPublicKey) {
    throw new Error('VITE_WEB_PUSH_PUBLIC_KEY가 설정되지 않았습니다.');
  }

  if (!window.isSecureContext) {
    throw new Error('Web Push notifications require HTTPS. Open the GitHub Pages HTTPS URL on your phone.');
  }

  if (!('Notification' in window)) {
    throw new Error('This browser does not support the Notification API. Try Android Chrome with the GitHub Pages HTTPS URL.');
  }

  if (!('PushManager' in window)) {
    throw new Error('This browser does not support Web Push. Try Android Chrome updated to the latest version.');
  }

  const registration = await registerServiceWorker();
  const permission = await window.Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('알림 권한이 허용되지 않았습니다.');
  }

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
}
