// order-display-short.js - Sistema Completo de Exibição de Pedidos
class OrderDisplay {
    constructor() {
        this.orderData = null;
        this.init();
    }

    init() {
        this.getOrderFromShortURL();
        this.displayOrder();
        this.setupAutoCleanup();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botão de download
        const downloadBtn = document.querySelector('.btn-primary');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => downloadImage());
        }
    }

    // ============================================
    // BUSCA DE PEDIDOS
    // ============================================

    async getOrderFromDatabase(orderId) {
        try {
            console.log(`🔍 Buscando pedido ${orderId} do banco...`);
            
            const response = await fetch(`/.netlify/functions/supabase-proxy/get-order?id=${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Pedido não encontrado');
            }
            
            // Formata os dados para o display
            return {
                customer: {
                    name: data.customer.name,
                    phone: data.customer.phone,
                    deliveryOption: data.order.deliveryOption || 'retirada',
                    paymentMethod: data.order.paymentMethod || 'pix',
                    address: data.customer.address || '',
                    observation: data.order.observation || '',
                    street: data.customer.street || '',
                    number: data.customer.number || '',
                    neighborhood: data.customer.neighborhood || '',
                    city: data.customer.city || '',
                    complement: data.customer.complement || '',
                    cep: data.customer.cep || ''
                },
                order: {
                    items: data.items || [],
                    subtotal: data.order.subtotal || 0,
                    deliveryFee: data.order.deliveryFee || 0,
                    total: data.order.total || 0,
                    orderId: data.order.id,
                    status: data.order.status || 'pendente',
                    timestamp: new Date(data.order.timestamp).toLocaleString('pt-BR')
                }
            };
            
        } catch (error) {
            console.error('❌ Erro ao buscar do banco:', error);
            return null;
        }
    }

    getOrderFromFullURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Verifica se há parâmetros básicos
        if (!urlParams.has('name') && !urlParams.has('items')) {
            return null;
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
            return {
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
                    timestamp: new Date(timestamp).toLocaleString('pt-BR'),
                    status: 'pendente'
                }
            };
            
        } catch (error) {
            console.error('Erro ao processar pedido da URL completa:', error);
            return null;
        }
    }

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
                    price: price,
                    quantity: quantity
                });
            }
        });
        
        return items;
    }

    estimatePrice(productName) {
        const priceMap = {
            'baguete': 13.00,
            'ciabatta': 8.00,
            'focaccia': 10.00,
            'pão': 12.00,
            'bolo': 25.00,
            'cookie': 5.00,
            'doce': 8.00,
            'brioche': 10.00,
            'cinnamon': 12.00
        };
        
        const lowerName = productName.toLowerCase();
        for (const [key, price] of Object.entries(priceMap)) {
            if (lowerName.includes(key)) {
                return price;
            }
        }
        
        return 10.00; // Preço padrão
    }

    async getOrderFromShortURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('i');
        
        if (!orderId) {
            this.showError('Pedido não encontrado. Verifique o link.');
            return;
        }

        try {
            console.log(`🔍 Carregando pedido: ${orderId}`);
            
            // 1. Tenta buscar do banco de dados
            const dbOrder = await this.getOrderFromDatabase(orderId);
            
            if (dbOrder) {
                this.orderData = dbOrder;
                console.log('✅ Pedido carregado do banco');
                return;
            }
            
            // 2. Fallback: tenta localStorage
            console.log('🔄 Banco falhou, tentando localStorage...');
            const expirationKey = `exp_${orderId}`;
            const orderKey = `order_${orderId}`;
            
            const expiration = localStorage.getItem(expirationKey);
            const now = Date.now();
            
            if (expiration && now > parseInt(expiration)) {
                this.showError('Este pedido expirou. Faça um novo pedido.');
                localStorage.removeItem(expirationKey);
                localStorage.removeItem(orderKey);
                return;
            }

            const savedOrder = localStorage.getItem(orderKey);
            
            if (savedOrder) {
                this.orderData = JSON.parse(savedOrder);
                console.log('✅ Pedido carregado do localStorage');
                return;
            }
            
            // 3. Fallback: dados da URL
            console.log('🔄 localStorage falhou, tentando URL...');
            const fullOrderData = this.getOrderFromFullURL();
            
            if (fullOrderData) {
                this.orderData = fullOrderData;
                console.log('✅ Pedido carregado da URL');
                return;
            }
            
            this.showError('Pedido não encontrado. O pedido pode ter expirado ou sido removido.');
            
        } catch (error) {
            console.error('❌ Erro ao carregar pedido:', error);
            this.showError('Erro ao carregar pedido. Tente novamente.');
        }
    }

    // ============================================
    // EXIBIÇÃO DO PEDIDO
    // ============================================

    displayOrder() {
        if (!this.orderData) return;

        try {
            // Atualiza o ID do pedido
            const orderIdElement = document.getElementById('orderId');
            if (orderIdElement) {
                orderIdElement.textContent = `Pedido: ${this.orderData.order.orderId}`;
            }

            // Atualiza status
            this.updateStatusBadge();

            // Exibe informações do cliente
            this.displayCustomerInfo();

            // Exibe itens do pedido
            this.displayOrderItems();

            // Exibe resumo do pedido
            this.displayOrderSummary();

            // Exibe timestamp
            this.displayTimestamp();
            
            // Adiciona controles admin se necessário
            this.addAdminControls();
            
        } catch (error) {
            console.error('❌ Erro ao exibir pedido:', error);
            this.showError('Erro ao carregar os dados do pedido.');
        }
    }

    updateStatusBadge() {
        const statusBadge = document.getElementById('orderStatus');
        if (statusBadge && this.orderData.order.status) {
            const status = this.orderData.order.status;
            const statusText = {
                'pendente': '📋 Pendente',
                'preparando': '👨‍🍳 Preparando',
                'pronto': '✅ Pronto para Retirada',
                'entregue': '🚗 Entregue',
                'cancelado': '❌ Cancelado'
            }[status] || '📋 Pendente';
            
            statusBadge.textContent = statusText;
            
            // Adiciona cor baseada no status
            const statusColors = {
                'pendente': '#E67E22',
                'preparando': '#3498DB',
                'pronto': '#27AE60',
                'entregue': '#2ECC71',
                'cancelado': '#E74C3C'
            };
            
            statusBadge.style.background = statusColors[status] || '#E67E22';
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
        if (customer.observation && customer.observation.trim() !== '' && customer.observation !== 'undefined') {
            customerHTML += `
            <div class="info-item">
                <strong>Observação:</strong>
                <span style="color: #e67e22; font-style: italic;">${this.escapeHtml(customer.observation)}</span>
            </div>
            `;
        }
        
        if (customer.deliveryOption === 'entrega' && customer.address && customer.address !== 'Retirada na Loja') {
            // Remove "Retirada na Loja" se for entrega
            const deliveryAddress = customer.address.replace('Retirada na Loja', '').trim();
            
            // Cria links para Google Maps e Uber
            const mapsUrl = this.createGoogleMapsUrl(deliveryAddress);
            const uberUrl = this.createUberUrl(deliveryAddress);
            
            customerHTML += `
            <div class="info-item">
                <strong>Endereço:</strong>
                <span>
                    ${this.escapeHtml(deliveryAddress)}
                    <div class="address-links">
                        <a href="${mapsUrl}" class="address-link maps" target="_blank" title="Abrir no Google Maps">
                            🗺️ Google Maps
                        </a>
                        <a href="${uberUrl}" class="address-link uber" target="_blank" title="Pedir Uber para este endereço">
                            🚗 Uber Flash
                        </a>
                    </div>
                </span>
            </div>
            `;
        }
        
        customerInfoDiv.innerHTML = customerHTML;
    }

    displayOrderItems() {
        const items = this.orderData.order.items;
        const itemsTable = document.getElementById('orderItems');
        
        if (!itemsTable || !items) return;
        
        let tableHTML = `
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Preço Unit.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        items.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            tableHTML += `
                <tr>
                    <td>${this.escapeHtml(item.name)}</td>
                    <td>${item.quantity || 1}x</td>
                    <td>R$ ${typeof item.price === 'number' ? item.price.toFixed(2).replace('.', ',') : '0,00'}</td>
                    <td>R$ ${itemTotal.toFixed(2).replace('.', ',')}</td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody>';
        itemsTable.innerHTML = tableHTML;
    }

    displayOrderSummary() {
        const order = this.orderData.order;
        const summaryDiv = document.getElementById('orderSummary');
        
        if (!summaryDiv) return;
        
        const subtotal = typeof order.subtotal === 'number' ? order.subtotal : 0;
        const deliveryFee = typeof order.deliveryFee === 'number' ? order.deliveryFee : 0;
        const total = typeof order.total === 'number' ? order.total : subtotal + deliveryFee;
        
        let summaryHTML = `
            <div class="summary-item">
                <span>Subtotal:</span>
                <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        
        if (deliveryFee > 0) {
            summaryHTML += `
            <div class="summary-item">
                <span>Frete:</span>
                <span>R$ ${deliveryFee.toFixed(2).replace('.', ',')}</span>
            </div>
            `;
        }
        
        summaryHTML += `
            <div class="summary-item total">
                <span>TOTAL:</span>
                <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        
        summaryDiv.innerHTML = summaryHTML;
    }

    displayTimestamp() {
        const timestampElement = document.getElementById('orderTimestamp');
        if (timestampElement && this.orderData.order.timestamp) {
            const status = this.orderData.order.status;
            const statusMsg = status === 'entregue' 
                ? 'Entregue em:' 
                : status === 'cancelado'
                ? 'Cancelado em:'
                : 'Pedido realizado em:';
            timestampElement.textContent = `${statusMsg} ${this.orderData.order.timestamp}`;
        }
    }

    // ============================================
    // UTILITÁRIOS
    // ============================================

    createGoogleMapsUrl(address) {
        const encodedAddress = encodeURIComponent(address);
        return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    createUberUrl(address) {
        const encodedAddress = encodeURIComponent(address);
        return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`;
    }

    formatPhone(phone) {
        if (!phone || phone === 'undefined') return 'Não informado';
        
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 12) { // +55 format
            return `(${cleanPhone.substring(2, 4)}) ${cleanPhone.substring(4, 9)}-${cleanPhone.substring(9)}`;
        } else if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
        } else if (cleanPhone.length === 10) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
        }
        return phone;
    }

    escapeHtml(text) {
        if (!text || text === 'undefined') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // CONTROLES ADMIN
    // ============================================

    addAdminControls() {
        // Verifica se é admin (simplificado)
        const isAdmin = localStorage.getItem('admin_mode') === 'true' || 
                        window.location.hash === '#admin' ||
                        window.location.search.includes('admin=true');
        
        if (!isAdmin) return;
        
        const actionsDiv = document.querySelector('.actions');
        if (!actionsDiv) return;
        
        // Botão para atualizar status
        const updateStatusBtn = document.createElement('button');
        updateStatusBtn.className = 'btn btn-secondary';
        updateStatusBtn.innerHTML = '🔄 Atualizar Status';
        updateStatusBtn.onclick = () => this.showStatusModal();
        
        actionsDiv.insertBefore(updateStatusBtn, actionsDiv.firstChild);
        
        // Botão para buscar pedido no banco
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-secondary';
        refreshBtn.innerHTML = '🔄 Buscar do Banco';
        refreshBtn.onclick = async () => {
            const orderId = new URLSearchParams(window.location.search).get('i');
            if (orderId) {
                const dbOrder = await this.getOrderFromDatabase(orderId);
                if (dbOrder) {
                    this.orderData = dbOrder;
                    this.displayOrder();
                    window.showNotification('✅ Pedido atualizado do banco!', 3000, 'success');
                }
            }
        };
        
        actionsDiv.insertBefore(refreshBtn, actionsDiv.firstChild);
    }

    async showStatusModal() {
        const orderId = new URLSearchParams(window.location.search).get('i');
        if (!orderId) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            max-width: 400px;
            width: 90%;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Atualizar Status do Pedido';
        title.style.cssText = 'margin-bottom: 1rem; color: #1C3D2D;';
        
        const select = document.createElement('select');
        select.style.cssText = `
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border: 1px solid #ddd;
            border-radius: 0.25rem;
            font-size: 1rem;
        `;
        
        const statuses = [
            { value: 'pendente', label: '📋 Pendente' },
            { value: 'preparando', label: '👨‍🍳 Preparando' },
            { value: 'pronto', label: '✅ Pronto para Retirada' },
            { value: 'entregue', label: '🚗 Entregue' },
            { value: 'cancelado', label: '❌ Cancelado' }
        ];
        
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.value;
            option.textContent = status.label;
            option.selected = this.orderData.order.status === status.value;
            select.appendChild(option);
        });
        
        const buttonDiv = document.createElement('div');
        buttonDiv.style.cssText = 'display: flex; gap: 1rem;';
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Salvar';
        saveBtn.style.cssText = `
            flex: 1;
            background: #1C3D2D;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 0.25rem;
            cursor: pointer;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cssText = `
            flex: 1;
            background: #ddd;
            color: #666;
            border: none;
            padding: 0.75rem;
            border-radius: 0.25rem;
            cursor: pointer;
        `;
        
        saveBtn.onclick = async () => {
            try {
                const response = await fetch('/.netlify/functions/supabase-proxy/update-order-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: orderId,
                        status: select.value
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.orderData.order.status = select.value;
                    this.updateStatusBadge();
                    this.displayTimestamp();
                    document.body.removeChild(modal);
                    window.showNotification('✅ Status atualizado!', 3000, 'success');
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
                window.showNotification('❌ Erro ao atualizar status.', 3000, 'error');
            }
        };
        
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        
        buttonDiv.appendChild(saveBtn);
        buttonDiv.appendChild(cancelBtn);
        
        modalContent.appendChild(title);
        modalContent.appendChild(select);
        modalContent.appendChild(buttonDiv);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    // ============================================
    // ERROS E LIMPEZA
    // ============================================

    showError(message) {
        const orderContent = document.querySelector('.order-content') || document.body;
        
        const errorHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h2 style="color: #e74c3c; margin-bottom: 20px;">❌ ${message}</h2>
                <p style="margin-bottom: 30px;">Volte para a loja e tente novamente.</p>
                <a href="/" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; background: #1C3D2D; color: white; text-decoration: none; border-radius: 4px;">
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

    setupAutoCleanup() {
        // Marca este pedido como visualizado
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('i');
        if (orderId) {
            setTimeout(() => {
                const viewedKey = `viewed_${orderId}`;
                localStorage.setItem(viewedKey, 'true');
            }, 5000);
        }
    }

    static cleanupExpiredOrders() {
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
            console.log(`🧹 Limpeza automática: ${keysToRemove.length / 2} pedidos expirados removidos`);
        }
    }
}

// ============================================
// SISTEMA DE DOWNLOAD AUTOMÁTICO
// ============================================

async function downloadImage() {
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    
    try {
        // Verifica dados do pedido
        if (!window.orderDisplay || !window.orderDisplay.orderData) {
            throw new Error('Dados do pedido não disponíveis');
        }

        console.log('📥 Iniciando download automático...');
        
        // Feedback visual imediato
        btn.innerHTML = '⏳ Gerando...';
        btn.disabled = true;
        
        // Garante que o ImageGenerator está carregado
        if (typeof ImageGenerator === 'undefined') {
            console.log('🔄 ImageGenerator não encontrado, carregando...');
            await loadImageGenerator();
            
            if (typeof ImageGenerator === 'undefined') {
                throw new Error('ImageGenerator não pôde ser carregado');
            }
        }

        // Gera a imagem
        console.log('🎨 Gerando imagem do comprovante...');
        const imageBlob = await ImageGenerator.generateOrderImage(window.orderDisplay.orderData);
        
        if (!imageBlob) {
            throw new Error('Falha ao gerar imagem');
        }

        console.log('✅ Imagem gerada, iniciando download...');
        
        // DOWNLOAD AUTOMÁTICO DIRETO
        await downloadDirect(imageBlob, window.orderDisplay.orderData.order.orderId);
        
        // Sucesso
        showDownloadSuccess(btn);
        
    } catch (error) {
        console.error('❌ Erro no download:', error);
        showDownloadError(btn, originalText);
        
        // Mensagem de erro amigável
        setTimeout(() => {
            alert('❌ Erro ao baixar comprovante. \n\nTente novamente ou tire um print da tela.');
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
            link.download = `comprovante-jardimpadaria-${orderId}.jpg`;
            link.style.display = 'none';
            
            // Adiciona ao DOM
            document.body.appendChild(link);
            
            // Dispara o click automaticamente
            link.click();
            
            // Remove o link do DOM
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
            }, 100);
            
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
        script.src = '/js/components/image-generator.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa display do pedido
    window.orderDisplay = new OrderDisplay();
    
    // Executa limpeza de pedidos expirados
    OrderDisplay.cleanupExpiredOrders();
    
    // Pré-carrega o ImageGenerator para download mais rápido
    setTimeout(() => {
        if (typeof ImageGenerator === 'undefined') {
            loadImageGenerator().catch(() => {
                console.warn('⚠️ ImageGenerator não pôde ser pré-carregado');
            });
        }
    }, 1000);
    
    // DOWNLOAD AUTOMÁTICO AO CARREGAR A PÁGINA (OPCIONAL)
    // Descomente a linha abaixo para download automático:
    // setTimeout(downloadImage, 1500);
});

// Adiciona limpeza periódica a cada hora
setInterval(OrderDisplay.cleanupExpiredOrders, 60 * 60 * 1000);