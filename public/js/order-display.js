// ============================================
// EXIBIÇÃO DO PEDIDO NA PÁGINA - NOVA VERSÃO
// ============================================

class OrderDisplay {
    constructor() {
        this.orderData = null;
        this.init();
    }

    init() {
        // Adiciona CSS básico para a página
        this.addBasicStyles();
        
        // Recupera os dados do pedido da URL
        this.getOrderFromURL();
        
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

    getOrderFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        console.log('Parâmetros da URL:', Object.fromEntries(urlParams.entries()));
        
        // Verifica se há parâmetros básicos
        if (!urlParams.has('id') && !urlParams.has('name')) {
            this.showError('Nenhum pedido especificado na URL.');
            return;
        }

        try {
            // Recupera dados básicos
            const orderId = urlParams.get('id') || 'JD' + Date.now().toString().slice(-6);
            const name = decodeURIComponent(urlParams.get('name') || 'Cliente');
            const phone = urlParams.get('phone') || '';
            const deliveryOption = urlParams.get('delivery') || 'retirada';
            const paymentMethod = urlParams.get('payment') || 'pix';
            const address = decodeURIComponent(urlParams.get('address') || '');
            const observation = decodeURIComponent(urlParams.get('obs') || '');
            const subtotal = parseFloat(urlParams.get('subtotal')) || 0;
            const total = parseFloat(urlParams.get('total')) || 0;
            const itemsParam = urlParams.get('items') || '';
            const timestamp = parseInt(urlParams.get('timestamp')) || Date.now();

            // Processa os itens do pedido
            const items = this.parseItems(itemsParam);

            // Estrutura os dados para exibição
            this.orderData = {
                customer: {
                    name: name,
                    phone: phone,
                    deliveryOption: deliveryOption,
                    paymentMethod: paymentMethod,
                    address: address,
                    observation: observation
                },
                order: {
                    items: items,
                    subtotal: subtotal,
                    deliveryFee: total - subtotal,
                    total: total,
                    orderId: orderId,
                    timestamp: new Date(timestamp).toLocaleString('pt-BR')
                }
            };
            
            console.log('Dados do pedido processados:', this.orderData);
            
        } catch (error) {
            console.error('Erro ao processar pedido:', error);
            this.showError('Erro ao processar os dados do pedido.');
        }
    }

    // Função para processar itens do parâmetro URL
    parseItems(itemsParam) {
        if (!itemsParam) return [];
        
        const items = [];
        const itemEntries = itemsParam.split(',');
        
        itemEntries.forEach(entry => {
            const match = entry.match(/(\d+)x(.+)/);
            if (match) {
                const quantity = parseInt(match[1]);
                const name = match[2].replace(/_/g, ' ');
                
                // Para demonstração, usamos preços fixos
                // Em uma aplicação real, você teria uma lista de produtos com preços
                const price = this.estimatePrice(name);
                
                items.push({
                    name: name,
                    price: price,
                    quantity: quantity
                });
            }
        });
        
        return items;
    }

    // Função auxiliar para estimar preços (para demonstração)
    estimatePrice(productName) {
        const priceMap = {
            'Baguete': 13.00,
            'Ciabatta': 8.00,
            'Focaccia': 10.00,
            'Pão': 12.00,
            'Bolo': 25.00,
            'Cookie': 5.00,
            'Doce': 8.00
        };
        
        for (const [key, price] of Object.entries(priceMap)) {
            if (productName.toLowerCase().includes(key.toLowerCase())) {
                return price;
            }
        }
        
        return 10.00; // Preço padrão
    }

    displayOrder() {
        if (!this.orderData) return;

        try {
            // Atualiza o ID do pedido
            const orderIdElement = document.getElementById('orderId');
            if (orderIdElement) {
                orderIdElement.textContent = `Pedido: ${this.orderData.order.orderId}`;
            }

            // Exibe informações do cliente
            this.displayCustomerInfo();

            // Exibe itens do pedido
            this.displayOrderItems();

            // Exibe resumo do pedido
            this.displayOrderSummary();

            // Exibe timestamp
            const timestampElement = document.getElementById('orderTimestamp');
            if (timestampElement) {
                timestampElement.textContent = `Pedido realizado em: ${this.orderData.order.timestamp}`;
            }
            
        } catch (error) {
            console.error('Erro ao exibir pedido:', error);
            this.showError('Erro ao carregar os dados do pedido.');
        }
    }

    displayCustomerInfo() {
        const customer = this.orderData.customer;
        const customerInfoDiv = document.getElementById('customerInfo');
        
        if (!customerInfoDiv) return;
        
        let customerHTML = `
            <div class="info-item">
                <strong>Nome:</strong>
                <span>${this.escapeHtml(customer.name)}</span>
            </div>
            <div class="info-item">
                <strong>Telefone:</strong>
                <span>${this.formatPhone(customer.phone)}</span>
            </div>
            <div class="info-item">
                <strong>Entrega:</strong>
                <span>${customer.deliveryOption === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega'}</span>
            </div>
            <div class="info-item">
                <strong>Pagamento:</strong>
                <span>${customer.paymentMethod === 'pix' ? '💰 Pix' : '💳 Cartão'}</span>
            </div>
        `;
        
        // Adiciona observação se existir
        if (customer.observation && customer.observation.trim() !== '') {
            customerHTML += `
            <div class="info-item">
                <strong>Observação:</strong>
                <span style="color: #e67e22; font-style: italic;">${this.escapeHtml(customer.observation)}</span>
            </div>
            `;
        }
        
        if (customer.deliveryOption === 'entrega' && customer.address) {
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
        const items = this.orderData.order.items;
        const itemsContainer = document.getElementById('orderItems');
        
        if (!itemsContainer) return;
        
        let itemsHTML = '';
        
        if (items && items.length > 0) {
            items.forEach(item => {
                const itemTotal = (item.price * item.quantity).toFixed(2);
                itemsHTML += `
                    <div class="info-item">
                        <span>${item.quantity}x ${this.escapeHtml(item.name)}</span>
                        <span>R$ ${itemTotal}</span>
                    </div>
                `;
            });
        } else {
            // Fallback: mostra apenas o total se não conseguir processar os itens
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
        const deliveryFee = order.deliveryFee || 0;
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

    formatPhone(phone) {
        if (!phone) return 'Não informado';
        
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
        }
        return phone;
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
                <h2 style="color: #e74c3c; margin-bottom: 20px;">❌ ${message}</h2>
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