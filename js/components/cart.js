// ============================================
// VARIÁVEIS DE CONFIGURAÇÃO
// ============================================

const PADARIA_ADDRESS = "Av. Joaquim Caroca, 266 - Universitário, Campina Grande - PB, 58429-120";
const PADARIA_WHATSAPP = "5583987194754";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Aplica a máscara de telefone (XX) XXXXX-XXXX ao campo de input.
 */
function applyPhoneMask(input) {
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
}

/**
 * Aplica a máscara de CEP (00000-000) ao campo de input.
 */
function applyCepMask(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        } else if (value.length > 8) {
            value = value.substring(0, 8);
        }
        e.target.value = value;
    });
}

/**
 * Busca o endereço completo a partir de um CEP usando a API ViaCEP.
 */
async function fetchAddressByCep(cep) {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
        return null;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (data.erro) {
            return null;
        }

        return data;
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        return null;
    }
}

/**
 * Preenche os campos de endereço no formulário de checkout.
 */
function fillAddressFields(addressData) {
    document.getElementById('customerStreet').value = addressData.logradouro || '';
    document.getElementById('customerNeighborhood').value = addressData.bairro || '';
    document.getElementById('customerCity').value = `${addressData.localidade} - ${addressData.uf}` || '';
    document.getElementById('customerComplement').value = addressData.complemento || '';

    document.getElementById('customerStreet').disabled = !!addressData.logradouro;
    document.getElementById('customerNeighborhood').disabled = !!addressData.bairro;
    document.getElementById('customerCity').disabled = !!addressData.localidade;

    document.getElementById('customerNumber').focus();
}

/**
 * Limpa e habilita todos os campos de endereço.
 */
function clearAndEnableAddressFields() {
    document.getElementById('customerStreet').value = '';
    document.getElementById('customerNeighborhood').value = '';
    document.getElementById('customerCity').value = '';
    document.getElementById('customerComplement').value = '';
    document.getElementById('customerNumber').value = '';

    document.getElementById('customerStreet').disabled = false;
    document.getElementById('customerNeighborhood').disabled = false;
    document.getElementById('customerCity').disabled = false;
}

