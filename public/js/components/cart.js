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
    _previousOrders: [],
getItems() {
    return this.cartItems;
},
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
            this._loadPreviousOrders(); // Carrega pedidos anteriores
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

        // 4. Listeners de pedidos anteriores
        this._setupPreviousOrdersListeners();
        
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
    checkoutBtn.addEventListener('click', function() {
        // Verifica se há itens no carrinho
        if (Cart && Cart.cartItems && Cart.cartItems.length > 0) {
            // Abre o modal
            if (window.openCheckoutModal) {
                window.openCheckoutModal();
            }
        } else {
            // Mostra notificação se o carrinho estiver vazio
            window.showNotification('Adicione itens ao carrinho antes de finalizar a compra.', 3000, 'warning');
        }
    });
}
    },

    _setupPreviousOrdersListeners() {
        const previousOrdersBtn = document.getElementById('previousOrdersBtn');
        const previousOrdersList = document.getElementById('previousOrdersList');

        if (previousOrdersBtn && previousOrdersList) {
            previousOrdersBtn.addEventListener('click', () => {
                const isVisible = previousOrdersList.style.display === 'block';
                previousOrdersList.style.display = isVisible ? 'none' : 'block';
                previousOrdersBtn.innerHTML = isVisible 
                    ? '📋 Pedidos anteriores' 
                    : '📋 Esconder pedidos';
                previousOrdersBtn.classList.toggle('active');
            });
        }

        // Delegation para os botões de repetição e detalhes
        document.addEventListener('click', (e) => {
            // Botão de repetir pedido
            const repeatBtn = e.target.closest('.repeat-order-btn');
            if (repeatBtn) {
                const orderId = repeatBtn.dataset.orderId;
                if (orderId) {
                    this.repeatOrder(orderId);
                }
            }
        });
    },
// funcoes de pedidos anteriores
async _loadPreviousOrders() {
    try {
        console.log('⏳ Buscando pedidos anteriores...');
        
        // 1. Obtém o telefone do localStorage
        let phone = localStorage.getItem('clientePhone') || localStorage.getItem('lastCustomerPhone');
        
        if (!phone) {
            console.log('📱 Nenhum telefone de cliente encontrado.');
            this._showNoPreviousOrders();
            return;
        }
        
        // Remove caracteres não numéricos
        phone = phone.replace(/\D/g, '');
        
        // 2. Verifica se tem telefone válido (mínimo 10 dígitos com DDD)
        if (phone.length < 10) {
            console.log('📱 Telefone inválido (mínimo 10 dígitos).');
            this._showNoPreviousOrders();
            return;
        }
        
        console.log(`📱 Telefone encontrado: ${phone}`);
        
        // 3. Adiciona 55 para buscar no banco de dados
        const phoneForDatabase = phone.startsWith('55') ? phone : `55${phone}`;
        
        console.log(`📱 Buscando pedidos para telefone: ${phoneForDatabase}`);
        
        let orders = [];
        
        // 4. Tenta buscar via API getRecentOrdersByPhone (que já deve retornar limitado)
        try {
            console.log(`📦 Tentando API getRecentOrdersByPhone...`);
            const apiResponse = await apiClient.getRecentOrdersByPhone(phoneForDatabase);
            
            if (apiResponse && apiResponse.success && apiResponse.orders) {
                orders = apiResponse.orders;
                console.log(`✅ ${orders.length} pedidos encontrados via API.`);
            } else {
                console.log(`⚠️ API não retornou pedidos, tentando localStorage...`);
                orders = this._getOrdersByPhoneFromLocalStorage(phone);
            }
        } catch (apiError) {
            console.warn('⚠️ Erro na API, usando localStorage:', apiError);
            orders = this._getOrdersByPhoneFromLocalStorage(phone);
        }
        
        // 5. Garante que mostra no máximo 2 pedidos
        this._previousOrders = orders.slice(0, 2);
        
        console.log(`📊 Pedidos que serão exibidos: ${this._previousOrders.length}`);
        
        // 6. Renderiza os pedidos
        this._renderPreviousOrders();
        
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos anteriores:', error);
        this._showNoPreviousOrders();
    }
},

_showNoPreviousOrders() {
    this._previousOrders = [];
    
    const listContainer = document.getElementById('previousOrdersList');
    const container = document.getElementById('previousOrdersContainer');
    
    if (listContainer && container) {
        container.style.display = 'block';
        listContainer.innerHTML = `
            <div class="no-previous-orders">
                <p>📭 Nenhum pedido anterior encontrado.</p>
                <p class="small-text">Faça seu primeiro pedido para começar seu histórico!</p>
            </div>
        `;
        
        // Atualiza botão
        const previousOrdersBtn = document.getElementById('previousOrdersBtn');
        if (previousOrdersBtn) {
            previousOrdersBtn.innerHTML = `📋 Pedidos anteriores`;
        }
    }
},

