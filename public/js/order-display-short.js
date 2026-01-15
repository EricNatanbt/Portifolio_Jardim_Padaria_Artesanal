// ============================================
// ORDEM DISPLAY PARA LINKS CURTOS
// ============================================

class OrderDisplayShort {
    constructor() {
        this.orderData = null;
        this.apiBase = window.location.origin + '/.netlify/functions/supabase-proxy';
        this.init();
    }

    init() {
        this.getOrderData();
        this.displayOrder();
        this.setupAutoCleanup();
    }

    // Normaliza dados do pedido
    normalizeOrderData(orderData) {
        if (!orderData) return null;
        
        // Se já estiver normalizado, retorna como está
        if (orderData.normalized === true) return orderData;
        
        // Extrai dados do cliente
        const clientData = orderData.customer || orderData.client || {};
        const orderInfo = orderData.order || orderData;
        const items = orderData.items || orderInfo.items || [];
        
        return {
            normalized: true,
            
            // Dados do cliente
            customer: {
                name: clientData.name || '',
                phone: clientData.phone || '',
                address: clientData.address || orderInfo.address || '',
                observation: clientData.observation || orderInfo.observation || '',
                delivery_option: clientData.delivery_option || clientData.deliveryOption || orderInfo.delivery_option || orderInfo.deliveryOption || 'entrega',
                payment_method: clientData.payment_method || clientData.paymentMethod || orderInfo.payment_method || orderInfo.paymentMethod || 'pix'
            },
            
            // Dados do pedido
            order: {
                order_id: orderInfo.order_id || orderInfo.id || 'JD' + Date.now().toString().slice(-8),
                id: orderInfo.id || orderInfo.order_id || '',
                total: parseFloat(orderInfo.total || orderInfo.total_amount || 0),
                subtotal: parseFloat(orderInfo.subtotal || orderInfo.total_amount || 0),
                delivery_fee: parseFloat(orderInfo.delivery_fee || orderInfo.deliveryFee || 0),
                delivery_option: orderInfo.delivery_option || orderInfo.deliveryOption || 'entrega',
                payment_method: orderInfo.payment_method || orderInfo.paymentMethod || 'pix',
                observation: orderInfo.observation || '',
                created_at: orderInfo.created_at || orderInfo.createdAt || orderInfo.timestamp || new Date().toISOString()
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

    // Recupera dados do pedido
    async getOrderData() {
        const urlParams = new URLSearchParams(window.location.search);
        const shortId = urlParams.get('i');
        const orderId = urlParams.get('orderId');
        
        console.log('🔍 Buscando dados do pedido:', { shortId, orderId });

        if (orderId) {
            // Busca pelo ID do banco de dados
            await this.fetchOrderFromDatabase(orderId);
        } else if (shortId) {
            // Busca pelo shortId (localStorage)
            await this.fetchOrderFromLocalStorage(shortId);
        } else {
            // Tenta carregar dados da URL como fallback
            await this.getOrderFromFullURL();
        }
    }

    // Busca pedido do banco de dados
    async fetchOrderFromDatabase(orderId) {
        try {
            console.log(`📋 Buscando pedido ${orderId} do banco...`);
            const response = await fetch(`${this.apiBase}/get-order/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.orderData) {
                this.orderData = this.normalizeOrderData(result.orderData);
                console.log('✅ Pedido carregado do banco:', this.orderData);
            } else {
                this.showError(result.message || 'Pedido não encontrado.');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar do banco:', error);
            this.showError('Erro ao carregar pedido do banco de dados.');
        }
    }

    // Busca pedido do localStorage
    async fetchOrderFromLocalStorage(shortId) {
        try {
            // Verifica expiração
            const expirationKey = `exp_${shortId}`;
            const expiration = localStorage.getItem(expirationKey);
            const now = Date.now();
            
            if (expiration && now > parseInt(expiration)) {
                this.showError('Este pedido expirou. Faça um novo pedido.');
                localStorage.removeItem(expirationKey);
                localStorage.removeItem(`order_${shortId}`);
                return;
            }

            // Carrega dados do pedido
            const orderKey = `order_${shortId}`;
            const savedOrder = localStorage.getItem(orderKey);
            
            if (!savedOrder) {
                this.showError('Pedido não encontrado ou já foi processado.');
                return;
            }
            
            const parsedOrder = JSON.parse(savedOrder);
            this.orderData = this.normalizeOrderData(parsedOrder);
            console.log('✅ Pedido carregado do localStorage:', this.orderData);
            
        } catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            this.showError('Erro ao carregar pedido do armazenamento local.');
        }
    }

    // Fallback para carregar dados diretamente da URL
    async getOrderFromFullURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Verifica se há parâmetros básicos
        if (!urlParams.has('name') && !urlParams.has('items')) {
            this.showError('Nenhum dado de pedido encontrado na URL.');
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

            // Cria objeto normalizado
            this.orderData = this.normalizeOrderData({
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
            });
            
        } catch (error) {
            console.error('❌ Erro ao processar pedido da URL completa:', error);
            this.showError('Erro ao processar dados do pedido da URL.');
        }
    }

    // Processa itens do parâmetro URL
    parseItems(itemsParam) {
        if (!itemsParam) return [];
        
        const items = [];
        const itemEntries = itemsParam.split(',');
        
        itemEntries.forEach(entry => {
            const match = entry.match(/(\d+)x(.+)/);
            if (match) {
                const quantity = parseInt(match[1]);
                const name = match[2].replace(/_/g, ' ');
                
                const price = this.estimatePrice(name);
                
                items.push({
                    name: name,
                    product_name: name,
                    price: price,
                    quantity: quantity
                });
            }
        });
        
        return items;
    }

    // Função auxiliar para estimar preços
    estimatePrice(productName) {
        const priceMap = {
            'Baguete': 13.00,
            'Ciabatta': 8.00,
            'Focaccia': 24.00,
            'Pão': 19.00,
            'Doce': 10.00,
            'Muffin': 10.00
        };
        
        for (const [key, price] of Object.entries(priceMap)) {
            if (productName.toLowerCase().includes(key.toLowerCase())) {
                return price;
            }
        }
        
        return 10.00;
    }

    displayOrder() {
        if (!this.orderData) return;

        try {
            const { customer, order, items } = this.orderData;
            
            // Atualiza o ID do pedido
            const orderIdElement = document.getElementById('orderId');
            const orderId = order.order_id || order.id || 'Indefinido';
            if (orderIdElement) {
                orderIdElement.textContent = `Pedido: ${orderId}`;
            }

            // Atualiza status
            const statusElement = document.getElementById('orderStatus');
            if (statusElement) {
                statusElement.textContent = '✅ Pedido Confirmado';
                statusElement.style.background = '#4CAF50';
            }

            // Exibe informações do cliente
            this.displayCustomerInfo(customer, order);

            // Exibe itens do pedido
            this.displayOrderItems(items);

            // Exibe resumo do pedido
            this.displayOrderSummary(order);

            // Exibe timestamp
            this.displayTimestamp(order);

            // Configura botões de ação
            this.setupActionButtons(customer, order);
            
        } catch (error) {
            console.error('Erro ao exibir pedido:', error);
            this.showError('Erro ao carregar os dados do pedido.');
        }
    }

    displayCustomerInfo(customer, order) {
        const customerInfoDiv = document.getElementById('customerInfo');
        
        if (!customerInfoDiv) return;
        
        // Formata os dados
        const formattedPhone = this.formatPhone(customer.phone);
        const paymentMethod = this.formatPaymentMethod(customer.payment_method || order.payment_method);
        const deliveryOption = (customer.delivery_option || order.delivery_option) === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega (Delivery)';
        
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
        
        if ((customer.delivery_option || order.delivery_option) === 'entrega' && customer.address) {
            // Cria links para Google Maps e Uber
            const mapsUrl = this.createGoogleMapsUrl(customer.address);
            const uberUrl = this.createUberUrl(customer.address);
            
            customerHTML += `
            <div class="info-item address-item">
                <strong>Endereço:</strong>
                <div class="address-text">${this.escapeHtml(customer.address)}</div>
                <div class="address-actions">
                    <a href="${mapsUrl}" target="_blank" class="action-btn google-maps">
                        <span class="action-btn-icon">🗺️</span>
                        <span>Abrir no Google Maps</span>
                    </a>
                    <a href="${uberUrl}" target="_blank" class="action-btn uber">
                        <span class="action-btn-icon">🚗</span>
                        <span>Solicitar Uber Flash</span>
                    </a>
                </div>
            </div>
            `;
        }
        
        customerInfoDiv.innerHTML = customerHTML;
    }

    // Cria URL para Google Maps
    createGoogleMapsUrl(address) {
        if (!address || address === 'Retirada na Loja') return '#';
        const encodedAddress = encodeURIComponent(address);
        return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    // Cria URL para Uber
    createUberUrl(address) {
        if (!address || address === 'Retirada na Loja') return '#';
        const encodedAddress = encodeURIComponent(address);
        return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`;
    }

    displayOrderItems(items) {
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
                    <span>Nenhum item encontrado</span>
                    <span></span>
                </div>
            `;
        }
        
        itemsContainer.innerHTML = itemsHTML;
    }

    displayOrderSummary(order) {
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

    displayTimestamp(order) {
        const timestampElement = document.getElementById('orderTimestamp');
        if (timestampElement) {
            const rawDate = order.created_at;
            let formattedDate = 'Data Inválida';
            
            if (rawDate) {
                try {
                    const date = new Date(rawDate);
                    if (!isNaN(date)) {
                        formattedDate = date.toLocaleString('pt-BR');
                    }
                } catch (error) {
                    console.warn('⚠️ Erro ao formatar data:', rawDate, error);
                }
            }
            
            timestampElement.textContent = `Pedido realizado em: ${formattedDate}`;
        }
    }

    setupActionButtons(customer, order) {
        const actionsFooter = document.getElementById('actionsFooter');
        if (!actionsFooter) return;
        
        const isDelivery = (customer.delivery_option || order.delivery_option) === 'entrega' && customer.address && customer.address !== 'Retirada na Loja';
        const mapsUrl = isDelivery ? this.createGoogleMapsUrl(customer.address) : null;
        const uberUrl = isDelivery ? this.createUberUrl(customer.address) : null;
        const whatsappUrl = this.createWhatsAppUrl(customer.phone);
        
        let actionsHTML = '';
        
        if (whatsappUrl !== '#') {
            actionsHTML += `
                <a href="${whatsappUrl}" target="_blank" class="action-btn whatsapp">
                    <span class="action-btn-icon">💬</span>
                    <span>Falar no WhatsApp</span>
                </a>
            `;
        }
        
        if (isDelivery) {
            actionsHTML += `
                <div class="address-actions" style="width: 100%;">
                    ${mapsUrl !== '#' ? `
                    <a href="${mapsUrl}" target="_blank" class="action-btn google-maps">
                        <span class="action-btn-icon">🗺️</span>
                        <span>Google Maps</span>
                    </a>
                    ` : ''}
                    
                    ${uberUrl !== '#' ? `
                    <a href="${uberUrl}" target="_blank" class="action-btn uber">
                        <span class="action-btn-icon">🚗</span>
                        <span>Uber Flash</span>
                    </a>
                    ` : ''}
                </div>
            `;
        }
        
        actionsHTML += `
            <button onclick="window.print()" class="action-btn secondary">
                <span class="action-btn-icon">🖨️</span>
                <span>Imprimir Comprovante</span>
            </button>
            
            <button onclick="window.location.href='index.html'" class="action-btn primary">
                <span class="action-btn-icon">🏠</span>
                <span>Voltar para a Loja</span>
            </button>
        `;
        
        actionsFooter.innerHTML = actionsHTML;
    }

    createWhatsAppUrl(phone) {
        if (!phone) return '#';
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent('Olá, gostaria de falar sobre meu pedido!');
        return `https://wa.me/${cleanPhone}?text=${message}`;
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
        
        if (lowerMethod.includes('pix')) return '💰 Pix';
        if (lowerMethod.includes('dinheiro')) return '💵 Dinheiro';
        if (lowerMethod.includes('cartao') || lowerMethod.includes('cartão')) return '💳 Cartão';
        if (lowerMethod.includes('card')) return '💳 Cartão';
        
        return method;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupAutoCleanup() {
        const urlParams = new URLSearchParams(window.location.search);
        const shortId = urlParams.get('i');
        if (shortId) {
            setTimeout(() => {
                const viewedKey = `viewed_${shortId}`;
                localStorage.setItem(viewedKey, 'true');
            }, 5000);
        }
    }

    showError(message) {
        const orderContent = document.querySelector('.order-content') || document.body;
        
        const errorHTML = `
            <div class="error">
                <h2>❌ ${message}</h2>
                <p>Verifique se o link do pedido está correto ou se o pedido ainda existe.</p>
                <button onclick="window.location.href='index.html'" class="action-btn primary">
                    <span class="action-btn-icon">🏠</span>
                    <span>Voltar para a Loja</span>
                </button>
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
        
        // Atualiza status no header
        const statusElement = document.getElementById('orderStatus');
        if (statusElement) {
            statusElement.textContent = '❌ Erro';
            statusElement.style.background = '#E74C3C';
        }
    }
}

// ============================================
// DOWNLOAD AUTOMÁTICO DIRETO
// ============================================

// Função principal de download
async function downloadImage() {
    const btn = document.querySelector('.btn-primary');
    const originalText = btn ? btn.innerHTML : 'Baixar Comprovante';
    
    try {
        // Verifica dados do pedido
        if (!window.orderDisplay || !window.orderDisplay.orderData) {
            throw new Error('Dados do pedido não disponíveis');
        }

        console.log('Iniciando download automático...');
        
        // Feedback visual imediato
        if (btn) {
            btn.innerHTML = '⏳ Gerando...';
            btn.disabled = true;
        }
        
        // Garante que o ImageGenerator está carregado
        if (typeof ImageGenerator === 'undefined') {
            console.log('ImageGenerator não encontrado, carregando...');
            await loadImageGenerator();
            
            if (typeof ImageGenerator === 'undefined') {
                throw new Error('ImageGenerator não pôde ser carregado');
            }
        }

        // Gera a imagem
        console.log('Gerando imagem do comprovante...');
        const imageBlob = await ImageGenerator.generateOrderImage(window.orderDisplay.orderData);
        
        if (!imageBlob) {
            throw new Error('Falha ao gerar imagem');
        }

        console.log('Imagem gerada, iniciando download automático...');
        
        // DOWNLOAD AUTOMÁTICO DIRETO
        await downloadDirect(imageBlob, window.orderDisplay.orderData.order.order_id);
        
        // Sucesso
        if (btn) showDownloadSuccess(btn);
        
    } catch (error) {
        console.error('Erro no download:', error);
        if (btn) showDownloadError(btn, originalText);
        
        // Mensagem de erro amigável
        setTimeout(() => {
            alert('❌ Erro ao baixar comprovante. \n\nTente novamente.');
        }, 500);
    }
}

// Download direto e automático
async function downloadDirect(blob, orderId) {
    return new Promise((resolve, reject) => {
        try {
            // Cria URL para o blob
            const url = URL.createObjectURL(blob);
            
            // Cria elemento de link para download
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprovante-${orderId}.jpg`;
            link.style.display = 'none';
            
            // Adiciona ao DOM
            document.body.appendChild(link);
            
            // Dispara o click automaticamente
            link.click();
            
            // Remove o link do DOM
            document.body.removeChild(link);
            
            // Limpa a URL após um tempo
            setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve();
            }, 1000);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Feedback visual de sucesso
function showDownloadSuccess(btn) {
    btn.innerHTML = '✅ Baixado!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.innerHTML = '📥 Baixar Comprovante';
        btn.style.background = '';
        btn.disabled = false;
    }, 2000);
}

// Feedback visual de erro
function showDownloadError(btn, originalText) {
    btn.innerHTML = '❌ Erro';
    btn.style.background = '#E74C3C';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.disabled = false;
    }, 2000);
}

// Carregar ImageGenerator dinamicamente
async function loadImageGenerator() {
    return new Promise((resolve, reject) => {
        if (typeof ImageGenerator !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'js/components/image-generator.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Limpa pedidos expirados
function cleanupExpiredOrders() {
    const now = Date.now();
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('exp_')) {
            const expiration = parseInt(localStorage.getItem(key));
            if (now > expiration) {
                const orderKey = key.replace('exp_', 'order_');
                keysToRemove.push(key);
                keysToRemove.push(orderKey);
            }
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
        console.log(`Limpeza automática: ${keysToRemove.length / 2} pedidos expirados removidos`);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona CSS se necessário
    if (!document.getElementById('order-display-styles')) {
        const style = document.createElement('style');
        style.id = 'order-display-styles';
        style.textContent = `
            .address-item {
                display: block !important;
                padding: 10px 0;
                border-bottom: 1px solid #ddd;
            }
            
            .address-text {
                margin-bottom: 15px;
                line-height: 1.5;
                font-size: 0.95em;
                color: #333;
            }
            
            .address-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 15px;
            }
            
            .action-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border: none;
                border-radius: 10px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.3s ease;
                flex: 1;
                min-width: 160px;
                justify-content: center;
                text-align: center;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            
            .action-btn.google-maps {
                background: #4285F4;
                color: white;
            }
            
            .action-btn.uber {
                background: #000000;
                color: white;
            }
            
            .action-btn.whatsapp {
                background: #25D366;
                color: white;
            }
            
            .action-btn.primary {
                background: #1C3D2D;
                color: white;
            }
            
            .action-btn.secondary {
                background: #A2B28E;
                color: white;
            }
            
            .action-btn-icon {
                font-size: 1.3em;
            }
            
            .actions-footer {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }
            
            .error {
                text-align: center;
                padding: 40px;
                color: #E74C3C;
            }
            
            .error h2 {
                margin-bottom: 20px;
            }
            
            @media (max-width: 768px) {
                .address-actions {
                    flex-direction: column;
                }
                
                .action-btn {
                    width: 100%;
                    min-width: unset;
                }
                
                .actions-footer {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    window.orderDisplay = new OrderDisplayShort();
    
    // Executa limpeza de pedidos expirados
    cleanupExpiredOrders();
    
    // Pré-carrega o ImageGenerator para download mais rápido
    setTimeout(() => {
        if (typeof ImageGenerator === 'undefined') {
            loadImageGenerator().catch(() => {
                console.warn('ImageGenerator não pôde ser pré-carregado');
            });
        }
    }, 1000);
    
    // Configura botão de download se existir
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }
    
    // DOWNLOAD AUTOMÁTICO AO CARREGAR A PÁGINA (OPCIONAL)
    // Descomente a linha abaixo para baixar automaticamente:
    // setTimeout(downloadImage, 1500);
});

// Adiciona limpeza periódica a cada hora
setInterval(cleanupExpiredOrders, 60 * 60 * 1000);