// ============================================
// COMPONENTE DO CARRINHO - ATUALIZADO
// ============================================
const Cart = {
    cartItems: [],
    deliveryFee: 0,
    isCalculatingFee: false,
    
    initialize() {
        this.setupEventListeners();
        this.loadCartFromStorage();
        this.updateCartUI();
    },

    setupEventListeners() {
        const cartBtn = document.getElementById("cartBtn");
        const cartOverlay = document.getElementById("cartOverlay");
        const closeCart = document.getElementById("closeCart");

        if (cartBtn) {
            cartBtn.addEventListener("click", () => this.openCart());
        }
        if (cartOverlay) {
            cartOverlay.addEventListener("click", () => this.closeCart());
        }
        if (closeCart) {
            closeCart.addEventListener("click", () => this.closeCart());
        }

        // Event listener para o botão "Finalizar Compra" no carrinho
        const checkoutBtn = document.querySelector(".cart-footer .checkout-btn");
        if (checkoutBtn) {
            checkoutBtn.addEventListener("click", () => this.openCheckoutModal());
        }

        // Event listeners para o modal de checkout
        const closeCheckoutModal = document.getElementById("closeCheckoutModal");
        const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");
        const checkoutForm = document.getElementById("checkoutForm");
        const customerCepInput = document.getElementById("customerCep");

        if (closeCheckoutModal) {
            closeCheckoutModal.addEventListener("click", () => this.closeCheckoutModal());
        }
        if (checkoutModalOverlay) {
            checkoutModalOverlay.addEventListener("click", () => this.closeCheckoutModal());
        }
        if (checkoutForm) {
            checkoutForm.addEventListener("submit", (e) => this.handleCheckoutSubmit(e));
        }

        // Lógica de CEP
        if (customerCepInput) {
            applyCepMask(customerCepInput);
            customerCepInput.addEventListener('blur', async (e) => {
                const cep = e.target.value;
                if (cep.replace(/\D/g, '').length === 8) {
                    window.showNotification("Buscando endereço...", 1500, 'info');
                    const address = await fetchAddressByCep(cep);
                    if (address) {
                        fillAddressFields(address);
                        window.showNotification("Endereço encontrado!", 1500, 'info');
                        // Calcula frete automaticamente após preencher endereço
                        setTimeout(() => this.calculateDeliveryFee(), 1000);
                    } else {
                        clearAndEnableAddressFields();
                        window.showNotification("CEP não encontrado. Preencha o endereço manualmente.", 3000, 'error');
                    }
                } else if (cep.replace(/\D/g, '').length > 0) {
                    clearAndEnableAddressFields();
                }
            });
        }

        // Lógica de Máscara de Telefone
        const customerPhoneInput = document.getElementById("customerPhone");
        if (customerPhoneInput) {
            applyPhoneMask(customerPhoneInput);
        }

        // Lógica de Retirada/Entrega
        const deliveryOptionSelect = document.getElementById("deliveryOption");
        const addressFieldsDiv = document.getElementById("addressFields");
        if (deliveryOptionSelect && addressFieldsDiv) {
            const toggleAddressFields = () => {
                if (deliveryOptionSelect.value === 'retirada') {
                    addressFieldsDiv.style.display = 'none';
                    addressFieldsDiv.querySelectorAll('input').forEach(input => input.removeAttribute('required'));
                    // Zera o frete para retirada
                    this.deliveryFee = 0;
                    this.updateCheckoutSummary();
                    this.showFeeCalculationStatus("Retirada na loja - Sem frete");
                } else {
                    addressFieldsDiv.style.display = 'block';
                    document.getElementById('customerCep').setAttribute('required', '');
                    document.getElementById('customerStreet').setAttribute('required', '');
                    document.getElementById('customerNumber').setAttribute('required', '');
                    document.getElementById('customerNeighborhood').setAttribute('required', '');
                    document.getElementById('customerCity').setAttribute('required', '');
                    // Recalcula frete se já tem endereço preenchido
                    const cep = document.getElementById("customerCep").value;
                    if (cep.replace(/\D/g, '').length === 8) {
                        this.calculateDeliveryFee();
                    }
                }
            };
            deliveryOptionSelect.addEventListener('change', toggleAddressFields);
            toggleAddressFields(); // Executa na inicialização
        }

        // Configurar cálculo automático de frete quando campos de endereço são preenchidos
        this.setupDeliveryCalculation();
    },

    // Configurar cálculo automático de frete
    setupDeliveryCalculation() {
        const addressFields = ['customerStreet', 'customerNumber', 'customerNeighborhood', 'customerCity'];
        addressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', async () => {
                    // Pequeno delay para garantir que todos os campos foram preenchidos
                    setTimeout(async () => {
                        await this.calculateDeliveryFee();
                    }, 500);
                });
            }
        });
    },

    // Calcular frete via Uber
    async calculateDeliveryFee() {
        const deliveryOptionSelect = document.getElementById("deliveryOption");
        
        // Se for retirada, frete é zero
        if (deliveryOptionSelect && deliveryOptionSelect.value === 'retirada') {
            this.deliveryFee = 0;
            this.updateCheckoutSummary();
            this.showFeeCalculationStatus("Retirada na loja - Sem frete");
            return;
        }

        const cep = document.getElementById("customerCep").value;
        const street = document.getElementById("customerStreet").value;
        const number = document.getElementById("customerNumber").value;
        const neighborhood = document.getElementById("customerNeighborhood").value;
        const city = document.getElementById("customerCity").value;

        // Valida se todos os campos de endereço estão preenchidos
        if (!cep || !street || !number || !neighborhood || !city) {
            this.showFeeCalculationStatus("Preencha todos os campos do endereço para calcular o frete");
            return;
        }

        this.isCalculatingFee = true;
        this.showFeeCalculationStatus("🔄 Calculando frete...", true);

        try {
            const deliveryAddress = `${street}, ${number}, ${neighborhood}, ${city}, ${cep}`;
            const deliveryInfo = await uberAPI.calculateDelivery(PADARIA_ADDRESS, deliveryAddress);
            
            this.deliveryFee = deliveryInfo.fare.value;
            this.updateCheckoutSummary();
            
            const minutes = Math.round(deliveryInfo.duration / 60);
            this.showFeeCalculationStatus(`✅ Frete: R$ ${this.deliveryFee.toFixed(2).replace('.', ',')} (${minutes} min)`);
            
        } catch (error) {
            console.error('Erro no cálculo do frete:', error);
            this.deliveryFee = 12.00; // Valor padrão
            this.updateCheckoutSummary();
            this.showFeeCalculationStatus("⚠️ Frete estimado: R$ 12,00");
        }

        this.isCalculatingFee = false;
    },

    // Mostrar status do cálculo do frete
    showFeeCalculationStatus(message, isCalculating = false) {
        let feeStatus = document.getElementById("deliveryFeeStatus");
        if (!feeStatus) {
            feeStatus = document.createElement('div');
            feeStatus.id = "deliveryFeeStatus";
            feeStatus.className = "delivery-fee-status";
            
            // Insere antes do resumo do pedido
            const orderSummary = document.querySelector('.order-summary');
            if (orderSummary) {
                orderSummary.parentNode.insertBefore(feeStatus, orderSummary);
            }
        }
        
        feeStatus.textContent = message;
        feeStatus.className = `delivery-fee-status ${isCalculating ? 'calculating' : ''}`;
    },

    // ============================================
    // ADICIONAR AO CARRINHO 
    // ============================================
    addToCart(product) {
        // 1. Obter o dia da semana atual
        const currentDay = window.getCurrentDayName();

        // 2. Verificar se o produto está disponível hoje
        if (!product.day.includes(currentDay)) {
            // Se o produto não estiver disponível, exibir uma notificação e interromper
            const message = `❌ ${product.name} só está disponível na(s) ${product.day.join(' e ')}.`;
            window.showNotification(message, 3000, 'error');
            return;
        }

        // 3. Adicionar ao carrinho se a validação passar
        const existingItem = this.cartItems.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({ ...product, quantity: 1 });
        }

        this.saveCartToStorage();
        this.updateCartUI();
        this.showCartNotification();
    },

    // ============================================
    // REMOVER UM ITEM DO CARRINHO
    // ============================================
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

    // ============================================
    // REMOVER DIRETO DO CARRINHO - botão de remover
    // ============================================
    deleteItem(productId) {
        this.cartItems = this.cartItems.filter(item => item.id !== productId);
        this.saveCartToStorage();
        this.updateCartUI();
    },

    // ============================================
    // ATUALIZAR A INTERFACE DO CARRINHO
    // ============================================
    updateCartUI() {
        const cartCount = document.getElementById("cartCount");
        const cartItemsContainer = document.getElementById("cartItems");
        const cartFooter = document.getElementById("cartFooter");
        const cartTotal = document.getElementById("cartTotal");

        // Elementos do modal de checkout
        this.checkoutSummaryList = document.getElementById("checkoutSummaryList");
        this.checkoutTotal = document.getElementById("checkoutTotal");

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

                cartItem.innerHTML = `
                    <img src="${item.image}" class="cart-item-img" alt="${item.name}">

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

                // Aumenta quantidade
                cartItem.querySelector(".increase").addEventListener("click", () => {
                    this.addToCart(item);
                });
                // Diminui quantidade
                cartItem.querySelector(".decrease").addEventListener("click", () => {
                    this.removeFromCart(item.id);
                });
                // Remover direto
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
    // ABRIR / FECHAR CARRINHO
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

    // ============================================
    // ANIMAÇÃO AO ADICIONAR
    // ============================================
    showCartNotification() {
        const cartBtn = document.getElementById("cartBtn");
        if (cartBtn) {
            cartBtn.style.transform = "scale(1.1)";
            setTimeout(() => {
                cartBtn.style.transform = "scale(1)";
            }, 200);
        }
    },

    // ============================================
    // LÓGICA DE CHECKOUT - ATUALIZADA COM LINK ENCURTADO
    // ============================================

    openCheckoutModal() {
        if (this.cartItems.length === 0) {
            window.showNotification("Seu carrinho está vazio. Adicione produtos antes de finalizar.", 3000, 'error');
            return;
        }

        this.closeCart(); // Fecha o carrinho antes de abrir o modal
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) {
            this.renderCheckoutSummary();
            checkoutModal.style.display = "flex";
            document.body.style.overflow = "hidden";
            
            // Reseta o frete quando abre o modal
            this.deliveryFee = 0;
            this.updateCheckoutSummary();
            this.showFeeCalculationStatus("Selecione 'Entrega' e preencha o endereço para calcular o frete");
        }
    },

    closeCheckoutModal() {
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) {
            checkoutModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    },

    // Renderizar resumo do checkout COM valores corretos
    renderCheckoutSummary() {
        if (!this.checkoutSummaryList || !this.checkoutTotal) return;

        this.checkoutSummaryList.innerHTML = "";
        
        // Itens do pedido
        this.cartItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            `;
            this.checkoutSummaryList.appendChild(li);
        });

        // Subtotal
        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const subtotalLi = document.createElement("li");
        subtotalLi.innerHTML = `
            <span><strong>Subtotal</strong></span>
            <span><strong>R$ ${subtotal.toFixed(2).replace('.', ',')}</strong></span>
        `;
        subtotalLi.style.borderTop = '1px dashed #ddd';
        subtotalLi.style.paddingTop = '0.5rem';
        subtotalLi.style.marginTop = '0.5rem';
        this.checkoutSummaryList.appendChild(subtotalLi);

        // Frete (se houver)
        if (this.deliveryFee > 0) {
            const feeLi = document.createElement("li");
            feeLi.innerHTML = `
                <span>🚗 Frete (Uber)</span>
                <span>R$ ${this.deliveryFee.toFixed(2).replace('.', ',')}</span>
            `;
            feeLi.style.fontWeight = '600';
            feeLi.style.color = '#1C3D2D';
            this.checkoutSummaryList.appendChild(feeLi);
        }

        // Total final
        const total = subtotal + this.deliveryFee;
        this.checkoutTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    // Atualizar resumo quando o frete mudar
    updateCheckoutSummary() {
        this.renderCheckoutSummary();
    },

    async handleCheckoutSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const name = form.customerName.value;
        const phone = form.customerPhone.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        const deliveryOption = form.deliveryOption.value;
        const paymentMethod = form.paymentMethod.value;
        const observation = form.customerObservation.value.trim(); // NOVO: Campo de observação
        
        let fullAddress = 'Retirada na Loja';

        if (phone.length < 10) {
            window.showNotification("Por favor, insira um telefone válido com DDD.", 3000, 'error');
            return;
        }

        if (deliveryOption === 'entrega') {
            const cep = form.customerCep.value;
            const street = form.customerStreet.value;
            const number = form.customerNumber.value;
            const neighborhood = form.customerNeighborhood.value;
            const complement = form.customerComplement.value;
            const city = form.customerCity.value;

            // Validação simples para entrega
            if (!cep || !street || !number || !neighborhood || !city) {
                window.showNotification("Por favor, preencha todos os campos de endereço para a entrega.", 3000, 'error');
                return;
            }

            // Constrói o endereço completo para a mensagem do WhatsApp
            fullAddress = `${street}, ${number}, ${neighborhood}, ${city} - ${cep}`;
            if (complement && complement.trim() !== '') {
                fullAddress += ` (${complement})`;
            }
        }

        // Mostra loading
        const submitBtn = form.querySelector('.checkout-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '🔄 Preparando pedido...';
        submitBtn.disabled = true;

        try {
            // Processa tudo automaticamente
            await this.processOrderAutomatically(name, phone, deliveryOption, paymentMethod, fullAddress, observation);
            
            window.showNotification("✅ Pedido enviado! Abrindo WhatsApp...", 3000, 'info');
            
            // Limpa o carrinho após o envio
            this.cartItems = [];
            this.deliveryFee = 0;
            this.saveCartToStorage();
            this.updateCartUI();
            this.closeCheckoutModal();
            
        } catch (error) {
            console.error('Erro ao processar pedido:', error);
            window.showNotification("❌ Erro ao processar pedido. Tente novamente.", 5000, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    // Processa tudo automaticamente em uma única função
    async processOrderAutomatically(name, phone, deliveryOption, paymentMethod, address, observation) {
        // Calcula os valores finais
        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + (deliveryOption === 'entrega' ? this.deliveryFee : 0);
        
        // Prepara os dados do pedido
        const orderData = {
            customer: {
                name: name,
                phone: `55${phone}`,
                deliveryOption: deliveryOption,
                paymentMethod: paymentMethod,
                address: address,
                observation: observation || '' // NOVO: Campo de observação
            },
            order: {
                items: this.cartItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                })),
                subtotal: subtotal,
                deliveryFee: deliveryOption === 'entrega' ? this.deliveryFee : 0,
                total: total,
                orderId: 'JD' + Date.now().toString().slice(-6),
                timestamp: new Date().toLocaleString('pt-BR')
            }
        };

        // Cria o link ENCURTADO da página do pedido
        const orderLink = this.createShortOrderLink(orderData);
        
        // Gera a mensagem do WhatsApp com o link
        const message = this.buildWhatsAppMessageWithLink(name, phone, deliveryOption, paymentMethod, address, subtotal, total, orderLink, observation);
        
        // Abre o WhatsApp com a mensagem
        this.openWhatsAppWithMessage(message);
    },

    // Cria link ENCURTADO para a página do pedido
    createShortOrderLink(orderData) {
        // Cria um ID curto único
        const shortId = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();
        
        // Salva os dados do pedido no localStorage com expiração
        const orderKey = `order_${shortId}`;
        localStorage.setItem(orderKey, JSON.stringify(orderData));
        
        // Define expiração em 24 horas
        const expirationKey = `exp_${shortId}`;
        localStorage.setItem(expirationKey, (Date.now() + 24 * 60 * 60 * 1000).toString());
        
        // Cria a URL completa com todos os dados como fallback
        const fullUrlParams = this.generateFullUrlParams(orderData);
        
        // URL super curta - use 'o.html' em vez de 'order.html'
        const baseUrl = window.location.origin;
        
        // Retorna o link curto com o fallback de dados completos na URL
        return `${baseUrl}/o.html?i=${shortId}&${fullUrlParams}`;
    },

    // NOVO: Função para gerar os parâmetros de URL completos
    generateFullUrlParams(orderData) {
        const params = new URLSearchParams();
        
        // Dados do Cliente
        params.append('name', encodeURIComponent(orderData.customer.name));
        params.append('phone', orderData.customer.phone);
        params.append('delivery', orderData.customer.deliveryOption);
        params.append('payment', orderData.customer.paymentMethod);
        params.append('address', encodeURIComponent(orderData.customer.address));
        params.append('obs', encodeURIComponent(orderData.customer.observation));
        
        // Dados do Pedido
        params.append('id', orderData.order.orderId);
        params.append('subtotal', orderData.order.subtotal.toFixed(2));
        params.append('total', orderData.order.total.toFixed(2));
        params.append('timestamp', new Date(orderData.order.timestamp).getTime());

        // Itens do Pedido (formato: 1xProduto_A,2xProduto_B)
        const itemsParam = orderData.order.items.map(item => 
            `${item.quantity}x${item.name.replace(/\s/g, '_')}`
        ).join(',');
        params.append('items', itemsParam);

        return params.toString();
    },



    // Mensagem do WhatsApp com link ENCURTADO
    buildWhatsAppMessageWithLink(name, phone, deliveryOption, paymentMethod, address, subtotal, total, orderLink, observation) {
        let message = `*JARDIM PADARIA ARTESANAL*\n\n`;
        message += `Olá! Meu nome é *${name}*\n\n`;
        message += `*QUERO FAZER UM PEDIDO!*\n\n`;
        
        message += `*--- RESUMO RÁPIDO ---*\n`;
        this.cartItems.forEach(item => {
            message += `• ${item.quantity}x ${item.name}\n`;
        });
        
        message += `\n*TOTAL: R$ ${total.toFixed(2)}*\n\n`;
        
        message += `*Modalidade:* ${deliveryOption === 'retirada' ? '_Retirada na Loja_' : '_Entrega_'}\n`;
        message += `*Pagamento:* ${paymentMethod === 'pix' ? '_Pix_' : '_Cartão_'}\n\n`;
        
        // NOVO: Adiciona observação se existir
        if (observation && observation.trim() !== '') {
            message += `*--- OBSERVAÇÃO ---*\n`;
            message += `${observation}\n\n`;
        }
        
        message += `*--- MEUS DADOS ---*\n`;
        message += `*Nome:* ${name}\n`;
        message += `*Telefone:* ${phone}\n\n`;
        
        message += `*--- DETALHES COMPLETOS DO PEDIDO ---*\n`;
        message += `${orderLink}\n\n`;
        
        message += `_Clique no link acima para ver todos os detalhes do pedido!_\n\n`;
        message += `*Por favor, confirme meu pedido!*`;

        return message;
    },

    // Abre WhatsApp apenas com mensagem
    openWhatsAppWithMessage(message) {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${PADARIA_WHATSAPP}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    },

    // ============================================
    // PERSISTÊNCIA 
    // ============================================
    saveCartToStorage() {
        localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    },

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            this.cartItems = JSON.parse(savedCart);
        }
    }
};

// ============================================
// LIMPEZA AUTOMÁTICA DE PEDIDOS EXPIRADOS
// ============================================

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

// Executa a limpeza quando o carrinho é inicializado
document.addEventListener('DOMContentLoaded', () => {
    cleanupExpiredOrders();
});