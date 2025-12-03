// ============================================
// CLIENTE UBER API (FRONTEND) - SIMPLIFICADO
// ============================================

class UberAPI {
    constructor() {
        this.baseURL = '/api';
    }

    async calculateDelivery(pickupAddress, deliveryAddress) {
        try {
            if (!deliveryAddress || deliveryAddress.trim() === '') {
                return this.getDefaultPrice();
            }

            // SIMULAÇÃO: Retorna um valor fixo por enquanto
            // Em produção, você implementaria a chamada real à API
            console.log('Calculando frete para:', deliveryAddress);
            
            // Simula um delay de rede
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return this.getDefaultPrice();

        } catch (error) {
            console.error('Erro ao calcular frete:', error);
            return this.getDefaultPrice();
        }
    }

    getDefaultPrice() {
        return {
            fare: {
                value: 12.00,
                currency: "BRL"
            },
            duration: 1200,
            distance: 8000,
            display: "R$ 12,00",
            provider: "Uber Flash",
            is_fallback: true
        };
    }

    async healthCheck() {
        return true; // Sempre retorna true para a simulação
    }
}

const uberAPI = new UberAPI();