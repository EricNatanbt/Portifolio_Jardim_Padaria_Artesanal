// ============================================
// COMPONENTE DO CARRINHO - VERSÃO SEGURA COM NETLIFY FUNCTIONS
// ============================================
import apiClient from './api-client.js'; 

const Cart = {
    cartItems: [],
    deliveryFee: 0,
    _initialized: false,
    _submitting: false,
    _listenersSetup: false,
    _currentUserId: null,

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

    _setupFormListeners() {
        const checkoutForm = document.getElementById("checkoutForm");
        const customerPhoneInput = document.getElementById("customerPhone");
        const customerCepInput = document.getElementById("customerCep");
        const deliveryOptionSelect = document.getElementById("deliveryOption");

        if (checkoutForm) {
            // Remove qualquer listener antigo
            checkoutForm.removeEventListener("submit", this._handleSubmitBound);
            
            // Cria novo handler bindado
            this._handleSubmitBound = this._handleCheckoutSubmit.bind(this);
            checkoutForm.addEventListener("submit", this._handleSubmitBound);
        }

        // Máscara de telefone
        if (customerPhoneInput) {
            this._applyPhoneMask(customerPhoneInput);
        }

        // Máscara de CEP
        if (customerCepInput) {
            this._applyCepMask(customerCepInput);
            
            // Auto-preenchimento de endereço ao sair do campo CEP
            customerCepInput.addEventListener('blur', async (e) => {
                await this._fetchAddressByCep(e.target.value);
            });
            
            // Também busca ao pressionar Enter
            customerCepInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    await this._fetchAddressByCep(e.target.value);
                }
            });
        }

        // Toggle campos de endereço e formas de pagamento
        if (deliveryOptionSelect) {
            this._setupDeliveryOptionToggle();
            this._setupPaymentMethodToggle();
        }
        
        const deliveryInfoToggle = document.getElementById('deliveryInfoToggle');
        if (deliveryInfoToggle) {
            deliveryInfoToggle.addEventListener('click', () => {
                const content = document.getElementById('deliveryInfoContent');
                const icon = document.getElementById('toggleIcon');
                
                content.classList.toggle('expanded');
                deliveryInfoToggle.classList.toggle('active');
            });
        }
    },

    // ============================================
    // FUNÇÕES AUXILIARES DE FORMULÁRIO
    // ============================================
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
                // Remove required dos campos de endereço
                addressFieldsDiv.querySelectorAll('input').forEach(input => {
                    input.removeAttribute('required');
                });
                // Zera o frete
                this.deliveryFee = 0;
                this.updateCheckoutSummary();
            } else {
                addressFieldsDiv.style.display = 'block';
                // Adiciona required aos campos
                const requiredFields = ['customerCep', 'customerStreet', 'customerNumber', 'customerNeighborhood', 'customerCity'];
                requiredFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) field.setAttribute('required', '');
                });
            }
            // Chama o toggle de pagamento para atualizar as opções
            this._togglePaymentMethods(deliveryOptionSelect.value);
        };

        deliveryOptionSelect.addEventListener('change', toggleAddressFields);
        toggleAddressFields(); // Executa na inicialização
    },

    _setupPaymentMethodToggle() {
        const deliveryOptionSelect = document.getElementById("deliveryOption");
        if (deliveryOptionSelect) {
            this._togglePaymentMethods(deliveryOptionSelect.value);
        }
    },

    _togglePaymentMethods(deliveryOption) {
        const paymentMethodSelect = document.getElementById("paymentMethod");
        if (!paymentMethodSelect) return;

        // Opções disponíveis
        const options = paymentMethodSelect.options;
        const dinheiroOption = Array.from(options).find(opt => opt.value === 'dinheiro');
        const pixOption = Array.from(options).find(opt => opt.value === 'pix');
        const cartaoOption = Array.from(options).find(opt => opt.value === 'cartao');

        if (deliveryOption === 'retirada') {
            // Retirada na loja: Aceita Pix, Cartão e Dinheiro
            if (dinheiroOption) dinheiroOption.style.display = 'block';
            if (pixOption) pixOption.style.display = 'block';
            if (cartaoOption) cartaoOption.style.display = 'block';
        } else {
            // Entrega: Aceita apenas Pix e Cartão
            if (dinheiroOption) dinheiroOption.style.display = 'none';
            if (pixOption) pixOption.style.display = 'block';
            if (cartaoOption) cartaoOption.style.display = 'block';
            
            // Se a opção atual for dinheiro, muda para Pix
            if (paymentMethodSelect.value === 'dinheiro') {
                paymentMethodSelect.value = 'pix';
            }
        }
    },

    // ============================================
    // BUSCA DE ENDEREÇO POR CEP (VIA CEP API)
    // ============================================
    async _fetchAddressByCep(cep) {
        // Remove caracteres não numéricos
        const cleanCep = cep.replace(/\D/g, '');
        
        // Valida se tem 8 dígitos
        if (cleanCep.length !== 8) {
            if (cleanCep.length > 0) {
                window.showNotification(' CEP inválido. Deve ter 8 dígitos.', 3000, 'error');
            }
            return null;
        }

        // Mostra loading
        const cepInput = document.getElementById('customerCep');
        const originalValue = cepInput.value;
        cepInput.value = 'Buscando...';
        cepInput.disabled = true;

        try {
            console.log(`📍 Buscando endereço para CEP: ${cleanCep}`);
            
            // Faz requisição para a API ViaCEP
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            
            if (!response.ok) {
                throw new Error('Erro na requisição');
            }
            
            const data = await response.json();
            
            // Verifica se o CEP foi encontrado
            if (data.erro) {
                window.showNotification(' CEP não encontrado. Preencha manualmente.', 3000, 'error');
                this._clearAddressFields();
                return null;
            }
            
            // Preenche os campos de endereço
            this._fillAddressFields(data);
            
            window.showNotification('Endereço encontrado! Agora insira o número.', 3000, 'success');
            
            // Foca no campo de número
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
            // Restaura o campo CEP
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

        // Preenche cada campo
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                
                // Desabilita campos que foram preenchidos automaticamente
                if (value && fieldId !== 'customerComplement') {
                    field.style.backgroundColor = '#f0f9f0';
                    field.style.borderColor = '#4CAF50';
                    field.title = 'Preenchido automaticamente. Pode editar se necessário.';
                    
                    // Adiciona evento para remover o estilo quando o usuário editar
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

        // Foca no campo de número
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

    // ============================================
    // CARRINHO - ADICIONAR/REMOVER ITENS
    // ============================================
    addToCart(product) {
        const currentDay = window.getCurrentDayName ? window.getCurrentDayName() : 'quarta';

        // Verificar disponibilidade
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
        
        // Feedback visual
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

    // ============================================
    // ATUALIZAR INTERFACE DO CARRINHO
    // ============================================
    updateCartUI() {
        const cartCount = document.getElementById("cartCount");
        const cartItemsContainer = document.getElementById("cartItems");
        const cartFooter = document.getElementById("cartFooter");
        const cartTotal = document.getElementById("cartTotal");

        // Atualizar contador
        if (cartCount) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? "flex" : "none";
        }

        // Renderizar itens do carrinho
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

                // Event listeners para os botões
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

            // Atualizar total
            if (cartTotal && cartFooter) {
                const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const total = subtotal + this.deliveryFee;
                cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
                cartFooter.style.display = "flex";
            }
        }
    },

    // ============================================
    // ABRIR/FECHAR CARRINHO E MODAIS
    // ============================================
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
            
            // Reset do formulário (mas não do telefone se já existe em localStorage)
            const form = document.getElementById("checkoutForm");
            if (form) {
                form.reset();
                // Tenta preencher com dados salvos do cliente
                this._prefillCustomerData();
            }
            
            // Reset do frete
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
            
            // Limpa estilos dos campos de endereço
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

    // ============================================
    // RESUMO DO CHECKOUT
    // ============================================
    renderCheckoutSummary() {
        const summaryList = document.getElementById("checkoutSummaryList");
        const checkoutTotal = document.getElementById("checkoutTotal");
        
        if (!summaryList || !checkoutTotal) return;

        summaryList.innerHTML = "";
        
        // Adiciona itens
        this.cartItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            `;
            summaryList.appendChild(li);
        });

        // Adiciona subtotal
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

        // Adiciona frete se houver
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

        // Total final
        const total = subtotal + this.deliveryFee;
        checkoutTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    updateCheckoutSummary() {
        this.renderCheckoutSummary();
    },

    // ============================================
    // PRÉ-PREENCHER DADOS DO CLIENTE
    // ============================================
    _prefillCustomerData() {
        const savedPhone = localStorage.getItem('lastCustomerPhone');
        if (savedPhone) {
            const phoneInput = document.getElementById('customerPhone');
            if (phoneInput) {
                phoneInput.value = savedPhone;
            }
        }
        
        // Tenta preencher endereço salvo
        const savedCep = localStorage.getItem('lastCustomerCep');
        if (savedCep) {
            const cepInput = document.getElementById('customerCep');
            if (cepInput) {
                cepInput.value = savedCep;
                // Busca endereço automaticamente
                setTimeout(() => {
                    this._fetchAddressByCep(savedCep);
                }, 1000);
            }
        }
    },

    // ============================================
    // PROCESSAMENTO DO PEDIDO
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
        
        // Buscar elementos diretamente pelo ID
        const name = document.getElementById("customerName")?.value.trim() || '';
        const phone = document.getElementById("customerPhone")?.value.replace(/\D/g, '') || '';
        const deliveryOption = document.getElementById("deliveryOption")?.value || '';
        const paymentMethod = document.getElementById("paymentMethod")?.value || '';
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

        console.log('📤 Processando pedido via API segura...');
        
        // Processa o pedido com delay para evitar duplicação
        setTimeout(async () => {
            try {
                await this._processOrder(name, phone, deliveryOption, paymentMethod, observation, {
                    street, number, neighborhood, city, cep, complement
                });
                
                window.showNotification(" Pedido enviado! Abrindo WhatsApp...", 3000, 'success');
                
                // Limpa o carrinho
                this.cartItems = [];
                this.deliveryFee = 0;
                this.saveCartToStorage();
                this.updateCartUI();
                
                // Fecha o modal com delay
                setTimeout(() => {
                    this.closeCheckoutModal();
                }, 1000);
                
            } catch (error) {
                console.error('❌ Erro ao processar pedido:', error);
                window.showNotification(" Erro ao processar pedido. Tente novamente.", 5000, 'error');
            } finally {
                // Restaura botão
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                this._submitting = false;
            }
        }, 300);
    },

    _formatPhoneForDisplay(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0,2)}) ${cleanPhone.substring(2,7)}-${cleanPhone.substring(7)}`;
        }
        return phone;
    },

    async _processOrder(name, phone, deliveryOption, paymentMethod, observation, addressData = {}) {
        const orderId = 'JD' + Date.now().toString().slice(-8);
        console.log(`📝 Criando pedido ${orderId} para ${name} (${phone}) via API...`);

        // Prepara dados do endereço
        let fullAddress = 'Retirada na Loja';
        
        const { street, number, neighborhood, city, cep, complement } = addressData;
        
        if (deliveryOption === 'entrega' && street && number && neighborhood && city && cep) {
            fullAddress = `${street}, ${number}, ${neighborhood}, ${city} - ${cep}`;
            if (complement && complement.trim() !== '') {
                fullAddress += ` (${complement})`;
            }
        }

        // Calcula valores
        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + this.deliveryFee;

        // PASSO 1: Gerar ID local para usuário
        const userId = this._createLocalUserId(name, phone);
        this._currentUserId = userId;

        // PASSO 2: Criar objeto do cliente com campos normalizados
        const clientData = {
            // Campos principais
            phone: `55${phone}`,
            name: name,
            address: fullAddress,
            
            // Campos individuais de endereço
            cep: cep || '',
            street: street || '',
            number: number || '',
            neighborhood: neighborhood || '',
            city: city || '',
            complement: complement || '',
            
            // Campos adicionais
            observation: observation || '',
            delivery_option: deliveryOption, // Campo normalizado
            payment_method: paymentMethod,   // Campo normalizado
            
            // Campos de compatibilidade (para APIs antigas)
            deliveryOption: deliveryOption,
            paymentMethod: paymentMethod
        };

        console.log('👤 Dados do cliente para API:', clientData);

        // PASSO 3: Criar objeto do pedido com campos normalizados
        const orderInfo = {
            // Campos principais
            total: total,
            subtotal: subtotal, // Adicionado para consistência
            delivery_fee: this.deliveryFee, // Campo normalizado
            payment_method: paymentMethod,   // Campo normalizado
            delivery_option: deliveryOption, // Campo normalizado
            observation: observation || '',
            
            // Campos de compatibilidade
            deliveryFee: this.deliveryFee,
            paymentMethod: paymentMethod,
            deliveryOption: deliveryOption,
            
            // Itens do pedido
            items: this.cartItems.map(item => ({
                product_id: item.id,
                product_name: item.name, // Campo normalizado
                name: item.name,         // Campo de compatibilidade
                price: item.price,
                quantity: item.quantity
            }))
        };

        // PASSO 4: Salvar pedido via API segura
        let apiResult = null;
        let universalLink = null;
        
        try {
            apiResult = await apiClient.saveOrder({
                client: clientData,
                order: orderInfo,
                items: orderInfo.items
            });
            
            if (apiResult && apiResult.success) {
                console.log(`✅ Pedido salvo via API: ${apiResult.orderId}`);
                orderInfo.apiOrderId = apiResult.orderId;
                clientData.apiClientId = apiResult.clientId;
                
                // Gerar link universal com ID do banco
                universalLink = this._generateUniversalOrderLink(apiResult.orderId);
                console.log(`🔗 Link universal gerado: ${universalLink}`);
            } else {
                throw new Error('API não retornou sucesso');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar via API:', error);
            // Continua com salvamento local mesmo se a API falhar
        }

        // PASSO 5: Salvar localmente (backup) com dados normalizados
        const shortId = this._saveToLocalStorage({
            customer: clientData,
            order: {
                order_id: orderId, // Campo normalizado
                id: orderId,       // Campo de compatibilidade
                total: total,
                subtotal: subtotal,
                delivery_fee: this.deliveryFee,
                delivery_option: deliveryOption,
                payment_method: paymentMethod,
                observation: observation || '',
                created_at: new Date().toISOString(), // Campo normalizado
                timestamp: new Date().toLocaleString('pt-BR'), // Campo de compatibilidade
                userId: userId,
                
                // Campos de compatibilidade
                deliveryFee: this.deliveryFee,
                deliveryOption: deliveryOption,
                paymentMethod: paymentMethod
            },
            items: this.cartItems.map(item => ({
                product_id: item.id,
                product_name: item.name,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            }))
        });
        
        // PASSO 6: Gerar mensagem do WhatsApp
        const message = this._generateWhatsAppMessage({
            customer: clientData,
            order: {
                order_id: orderId,
                items: this.cartItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }
        }, shortId, universalLink);
        
        // PASSO 7: Abrir WhatsApp
        this._openWhatsApp(message);
    },

    // Gerar link universal com ID do banco
    _generateUniversalOrderLink(databaseOrderId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/order.html?orderId=${databaseOrderId}`;
    },

    _createLocalUserId(name, phone) {
        const localUserId = `local_${phone}_${Date.now().toString(36)}`;
        console.log(`👤 ID local gerado para usuário: ${localUserId}`);
        return localUserId;
    },

    // ============================================
    // FUNÇÕES DE PERSISTÊNCIA LOCAL
    // ============================================
    _saveToLocalStorage(orderData) {
        // Gera ID único
        const shortId = Date.now().toString(36).toUpperCase() + 
                       Math.random().toString(36).substr(2, 3).toUpperCase();
        
        const orderKey = `order_${shortId}`;
        localStorage.setItem(orderKey, JSON.stringify(orderData));
        
        // Define expiração (24 horas)
        const expirationKey = `exp_${shortId}`;
        localStorage.setItem(expirationKey, (Date.now() + 24 * 60 * 60 * 1000).toString());
        
        // Salva referência do usuário
        if (this._currentUserId) {
            localStorage.setItem(`user_${this._currentUserId}_last_order`, shortId);
        }
        
        console.log(`💾 Pedido salvo localmente: ${orderKey} para usuário ${this._currentUserId || 'desconhecido'}`);
        return shortId;
    },

    _generateWhatsAppMessage(orderData, shortId, universalLink = null) {
        const customer = orderData.customer || {};
        const order = orderData.order || {};
        const items = order.items || [];
        
        const baseUrl = window.location.origin;
        
        const deliveryOption = customer.delivery_option || customer.deliveryOption || 'entrega';
        const paymentMethod = customer.payment_method || customer.paymentMethod || 'pix';
        const name = customer.name || '';
        const phone = customer.phone || '';
        const address = customer.address || '';
        const observation = customer.observation || '';
        
        // Prioriza o link universal (com ID do banco)
        const orderLink = universalLink || `${baseUrl}/order.html?i=${shortId}`;
            
        let message = `*JARDIM PADARIA ARTESANAL*\n\n`;
        message += `Olá! Meu nome é *${name}*\n\n`;
        message += `*QUERO FAZER UM PEDIDO!*\n\n`;
        
        message += `> RESUMO RÁPIDO\n`;
        items.forEach(item => {
            message += `• ${item.quantity}x ${item.name}\n`;
        });
        
        message += `\n*Modalidade:* ${deliveryOption === 'retirada' ? '_Retirada na Loja_' : '_Entrega_'}\n`;
        
        let paymentText = '';
        if (paymentMethod === 'pix') {
            paymentText = '_Pix_';
        } else if (paymentMethod === 'cartao') {
            paymentText = '_Cartão (Crédito/Débito)_';
        } else if (paymentMethod === 'dinheiro') {
            paymentText = '_Dinheiro_';
        }
        message += `*Pagamento:* ${paymentText}\n\n`;
        
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
        message += "```" + `${orderLink}` + "```\n\n";
        
        message += `_Clique no link acima para ver todos os detalhes do pedido!_\n\n`;
        
        message += `*Por favor, confirme meu pedido!*`;

        return message;
    },

    _openWhatsApp(message) {
        if (typeof message !== 'string') {
            console.error('❌ Mensagem do WhatsApp não é uma string:', message);
            message = this._generateFallbackWhatsAppMessage();
        }
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/5583987194754?text=${encodedMessage}`;
        
        // Abre em nova aba
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    },

    _generateFallbackWhatsAppMessage() {
        return `*JARDIM PADARIA ARTESANAL*\n\nOlá! Acabei de fazer um pedido no site.\n\nPor favor, entre em contato comigo para finalizar o pedido!\n\nObrigado!`;
    },

    // ============================================
    // PERSISTÊNCIA DO CARRINHO
    // ============================================
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

    // ============================================
    // UTILITÁRIOS
    // ============================================
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

// ============================================
// EXPORTAÇÕES
// ============================================
export { Cart };
export default Cart;