_getOrdersByPhoneFromLocalStorage(phone) {
    console.log(`🔍 Buscando pedidos no localStorage para telefone: ${phone}`);
    
    const orders = [];
    const keys = Object.keys(localStorage);
    const orderKeys = keys.filter(key => key.startsWith('order_'));
    
    // Prepara o telefone para comparação (com e sem 55)
    const phoneVariations = [
        phone, // Como veio
        phone.startsWith('55') ? phone : `55${phone}`, // Com 55
        phone.startsWith('55') ? phone.substring(2) : phone // Sem 55
    ];
    
    console.log(`📱 Variações de telefone para busca:`, phoneVariations);
    
    for (const key of orderKeys) {
        try {
            const orderData = JSON.parse(localStorage.getItem(key));
            
            // Extrai telefone do pedido
            const orderPhone = this._extractPhoneFromOrder(orderData);
            
            if (orderPhone) {
                // Remove caracteres não numéricos para comparação
                const cleanOrderPhone = orderPhone.replace(/\D/g, '');
                
                // Verifica se o telefone do pedido corresponde a alguma variação
                const isMatch = phoneVariations.some(variation => {
                    const cleanVariation = variation.replace(/\D/g, '');
                    return cleanOrderPhone === cleanVariation;
                });
                
                if (isMatch) {
                    orderData._shortId = key.replace('order_', '');
                    orderData._source = 'localStorage';
                    orders.push(orderData);
                }
            }
        } catch (e) {
            continue;
        }
    }
    
    // Ordena por data (mais recente primeiro)
    orders.sort((a, b) => {
        const dateA = new Date(a.order?.created_at || a.order?.timestamp || 0);
        const dateB = new Date(b.order?.created_at || b.order?.timestamp || 0);
        return dateB - dateA;
    });
    
    // Já retorna limitado a 2
    return orders.slice(0, 2);
},

_extractPhoneFromOrder(orderData) {
    if (!orderData) return null;
    
    // Tenta várias propriedades possíveis em ordem de prioridade
    const phoneSources = [
        orderData.customer?.phone,
        orderData.client?.phone,
        orderData.phone,
        orderData.order?.customer_phone,
        orderData.order?.client_phone
    ];
    
    for (const phone of phoneSources) {
        if (phone && typeof phone === 'string' && phone.trim() !== '') {
            // Remove caracteres não numéricos
            const cleanPhone = phone.toString().replace(/\D/g, '');
            
            // Se tiver menos de 10 dígitos, ignora (não é um telefone válido)
            if (cleanPhone.length >= 10) {
                return cleanPhone;
            }
        }
    }
    
    return null;
},
// Adicione esta função utilitária:
_normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.toString().replace(/\D/g, '');
    
    // Verifica se é um telefone válido
    if (cleanPhone.length < 10) {
        return null;
    }
    
    // Garante que tem código do país (55) para o banco
    const withCountryCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    return {
        raw: phone,
        clean: cleanPhone,
        with55: withCountryCode,
        without55: cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone
    };
},

_loadFromLocalStorage() {
    console.log('📂 Buscando pedidos anteriores do localStorage...');
    this._previousOrders = [];
    const keys = Object.keys(localStorage);
    const orderKeys = keys.filter(key => key.startsWith('order_'));
    
    // Carrega os pedidos mais recentes
    const allOrders = orderKeys.map(key => {
        try {
            const orderData = JSON.parse(localStorage.getItem(key));
            // Adiciona o shortId aos dados do pedido
            orderData._shortId = key.replace('order_', '');
            return orderData;
        } catch (e) {
            console.error(`❌ Erro ao carregar pedido ${key}:`, e);
            return null;
        }
    }).filter(order => order !== null);
    
    // Ordena por data (mais recente primeiro)
    allOrders.sort((a, b) => {
        const dateA = new Date(a.order?.created_at || a.order?.timestamp || 0);
        const dateB = new Date(b.order?.created_at || b.order?.timestamp || 0);
        return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    });
    
    // Limita aos 2 últimos pedidos - CORREÇÃO AQUI
    this._previousOrders = allOrders.slice(0, 2);
    console.log(`📜 ${this._previousOrders.length} pedidos anteriores carregados do localStorage.`);
    
    this._renderPreviousOrders();
},

