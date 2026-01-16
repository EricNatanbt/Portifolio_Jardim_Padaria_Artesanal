// ============================================
// EXIBIÇÃO DO PEDIDO NA PÁGINA
// ============================================

class OrderDisplay {
    constructor() {
        this.orderData = null;
        this.apiBase = window.location.origin + '/.netlify/functions/supabase-proxy';
        this.init();
    }

    async init() {
        // Adiciona CSS básico para a página
        this.addBasicStyles();
        
        // Recupera os dados do pedido
        await this.loadOrder();
        
        // Exibe os dados do pedido
        this.displayOrder();
    }

    addBasicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #1C3D2D 0%, #2D5A3D 100%);
                min-height: 100vh;
                padding: 20px;
                line-height: 1.6;
            }

            .order-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                overflow: hidden;
            }

            .order-header {
                background: #1C3D2D;
                color: white;
                padding: 30px;
                text-align: center;
            }

            .order-header h1 {
                font-family: 'Playfair Display', serif;
                font-size: 2.5em;
                margin-bottom: 10px;
            }

            .order-header .order-id {
                font-size: 1.2em;
                opacity: 0.9;
                margin-bottom: 10px;
            }

            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                background: #FFA000;
                color: white;
                border-radius: 20px;
                font-weight: bold;
                margin-top: 10px;
            }

            .order-content {
                padding: 30px;
            }

            .section {
                margin-bottom: 30px;
                padding: 20px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
            }

            .section h2 {
                color: #1C3D2D;
                margin-bottom: 15px;
                font-family: 'Playfair Display', serif;
                font-size: 1.5em;
            }

            .info-grid {
                display: grid;
                gap: 10px;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .info-item:last-child {
                border-bottom: none;
            }

            .summary-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                font-size: 1.1em;
            }

            .total {
                font-size: 1.3em;
                font-weight: bold;
                color: #1C3D2D;
                border-top: 2px solid #1C3D2D;
                margin-top: 10px;
                padding-top: 10px;
            }

            .timestamp {
                text-align: center;
                color: #666;
                margin-top: 20px;
                font-style: italic;
            }

            .actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }

            .btn {
                padding: 15px 30px;
                border: none;
                border-radius: 8px;
                font-size: 1.1em;
                cursor: pointer;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s ease;
                font-family: 'Inter', sans-serif;
            }

            .btn-primary {
                background: #1C3D2D;
                color: white;
            }

            .btn-secondary {
                background: #4CAF50;
                color: white;
            }

            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }

            @media (max-width: 768px) {
                .order-container {
                    margin: 10px;
                }
                
                .actions {
                    flex-direction: column;
                }
                
                .btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .info-item {
                    flex-direction: column;
                    gap: 5px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    async loadOrder() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const shortId = urlParams.get('i');

        if (!orderId && !shortId) {
            this.showError('Nenhum pedido especificado na URL.');
            return;
        }

        try {
            if (orderId) {
                // Busca pelo ID do banco de dados
                await this.fetchOrderFromDatabase(orderId);
            } else if (shortId) {
                // Busca pelo shortId (compatibilidade com links antigos)
                await this.fetchOrderFromLocalStorage(shortId);
            }
        } catch (error) {
            console.error(' Erro ao carregar pedido:', error);
            this.showError('Erro ao carregar os detalhes do pedido.');
        }
    }

    async fetchOrderFromDatabase(orderId) {
        try {
            console.log(`Buscando pedido ${orderId} da API...`);
            const response = await fetch(`${this.apiBase}/get-order/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.orderData) {
                this.orderData = this.normalizeOrderData(result.orderData);
                console.log(' Pedido carregado da API:', this.orderData);
            } else {
                this.showError(result.message || 'Pedido não encontrado no banco de dados.');
            }
        } catch (error) {
            console.error(' Erro na API:', error);
            this.showError('Erro ao buscar pedido do banco de dados.');
        }
    }

    async fetchOrderFromLocalStorage(shortId) {
        try {
            const orderKey = `order_${shortId}`;
            const savedOrder = localStorage.getItem(orderKey);
            
            if (savedOrder) {
                const parsed = JSON.parse(savedOrder);
                this.orderData = this.normalizeOrderData(parsed);
                console.log('Pedido carregado do localStorage:', this.orderData);
            } else {
                this.showError('Pedido não encontrado no armazenamento local.');
            }
        } catch (error) {
            console.error(' Erro ao carregar do localStorage:', error);
            this.showError('Erro ao carregar pedido do armazenamento local.');
        }
    }

    normalizeOrderData(orderData) {
        if (!orderData) return null;
        
        // Se já estiver normalizado, retorna como está
        if (orderData.normalized === true) return orderData;
        
        // Extrai dados do cliente
        const clientData = orderData.client || orderData.customer || {};
        const orderInfo = orderData.order || orderData;
        const items = orderData.items || orderInfo.items || [];
        
        // Normaliza os dados
        return {
            normalized: true,
            
            // Dados do cliente
            customer: {
                name: clientData.name || '',
                phone: clientData.phone || '',
                address: clientData.address || orderInfo.address || '',
                observation: clientData.observation || orderInfo.observation || ''
            },
            
            // Dados do pedido
            order: {
                order_id: orderInfo.order_id || orderInfo.id || orderData.order_id || '',
                id: orderInfo.id || orderInfo.order_id || '',
                total: parseFloat(orderInfo.total || orderInfo.total_amount || 0),
                subtotal: parseFloat(orderInfo.subtotal || orderInfo.total_amount || 0),
                delivery_fee: parseFloat(orderInfo.delivery_fee || orderInfo.deliveryFee || 0),
                delivery_option: orderInfo.delivery_option || orderInfo.deliveryOption || 'entrega',
                payment_method: orderInfo.payment_method || orderInfo.paymentMethod || 'pix',
                observation: orderInfo.observation || '',
                created_at: orderInfo.created_at || orderInfo.createdAt || orderInfo.timestamp || new Date().toISOString(),
                status: orderInfo.status || 'pendente'
            },
            
            // Itens do pedido
            items: items.map(item => ({
                product_id: item.product_id || item.id || '',
                product_name: item.product_name || item.name || '',
                name: item.name || item.product_name || '',
                price: parseFloat(item.price || 0),
                quantity: parseInt(item.quantity || 1)
            }))
        };
    }

    displayOrder() {
        if (!this.orderData) return;

        try {
            // Atualiza o ID do pedido
            const orderIdElement = document.getElementById('orderId');
            const orderId = this.orderData.order?.order_id || this.orderData.order?.id || 'Indefinido';
            if (orderIdElement) {
                orderIdElement.textContent = `Pedido: ${orderId}`;
            }

            // Exibe informações do cliente
            this.displayCustomerInfo();

            // Exibe itens do pedido
            this.displayOrderItems();

            // Exibe resumo do pedido
            this.displayOrderSummary();

            // Exibe timestamp
            this.displayTimestamp();

        } catch (error) {
            console.error('Erro ao exibir pedido:', error);
            this.showError('Erro ao carregar os dados do pedido.');
        }
    }

    displayCustomerInfo() {
        const customer = this.orderData.customer;
        const order = this.orderData.order;
        const customerInfoDiv = document.getElementById('customerInfo');
        
        if (!customerInfoDiv) return;
        
        // Formata o telefone
        const formattedPhone = this.formatPhone(customer.phone);
        
        // Formata o método de pagamento
        const paymentMethod = this.formatPaymentMethod(order.payment_method);
        
        // Formata a opção de entrega
        const deliveryOption = order.delivery_option === 'retirada' ? 'Retirada na Loja' : 'Entrega (Delivery)';
        
        let customerHTML = `
            <div class="info-item">
                <strong>Nome:</strong>
                <span>${this.escapeHtml(customer.name)}</span>
            </div>
            <div class="info-item">
                <strong>Telefone:</strong>
                <span>${formattedPhone}</span>
            </div>
            <div class="info-item">
                <strong>Entrega:</strong>
                <span>${deliveryOption}</span>
            </div>
            <div class="info-item">
                <strong>Pagamento:</strong>
                <span>${paymentMethod}</span>
            </div>
        `;
        
        // Adiciona observação se existir
        if (order.observation && order.observation.trim() !== '') {
            customerHTML += `
            <div class="info-item">
                <strong>Observação:</strong>
                <span style="color: #e67e22; font-style: italic;">${this.escapeHtml(order.observation)}</span>
            </div>
            `;
        }
        
        if (order.delivery_option === 'entrega' && customer.address) {
            customerHTML += `
            <div class="info-item">
                <strong>Endereço:</strong>
                <span>${this.escapeHtml(customer.address)}</span>
            </div>
            `;
        }
        
        customerInfoDiv.innerHTML = customerHTML;
    }

    displayOrderItems() {
        const items = this.orderData.items;
        const itemsContainer = document.getElementById('orderItems');
        
        if (!itemsContainer) return;
        
        let itemsHTML = '';
        
        if (items && items.length > 0) {
            items.forEach(item => {
                const itemTotal = (item.price * item.quantity).toFixed(2);
                itemsHTML += `
                    <div class="info-item">
                        <span>${item.quantity}x ${this.escapeHtml(item.product_name || item.name)}</span>
                        <span>R$ ${itemTotal}</span>
                    </div>
                `;
            });
        } else {
            itemsHTML = `
                <div class="info-item">
                    <span>Pedido personalizado</span>
                    <span>R$ ${this.orderData.order.total.toFixed(2)}</span>
                </div>
            `;
        }
        
        itemsContainer.innerHTML = itemsHTML;
    }

    displayOrderSummary() {
        const order = this.orderData.order;
        const summaryDiv = document.getElementById('orderSummary');
        
        if (!summaryDiv) return;
        
        const subtotal = order.subtotal || 0;
        const deliveryFee = order.delivery_fee || 0;
        const total = order.total || (subtotal + deliveryFee);
        
        let summaryHTML = `
            <div class="summary-item">
                <span>Subtotal:</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
            </div>
        `;
        
        if (deliveryFee > 0) {
            summaryHTML += `
            <div class="summary-item">
                <span>Frete:</span>
                <span>R$ ${deliveryFee.toFixed(2)}</span>
            </div>
            `;
        }
        
        summaryHTML += `
            <div class="summary-item total">
                <span>TOTAL:</span>
                <span>R$ ${total.toFixed(2)}</span>
            </div>
        `;
        
        summaryDiv.innerHTML = summaryHTML;
    }

    displayTimestamp() {
        const timestampElement = document.getElementById('orderTimestamp');
        if (timestampElement) {
            const rawDate = this.orderData.order?.created_at;
            let formattedDate = 'Data Inválida';
            
            if (rawDate) {
                try {
                    const date = new Date(rawDate);
                    if (!isNaN(date)) {
                        formattedDate = date.toLocaleString('pt-BR');
                    }
                } catch (error) {
                    console.warn('Erro ao formatar data:', rawDate, error);
                }
            }
            
            timestampElement.textContent = `Pedido realizado em: ${formattedDate}`;
        }
    }

    formatPhone(phone) {
        if (!phone) return 'Não informado';
        
        const cleanPhone = phone.replace(/\D/g, '');
        
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

    formatPaymentMethod(method) {
        if (!method) return 'Método Desconhecido';
        const lowerMethod = method.toLowerCase();
        
        if (lowerMethod.includes('pix')) {
            return '💰 Pix';
        }
        if (lowerMethod.includes('dinheiro')) {
            return '💵 Dinheiro';
        }
        if (lowerMethod.includes('cartao') || lowerMethod.includes('cartão')) {
            return '💳 Cartão';
        }
        if (lowerMethod.includes('card')) {
            return '💳 Cartão';
        }
        
        return method;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const orderContent = document.querySelector('.order-content') || document.body;
        
        const errorHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h2 style="color: #e74c3c; margin-bottom: 20px;"> ${message}</h2>
                <p style="margin-bottom: 30px;">Volte para a loja e tente novamente.</p>
                <a href="index.html" class="btn btn-primary">
                    🏠 Voltar para a Loja
                </a>
            </div>
        `;
        
        if (orderContent) {
            orderContent.innerHTML = errorHTML;
        } else {
            document.body.innerHTML = `
                <div class="order-container">
                    <div class="order-header">
                        <h1>🍞 Jardim Padaria</h1>
                        <p>Erro no Pedido</p>
                    </div>
                    ${errorHTML}
                </div>
            `;
        }
    }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.orderDisplay = new OrderDisplay();
});