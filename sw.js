const CACHE_NAME = 'sem3-tracker-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './supabaseClient.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', () => {
  console.log('✅ Service Worker Installed');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('🚀 Service Worker Activated');
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
