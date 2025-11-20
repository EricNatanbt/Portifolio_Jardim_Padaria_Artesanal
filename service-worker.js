const CACHE_NAME = 'jardim-padaria-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/css/components/header.css',
    '/css/components/footer.css',
    '/css/components/carousel.css',
    '/css/components/modal.css',
    '/css/components/cart.css',
    '/css/pages/inicio.css',
    '/css/pages/sobrenos.css',
    '/css/pages/menu.css',
    '/css/pages/feedbacks.css',
    '/js/main.js',
    '/js/components/navigation.js',
    '/js/components/cart.js',
    '/js/components/carousel.js',
    '/js/components/modal.js',
    '/js/pages/inicio.js',
    '/js/pages/sobrenos.js',
    '/js/pages/menu.js',
    '/js/pages/feedbacks.js',
    '/data/menuData.js',
    '/img/logos/Logo.png',
    '/img/logos/Logo-192.png',
    '/img/logos/Logo-512.png',
    '/img/logos/instagram.png',
    '/img/logos/whatsapp.png',
    '/img/produtos/produto1.png',
    '/img/produtos/produto2.png',
    '/img/produtos/produto3.png',
    '/img/produtos/produto4.png',
    '/img/produtos/produto5.png',
    '/img/produtos/produto6.png',
    '/img/produtos/produto7.png',
    '/img/produtos/produto8.png',
    '/img/produtos/produto9.png',
    '/img/produtos/produto10.png',
    '/img/produtos/produto11.png',
    '/img/produtos/produto12.png',
    '/img/produtos/produto13.png',
    '/img/sobre/sobre_nos_1.png',
    '/img/sobre/sobre_nos_2.png',
    '/img/sobre/sobre_nos_3.png',
    '/img/sobre/sobre_nos_4.png',
    '/img/sobre/sobre_nos_5.png',
    '/img/sobre/sobre_nos_6.png',
    '/img/sobre/sobre_nos_7.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptação de requisições (Estratégia Cache-First)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - retorna a resposta do cache
                if (response) {
                    return response;
                }
                
                // Não há cache - faz a requisição à rede
                return fetch(event.request).then(
                    response => {
                        // Verifica se recebemos uma resposta válida
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // IMPORTANTE: Clona a resposta. Uma resposta é um stream e só pode ser consumida uma vez.
                        // Como queremos que o navegador a consuma e o cache a consuma, precisamos cloná-la.
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                ).catch(error => {
                    // Tratar falha de rede, por exemplo, retornando uma página offline
                    console.error('Fetch failed:', error);
                    // Aqui você pode retornar uma página offline se tiver uma
                    // return caches.match('/offline.html');
                });
            })
    );
});