_renderPreviousOrders() {
    const listContainer = document.getElementById('previousOrdersList');
    const container = document.getElementById('previousOrdersContainer');
    
    if (!listContainer || !container) {
        console.warn('⚠️ Elementos de pedidos anteriores não encontrados');
        return;
    }

    // Verifica se tem pedidos para mostrar
    if (!this._previousOrders || this._previousOrders.length === 0) {
        container.style.display = 'block';
        listContainer.innerHTML = `
            <div class="no-previous-orders">
                <p>📭 Nenhum pedido anterior encontrado.</p>
                <p class="small-text">Faça seu primeiro pedido para começar seu histórico!</p>
            </div>
        `;
        
        // Atualiza botão
        const previousOrdersBtn = document.getElementById('previousOrdersBtn');
        if (previousOrdersBtn) {
            previousOrdersBtn.innerHTML = `📋 Pedidos anteriores`;
        }
        
        return;
    }

    container.style.display = 'block';
    listContainer.innerHTML = '';

    // Renderiza APENAS 2 pedidos (já está limitado, mas por segurança)
    const ordersToShow = this._previousOrders.slice(0, 2);
    
    ordersToShow.forEach((order, index) => {
        console.log(`📄 Renderizando pedido ${index + 1} de ${ordersToShow.length}`);
        listContainer.innerHTML += this._createOrderHtml(order);
    });
    
    // Atualiza o texto do botão para mostrar APENAS 2 pedidos
    const previousOrdersBtn = document.getElementById('previousOrdersBtn');
    if (previousOrdersBtn) {
        previousOrdersBtn.innerHTML = `📋 Pedidos anteriores (${ordersToShow.length})`;
    }
},
_createOrderHtml(order) {
    console.log('📄 Processando HTML para pedido:', order);
    
    // Obtém todos os IDs possíveis
    const shortId = order._shortId;
    const apiOrderId = order.order?.order_id || order.order?.id || order.order_id;
    const displayOrderId = order.order?.order_id || order.order?.id || order.order_id || shortId;
    
    console.log(`🔑 IDs disponíveis: shortId=${shortId}, apiOrderId=${apiOrderId}, displayOrderId=${displayOrderId}`);
    
    // DECIDE qual ID usar para ações
    // Prioriza o ID oficial (API) se disponível
    let actionOrderId = apiOrderId || shortId;
    let isLocalStorageOrder = !apiOrderId;
    
    // Se não tem ID claro, tenta gerar um
    if (!actionOrderId) {
        // Tenta encontrar no localStorage
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith('order_')) {
                try {
                    const storedOrder = JSON.parse(localStorage.getItem(key));
                    const storedApiId = storedOrder.order?.order_id || storedOrder.order?.id;
                    const storedDisplayId = storedOrder.order?.order_id || storedOrder.order?.id || storedOrder.order_id;
                    
                    if (storedDisplayId === displayOrderId || storedApiId === apiOrderId) {
                        actionOrderId = key.replace('order_', '');
                        isLocalStorageOrder = true;
                        console.log(`🔍 Encontrou correspondência no localStorage: ${actionOrderId}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }
        
        // Se ainda não tem, cria um fallback
        if (!actionOrderId) {
            actionOrderId = 'temp_' + Date.now().toString(36);
            isLocalStorageOrder = true;
        }
    }
    
    // Formata a data
    const orderDate = order.created_at || order.order?.created_at || order.order?.timestamp || order.date || order.timestamp;
    const formattedDate = this._formatOrderDate(orderDate);
    
    // Calcula o total
    const total = order.total || order.order?.total || order.total_amount || order.order?.total_amount || 0;
    const formattedTotal = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    // Lista os produtos
    const orderItems = order.items || order.cart || order.order?.items || [];
    let productsList = '';
    
    if (orderItems && orderItems.length > 0) {
        productsList = orderItems.map(item => {
            const itemPrice = parseFloat(item.price || item.unit_price || 0);
            const itemQty = parseInt(item.quantity || 1);
            const itemTotal = (itemPrice * itemQty).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            return `
                <div class="order-item-detail">
                    <span>${itemQty}x ${item.product_name || item.name || 'Produto'}</span>
                    <span>${itemTotal}</span>
                </div>
            `;
        }).join('');
    } else {
        productsList = '<div class="order-item-detail"><span>Clique em "Ver Detalhes" para ver os itens</span></div>';
    }
    
    // Gera o link de detalhes
    // Se tivermos um ID oficial (que começa com JD-), usamos apenas orderId
    const isOfficialId = actionOrderId && actionOrderId.toString().startsWith('JD-');
    const detailsLink = `/order.html?orderId=${encodeURIComponent(actionOrderId)}${(isLocalStorageOrder && !isOfficialId) ? '&source=local' : ''}`;
    
    // ID para exibição (formata para ficar mais apresentável)
    let displayId = displayOrderId;
    if (displayId && displayId.length > 10) {
        displayId = displayId.substring(0, 8) + '...';
    } else if (!displayId) {
        displayId = 'Pedido';
    }
    
    console.log(`🔗 Link gerado: ${detailsLink}, displayId: ${displayId}`);
    
    return `
        <div class="previous-order-item">
            <div class="order-header">
                <span class="order-id">Pedido #${displayId}</span>
                <span class="order-date">${formattedDate}</span>
                <span class="order-total">${formattedTotal}</span>
            </div>
            
            <div class="order-details">
                <h5>Produtos:</h5>
                <div class="order-items">${productsList}</div>
            </div>
            
            <div class="order-actions">
                <a href="${detailsLink}" target="_blank" class="order-details-btn" data-order-id="${actionOrderId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Detalhes do Pedido
                </a>
                <button class="repeat-order-btn" data-order-id="${actionOrderId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 4v6h6"></path>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    Repetir Pedido
                </button>
            </div>
        </div>
    `;
},

// Atualize a função _loadFromLocalStorage para incluir o shortId:
_loadFromLocalStorage() {
    console.log('📂 Buscando pedidos anteriores do localStorage...');
    this._previousOrders = [];
    const keys = Object.keys(localStorage);
    const orderKeys = keys.filter(key => key.startsWith('order_'));
    
    // Carrega os pedidos mais recentes
    const allOrders = orderKeys.map(key => {
        try {
            const orderData = JSON.parse(localStorage.getItem(key));
            orderData._shortId = key.replace('order_', '');
            return orderData;
        } catch (e) {
            return null;
        }
    }).filter(order => order !== null);
    
    // Ordena por data (mais recente primeiro)
    allOrders.sort((a, b) => {
        const dateA = new Date(a.order?.created_at || a.order?.timestamp || 0);
        const dateB = new Date(b.order?.created_at || b.order?.timestamp || 0);
        return dateB - dateA;
    });
    
    // LIMITA AOS 2 ÚLTIMOS PEDIDOS - MUDANÇA AQUI
    this._previousOrders = allOrders.slice(0, 2);
    console.log(`📜 ${this._previousOrders.length} pedidos anteriores carregados do localStorage.`);
    
    this._renderPreviousOrders();
},



    _formatOrderDate(dateString) {
        if (!dateString) return 'Data não disponível';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    },

async repeatOrder(orderId) {
    if (!orderId) return;

    try {
        console.log(`⏳ Buscando detalhes do pedido ${orderId} para repetição...`);
        
        let orderDetails = null;
        let source = 'unknown';
        
        // PRIMEIRO: Tenta buscar da API usando getOrderDetails
        try {
            console.log(`🌐 Tentando buscar pedido ${orderId} da API...`);
            const response = await apiClient.getOrderDetails(orderId);
            
            // Verifica se a resposta tem sucesso e dados
            if (response && response.success !== false && response.orderData) {
                orderDetails = response.orderData;
                source = 'api';
                console.log(`✅ Pedido ${orderId} encontrado na API`);
            } else {
                console.log(`⚠️ API retornou sem dados para ${orderId}`);
                throw new Error('API sem dados');
            }
        } catch (apiError) {
            console.log('⚠️ Não conseguiu buscar da API, tentando localStorage...');
            
            // SEGUNDO: Tenta buscar do localStorage
            orderDetails = this._findOrderInLocalStorage(orderId);
            
            if (orderDetails) {
                source = 'localStorage';
                console.log(`✅ Pedido ${orderId} encontrado no localStorage`);
            } else {
                // TENTA BUSCAR POR SHORT ID
                console.log(`🔍 Tentando buscar por shortId...`);
                
                // Verifica se o orderId parece ser um ID da API (começa com JD)
                if (orderId.startsWith('JD')) {
                    // Tenta buscar no localStorage usando shortId
                    const keys = Object.keys(localStorage);
                    const orderKeys = keys.filter(key => key.startsWith('order_'));
                    
                    for (const key of orderKeys) {
                        try {
                            const storedOrder = JSON.parse(localStorage.getItem(key));
                            const storedApiId = storedOrder.order?.order_id || storedOrder.order?.id;
                            
                            if (storedApiId === orderId) {
                                orderDetails = storedOrder;
                                source = 'localStorage-by-api-id';
                                console.log(`✅ Pedido encontrado no localStorage pelo ID da API: ${key}`);
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            }
        }
        
        // TERCEIRO: Se ainda não encontrou, tenta buscar como shortId do localStorage
        if (!orderDetails) {
            console.log(`🔍 Tentando buscar como shortId direto...`);
            // Tenta adicionar "order_" prefix se não tiver
            const localKey = orderId.startsWith('order_') ? orderId : `order_${orderId}`;
            
            try {
                const storedData = localStorage.getItem(localKey);
                if (storedData) {
                    orderDetails = JSON.parse(storedData);
                    source = 'localStorage-direct';
                    console.log(`✅ Pedido encontrado com chave direta: ${localKey}`);
                }
            } catch (e) {
                console.error(`❌ Erro ao acessar localStorage:`, e);
            }
        }
        
        // Verifica se encontrou o pedido
        if (!orderDetails) {
            console.warn(`⚠️ Pedido ${orderId} não encontrado em nenhuma fonte.`);
            window.showNotification('Pedido não encontrado. Talvez tenha expirado ou sido removido.', 3000, 'error');
            return;
        }
        
        // Normaliza os itens (pode vir como items ou cart)
        const items = orderDetails?.items || orderDetails?.cart || orderDetails?.order?.items || [];
        
        if (items.length === 0) {
            console.warn(`⚠️ Pedido ${orderId} encontrado mas sem itens.`);
            window.showNotification('Pedido encontrado mas sem itens para repetir.', 3000, 'warning');
            return;
        }

        console.log(`📍 Fonte dos dados: ${source}, ${items.length} itens encontrados`);
        
        // Limpa o carrinho atual antes de adicionar os itens do pedido anterior
        Cart.clearCart();
        
        // Adiciona cada item do pedido anterior ao carrinho
        items.forEach(item => {
            console.log('🔍 Processando item para repetição:', item);
            
            // Normaliza os campos do item
            const itemName = item.name || item.product_name;
            const itemPrice = item.price || item.unit_price;
            const itemId = item.product_id || item.id; // Prioriza product_id para itens vindos do banco
            
            // Verifica se o item tem os dados mínimos necessários
            if (itemName && itemPrice) {
                // Tenta encontrar a imagem no item ou usa um fallback baseado no ID
                let itemImage = item.image || item.image_url || item.imagem || item.product_image;
                
                console.log(`🖼️ Imagem original do item: ${itemImage}`);

                // Se não tiver imagem, tenta construir o caminho padrão ou usa o logo
                if (!itemImage || itemImage === 'null' || itemImage === 'undefined') {
                    // Tenta encontrar o produto no menu global para pegar a imagem correta
                    const menuProducts = window.allProducts || [];
                    const foundProduct = menuProducts.find(p => p.id == itemId || p.name == itemName);
                    
                    if (foundProduct && foundProduct.image) {
                        itemImage = foundProduct.image;
                        console.log(`🔄 Imagem recuperada do menu global: ${itemImage}`);
                    } else if (itemId && !isNaN(itemId)) {
                        // Verifica se o ID é um número e tenta o caminho padrão
                        itemImage = `img/produtos/produto${itemId}.png`;
                        console.log(`🔄 Usando fallback por ID: ${itemImage}`);
                    } else {
                        itemImage = 'img/logos/Logo.png';
                        console.log(`🔄 Usando fallback logo: ${itemImage}`);
                    }
                }

                // Usa Cart.addToCart para garantir o contexto correto e a lógica de disponibilidade
                const quantity = parseInt(item.quantity) || 1;
                const product = {
                    id: itemId,
                    name: itemName,
                    price: parseFloat(itemPrice),
                    image: itemImage,
                    available_days: ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'] // Ignora trava de dia na repetição
                };
                
                console.log('🛒 Adicionando produto normalizado ao carrinho:', product);
                
                for (let i = 0; i < quantity; i++) {
                    Cart.addToCart(product);
                }
            }
        });

        Cart.updateCartUI();
        Cart.openCart();
        
        // Fecha a aba de pedidos anteriores automaticamente
        const previousOrdersBtn = document.getElementById('previousOrdersBtn');
        const previousOrdersList = document.getElementById('previousOrdersList');
        if (previousOrdersList && previousOrdersList.style.display === 'block') {
            previousOrdersList.style.display = 'none';
            if (previousOrdersBtn) {
                previousOrdersBtn.innerHTML = '📋 Pedidos anteriores';
                previousOrdersBtn.classList.remove('active');
            }
        }
        
        window.showNotification('Pedido repetido com sucesso!', 3000, 'success');

    } catch (error) {
        console.error(`❌ Erro ao repetir pedido ${orderId}:`, error);
        window.showNotification('Erro ao repetir pedido. Tente novamente.', 'error');
    }
},

// Melhore a função _findOrderInLocalStorage
_findOrderInLocalStorage(orderId) {
    console.log(`🔍 Buscando pedido ${orderId} no localStorage...`);
    
    const keys = Object.keys(localStorage);
    
    // CASO 1: orderId já inclui "order_" prefix
    if (orderId.startsWith('order_')) {
        const key = orderId;
        if (keys.includes(key)) {
            try {
                const orderData = JSON.parse(localStorage.getItem(key));
                console.log(`✅ Encontrado com chave completa: ${key}`);
                return orderData;
            } catch (e) {
                console.error(`❌ Erro ao parsear ${key}:`, e);
            }
        }
    }
    
    // CASO 2: orderId é um shortId (sem "order_")
    const orderKey = `order_${orderId}`;
    if (keys.includes(orderKey)) {
        try {
            const orderData = JSON.parse(localStorage.getItem(orderKey));
            console.log(`✅ Encontrado com shortId: ${orderKey}`);
            return orderData;
        } catch (e) {
            console.error(`❌ Erro ao parsear ${orderKey}:`, e);
        }
    }
    
    // CASO 3: Busca por ID da API em todos os pedidos
    const orderKeys = keys.filter(key => key.startsWith('order_'));
    console.log(`🔍 Verificando ${orderKeys.length} pedidos no localStorage...`);
    
    for (const key of orderKeys) {
        try {
            const orderData = JSON.parse(localStorage.getItem(key));
            
            // Verifica múltiplos campos possíveis de ID
            const possibleIds = [
                key.replace('order_', ''), // shortId da chave
                orderData.order?.order_id,
                orderData.order?.id,
                orderData.order_id,
                orderData.id,
                orderData._shortId
            ];
            
            // Remove valores nulos/undefined e converte para string
            const cleanIds = possibleIds
                .filter(id => id != null)
                .map(id => id.toString());
            
            // Verifica se algum dos IDs corresponde
            if (cleanIds.includes(orderId.toString())) {
                console.log(`✅ Encontrado! Chave: ${key}, IDs: ${cleanIds.join(', ')}`);
                return orderData;
            }
        } catch (e) {
            continue;
        }
    }
    
    console.log(`❌ Pedido ${orderId} não encontrado no localStorage`);
    return null;
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
    
    // Também formata o valor inicial se já houver algo
    if (input.value) {
        input.value = this._formatCepForDisplay(input.value);
    }
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
        
        // Restaura o valor original se for inválido
        const cepInput = document.getElementById('customerCep');
        if (cepInput && cepInput.value === 'Buscando...') {
            cepInput.value = this._formatCepForDisplay(cep);
            cepInput.disabled = false;
        }
        return null;
    }

    // Salva a posição atual do scroll ANTES de fazer qualquer coisa
    const modalBody = document.querySelector('#checkoutModal .modal-body');
    const scrollTopBefore = modalBody ? modalBody.scrollTop : 0;
    
    // Mostra loading - salva o valor ORIGINAL para restaurar depois
    const cepInput = document.getElementById('customerCep');
    const originalValue = cepInput ? this._formatCepForDisplay(cep) : cep;
    
    if (cepInput) {
        cepInput.value = 'Buscando...';
        cepInput.disabled = true;
    }

    // Timeout de segurança para evitar que fique preso em "Buscando..."
    const safetyTimeout = setTimeout(() => {
        if (cepInput && cepInput.value === 'Buscando...') {
            console.warn('⚠️ Timeout na busca do CEP. Restaurando valor original.');
            cepInput.value = originalValue;
            cepInput.disabled = false;
            window.showNotification('Tempo limite excedido ao buscar CEP. Tente novamente.', 3000, 'warning');
        }
    }, 10000); // 10 segundos de timeout

    try {
        console.log(`📍 Buscando endereço para CEP: ${cleanCep}`);
        
        // Faz requisição para a API ViaCEP
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }
        
        const data = await response.json();
        
        // Limpa o timeout de segurança
        clearTimeout(safetyTimeout);
        
        // Verifica se o CEP foi encontrado
        if (data.erro) {
            window.showNotification(' CEP não encontrado. Preencha manualmente.', 3000, 'error');
            this._clearAddressFields();
            
            // Restaura o CEP original formatado
            if (cepInput) {
                cepInput.value = originalValue;
                cepInput.disabled = false;
            }
            
            // Restaura a posição do scroll
            if (modalBody) {
                modalBody.scrollTop = scrollTopBefore;
            }
            return null;
        }
        
        // Preenche os campos de endereço SEM foco automático
        this._fillAddressFieldsWithoutFocus(data);
        
        window.showNotification('Endereço encontrado! Agora insira o número.', 3000, 'success');
        
        // Restaura o CEP formatado no campo
        if (cepInput) {
            cepInput.value = originalValue;
            cepInput.disabled = false;
        }
        
        // RESTAURA A POSIÇÃO DO SCROLL após preenchimento
        if (modalBody) {
            setTimeout(() => {
                modalBody.scrollTop = scrollTopBefore;
            }, 10);
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Erro ao buscar CEP:', error);
        
        // Limpa o timeout de segurança
        clearTimeout(safetyTimeout);
        
        window.showNotification(' Erro ao buscar CEP. Preencha manualmente.', 3000, 'error');
        this._clearAddressFields();
        
        // Restaura o CEP original em caso de erro
        if (cepInput) {
            cepInput.value = originalValue;
            cepInput.disabled = false;
        }
        
        // Restaura a posição do scroll
        if (modalBody) {
            modalBody.scrollTop = scrollTopBefore;
        }
        return null;
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
    _fillAddressFieldsWithoutFocus(addressData) {
    const fields = {
        'customerStreet': addressData.logradouro || '',
        'customerNeighborhood': addressData.bairro || '',
        'customerCity': `${addressData.localidade || ''} - ${addressData.uf || ''}`,
        'customerComplement': addressData.complemento || ''
    };

    // Preenche cada campo SEM focar neles
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            
            // Aplica estilo sutil para indicar preenchimento automático
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

    // NÃO foca no campo de número - mantém o usuário onde está
    // Apenas adiciona uma dica visual
    const numberField = document.getElementById('customerNumber');
    if (numberField) {
        numberField.style.borderColor = '#FFA726'; // Laranja para indicar "próximo passo"
        numberField.style.borderWidth = '2px';
        
        // Remove o destaque depois de 3 segundos ou quando o usuário interage
        setTimeout(() => {
            numberField.style.borderColor = '';
            numberField.style.borderWidth = '';
        }, 3000);
        
        numberField.addEventListener('focus', () => {
            numberField.style.borderColor = '';
            numberField.style.borderWidth = '';
        }, { once: true });
    }
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
            // Atualiza a imagem se o item existente não tiver uma, mas o novo tiver
            if ((!existingItem.image || existingItem.image.includes('Logo.png')) && product.image) {
                existingItem.image = product.image;
            }
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

                const imageUrl = item.image || item.imagem || "img/logos/Logo.png";

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
            this._loadPreviousOrders(); // Garante que a lista esteja atualizada
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
        checkoutModal.classList.add("active");
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
        
        // ADICIONE ESTA LINHA PARA FOCO CORRETO
        this._focusFirstField();
    }
},
_focusFirstField() {
    setTimeout(() => {
        const modal = document.getElementById('checkoutModal');
        if (!modal) return;
        
        // Primeiro, rola para o topo
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Depois foca no primeiro campo não readonly
        const fields = modal.querySelectorAll('input:not([readonly]), select, textarea');
        if (fields.length > 0) {
            fields[0].focus();
            
            // Se o campo já tiver valor, seleciona o texto
            if (fields[0].value) {
                fields[0].select();
            }
        }
    }, 300); // Delay para garantir que o modal está completamente renderizado
},
    closeCheckoutModal() {
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) {
            checkoutModal.style.display = "none";
            checkoutModal.classList.remove("active");
            document.body.style.overflow = "auto";
            this._submitting = false;
            
            // Limpa estilos dos campos de endereço
            this._clearAddressStyles();

            // Atualiza a lista de pedidos anteriores após a finalização
            this._loadPreviousOrders();
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
    console.log('📝 Tentando pré-preencher dados do cliente...');
    
    // 1. Tenta preencher o telefone - PRIORIDADE para clientePhone (com 55)
    const savedPhoneWith55 = localStorage.getItem('clientePhone');
    const savedPhoneWithout55 = localStorage.getItem('lastCustomerPhone');
    
    // Prefere o telefone COM 55 (do banco)
    let phoneToUse = savedPhoneWith55 || savedPhoneWithout55;
    
    if (phoneToUse) {
        const phoneInput = document.getElementById('customerPhone');
        if (phoneInput) {
            // Remove código do país (55) para exibição no campo
            let displayPhone = phoneToUse;
            if (displayPhone.startsWith('55')) {
                displayPhone = displayPhone.substring(2);
            }
            
            // Aplica máscara
            phoneInput.value = this._formatPhoneForDisplay(displayPhone);
            console.log('✅ Telefone pré-preenchido:', phoneInput.value);
            
            // Garante que ambos estão salvos para consistência
            if (!savedPhoneWith55 && phoneToUse.startsWith('55')) {
                localStorage.setItem('clientePhone', phoneToUse);
            }
            if (!savedPhoneWithout55) {
                localStorage.setItem('lastCustomerPhone', displayPhone);
            }
        }
    }

    // 2. Tenta preencher o nome
    const savedName = localStorage.getItem('lastCustomerName');
    if (savedName) {
        const nameInput = document.getElementById('customerName');
        if (nameInput) {
            nameInput.value = savedName;
            console.log('✅ Nome pré-preenchido:', savedName);
        }
    }
    
    // 3. Tenta preencher o CEP e buscar endereço SEM foco automático
    const savedCep = localStorage.getItem('lastCustomerCep');
    if (savedCep) {
        const cepInput = document.getElementById('customerCep');
        if (cepInput) {
            // Formata o CEP para exibição
            cepInput.value = this._formatCepForDisplay(savedCep);
            console.log('✅ CEP pré-preenchido:', cepInput.value);
            
            // Busca endereço automaticamente MAS sem causar scroll
            setTimeout(async () => {
                // Passa o CEP LIMPO (sem formatação) para a busca
                await this._fetchAddressByCep(savedCep.replace(/\D/g, ''));
                
                // Após buscar o CEP, tenta preencher os campos específicos que não vêm do ViaCEP
                const savedNumber = localStorage.getItem('lastCustomerNumber');
                if (savedNumber) {
                    const numberInput = document.getElementById('customerNumber');
                    if (numberInput) {
                        numberInput.value = savedNumber;
                        console.log('✅ Número pré-preenchido:', savedNumber);
                    }
                }

                const savedComplement = localStorage.getItem('lastCustomerComplement');
                if (savedComplement) {
                    const complementInput = document.getElementById('customerComplement');
                    if (complementInput) {
                        complementInput.value = savedComplement;
                        console.log('✅ Complemento pré-preenchido:', savedComplement);
                    }
                }
            }, 800); // Delay maior para garantir que o modal está completamente renderizado
        }
    }
},

    _prefillAddressDetails() {
        // Preenche número e complemento que foram salvos anteriormente
        const savedNumber = localStorage.getItem('lastCustomerNumber');
        if (savedNumber) {
            const numberInput = document.getElementById('customerNumber');
            if (numberInput) {
                numberInput.value = savedNumber;
                console.log('✅ Número pré-preenchido:', savedNumber);
            }
        }

        const savedComplement = localStorage.getItem('lastCustomerComplement');
        if (savedComplement) {
            const complementInput = document.getElementById('customerComplement');
            if (complementInput) {
                complementInput.value = savedComplement;
                console.log('✅ Complemento pré-preenchido:', savedComplement);
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
            
            // Salva dados de endereço para pré-preenchimento futuro
            localStorage.setItem('lastCustomerCep', cep);
            localStorage.setItem('lastCustomerStreet', street);
            localStorage.setItem('lastCustomerNumber', number);
            localStorage.setItem('lastCustomerNeighborhood', neighborhood);
            localStorage.setItem('lastCustomerCity', city);
            localStorage.setItem('lastCustomerComplement', complement);
        }

        // Salva dados pessoais para pré-preenchimento futuro
        localStorage.setItem('lastCustomerName', name);
        localStorage.setItem('lastCustomerPhone', this._formatPhoneForDisplay(phone));
        localStorage.setItem('clientePhone', '55' + phone);

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

    _formatCepForDisplay(cep) {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
        return cleanCep.substring(0, 5) + '-' + cleanCep.substring(5);
    }
    return cep; // Retorna como está se não tiver 8 dígitos
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
            // Garante que estamos enviando os dados no formato que a API espera
            apiResult = await apiClient.saveOrder({
                client: clientData,
                order: orderInfo,
                items: orderInfo.items,
                cart: orderInfo.items, // Duplicado para compatibilidade com server.js
                total: total           // Duplicado para compatibilidade com server.js
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
                order_id: apiResult && apiResult.success ? apiResult.orderId : orderId, // Prioriza ID da API
                id: apiResult && apiResult.success ? apiResult.orderId : orderId,       // Campo de compatibilidade
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

// Salva o telefone no formato correto para ambas as situações

// Telefone SEM 55 (para exibição)
localStorage.setItem('lastCustomerName', name);
localStorage.setItem('lastCustomerPhone', phone); // Já formatado sem 55

// Telefone COM 55 (para busca no banco)
const phoneWith55 = `55${phone.replace(/\D/g, '')}`;
localStorage.setItem('clientePhone', phoneWith55);

console.log(`📱 Telefone salvo: ${phone} (sem 55) e ${phoneWith55} (com 55)`);

        // PASSO 7: Abrir WhatsApp
        this._openWhatsApp(message);
    },

    // Gerar link universal com ID do banco
    _generateUniversalOrderLink(databaseOrderId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/order.html?orderId=${databaseOrderId}`;
    },

    _createLocalUserId(name, phone) {
        const localUserId = `local_+55${phone}_${Date.now().toString(36)}`;
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