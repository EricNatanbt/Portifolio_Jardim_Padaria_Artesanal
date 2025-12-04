// clear-cache.js
window.clearAppCache = function() {
    console.log('🔧 Limpando cache da aplicação...');
    
    // 1. Limpar localStorage (exceto dados importantes)
    const importantKeys = ['cartItems', 'lastCustomerPhone', 'lastCustomerCep'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!importantKeys.includes(key)) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 2. Limpar sessionStorage
    sessionStorage.clear();
    
    // 3. Limpar cache do Service Worker
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
                console.log(`🗑️ Cache removido: ${cacheName}`);
            });
        });
    }
    
    // 4. Desregistrar Service Workers antigos
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
                console.log('🔄 Service Worker desregistrado');
            });
        });
    }
    
    // 5. Forçar recarregamento
    localStorage.setItem('forceRefresh', 'true');
    
    // 6. Recarregar a página
    setTimeout(() => {
        window.location.reload(true); // true força recarregamento do servidor
    }, 1000);
    
    return 'Cache limpo! A página será recarregada.';
};

// Executar automaticamente em desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.clearAppCache();
}