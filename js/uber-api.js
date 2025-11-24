// ============================================
// CLIENTE UBER API (FRONTEND)
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

            const response = await fetch(`${this.baseURL}/calculate-delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deliveryAddress: deliveryAddress
                })
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }

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
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

const uberAPI = new UberAPI();