class ApiClient {
    constructor() {
        this.baseUrl = window.location.origin + '/api';
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
        console.log('🔍 Dados completos recebidos:', orderData);
        
        try {
            // Garante que os dados estejam no formato correto
            const dataToSend = {
                client: orderData.client || {},
                order: {
                    total: orderData.order?.total || orderData.total || 0,
                    subtotal: orderData.order?.subtotal || orderData.subtotal || 0,
                    deliveryFee: orderData.order?.deliveryFee || orderData.deliveryFee || 0,
                    // IMPORTANTE: Usar os nomes corretos que o supabase-proxy.js espera
                    payment_method: orderData.order?.paymentMethod || orderData.paymentMethod || 'pix',
                    paymentMethod: orderData.order?.paymentMethod || orderData.paymentMethod || 'pix', // Mantém compatibilidade
                    delivery_option: orderData.order?.deliveryOption || orderData.deliveryOption || 'entrega',
                    deliveryOption: orderData.order?.deliveryOption || orderData.deliveryOption || 'entrega', // Mantém compatibilidade
                    observation: orderData.order?.observation || orderData.observation || ''
                },
                items: orderData.items || []
            };

            console.log('📤 Dados formatados para envio:', dataToSend);
            
            return await this._makeRequest('/saveOrder', 'POST', dataToSend);
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
        return await this._makeRequest('/produtos', 'GET');
    }

    async getOrder(orderId) {
        console.log(`📋 Buscando pedido ${orderId}...`);
        return await this._makeRequest(`/orders/${orderId}`, 'GET');
    }

    async healthCheck() {
        console.log('🏥 Verificando saúde da API...');
        return await this._makeRequest('/health', 'GET');
    }

    // NOVA FUNÇÃO: Para corrigir método de pagamento
    async fixPaymentMethod(orderId, correctMethod) {
        console.log(`🛠️ Corrigindo método de pagamento do pedido ${orderId} para ${correctMethod}`);
        return await this._makeRequest('/fix-payment-methods', 'POST', {
            orderId: orderId,
            correctPaymentMethod: correctMethod
        });
    }

    // NOVA FUNÇÃO: Buscar cliente por telefone (nova API)
    async getClientByPhone(phone) {
        console.log(`🔍 Buscando cliente por telefone: ${phone}`);
        return await this._makeRequest('/get-client-by-phone', 'POST', { phone: phone });
    }

    // NOVA FUNÇÃO: Buscar os últimos 3 pedidos (Geral)
    async getRecentOrders() {
        console.log(`📋 Buscando os últimos 3 pedidos...`);
        return await this._makeRequest('/orders', 'GET');
    }

    // NOVA FUNÇÃO: Buscar os últimos 3 pedidos por telefone
    async getRecentOrdersByPhone(phone) {
        console.log(`📋 Buscando os últimos 3 pedidos para o telefone ${phone}...`);
        return await this._makeRequest(`/orders/by-phone?phone=${encodeURIComponent(phone)}`, 'GET');
    }

    // Função para buscar detalhes de um pedido específico (já existe, mas ajustando o endpoint)
    async getOrderDetails(orderId) {
        console.log(`📋 Buscando detalhes do pedido ID: ${orderId}...`);
        return await this._makeRequest(`/orders/${orderId}`, 'GET');
    }
}

// Cria instância global
const apiClient = new ApiClient();

// Exporta para uso global
window.ApiClient = apiClient;

// Export default
export default apiClient;