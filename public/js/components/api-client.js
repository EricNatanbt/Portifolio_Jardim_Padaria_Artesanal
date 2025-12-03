class ApiClient {
    constructor() {
        this.baseUrl = window.location.origin + '/.netlify/functions/supabase-proxy';
        console.log('🌐 API Client inicializado para:', this.baseUrl);
    }

    async _makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`📤 ${method} ${url}`, data ? 'com dados' : '');
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ HTTP ${response.status}: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(`✅ ${method} ${endpoint} - Sucesso:`, result.success !== false);
            return result;
            
        } catch (error) {
            console.error(`❌ Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }

    async saveOrder(orderData) {
        console.log('📤 Salvando pedido via API...');
        console.log('🔍 Dados do cliente recebidos:', orderData.client);
        
        try {
            const dataToSend = {
                client: orderData.client,
                order: orderData.order,
                items: orderData.items
            };

            return await this._makeRequest('/save-order', 'POST', dataToSend);
        } catch (error) {
            console.error('❌ Erro ao preparar pedido:', error);
            throw error;
        }
    }

    async saveClient(clientData) {
        console.log('👤 Salvando cliente via API...');
        return await this._makeRequest('/save-client', 'POST', clientData);
    }

    async getClient(phone) {
        console.log('🔍 Buscando cliente via API...');
        return await this._makeRequest(`/get-client?phone=${encodeURIComponent(phone)}`, 'GET');
    }

    async getProducts() {
        console.log('📦 Buscando produtos via API...');
        return await this._makeRequest('/get-products', 'GET');
    }

   async getOrder(orderId) {
    try {
        console.log(`📋 Buscando pedido ${orderId}...`);
        const response = await fetch(`${this.apiBase}/get-order/${orderId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Resposta da API (getOrder):', result.success ? '✅ Sucesso' : '❌ Erro');
        
        return result;
    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao buscar pedido'
        };
    }
}

    async healthCheck() {
        console.log('🏥 Verificando saúde da API...');
        return await this._makeRequest('/health', 'GET');
    }
}

// Cria instância global
const apiClient = new ApiClient();

// Exporta para uso global
window.ApiClient = apiClient;

// Export default
export default apiClient;