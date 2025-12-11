// api-client-utils.js
class ApiClientUtils {
    static normalizeOrderData(orderData) {
        if (!orderData) return null;
        
        return {
            customer: {
                name: orderData.customer?.name || orderData.name || '',
                phone: orderData.customer?.phone || orderData.phone || '',
                address: orderData.customer?.address || orderData.address || '',
                observation: orderData.customer?.observation || orderData.observation || ''
            },
            order: {
                order_id: orderData.order?.order_id || orderData.order_id || orderData.id || '',
                total: parseFloat(orderData.order?.total || orderData.total || 0),
                subtotal: parseFloat(orderData.order?.subtotal || orderData.subtotal || 0),
                delivery_fee: parseFloat(orderData.order?.delivery_fee || orderData.delivery_fee || orderData.deliveryFee || 0),
                delivery_option: orderData.order?.delivery_option || orderData.delivery_option || orderData.deliveryOption || 'entrega',
                payment_method: orderData.order?.payment_method || orderData.payment_method || orderData.paymentMethod || 'pix',
                observation: orderData.order?.observation || orderData.observation || '',
                created_at: orderData.order?.created_at || orderData.created_at || orderData.timestamp || new Date().toISOString()
            },
            items: orderData.items || orderData.order?.items || []
        };
    }
    
    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return 'Data Inválida';
            return date.toLocaleString('pt-BR');
        } catch (error) {
            return 'Data Inválida';
        }
    }
    
    static formatPaymentMethod(method) {
        if (!method) return 'Método Desconhecido';
        const lowerMethod = method.toLowerCase();
        
        if (lowerMethod.includes('pix')) return '💰 Pix';
        if (lowerMethod.includes('dinheiro') || lowerMethod.includes('cash')) return '💵 Dinheiro';
        if (lowerMethod.includes('cartao') || lowerMethod.includes('card')) return '💳 Cartão';
        
        return method;
    }
    
    static formatPhone(phone) {
        if (!phone) return 'Não informado';
        const cleanPhone = phone.toString().replace(/\D/g, '');
        
        // Remove código do país se tiver
        if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
            const cleanLocal = cleanPhone.substring(2);
            return `(${cleanLocal.substring(0,2)}) ${cleanLocal.substring(2,7)}-${cleanLocal.substring(7)}`;
        }
        
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0,2)}) ${cleanPhone.substring(2,7)}-${cleanPhone.substring(7)}`;
        }
        
        return phone;
    }
}