class OrderDisplayFixed {
    constructor() {
        this.orderData = null;
        this.apiBase = window.location.origin + '/.netlify/functions/supabase-proxy';
        this.init();
    }

    async init() {
        await this.loadOrder();
        this.displayOrder();
    }

    async loadOrder() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const shortId = urlParams.get('i'); // Para compatibilidade com links antigos

        if (!orderId && !shortId) {
            this.showError('Nenhum pedido especificado.');
            return;
        }

        try {
            let orderData = null;
            
            if (orderId) {
                // Busca pelo ID do banco de dados
                orderData = await this.fetchOrderById(orderId);
            } else if (shortId) {
                // Busca pelo shortId (compatibilidade com links antigos)
                orderData = await this.fetchOrderByShortId(shortId);
            }

            if (orderData) {
                this.orderData = ApiClientUtils.normalizeOrderData(orderData);
                console.log('✅ Dados normalizados:', this.orderData);
            } else {
                this.showError('Pedido não encontrado.');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pedido:', error);
            this.showError('Erro ao carregar os detalhes do pedido.');
        }
    }

    async fetchOrderById(orderId) {
        try {
            console.log(`📋 Buscando pedido ${orderId}...`);
            const response = await fetch(`${this.apiBase}/get-order/${orderId}`);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.success && result.orderData) {
                return result.orderData;
            }
            return null;
        } catch (error) {
            console.error(' Erro na API:', error);
            return null;
        }
    }

    async fetchOrderByShortId(shortId) {
        // Tenta carregar do localStorage primeiro (para pedidos antigos)
        try {
            const orderKey = `order_${shortId}`;
            const savedOrder = localStorage.getItem(orderKey);
            
            if (savedOrder) {
                const parsed = JSON.parse(savedOrder);
                console.log(' Pedido carregado do localStorage:', parsed);
                return parsed;
            }
        } catch (error) {
            console.warn(' Erro ao carregar do localStorage:', error);
        }
        
        return null;
    }

    displayOrder() {
        if (!this.orderData) return;

        const orderContent = document.getElementById('orderContent');
        if (!orderContent) return;

        try {
            const { customer, order, items } = this.orderData;
            
            // Verifica se é entrega para mostrar botões de endereço
            const isDelivery = order.delivery_option === 'entrega' && customer.address && customer.address !== 'Retirada na Loja';
            
            orderContent.innerHTML = this.generateOrderHTML(customer, order, items, isDelivery);

            // Atualiza header
            this.updateHeader(order);

        } catch (error) {
            console.error(' Erro ao exibir pedido:', error);
            this.showError('Erro ao exibir os dados do pedido.');
        }
    }

    generateOrderHTML(customer, order, items, isDelivery) {
        return `
            <!-- Informações do Cliente -->
            <div class="section">
                <h2>👤 Informações do Cliente</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Nome:</strong>
                        <span>${this.escapeHtml(customer.name)}</span>
                    </div>
                    <div class="info-item">
                        <strong>Telefone:</strong>
                        <span>${ApiClientUtils.formatPhone(customer.phone)}</span>
                    </div>
                    <div class="info-item">
                        <strong>Entrega:</strong>
                        <span>${order.delivery_option === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Pagamento:</strong>
                        <span>${ApiClientUtils.formatPaymentMethod(order.payment_method)}</span>
                    </div>
                    ${order.observation ? `
                    <div class="info-item">
                        <strong>Observação:</strong>
                        <span style="color: #e67e22;">${this.escapeHtml(order.observation)}</span>
                    </div>
                    ` : ''}
                    
                    <!-- Endereço com botões de ação -->
                    ${isDelivery ? `
                    <div class="address-item">
                        <strong>Endereço de Entrega:</strong>
                        <div class="address-text">${this.escapeHtml(customer.address)}</div>
                        
                        <div class="address-actions">
                            <a href="${this.createGoogleMapsUrl(customer.address)}" target="_blank" class="action-btn google-maps">
                                <span class="action-btn-icon"></span>
                                <span>Abrir no Google Maps</span>
                            </a>
                            
                            <a href="${this.createUberUrl(customer.address)}" target="_blank" class="action-btn uber">
                                <span class="action-btn-icon"></span>
                                <span>Solicitar Uber Flash</span>
                            </a>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Itens do Pedido -->
            <div class="section">
                <h2>📋 Itens do Pedido</h2>
                <div class="info-grid">
                    ${items && items.length > 0 ? items.map(item => `
                    <div class="info-item">
                        <span>${item.quantity}x ${this.escapeHtml(item.product_name || item.name)}</span>
                        <span>R$ ${(parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)}</span>
                    </div>
                    `).join('') : '<p>Nenhum item encontrado</p>'}
                </div>
            </div>

            <!-- Resumo do Pedido -->
            <div class="section">
                <h2>💵 Resumo do Pedido</h2>
                <div class="info-grid">
                    <div class="summary-item">
                        <span>Subtotal:</span>
                        <span>R$ ${parseFloat(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    ${order.delivery_fee > 0 ? `
                    <div class="summary-item">
                        <span>Frete:</span>
                        <span>R$ ${parseFloat(order.delivery_fee).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="summary-item total">
                        <span>TOTAL:</span>
                        <span>R$ ${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- Timestamp -->
            <div class="timestamp" id="orderTimestamp">
                Pedido realizado em: ${ApiClientUtils.formatDate(order.created_at)}
            </div>

            <!-- Botões de ação principais -->
            <div class="actions-footer">
                <a href="${this.createWhatsAppUrl(customer.phone)}" target="_blank" class="action-btn whatsapp">
                    <span class="action-btn-icon">💬</span>
                    <span>Falar no WhatsApp</span>
                </a>
                
                ${isDelivery ? `
                <div class="address-actions" style="width: 100%;">
                    <a href="${this.createGoogleMapsUrl(customer.address)}" target="_blank" class="action-btn google-maps">
                        <span class="action-btn-icon">🗺️</span>
                        <span>Google Maps</span>
                    </a>
                    
                    <a href="${this.createUberUrl(customer.address)}" target="_blank" class="action-btn uber">
                        <span class="action-btn-icon">🚗</span>
                        <span>Uber Flash</span>
                    </a>
                </div>
                ` : ''}
                
                <button onclick="window.print()" class="action-btn secondary">
                    <span class="action-btn-icon">🖨️</span>
                    <span>Imprimir Comprovante</span>
                </button>
                
                <button onclick="window.location.href='index.html'" class="action-btn primary">
                    <span class="action-btn-icon">🏠</span>
                    <span>Voltar para a Loja</span>
                </button>
            </div>
        `;
    }

    updateHeader(order) {
        const orderIdElement = document.getElementById('orderId');
        if (orderIdElement) {
            orderIdElement.textContent = `Pedido: ${order.order_id || 'N/A'}`;
        }

        const statusElement = document.getElementById('orderStatus');
        if (statusElement) {
            statusElement.textContent = '✅ Pedido Confirmado';
            statusElement.style.background = '#4CAF50';
        }
    }

    // Funções auxiliares
    createGoogleMapsUrl(address) {
        if (!address || address === 'Retirada na Loja') return '#';
        const encodedAddress = encodeURIComponent(address);
        return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    createUberUrl(address) {
        if (!address || address === 'Retirada na Loja') return '#';
        const encodedAddress = encodeURIComponent(address);
        return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`;
    }

    createWhatsAppUrl(phone, message = '') {
        if (!phone) return '#';
        const cleanPhone = phone.toString().replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message || 'Olá, gostaria de falar sobre meu pedido!');
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const orderContent = document.getElementById('orderContent');
        if (orderContent) {
            orderContent.innerHTML = `
                <div class="error">
                    <h2>❌ ${message}</h2>
                    <p>Verifique se o link do pedido está correto ou se o pedido ainda existe.</p>
                    <button onclick="window.location.href='index.html'" class="action-btn primary">
                        <span class="action-btn-icon">🏠</span>
                        <span>Voltar para a Loja</span>
                    </button>
                </div>
            `;
            
            const statusElement = document.getElementById('orderStatus');
            if (statusElement) {
                statusElement.textContent = '❌ Erro';
                statusElement.style.background = '#E74C3C';
            }
        }
    }
}