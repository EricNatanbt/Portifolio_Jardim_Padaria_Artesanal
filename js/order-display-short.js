// order-display-short.js - Versão para links encurtados com links de endereço
class OrderDisplay {
    constructor() {
        this.orderData = null;
        this.init();
    }

    init() {
        this.getOrderFromShortURL();
        this.displayOrder();
        this.setupAutoCleanup();
    }

    getOrderFromShortURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const shortId = urlParams.get('i');
        
        if (!shortId) {
            this.showError('Pedido não encontrado.');
            return;
        }

        try {
            // Verifica expiração
            const expirationKey = `exp_${shortId}`;
            const expiration = localStorage.getItem(expirationKey);
            const now = Date.now();
            
            if (expiration && now > parseInt(expiration)) {
                this.showError('Este pedido expirou. Faça um novo pedido.');
                // Remove dados expirados
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

            this.orderData = JSON.parse(savedOrder);
            
            if (!this.orderData.customer || !this.orderData.order) {
                throw new Error('Dados do pedido incompletos');
            }
            
        } catch (error) {
            console.error('Erro ao carregar pedido:', error);
            this.showError('Erro ao carregar pedido.');
        }
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

    // Cria URL para Google Maps
    createGoogleMapsUrl(address) {
        const encodedAddress = encodeURIComponent(address);
        return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    // Cria URL para Uber
    createUberUrl(address) {
        const encodedAddress = encodeURIComponent(address);
        return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`;
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
            tableHTML += `
                <tr>
                    <td>${this.escapeHtml(item.name)}</td>
                    <td>${item.quantity}x</td>
                    <td>R$ ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}</td>
                    <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
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
        if (cleanPhone.length === 12) { // +55 format
            return `(${cleanPhone.substring(2, 4)}) ${cleanPhone.substring(4, 9)}-${cleanPhone.substring(9)}`;
        } else if (cleanPhone.length === 11) {
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

    setupAutoCleanup() {
        // Marca este pedido como visualizado (pode ser limpo mais tarde)
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
        // Código de erro mantido igual...
    }
}


// Função para baixar a imagem do comprovante
async function downloadImage() {
    try {
        if (!window.orderDisplay || !window.orderDisplay.orderData) {
            alert('Dados do pedido não disponíveis.');
            return;
        }

        // Verifica se o ImageGenerator está disponível
        if (typeof ImageGenerator === 'undefined') {
            console.error('ImageGenerator não carregado');
            
            // Tenta carregar dinamicamente
            await this.loadImageGenerator();
            
            if (typeof ImageGenerator === 'undefined') {
                alert('Funcionalidade de download não disponível no momento. Tente recarregar a página.');
                return;
            }
        }

        console.log('Gerando imagem do comprovante...');
        
        // Gera a imagem usando o ImageGenerator
        const imageBlob = await ImageGenerator.generateOrderImage(window.orderDisplay.orderData);
        
        // Cria link de download
        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprovante-${window.orderDisplay.orderData.order.orderId}.jpg`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpa o URL após o download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        // Feedback visual
        const btn = document.querySelector('.btn-primary');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Baixado!';
            btn.style.background = '#4CAF50';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Erro ao baixar imagem:', error);
        alert('Erro ao baixar comprovante. Tente novamente.');
    }
}

// Função para carregar o ImageGenerator dinamicamente
async function loadImageGenerator() {
    return new Promise((resolve, reject) => {
        // Verifica se já está carregado
        if (typeof ImageGenerator !== 'undefined') {
            resolve();
            return;
        }

        // Tenta carregar o script
        const script = document.createElement('script');
        script.src = 'js/components/image-generator.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Função para limpar pedidos expirados (pode ser chamada periodicamente)
function cleanupExpiredOrders() {
    const now = Date.now();
    const keysToRemove = [];
    
    // Procura por chaves de expiração
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
    
    // Remove as chaves expiradas
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
        console.log(`Limpeza automática: ${keysToRemove.length / 2} pedidos expirados removidos`);
    }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.orderDisplay = new OrderDisplay();
    
    // Executa limpeza de pedidos expirados
    cleanupExpiredOrders();
    
    // Pré-carrega o ImageGenerator para download mais rápido
    setTimeout(() => {
        if (typeof ImageGenerator === 'undefined') {
            loadImageGenerator().catch(() => {
                console.warn('ImageGenerator não pôde ser carregado');
            });
        }
    }, 1000);
});

// Adiciona limpeza periódica a cada hora
setInterval(cleanupExpiredOrders, 60 * 60 * 1000);