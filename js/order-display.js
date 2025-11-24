// ============================================
// EXIBIÇÃO DO PEDIDO NA PÁGINA
// ============================================

class OrderDisplay {
    constructor() {
        this.orderData = null;
        this.init();
    }

    init() {
        // Recupera os dados do pedido da URL
        this.getOrderFromURL();
        
        // Exibe os dados do pedido
        this.displayOrder();
    }

    getOrderFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderDataEncoded = urlParams.get('order');
        
        if (orderDataEncoded) {
            try {
                const orderDataJSON = decodeURIComponent(orderDataEncoded);
                this.orderData = JSON.parse(orderDataJSON);
                
                // Valida se os dados estão completos
                if (!this.orderData.customer || !this.orderData.order) {
                    throw new Error('Dados do pedido incompletos');
                }
                
            } catch (error) {
                console.error('Erro ao decodificar pedido:', error);
                this.showError('Pedido não encontrado ou inválido.');
            }
        } else {
            this.showError('Nenhum pedido especificado na URL.');
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
        
        // NOVO: Adiciona observação se existir
        if (customer.observation && customer.observation.trim() !== '') {
            customerHTML += `
            <div class="info-item" style="align-items: flex-start;">
                <strong>Observação:</strong>
                <span style="text-align: right; color: #e67e22; font-style: italic;">${this.escapeHtml(customer.observation)}</span>
            </div>
            `;
        }
        
        if (customer.deliveryOption === 'entrega' && customer.address) {
            customerHTML += `
            <div class="info-item">
                <strong>Endereço:</strong>
                <span style="text-align: right;">${this.escapeHtml(customer.address)}</span>
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
                    <th>Quantidade</th>
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

    showError(message) {
        // Encontra o container principal de forma segura
        const orderContainer = document.querySelector('.order-container');
        const orderContent = document.querySelector('.order-content');
        
        const errorContainer = orderContent || orderContainer || document.body;
        
        const errorHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h2 style="color: #e74c3c; margin-bottom: 20px;">❌ ${message}</h2>
                <p style="margin-bottom: 30px;">Volte para a loja e tente novamente.</p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; background: #1C3D2D; color: white; text-decoration: none; border-radius: 8px;">
                    🏠 Voltar para a Loja
                </a>
            </div>
        `;
        
        if (orderContent) {
            orderContent.innerHTML = errorHTML;
        } else if (orderContainer) {
            orderContainer.innerHTML = `
                <div class="order-header">
                    <h1>🍞 Jardim Padaria</h1>
                    <p>Erro no Pedido</p>
                </div>
                ${errorHTML}
            `;
        } else {
            document.body.innerHTML = `
                <div style="max-width: 800px; margin: 50px auto; padding: 20px; text-align: center;">
                    <h1 style="color: #1C3D2D; margin-bottom: 30px;">🍞 Jardim Padaria</h1>
                    ${errorHTML}
                </div>
            `;
        }
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

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.orderDisplay = new OrderDisplay();
    
    // Pré-carrega o ImageGenerator para download mais rápido
    setTimeout(() => {
        if (typeof ImageGenerator === 'undefined') {
            loadImageGenerator().catch(() => {
                console.warn('ImageGenerator não pôde ser carregado');
            });
        }
    }, 1000);
});