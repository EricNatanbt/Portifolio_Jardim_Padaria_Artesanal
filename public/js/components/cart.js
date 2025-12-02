// cart.js - Sistema de Carrinho com URL de Pedido
class Cart {
    constructor() {
        this.items = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) {
            console.warn('⚠️ Carrinho já inicializado, ignorando...');
            return;
        }

        console.log('🛒 Inicializando carrinho (versão segura)...');
        
        try {
            // Carrega itens salvos
            this.loadFromStorage();
            
            // Configura event listeners
            this.setupEventListeners();
            
            // Atualiza UI inicial
            this.updateUI();
            
            this.isInitialized = true;
            console.log('✅ Carrinho inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar carrinho:', error);
            this.isInitialized = false;
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando todos os event listeners...');
        
        // Botão do carrinho
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.openCart());
        }

        // Overlay do carrinho
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }

        // Botão fechar carrinho
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCart());
        }

        // Botão finalizar compra
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCheckoutModal();
            });
        }

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
                this.closeCheckoutModal();
            }
        });

        // Delegation para remover itens
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item-btn')) {
                const index = e.target.closest('.remove-item-btn').dataset.index;
                this.removeFromCart(parseInt(index));
            }
        });
    }

    // ============================================
    // GERENCIAMENTO DO CARRINHO
    // ============================================

    addToCart(product) {
        try {
            console.log(`🛒 Adicionando ${product.name} ao carrinho`);
            
            // Verifica se já existe no carrinho
            const existingIndex = this.items.findIndex(item => item.id === product.id);
            
            if (existingIndex >= 0) {
                // Incrementa quantidade
                this.items[existingIndex].quantity += 1;
            } else {
                // Adiciona novo item
                this.items.push({
                    ...product,
                    quantity: 1
                });
            }
            
            // Salva e atualiza UI
            this.saveToStorage();
            this.updateUI();
            
            // Feedback visual
            this.showAddNotification(product.name);
            
            // Abre carrinho automaticamente se for o primeiro item
            if (this.items.length === 1) {
                setTimeout(() => this.openCart(), 300);
            }
            
        } catch (error) {
            console.error('❌ Erro ao adicionar ao carrinho:', error);
            window.showNotification('Erro ao adicionar produto. Tente novamente.', 3000, 'error');
        }
    }

    removeFromCart(index) {
        if (index >= 0 && index < this.items.length) {
            const removedItem = this.items[index];
            this.items.splice(index, 1);
            
            this.saveToStorage();
            this.updateUI();
            
            window.showNotification(`${removedItem.name} removido do carrinho`, 2000, 'info');
        }
    }

    updateQuantity(index, newQuantity) {
        if (index >= 0 && index < this.items.length && newQuantity > 0) {
            this.items[index].quantity = newQuantity;
            this.saveToStorage();
            this.updateUI();
        }
    }

    clearCart() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
        window.showNotification('Carrinho limpo', 2000, 'info');
    }

    // ============================================
    // STORAGE
    // ============================================

    saveToStorage() {
        try {
            localStorage.setItem('cart_items', JSON.stringify(this.items));
        } catch (error) {
            console.warn('⚠️ Não foi possível salvar carrinho:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('cart_items');
            if (saved) {
                this.items = JSON.parse(saved);
                console.log(`📦 Carrinho carregado: ${this.items.length} itens`);
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar carrinho:', error);
            this.items = [];
        }
    }

    // ============================================
    // UI
    // ============================================

    updateUI() {
        this.updateCartCount();
        this.renderCartItems();
        this.updateCartTotal();
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            if (totalItems > 0) {
                cartCount.textContent = totalItems;
                cartCount.style.display = 'flex';
            } else {
                cartCount.style.display = 'none';
            }
        }
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        
        if (!cartItems || !cartFooter) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            cartFooter.style.display = 'none';
            return;
        }
        
        cartItems.innerHTML = '';
        this.items.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                        <span class="quantity-value">${item.quantity}x</span>
                        <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" data-index="${index}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            cartItems.appendChild(cartItem);
        });
        
        cartFooter.style.display = 'flex';
        
        // Adiciona listeners para botões de quantidade
        cartItems.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const action = e.target.dataset.action;
                
                if (action === 'increase') {
                    this.updateQuantity(index, this.items[index].quantity + 1);
                } else if (action === 'decrease') {
                    if (this.items[index].quantity > 1) {
                        this.updateQuantity(index, this.items[index].quantity - 1);
                    } else {
                        this.removeFromCart(index);
                    }
                }
            });
        });
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    showAddNotification(productName) {
        window.showNotification(`✅ ${productName} adicionado ao carrinho!`, 2000, 'success');
        
        // Animação no botão do carrinho
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                cartBtn.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // ============================================
    // MODAIS
    // ============================================

    openCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Atualiza dados antes de abrir
            this.updateUI();
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    openCheckoutModal() {
        if (this.items.length === 0) {
            window.showNotification('Adicione produtos ao carrinho antes de finalizar.', 3000, 'error');
            return;
        }
        
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            // Atualiza resumo
            this.updateCheckoutSummary();
            
            // Mostra modal
            checkoutModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Foco no primeiro campo
            setTimeout(() => {
                const nameField = document.getElementById('customerName');
                if (nameField) nameField.focus();
            }, 100);
            
            // Configura submit
            const checkoutForm = document.getElementById('checkoutForm');
            if (checkoutForm) {
                checkoutForm.onsubmit = (e) => this._handleCheckoutSubmit(e);
            }
            
            // Configura opção de entrega
            const deliveryOption = document.getElementById('deliveryOption');
            if (deliveryOption) {
                deliveryOption.onchange = () => this._toggleAddressFields();
                this._toggleAddressFields(); // Inicializa estado
            }
            
            // Configura CEP
            const cepField = document.getElementById('customerCep');
            if (cepField) {
                cepField.oninput = (e) => this._formatCEP(e);
                cepField.onblur = () => this._searchCEP();
            }
        }
    }

    closeCheckoutModal() {
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    updateCheckoutSummary() {
        const checkoutSummaryList = document.getElementById('checkoutSummaryList');
        const checkoutSubtotal = document.getElementById('checkoutSubtotal');
        const checkoutTotal = document.getElementById('checkoutTotal');
        
        if (!checkoutSummaryList || !checkoutSubtotal || !checkoutTotal) return;
        
        // Limpa lista
        checkoutSummaryList.innerHTML = '';
        
        // Adiciona itens
        this.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            `;
            checkoutSummaryList.appendChild(li);
        });
        
        // Calcula totais
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = this._calculateDeliveryFee();
        const total = subtotal + deliveryFee;
        
        checkoutSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        checkoutTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        
        // Atualiza taxa de entrega
        const deliveryFeeRow = document.getElementById('deliveryFeeRow');
        const checkoutDeliveryFee = document.getElementById('checkoutDeliveryFee');
        
        if (deliveryFeeRow && checkoutDeliveryFee) {
            if (deliveryFee > 0) {
                deliveryFeeRow.style.display = 'flex';
                checkoutDeliveryFee.textContent = `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`;
            } else {
                deliveryFeeRow.style.display = 'none';
            }
        }
    }

    // ============================================
    // CHECKOUT E PROCESSAMENTO
    // ============================================

    async _handleCheckoutSubmit(event) {
        event.preventDefault();
        
        try {
            console.log('🛒 Iniciando checkout...');
            
            // Coleta dados do formulário
            const formData = this._collectFormData();
            
            // Validação
            if (!this._validateFormData(formData)) {
                return;
            }
            
            // Prepara dados do pedido
            const orderData = this._prepareOrderData(formData);
            
            // Processa pedido (salva no banco)
            const result = await this._processOrder(orderData);
            
            if (result.success) {
                // Gera URL do pedido
                const orderUrl = await this._generateOrderUrl(orderData, result.orderId);
                
                // Mostra sucesso com URL
                this._showOrderSuccess(orderUrl, orderData, result.orderId);
                
            } else {
                throw new Error(result.error || 'Erro ao processar pedido');
            }
            
        } catch (error) {
            console.error('❌ Erro no checkout:', error);
            this._showError('Erro ao processar pedido. Tente novamente.');
        }
    }

    _collectFormData() {
        return {
            name: document.getElementById('customerName')?.value || '',
            phone: document.getElementById('customerPhone')?.value || '',
            deliveryOption: document.getElementById('deliveryOption')?.value || 'retirada',
            paymentMethod: document.getElementById('paymentMethod')?.value || 'pix',
            cep: document.getElementById('customerCep')?.value || '',
            street: document.getElementById('customerStreet')?.value || '',
            number: document.getElementById('customerNumber')?.value || '',
            neighborhood: document.getElementById('customerNeighborhood')?.value || '',
            city: document.getElementById('customerCity')?.value || '',
            complement: document.getElementById('customerComplement')?.value || '',
            observation: document.getElementById('customerObservation')?.value || ''
        };
    }

    _validateFormData(data) {
        if (!data.name.trim()) {
            this._showError('Por favor, informe seu nome.');
            return false;
        }
        
        if (!data.phone.trim()) {
            this._showError('Por favor, informe seu telefone.');
            return false;
        }
        
        // Valida telefone
        const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
        if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
            this._showError('Por favor, informe um telefone válido.');
            return false;
        }
        
        // Se for entrega, valida endereço
        if (data.deliveryOption === 'entrega') {
            if (!data.cep.trim() || !data.street.trim() || !data.number.trim() || !data.neighborhood.trim() || !data.city.trim()) {
                this._showError('Para entrega, preencha todos os campos do endereço.');
                return false;
            }
        }
        
        return true;
    }

    _prepareOrderData(formData) {
        // Calcula totais
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = formData.deliveryOption === 'entrega' ? this._calculateDeliveryFee() : 0;
        const total = subtotal + deliveryFee;
        
        return {
            client: {
                name: formData.name,
                phone: formData.phone,
                deliveryOption: formData.deliveryOption,
                paymentMethod: formData.paymentMethod,
                address: formData.deliveryOption === 'entrega' 
                    ? `${formData.street}, ${formData.number}, ${formData.neighborhood}, ${formData.city} - ${formData.cep}${formData.complement ? ` (${formData.complement})` : ''}`
                    : 'Retirada na Loja',
                cep: formData.cep,
                street: formData.street,
                number: formData.number,
                neighborhood: formData.neighborhood,
                city: formData.city,
                complement: formData.complement,
                observation: formData.observation
            },
            order: {
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                total: total,
                deliveryOption: formData.deliveryOption,
                paymentMethod: formData.paymentMethod
            },
            items: this.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        };
    }

    async _processOrder(orderData) {
        console.log('📤 Processando pedido via API segura...');
        
        try {
            // Usa o ApiClient global
            if (!window.ApiClient) {
                throw new Error('ApiClient não disponível');
            }

            const result = await window.ApiClient.saveOrder(orderData);
            
            if (!result.success) {
                throw new Error(result.error || 'Erro ao salvar pedido');
            }

            console.log('✅ Pedido salvo via API:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Erro ao salvar via API:', error);
            
            // Fallback: salva localmente
            console.log('🔄 Usando fallback local...');
            return this._saveOrderLocally(orderData);
        }
    }

    // ============================================
    // URL DO PEDIDO
    // ============================================

    async _generateOrderUrl(orderData, orderId) {
        console.log('🔗 Gerando URL do pedido...');
        
        try {
            // Se tiver orderId do banco, usa ele
            const finalOrderId = orderId || `JD${Date.now().toString().slice(-8)}`;
            
            // Cria URL curta
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/o.html?i=${finalOrderId}`;
            
            console.log('📋 URL do pedido gerada:', url);
            return {
                shortUrl: url,
                orderId: finalOrderId,
                data: orderData
            };
            
        } catch (error) {
            console.error('❌ Erro ao gerar URL:', error);
            return null;
        }
    }

    _showOrderSuccess(orderUrl, orderData, orderId) {
        // Fecha modais
        this.closeCheckoutModal();
        this.closeCart();
        
        // Limpa carrinho
        this.clearCart();
        
        // Mostra modal de sucesso com URL
        const successModal = document.createElement('div');
        successModal.className = 'modal';
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(28, 61, 45, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        const successContent = document.createElement('div');
        successContent.className = 'modal-content';
        successContent.style.cssText = `
            background: white;
            padding: 2.5rem;
            border-radius: 1rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            animation: slideUp 0.4s ease;
        `;
        
        // Ícone de sucesso
        const successIcon = document.createElement('div');
        successIcon.style.cssText = `
            width: 80px;
            height: 80px;
            background: #27AE60;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 2.5rem;
            color: white;
        `;
        successIcon.innerHTML = '🎉';
        
        // Título
        const title = document.createElement('h3');
        title.textContent = 'Pedido Confirmado!';
        title.style.cssText = 'color: #1C3D2D; margin-bottom: 0.5rem; font-size: 1.5rem;';
        
        // Mensagem
        const message = document.createElement('p');
        message.textContent = 'Seu pedido foi registrado com sucesso. Guarde este link para acompanhar:';
        message.style.cssText = 'color: #666; margin-bottom: 1.5rem; line-height: 1.5;';
        
        // URL do pedido
        const urlContainer = document.createElement('div');
        urlContainer.style.cssText = `
            background: #F5F9F7;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            border: 2px dashed #A2B28E;
        `;
        
        const urlText = document.createElement('div');
        urlText.style.cssText = `
            font-family: monospace;
            color: #1C3D2D;
            font-size: 0.9rem;
            word-break: break-all;
            padding: 0.5rem;
            background: white;
            border-radius: 0.25rem;
            margin-bottom: 1rem;
        `;
        urlText.textContent = orderUrl.shortUrl;
        
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '📋 Copiar Link';
        copyBtn.style.cssText = `
            background: #1C3D2D;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s;
        `;
        copyBtn.onmouseover = () => copyBtn.style.background = '#2A5C42';
        copyBtn.onmouseout = () => copyBtn.style.background = '#1C3D2D';
        
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(orderUrl.shortUrl).then(() => {
                copyBtn.innerHTML = '✅ Link Copiado!';
                copyBtn.style.background = '#27AE60';
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copiar Link';
                    copyBtn.style.background = '#1C3D2D';
                }, 2000);
            });
        };
        
        // Botão WhatsApp
        const whatsappBtn = document.createElement('button');
        whatsappBtn.innerHTML = '📱 Enviar pelo WhatsApp';
        whatsappBtn.style.cssText = `
            background: #25D366;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            margin-top: 1rem;
            transition: all 0.3s;
        `;
        whatsappBtn.onmouseover = () => whatsappBtn.style.background = '#128C7E';
        whatsappBtn.onmouseout = () => whatsappBtn.style.background = '#25D366';
        
        whatsappBtn.onclick = () => {
            const message = `🎉 Meu pedido na Jardim Padaria foi realizado!\n\n📋 Pedido: ${orderId}\n💰 Total: R$ ${orderData.order.total.toFixed(2)}\n📱 Acompanhe aqui: ${orderUrl.shortUrl}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        };
        
        // Botão fechar
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Voltar para a Loja';
        closeBtn.style.cssText = `
            background: transparent;
            color: #666;
            border: 2px solid #D4E8DC;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            margin-top: 1rem;
            transition: all 0.3s;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = '#F5F9F7';
            closeBtn.style.color = '#1C3D2D';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'transparent';
            closeBtn.style.color = '#666';
        };
        
        closeBtn.onclick = () => {
            document.body.removeChild(successModal);
            // Volta para a página inicial
            if (window.navigateToPage) {
                window.navigateToPage('inicio');
            }
        };
        
        // Monta modal
        urlContainer.appendChild(urlText);
        urlContainer.appendChild(copyBtn);
        
        successContent.appendChild(successIcon);
        successContent.appendChild(title);
        successContent.appendChild(message);
        successContent.appendChild(urlContainer);
        successContent.appendChild(whatsappBtn);
        successContent.appendChild(closeBtn);
        successModal.appendChild(successContent);
        
        // Adiciona ao body
        document.body.appendChild(successModal);
        
        // Foca no botão de copiar
        setTimeout(() => copyBtn.focus(), 100);
        
        // Adiciona animações CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // UTILITÁRIOS
    // ============================================

    _calculateDeliveryFee() {
        // Simples cálculo de frete - pode ser personalizado
        return 5.00; // Valor fixo por enquanto
    }

    _toggleAddressFields() {
        const deliveryOption = document.getElementById('deliveryOption');
        const addressFields = document.getElementById('addressFields');
        
        if (deliveryOption && addressFields) {
            if (deliveryOption.value === 'entrega') {
                addressFields.style.display = 'block';
                
                // Torna campos obrigatórios
                const requiredFields = addressFields.querySelectorAll('input[required]');
                requiredFields.forEach(field => field.required = true);
            } else {
                addressFields.style.display = 'none';
                
                // Remove obrigatoriedade
                const fields = addressFields.querySelectorAll('input');
                fields.forEach(field => field.required = false);
            }
        }
    }

    _formatCEP(event) {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        event.target.value = value;
    }

    async _searchCEP() {
        const cepField = document.getElementById('customerCep');
        const streetField = document.getElementById('customerStreet');
        const neighborhoodField = document.getElementById('customerNeighborhood');
        const cityField = document.getElementById('customerCity');
        
        if (!cepField || !streetField || !neighborhoodField || !cityField) return;
        
        const cep = cepField.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                streetField.value = data.logradouro || '';
                neighborhoodField.value = data.bairro || '';
                cityField.value = `${data.localidade} - ${data.uf}`;
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível buscar CEP:', error);
        }
    }

    _saveOrderLocally(orderData) {
        // Gera ID único
        const orderId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Salva no localStorage
        const orderKey = `order_${orderId}`;
        const expirationKey = `exp_${orderId}`;
        
        localStorage.setItem(orderKey, JSON.stringify(orderData));
        localStorage.setItem(expirationKey, (Date.now() + 7 * 24 * 60 * 60 * 1000).toString()); // Expira em 7 dias
        
        console.log(`💾 Pedido salvo localmente: ${orderId}`);
        
        return {
            success: true,
            orderId: orderId,
            message: 'Pedido salvo localmente (modo offline)'
        };
    }

    _showError(message) {
        window.showNotification(`❌ ${message}`, 3000, 'error');
    }

    // ============================================
    // INTERFACE PÚBLICA
    // ============================================

    getItems() {
        return [...this.items];
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// Cria instância global
const cartInstance = new Cart();

// Exporta para uso global
window.Cart = cartInstance;

// Export default
export default cartInstance;