// ============================================
// COMPONENTE DO CARRINHO - VERSÃO CORRIGIDA PARA MOBILE
// ============================================
import apiClient from './api-client.js'; 

const Cart = {
    cartItems: [],
    deliveryFee: 0,
    _initialized: false,
    _submitting: false,
    _listenersSetup: false,
    _currentUserId: null,
    _whatsappOpened: false, // Nova flag para controlar abertura do WhatsApp

    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    initialize() {
        if (this._initialized) {
            console.warn('⚠️ Carrinho já inicializado, ignorando...');
            return;
        }
        
        console.log('🛒 Inicializando carrinho (versão segura)...');
        this._initialized = true;
        
        this.loadCartFromStorage();
        this.updateCartUI();
        
        // Pequeno delay para garantir DOM pronto
        setTimeout(() => {
            this._setupAllEventListeners();
        }, 500);
    },

    // ============================================
    // CONFIGURAÇÃO DE EVENT LISTENERS
    // ============================================
    _setupAllEventListeners() {
        if (this._listenersSetup) {
            console.warn('⚠️ Listeners já configurados, ignorando...');
            return;
        }

        console.log('🔧 Configurando todos os event listeners...');
        
        // 1. Listeners do carrinho
        this._setupCartListeners();
        
        // 2. Listeners do modal de checkout
        this._setupCheckoutListeners();
        
        // 3. Listeners do formulário
        this._setupFormListeners();
        
        this._listenersSetup = true;
    },

    _setupCartListeners() {
        const cartBtn = document.getElementById("cartBtn");
        const cartOverlay = document.getElementById("cartOverlay");
        const closeCart = document.getElementById("closeCart");

        if (cartBtn) {
            cartBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.openCart();
            });
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener("click", (e) => {
                e.preventDefault();
                this.closeCart();
            });
        }
        
        if (closeCart) {
            closeCart.addEventListener("click", (e) => {
                e.preventDefault();
                this.closeCart();
            });
        }

        // Botão "Finalizar Compra" dentro do carrinho
        const checkoutBtn = document.querySelector(".cart-footer .checkout-btn");
        if (checkoutBtn) {
            checkoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.openCheckoutModal();
            });
        }
    },

    _setupCheckoutListeners() {
        const closeCheckoutModal = document.getElementById("closeCheckoutModal");
        const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");

        if (closeCheckoutModal) {
            closeCheckoutModal.addEventListener("click", (e) => {
                e.preventDefault();
                this.closeCheckoutModal();
            });
        }
        
        if (checkoutModalOverlay) {
            checkoutModalOverlay.addEventListener("click", (e) => {
                e.preventDefault();
                this.closeCheckoutModal();
            });
        }
    },

   // ============================================
