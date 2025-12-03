console.log('👷 Service Worker carregado');

self.addEventListener('install', event => {
  console.log('✅ Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker ativado');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Pode adicionar lógica de cache aqui se necessário
});