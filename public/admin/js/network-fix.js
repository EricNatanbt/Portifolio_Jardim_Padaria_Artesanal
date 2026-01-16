// network-fix.js
(function() {
    // Desativa completamente o Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
                registration.unregister();
            });
        });
    }
    
    // Patch para fetch para lidar com erros de CORS
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // Se for uma requisição para /api/, redireciona para o caminho correto
        if (typeof url === 'string' && url.startsWith('/api/')) {
            const newUrl = '/.netlify/functions/supabase-proxy' + url.substring(4);
            console.log(` Redirecting ${url} to ${newUrl}`);
            url = newUrl;
        }
        
        return originalFetch.call(this, url, options).catch(error => {
            console.warn('Fetch error:', error);
            // Tenta caminho alternativo
            if (typeof url === 'string' && url.includes('/.netlify/functions/')) {
                const altUrl = url.replace('/.netlify/functions/supabase-proxy', '/api');
                console.log(`Trying alternative: ${altUrl}`);
                return originalFetch.call(this, altUrl, options);
            }
            throw error;
        });
    };
    
    console.log(' Network fix aplicado');
})();