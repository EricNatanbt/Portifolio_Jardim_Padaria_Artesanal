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

    // Função de fallback para carregar dados diretamente da URL (copiada de order-display.js)
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

            // Processa os itens do pedido (usando a função parseItems que deve ser adicionada)
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
                    timestamp: new Date(timestamp).toLocaleString('pt-BR')
                }
            };
            
        } catch (error) {
            console.error('Erro ao processar pedido da URL completa:', error);
            return null;
        }
    }

    // Função para processar itens do parâmetro URL (copiada de order-display.js)
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

    // Função auxiliar para estimar preços (copiada de order-display.js)
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
                // Tenta carregar os dados diretamente da URL como fallback
                const fullOrderData = this.getOrderFromFullURL();
                    if (!fullOrderData) {
                        this.showError('Pedido não encontrado ou já foi processado.');
                        return;
                    }
                    this.orderData = fullOrderData;
            } else {
                this.orderData = JSON.parse(savedOrder);
            }
            
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
    createUberUrl(address ) {
        const encodedAddress = encodeURIComponent(address);
        return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedAddress}`;
    }

    displayOrderItems( ) {
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

// ============================================
// SISTEMA DE DOWNLOAD MOBILE COMPATÍVEL
// ============================================

// Função principal de download - VERSÃO MOBILE CORRIGIDA
async function downloadImage() {
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    const originalBg = btn.style.background;
    
    try {
        // Verifica dados do pedido
        if (!window.orderDisplay || !window.orderDisplay.orderData) {
            throw new Error('Dados do pedido não disponíveis');
        }

        console.log('Iniciando download...');
        
        // Feedback visual imediato
        btn.innerHTML = '⏳ Gerando...';
        btn.disabled = true;
        btn.style.background = '#FFA000';
        
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

        console.log('Imagem gerada, tamanho:', imageBlob.size, 'tipo:', imageBlob.type);
        
        // Detecta se é mobile
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isMobile) {
            await downloadMobile(imageBlob, window.orderDisplay.orderData.order.orderId);
        } else {
            await downloadDesktop(imageBlob, window.orderDisplay.orderData.order.orderId);
        }
        
        // Sucesso
        showDownloadSuccess(btn);
        
    } catch (error) {
        console.error('Erro no download:', error);
        showDownloadError(btn, originalText, originalBg);
        
        // Mensagem de erro amigável
        setTimeout(() => {
            alert('❌ Erro ao baixar comprovante. \n\nDica: Tente manter a página aberta durante o download.');
        }, 500);
    }
}

// Download para desktop
async function downloadDesktop(blob, orderId) {
    return new Promise((resolve, reject) => {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprovante-${orderId}.jpg`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpa após um tempo
            setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve();
            }, 1000);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Download para mobile - MÚLTIPLAS ESTRATÉGIAS
async function downloadMobile(blob, orderId) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Iniciando download mobile...');
            
            // Estratégia 1: Tenta File System Access API (navegadores modernos)
            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: `comprovante-${orderId}.jpg`,
                        types: [{
                            description: 'Imagem JPEG',
                            accept: { 'image/jpeg': ['.jpg'] },
                        }],
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    console.log('Download via File System API bem-sucedido');
                    return resolve();
                } catch (fileError) {
                    console.log('File System API falhou ou foi cancelado:', fileError);
                    // Continua para próxima estratégia
                }
            }
            
            // Estratégia 2: Abre em nova aba (mais compatível)
            const url = URL.createObjectURL(blob);
            console.log('Tentando abrir em nova aba...');
            
            // Tenta abrir nova aba
            const newTab = window.open(url, '_blank');
            
            if (newTab) {
                console.log('Nova aba aberta com sucesso');
                // Dá tempo para o usuário salvar manualmente
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    resolve();
                }, 3000);
            } else {
                // Estratégia 3: Popup bloqueado, força download via link
                console.log('Popup bloqueado, forçando download via link...');
                const link = document.createElement('a');
                link.href = url;
                link.download = `comprovante-${orderId}.jpg`;
                link.style.display = 'none';
                
                // Adiciona evento para detectar sucesso
                link.addEventListener('click', function() {
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                        resolve();
                    }, 1000);
                });
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Fallback: resolve após um tempo mesmo sem confirmação
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    resolve();
                }, 2000);
            }
            
        } catch (mobileError) {
            console.error('Todas as estratégias mobile falharam:', mobileError);
            reject(mobileError);
        }
    });
}

// Feedback visual de sucesso
function showDownloadSuccess(btn) {
    btn.innerHTML = '✅ Baixado!';
    btn.style.background = '#4CAF50';
    
    // Mostra notificação adicional no mobile
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        showMobileDownloadHelp();
    }
    
    setTimeout(() => {
        btn.innerHTML = '📥 Baixar Comprovante';
        btn.style.background = '';
        btn.disabled = false;
    }, 3000);
}

// Feedback visual de erro
function showDownloadError(btn, originalText, originalBg) {
    btn.innerHTML = '❌ Erro';
    btn.style.background = '#E74C3C';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = originalBg;
        btn.disabled = false;
    }, 2000);
}

// Ajuda adicional para mobile
function showMobileDownloadHelp() {
    const helpMsg = `📱 Se a imagem não baixou automaticamente:
    
1. Toque e segure na imagem que abriu
2. Selecione "Salvar imagem" ou "Download"
3. Ou procure na pasta "Downloads" do seu celular`;

    console.log(helpMsg);
    
    // Opcional: mostra alerta com instruções
    setTimeout(() => {
        if (confirm('📱 Precisa de ajuda com o download?\n\nClique em OK para ver instruções.')) {
            alert(helpMsg);
        }
    }, 1000);
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

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.orderDisplay = new OrderDisplay();
    
    // Executa limpeza de pedidos expirados
    cleanupExpiredOrders();
    
    // Pré-carrega o ImageGenerator para melhor performance
    setTimeout(() => {
        if (typeof ImageGenerator === 'undefined') {
            loadImageGenerator().catch(() => {
                console.warn('ImageGenerator não pôde ser pré-carregado');
            });
        }
    }, 2000);
});

// Adiciona limpeza periódica a cada hora
setInterval(cleanupExpiredOrders, 60 * 60 * 1000);