// PROCESSAMENTO DO PEDIDO - VERSÃO CORRIGIDA PARA MOBILE
// ============================================
_handleCheckoutSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    // Prevenir múltiplos envios
    if (this._submitting) {
        console.log('⏳ Pedido já está sendo processado...');
        return;
    }

    this._submitting = true;
    
    // Usar getElementById em vez de acessar direto do form
    const name = document.getElementById("customerName")?.value.trim() || '';
    const phone = document.getElementById("customerPhone")?.value.replace(/\D/g, '') || '';
    const deliveryOption = document.getElementById("deliveryOption")?.value;
    const paymentMethod = document.getElementById("paymentMethod")?.value;

    console.log('🔍 Valores obtidos:', { name, phone, deliveryOption, paymentMethod });

    if (!deliveryOption || !paymentMethod) {
        console.error('❌ Opção de entrega ou pagamento não encontrada no DOM.');
        window.showNotification("Erro: Opções de entrega/pagamento não encontradas. Recarregue a página.", 5000, 'error');
        this._submitting = false;
        return;
    }
    
    const observation = document.getElementById("customerObservation")?.value.trim() || '';
    
    // Validações básicas
    if (!name) {
        window.showNotification("Por favor, informe seu nome.", 3000, 'error');
        this._submitting = false;
        return;
    }
    
    if (phone.length < 10) {
        window.showNotification("Por favor, insira um telefone válido com DDD.", 3000, 'error');
        this._submitting = false;
        return;
    }

    // Se for entrega, valida endereço
    let street = '', number = '', neighborhood = '', city = '', cep = '', complement = '';
    if (deliveryOption === 'entrega') {
        street = document.getElementById("customerStreet")?.value || '';
        number = document.getElementById("customerNumber")?.value || '';
        neighborhood = document.getElementById("customerNeighborhood")?.value || '';
        city = document.getElementById("customerCity")?.value || '';
        cep = document.getElementById("customerCep")?.value || '';
        complement = document.getElementById("customerComplement")?.value || '';
        
        if (!cep || !street || !number || !neighborhood || !city) {
            window.showNotification("Por favor, preencha todos os campos de endereço para entrega.", 3000, 'error');
            this._submitting = false;
            return;
        }
        
        // Salva CEP para pré-preenchimento futuro
        localStorage.setItem('lastCustomerCep', cep);
    }

    // Salva telefone para pré-preenchimento futuro
    localStorage.setItem('lastCustomerPhone', this._formatPhoneForDisplay(phone));

    // Mostra loading
    const submitBtn = document.querySelector('.checkout-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '🔄 Preparando pedido...';
    submitBtn.disabled = true;

    console.log('📤 Processando pedido...');
    
    // CORREÇÃO: Remove o setTimeout e processa diretamente
this._processOrder(name, phone, deliveryOption, paymentMethod, observation, {
    street, number, neighborhood, city, cep, complement
}).then(() => {
        // Limpa o carrinho APÓS confirmar que o WhatsApp foi aberto
        this.cartItems = [];
        this.deliveryFee = 0;
        this.saveCartToStorage();
        this.updateCartUI();
        
        // Fecha o modal com delay
        setTimeout(() => {
            this.closeCheckoutModal();
        }, 1000);
        
        // Restaura botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        this._submitting = false;
        
    }).catch((error) => {
        console.error('❌ Erro ao processar pedido:', error);
        window.showNotification(" Erro ao processar pedido. Tente novamente.", 5000, 'error');
        
        // Restaura botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        this._submitting = false;
    });
},

    _formatPhoneForDisplay(phone) {
        // Formata (XX) XXXXX-XXXX
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0,2)}) ${cleanPhone.substring(2,7)}-${cleanPhone.substring(7)}`;
        }
        return phone;
    },

    async _processOrder(name, phone, deliveryOption, paymentMethod, observation, addressData) {
    console.log(`📝 Processando pedido para ${name} (${phone})...`);

    // Prepara dados do endereço
    const { street, number, neighborhood, city, cep, complement } = addressData;
    
    let fullAddress = 'Retirada na Loja';
    
    if (deliveryOption === 'entrega' && street && number && neighborhood && city && cep) {
        fullAddress = `${street}, ${number}, ${neighborhood}, ${city} - ${cep}`;
        if (complement && complement.trim() !== '') {
            fullAddress += ` (${complement})`;
        }
    }

    // CORREÇÃO: Usar this.cartItems diretamente, não parâmetro
    const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + this.deliveryFee;

    // PASSO 1: Criar objeto do cliente
    const clientData = {
        phone: `55${phone}`,
        name: name,
        address: fullAddress,
        cep: cep,
        street: street || '',
        number: number || '',
        address_number: number || '',
        neighborhood: neighborhood || '',
        city: city || '',
        city_state: city || '',
        complement: complement || '',
        observation: observation || '',
        deliveryOption: deliveryOption,
        paymentMethod: paymentMethod
    };

    console.log('👤 Dados do cliente para API:', clientData);

    // PASSO 2: Criar objeto do pedido
    const orderInfo = {
        total: total,
        subtotal: subtotal,
        deliveryFee: this.deliveryFee,
        paymentMethod: paymentMethod,
        deliveryOption: deliveryOption,
        items: this.cartItems.map(item => ({  // CORREÇÃO: Usar this.cartItems
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };

    // PASSO 3: Salvar no banco de dados via API
    console.log('📤 Enviando pedido para API...');
    
    let orderId = 'JD' + Date.now().toString().slice(-8);
    let orderDetailLink = `${window.location.origin}/order.html?orderId=${orderId}`;
    
    try {
        const apiResult = await apiClient.saveOrder({
            client: clientData,
            order: orderInfo,
            items: orderInfo.items
        });
        
        if (apiResult && apiResult.success) {
            console.log(`✅ Pedido salvo no banco: ${apiResult.orderId}`);
            orderId = apiResult.orderId;
            orderDetailLink = apiResult.orderDetailLink || orderDetailLink;
        } else {
            throw new Error('API não retornou sucesso');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar pedido no banco:', error);
        // Continua com ID local
    }

    // PASSO 4: Gerar mensagem do WhatsApp
    const message = this._generateWhatsAppMessage(
        clientData, 
        orderInfo,
        orderId,
        orderDetailLink
    );
    
    // PASSO 5: Abrir WhatsApp
    return this._openWhatsAppMobile(message);
},
    _generateWhatsAppMessage(clientData, orderInfo, orderId, orderDetailLink) {
        const items = orderInfo.items || [];
        const deliveryOption = clientData.deliveryOption || 'entrega';
        const paymentMethod = clientData.paymentMethod || 'pix';
        const name = clientData.name || '';
        const phone = clientData.phone || '';
        const address = clientData.address || '';
        const observation = clientData.observation || '';
            
        let message = `*JARDIM PADARIA ARTESANAL*\n\n`;
        message += `Olá! Meu nome é *${name}*\n\n`;
        message += `*QUERO FAZER UM PEDIDO!*\n\n`;
        
        message += `> RESUMO RÁPIDO\n`;
        items.forEach(item => {
            message += `• ${item.quantity}x ${item.name}\n`;
        });
        
        message += `\n*Modalidade:* ${deliveryOption === 'retirada' ? '_Retirada na Loja_' : '_Entrega_'}\n`;
        message += `*Pagamento:* ${paymentMethod === 'pix' ? '_Pix_' : '_Cartão_'}\n\n`;
        
        if (observation) {
            message += `> OBSERVAÇÃO\n${observation}\n\n`;
        }
        
        message += `> MEUS DADOS\n`;
        message += `*Nome:* ${name}\n`;
        message += `*Telefone:* ${phone.replace('55', '')}\n`;
        
        if (deliveryOption === 'entrega') {
            message += `*Endereço:* ${address}\n`;
        }
        
        message += `\n> DETALHES DO PEDIDO\n`;
        message += `*ID do Pedido:* ${orderId}\n`;
        message += `*Link:* ${orderDetailLink}\n\n`;
        
        message += `_Clique no link acima para ver todos os detalhes do pedido!_\n\n`;
        
        message += `*Por favor, confirme meu pedido!*`;

        return message;
    },

    // CORREÇÃO CRÍTICA: Método para abrir WhatsApp no mobile
    // CORREÇÃO CRÍTICA: Método simplificado para abrir WhatsApp
_openWhatsAppMobile(message) {
    return new Promise((resolve, reject) => {
        try {
            // Garante que a mensagem é uma string
            if (typeof message !== 'string') {
                message = `*JARDIM PADARIA ARTESANAL*\n\nOlá! Acabei de fazer um pedido no site.\n\nPor favor, entre em contato comigo para finalizar o pedido!\n\nObrigado!`;
            }
            
            const encodedMessage = encodeURIComponent(message);
            
            // NÚMERO CORRETO DO WHATSAPP - VERIFIQUE SE É 5583987194754
            const whatsappUrl = `https://wa.me/5583987194754?text=${encodedMessage}`;
            
            console.log('📱 Abrindo WhatsApp...');
            
            // ABORDAGEM SIMPLIFICADA: Use window.location para mobile
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Para mobile, use window.location que funciona melhor
                console.log('📱 Redirecionando para WhatsApp (mobile)...');
                window.location.href = whatsappUrl;
            } else {
                // Para desktop, nova aba normal
                console.log('💻 Abrindo nova aba (desktop)...');
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }
            
            // Dá um pequeno tempo para o redirecionamento acontecer
            setTimeout(() => {
                resolve();
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro ao abrir WhatsApp:', error);
            reject(error);
        }
    });
},

    // ============================================
    // RESTANTE DO CÓDIGO (mantido igual)
    // ============================================

    _setupDeliveryInfoModalListeners() {
        const closeDeliveryInfoModal = document.getElementById("closeDeliveryInfoModal");
        const closeDeliveryInfoBtn = document.getElementById("closeDeliveryInfoBtn");
        const deliveryInfoModalOverlay = document.getElementById("deliveryInfoModalOverlay");
        
        console.log('🔍 Configurando listeners do modal de informações do frete...');
        
        if (closeDeliveryInfoModal) {
            closeDeliveryInfoModal.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._closeDeliveryInfoModal();
            });
            console.log('✅ Listener adicionado ao closeDeliveryInfoModal');
        }
        
        if (closeDeliveryInfoBtn) {
            closeDeliveryInfoBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._closeDeliveryInfoModal();
            });
            console.log('✅ Listener adicionado ao closeDeliveryInfoBtn');
        }
        
        if (deliveryInfoModalOverlay) {
            deliveryInfoModalOverlay.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._closeDeliveryInfoModal();
            });
            console.log('✅ Listener adicionado ao deliveryInfoModalOverlay');
        }
    },

    _openDeliveryInfoModal() {
        console.log('🔄 Abrindo modal de informações do frete...');
        const deliveryInfoModal = document.getElementById("deliveryInfoModal");
        
        console.log('Modal de informações encontrado:', deliveryInfoModal);
        
        if (deliveryInfoModal) {
            deliveryInfoModal.style.display = "flex";
            deliveryInfoModal.style.zIndex = "2000";
            console.log('✅ Modal de informações do frete aberto (sobreposto)');
        } else {
            console.error('❌ Modal de informações do frete não encontrado!');
        }
    },

    _closeDeliveryInfoModal() {
        console.log('🔄 Fechando modal de informações do frete...');
        const deliveryInfoModal = document.getElementById("deliveryInfoModal");
        
        if (deliveryInfoModal) {
            deliveryInfoModal.style.display = "none";
            deliveryInfoModal.style.zIndex = "";
            console.log('✅ Modal de informações do frete fechado');
        }
    },

    _setupFormListeners() {
        const checkoutForm = document.getElementById("checkoutForm");
        const customerPhoneInput = document.getElementById("customerPhone");
        const customerCepInput = document.getElementById("customerCep");
        const deliveryOptionSelect = document.getElementById("deliveryOption");

        if (checkoutForm) {
            checkoutForm.removeEventListener("submit", this._handleSubmitBound);
            this._handleSubmitBound = this._handleCheckoutSubmit.bind(this);
            checkoutForm.addEventListener("submit", this._handleSubmitBound);
        }

        if (customerPhoneInput) {
            this._applyPhoneMask(customerPhoneInput);
        }

        if (customerCepInput) {
            this._applyCepMask(customerCepInput);
            
            customerCepInput.addEventListener('blur', async (e) => {
                await this._fetchAddressByCep(e.target.value);
            });
            
            customerCepInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    await this._fetchAddressByCep(e.target.value);
                }
            });
        }

        if (deliveryOptionSelect) {
            this._setupDeliveryOptionToggle();
            deliveryOptionSelect.addEventListener('change', () => {
                this._updatePaymentMethods();
            });
        }
        
        const deliveryInfoBtn = document.getElementById('deliveryInfoBtn');
        if (deliveryInfoBtn) {
            deliveryInfoBtn.removeEventListener('click', this._openDeliveryInfoModal);
            deliveryInfoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Clicou em Informações do Frete');
                this._openDeliveryInfoModal();
            });
            console.log('✅ Listener adicionado ao botão de informações do frete');
        }
        
        this._setupDeliveryInfoModalListeners();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const deliveryInfoModal = document.getElementById("deliveryInfoModal");
                if (deliveryInfoModal && deliveryInfoModal.style.display === "flex") {
                    e.preventDefault();
                    e.stopPropagation();
                    this._closeDeliveryInfoModal();
                }
            }
        });
    },

    _applyPhoneMask(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            let maskedValue = '';

            if (value.length > 0) {
                maskedValue += '(' + value.substring(0, 2);
            }
            if (value.length > 2) {
                maskedValue += ') ' + value.substring(2, 7);
            }
            if (value.length > 7) {
                maskedValue += '-' + value.substring(7, 11);
            }

            e.target.value = maskedValue;
        });
    },

    _applyCepMask(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
            }
            e.target.value = value;
        });
    },

    _setupDeliveryOptionToggle() {
        const deliveryOptionSelect = document.getElementById("deliveryOption");
        const addressFieldsDiv = document.getElementById("addressFields");
        
        if (!deliveryOptionSelect || !addressFieldsDiv) return;

        const toggleAddressFields = () => {
            if (deliveryOptionSelect.value === 'retirada') {
                addressFieldsDiv.style.display = 'none';
                addressFieldsDiv.querySelectorAll('input').forEach(input => {
                    input.removeAttribute('required');
                });
                this.deliveryFee = 0;
                this.updateCheckoutSummary();
            } else {
                addressFieldsDiv.style.display = 'block';
                const requiredFields = ['customerCep', 'customerStreet', 'customerNumber', 'customerNeighborhood', 'customerCity'];
                requiredFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) field.setAttribute('required', '');
                });
            }
            
            this._updatePaymentMethods();
        };

        deliveryOptionSelect.addEventListener('change', toggleAddressFields);
        toggleAddressFields();
        
        this._updatePaymentMethods();
    },

    async _fetchAddressByCep(cep) {
        const cleanCep = cep.replace(/\D/g, '');
        
        if (cleanCep.length !== 8) {
            if (cleanCep.length > 0) {
                window.showNotification(' CEP inválido. Deve ter 8 dígitos.', 3000, 'error');
            }
            return null;
        }

        const cepInput = document.getElementById('customerCep');
        const originalValue = cepInput.value;
        cepInput.value = 'Buscando...';
        cepInput.disabled = true;

        try {
            console.log(`📍 Buscando endereço para CEP: ${cleanCep}`);
            
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            
            if (!response.ok) {
                throw new Error('Erro na requisição');
            }
            
            const data = await response.json();
            
            if (data.erro) {
                window.showNotification(' CEP não encontrado. Preencha manualmente.', 3000, 'error');
                this._clearAddressFields();
                return null;
            }
            
            this._fillAddressFields(data);
            
            window.showNotification('Endereço encontrado! Agora insira o número.', 3000, 'success');
            
            setTimeout(() => {
                const numberField = document.getElementById('customerNumber');
                if (numberField) {
                    numberField.focus();
                }
            }, 500);
            
            return data;
            
        } catch (error) {
            console.error('❌ Erro ao buscar CEP:', error);
            window.showNotification(' Erro ao buscar CEP. Preencha manualmente.', 3000, 'error');
            this._clearAddressFields();
            return null;
        } finally {
            cepInput.value = originalValue;
            cepInput.disabled = false;
        }
    },

    _fillAddressFields(addressData) {
        const fields = {
            'customerStreet': addressData.logradouro || '',
            'customerNeighborhood': addressData.bairro || '',
            'customerCity': `${addressData.localidade || ''} - ${addressData.uf || ''}`,
            'customerComplement': addressData.complemento || ''
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                
                if (value && fieldId !== 'customerComplement') {
                    field.style.backgroundColor = '#f0f9f0';
                    field.style.borderColor = '#4CAF50';
                    field.title = 'Preenchido automaticamente. Pode editar se necessário.';
                    
                    const originalValue = field.value;
                    field.addEventListener('input', function onEdit() {
                        if (this.value !== originalValue) {
                            this.style.backgroundColor = '';
                            this.style.borderColor = '';
                            this.title = '';
                            this.removeEventListener('input', onEdit);
                        }
                    });
                }
            }
        });

        setTimeout(() => {
            const numberField = document.getElementById('customerNumber');
            if (numberField) {
                numberField.focus();
                numberField.select();
            }
        }, 100);
    },

    _clearAddressFields() {
        const fieldsToClear = ['customerStreet', 'customerNeighborhood', 'customerCity', 'customerComplement'];
        
        fieldsToClear.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                field.style.backgroundColor = '';
                field.style.borderColor = '';
                field.title = '';
                field.disabled = false;
            }
        });
    },

    addToCart(product) {
        const currentDay = window.getCurrentDayName ? window.getCurrentDayName() : 'quarta';

        if (!product.available_days || !product.available_days.includes(currentDay)) {
            const diaDisponivel = product.available_days && product.available_days.length > 0 
                ? product.available_days.join(' e ')
                : 'dias não especificados';
            const message = ` ${product.name} só está disponível na(s) ${diaDisponivel}.`;
            window.showNotification(message, 3000, 'error');
            return;
        }

        const existingItem = this.cartItems.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({ 
                ...product, 
                quantity: 1,
                image: product.image || "img/logos/Logo.png"
            });
        }

        this.saveCartToStorage();
        this.updateCartUI();
        
        window.showNotification(` ${product.name} adicionado ao carrinho!`, 2000, 'success');
    },

    removeFromCart(productId) {
        const itemIndex = this.cartItems.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            const item = this.cartItems[itemIndex];
            item.quantity -= 1;

            if (item.quantity <= 0) {
                this.cartItems.splice(itemIndex, 1);
            }

            this.saveCartToStorage();
            this.updateCartUI();
        }
    },

    deleteItem(productId) {
        this.cartItems = this.cartItems.filter(item => item.id !== productId);
        this.saveCartToStorage();
        this.updateCartUI();
    },

    updateCartUI() {
        const cartCount = document.getElementById("cartCount");
        const cartItemsContainer = document.getElementById("cartItems");
        const cartFooter = document.getElementById("cartFooter");
        const cartTotal = document.getElementById("cartTotal");

        if (cartCount) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? "flex" : "none";
        }

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = "";

            if (this.cartItems.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
                if (cartFooter) cartFooter.style.display = "none";
                return;
            }

            this.cartItems.forEach((item) => {
                const cartItem = document.createElement("div");
                cartItem.className = "cart-item";

                const imageUrl = item.image || "img/logos/Logo.png";

                cartItem.innerHTML = `
                    <img src="${imageUrl}" class="cart-item-img" alt="${item.name}">

                    <div class="cart-item-info">
                        <p class="cart-item-name">${item.name}</p>
                        <p class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>

                        <div class="cart-qty-controls">
                            <button class="qty-btn decrease" data-id="${item.id}">-</button>
                            <span class="qty-number">${item.quantity}</span>
                            <button class="qty-btn increase" data-id="${item.id}">+</button>
                        </div>
                    </div>

                    <button class="delete-item-btn" data-id="${item.id}">🗑</button>
                `;

                cartItem.querySelector(".increase").addEventListener("click", () => {
                    this.addToCart(item);
                });
                
                cartItem.querySelector(".decrease").addEventListener("click", () => {
                    this.removeFromCart(item.id);
                });
                
                cartItem.querySelector(".delete-item-btn").addEventListener("click", () => {
                    this.deleteItem(item.id);
                });

                cartItemsContainer.appendChild(cartItem);
            });

            if (cartTotal && cartFooter) {
                const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const total = subtotal + this.deliveryFee;
                cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
                cartFooter.style.display = "flex";
            }
        }
    },

    openCart() {
        const cartSidebar = document.getElementById("cartSidebar");
        if (cartSidebar) {
            cartSidebar.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    },

    closeCart() {
        const cartSidebar = document.getElementById("cartSidebar");
        if (cartSidebar) {
            cartSidebar.style.display = "none";
            document.body.style.overflow = "auto";
        }
    },

    openCheckoutModal() {
        if (this.cartItems.length === 0) {
            window.showNotification("Seu carrinho está vazio. Adicione produtos antes de finalizar.", 3000, 'error');
            return;
        }

        this.closeCart();
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) {
            this.renderCheckoutSummary();
            checkoutModal.style.display = "flex";
            document.body.style.overflow = "hidden";
            
            const form = document.getElementById("checkoutForm");
            if (form) {
                form.reset();
                this._prefillCustomerData();
            }
            
            this.deliveryFee = 0;
            this.updateCheckoutSummary();
        }
    },

    closeCheckoutModal() {
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) {
            checkoutModal.style.display = "none";
            document.body.style.overflow = "auto";
            this._submitting = false;
            
            this._clearAddressStyles();
        }
    },

    _clearAddressStyles() {
        const addressFields = ['customerStreet', 'customerNeighborhood', 'customerCity', 'customerComplement'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.backgroundColor = '';
                field.style.borderColor = '';
                field.title = '';
            }
        });
    },

    renderCheckoutSummary() {
        const summaryList = document.getElementById("checkoutSummaryList");
        const checkoutTotal = document.getElementById("checkoutTotal");
        
        if (!summaryList || !checkoutTotal) return;

        summaryList.innerHTML = "";
        
        this.cartItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            `;
            summaryList.appendChild(li);
        });

        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const subtotalLi = document.createElement("li");
        subtotalLi.innerHTML = `
            <span><strong>Subtotal</strong></span>
            <span><strong>R$ ${subtotal.toFixed(2).replace('.', ',')}</strong></span>
        `;
        subtotalLi.style.borderTop = '1px dashed #ddd';
        subtotalLi.style.paddingTop = '0.5rem';
        subtotalLi.style.marginTop = '0.5rem';
        summaryList.appendChild(subtotalLi);

        if (this.deliveryFee > 0) {
            const feeLi = document.createElement("li");
            feeLi.innerHTML = `
                <span>🚗 Frete</span>
                <span>R$ ${this.deliveryFee.toFixed(2).replace('.', ',')}</span>
            `;
            feeLi.style.fontWeight = '600';
            feeLi.style.color = '#1C3D2D';
            summaryList.appendChild(feeLi);
        }

        const total = subtotal + this.deliveryFee;
        checkoutTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    updateCheckoutSummary() {
        this.renderCheckoutSummary();
    },

    _prefillCustomerData() {
        const savedPhone = localStorage.getItem('lastCustomerPhone');
        if (savedPhone) {
            const phoneInput = document.getElementById('customerPhone');
            if (phoneInput) {
                phoneInput.value = savedPhone;
            }
        }
        
        const savedCep = localStorage.getItem('lastCustomerCep');
        if (savedCep) {
            const cepInput = document.getElementById('customerCep');
            if (cepInput) {
                cepInput.value = savedCep;
                setTimeout(() => {
                    this._fetchAddressByCep(savedCep);
                }, 1000);
            }
        }
    },

    _updatePaymentMethods() {
        const deliveryOptionSelect = document.getElementById("deliveryOption");
        const paymentMethodSelect = document.getElementById("paymentMethod");
        
        if (!deliveryOptionSelect || !paymentMethodSelect) return;
        
        const currentValue = paymentMethodSelect.value;
        
        paymentMethodSelect.innerHTML = '';
        
        if (deliveryOptionSelect.value === 'entrega') {
            paymentMethodSelect.innerHTML = `
                <option value="pix">Pix</option>
                <option value="cartao">Cartão (Crédito/Débito)</option>
            `;
        } else if (deliveryOptionSelect.value === 'retirada') {
            paymentMethodSelect.innerHTML = `
                <option value="pix">Pix</option>
                <option value="cartao">Cartão (Crédito/Débito)</option>
                <option value="dinheiro">Dinheiro</option>
            `;
        }
        
        const availableValues = Array.from(paymentMethodSelect.options).map(opt => opt.value);
        if (availableValues.includes(currentValue)) {
            paymentMethodSelect.value = currentValue;
        }
    },

    saveCartToStorage() {
        localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    },

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('cartItems');
            if (savedCart) {
                this.cartItems = JSON.parse(savedCart);
                console.log(`📦 Carrinho carregado: ${this.cartItems.length} itens`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar carrinho:', error);
            this.cartItems = [];
        }
    },

    clearCart() {
        this.cartItems = [];
        this.deliveryFee = 0;
        this.saveCartToStorage();
        this.updateCartUI();
    },

    getCartTotal() {
        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return subtotal + this.deliveryFee;
    }
};

export { Cart };
export default Cart;