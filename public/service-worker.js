// service-worker.js - Versão 2.1.2 (Correção Menu Mobile)
const CACHE_NAME = 'jardim-padaria-v2.1.2';
const DYNAMIC_CACHE = 'jardim-dynamic-v2.1.2';

// Arquivos para cache inicial (instalação)
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/components/header.css',
    '/css/components/footer.css',
    '/css/components/carousel.css',
    '/css/components/modal.css',
    '/css/components/cart.css',
    '/css/components/contact-modal.css',
    '/css/components/checkout-modal.css',
    '/css/pages/inicio.css',
    '/css/pages/sobrenos.css',
    '/css/pages/menu.css',
    '/css/pages/cuidados.css',
    '/css/pages/feedbacks.css',
    '/js/main.js',
    '/js/pages-loader.js',
    '/js/components/navigation.js',
    '/js/components/carousel.js',
    '/js/components/modal.js',
    '/js/pages/inicio.js',
    '/js/pages/sobrenos.js',
    '/js/pages/menu.js',
    '/js/pages/cuidados.js',
    '/js/pages/feedbacks.js',
    '/img/logos/Logo.png',
    '/img/logos/instagram.png',
    '/img/logos/whatsapp.png',
    '/img/logos/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap'
];

// URLs que NÃO devem ser cacheadas (sempre buscar na rede)
const NO_CACHE_URLS = [
    '/api/',
    '/order.html',
    'cart.js',
    'checkout',
    'supabaseClient.js',
    'api-client.js'
];

// ============================================
// INSTALAÇÃO
// ============================================
self.addEventListener('install', event => {
    console.log('🔄 Service Worker instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Armazenando arquivos estáticos em cache');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Service Worker instalado com sucesso');
                return self.skipWaiting(); // Ativar imediatamente
            })
            .catch(error => {
                console.error('❌ Erro durante instalação:', error);
            })
    );
});

// ============================================
// ATIVAÇÃO
// ============================================
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker ativando...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Remove caches antigos
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log(`🗑️ Removendo cache antigo: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker ativado');
            return self.clients.claim(); // Tomar controle das páginas abertas
        })
    );
});

// ============================================
// FUNÇÃO AUXILIAR: VERIFICAR SE PODE CACHEAR
// ============================================
function canCacheRequest(request) {
    // Não cachear requisições POST, PUT, DELETE
    if (request.method !== 'GET') {
        return false;
    }
    
    // Não cachear URLs específicas
    const url = new URL(request.url);
    const shouldNotCache = NO_CACHE_URLS.some(noCacheUrl => 
        url.pathname.includes(noCacheUrl)
    );
    
    return !shouldNotCache;
}

// ============================================
// INTERCEPTAÇÃO DE REQUISIÇÕES (FETCH)
// ============================================
self.addEventListener('fetch', event => {
        const request = event.request;
    const url = new URL(request.url);

    // 🚨 LIBERA TOTALMENTE O REACT (/feedback)
    if (url.pathname === '/feedback' || url.pathname.startsWith('/feedback/')) {
        return;
    }

    // 2. Verificar se é uma URL que NÃO deve ser cachead
    const shouldNotCache = NO_CACHE_URLS.some(noCacheUrl => 
        url.pathname.includes(noCacheUrl)
    );
    
    if (shouldNotCache) {
        // Para arquivos críticos, SEMPRE buscar na rede
        console.log(`🌐 Buscando na rede (sem cache): ${url.pathname}`);
        event.respondWith(fetch(request));
        return;
    }
    
    // 3. Para requisições de API, usar estratégia "Network Only" para garantir dados frescos
    // Se quiser suporte offline, use "Network First" mas sem cachear a resposta de sucesso permanentemente
    if (url.pathname.includes('/api/') || url.pathname.includes('/.netlify/functions/')) {
        event.respondWith(
            fetch(request).catch(() => {
                // Se offline, tentar buscar do cache como último recurso
                return caches.match(request);
            })
        );
        return;
    }
    
    // 4. Para imagens, usar estratégia "Cache First"
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request).then(response => {
                    // Adiciona ao cache dinâmico
                    if (canCacheRequest(request) && response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }
    
    // 5. Para outros recursos GET, usar estratégia "Cache First, Network Fallback"
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Se tem cache, retorna e busca atualização em background
            if (cachedResponse) {
                // Busca atualização em background
                fetch(request).then(networkResponse => {
                    if (canCacheRequest(request) && networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                }).catch(() => {
                    // Ignora erro de rede, já temos cache
                });
                
                return cachedResponse;
            }
            
            // Se não tem cache, busca na rede
            return fetch(request).then(networkResponse => {
                // Cacheia a resposta se for apropriado
                if (canCacheRequest(request) && networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(error => {
                console.error('❌ Erro de rede:', error);
                // Para páginas HTML, retorna página offline
                if (request.destination === 'document' || request.mode === 'navigate') {
                    return caches.match('/offline.html') || 
                           new Response('<h1>Você está offline</h1><p>Tente novamente quando tiver conexão.</p>', {
                               headers: { 'Content-Type': 'text/html' }
                           });
                }
                throw error;
            });
        })
    );
});

// ============================================
// MENSAGENS DO CLIENTE
// ============================================
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        console.log('⏩ Pulando espera do Service Worker');
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        console.log('🗑️ Limpando cache por solicitação do cliente');
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
    }
    
    if (event.data === 'update') {
        console.log('🔄 Atualizando Service Worker');
        self.skipWaiting();
        self.clients.claim();
    }
});

// ============================================
// SINCRONIZAÇÃO EM BACKGROUND
// ============================================
self.addEventListener('sync', event => {
    if (event.tag === 'sync-orders') {
        console.log('🔄 Sincronizando pedidos offline...');
        event.waitUntil(syncOfflineOrders());
    }
});

// ============================================
// NOTIFICAÇÕES PUSH
// ============================================
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Nova notificação da Padaria Jardim',
        icon: '/img/logos/Logo.png',
        badge: '/img/logos/Logo.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Padaria Jardim', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Verifica se já existe uma janela aberta
            for (const client of windowClients) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não existe, abre nova janela
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
async function syncOfflineOrders() {
    console.log('📤 Sincronizando pedidos offline...');
    // Implementação futura para sincronizar pedidos feitos offline
}

// ============================================
// LIMPEZA PERIÓDICA DE CACHE
// ============================================
async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const currentCaches = [CACHE_NAME, DYNAMIC_CACHE];
        
        for (const cacheName of cacheNames) {
            if (!currentCaches.includes(cacheName)) {
                console.log(`🗑️ Limpando cache antigo: ${cacheName}`);
                await caches.delete(cacheName);
            }
        }
        
        // Limpa cache dinâmico se ficar muito grande
        const dynamicCache = await caches.open(DYNAMIC_CACHE);
        const requests = await dynamicCache.keys();
        
        if (requests.length > 100) {
            console.log(`🗑️ Limpando cache dinâmico (${requests.length} itens)`);
            // Mantém os 50 itens mais recentes
            for (let i = 0; i < requests.length - 50; i++) {
                await dynamicCache.delete(requests[i]);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao limpar cache:', error);
    }
}

// Executa limpeza periodicamente
setInterval(cleanupOldCaches, 24 * 60 * 60 * 1000); // Uma vez por dia

// ============================================
// TRATAMENTO DE ERROS GLOBAIS
// ============================================
self.addEventListener('error', event => {
    console.error('❌ Erro no Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
});