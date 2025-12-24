// ============================================
// PÁGINA PEDIDOS - PARA CLIENTES
// ============================================
const PedidosPage = {
    phone: null,
    orders: [],
    filteredOrders: [],
    currentSort: { column: 'created_at', direction: 'desc' },
    currentOrderId: null,
    apiBase: window.location.origin + '/.netlify/functions',

    async initialize() {
        console.log('🚀 Inicializando Página de Pedidos...');
        
        // Verifica se já tem telefone salvo
        this.phone = this.getPhoneFromStorage();
        
        // Se não tiver telefone, pede
        if (!this.phone) {
            await this.promptPhone();
        } else {
            // Se já tem telefone, carrega os pedidos
            await this.loadOrders();
            this.setupEventListeners();
        }
        
        console.log('✅ Página de Pedidos inicializada');
    },

    getPhoneFromStorage() {
        // Busca do localStorage ou sessionStorage
        return localStorage.getItem('clientePhone') || 
               sessionStorage.getItem('clientePhone');
    },

    async promptPhone() {
        return new Promise((resolve) => {
            // Remove modal antigo se existir
            const oldModal = document.getElementById('phonePromptModal');
            if (oldModal) oldModal.remove();
            
            // Cria modal para pedir telefone
            const modalHTML = `
                <div id="phonePromptModal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    padding: 20px;
                ">
                    <div style="
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        max-width: 400px;
                        width: 100%;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    ">
                        <h3 style="margin-bottom: 1rem; color: #1C3D2D;">📱 Acessar Meus Pedidos</h3>
                        <p style="margin-bottom: 1.5rem; color: #666;">
                            Digite o telefone que você usou para fazer seus pedidos:
                        </p>
                        <input 
                            type="tel" 
                            id="phoneInput" 
                            placeholder="Ex: (83) 99920-4618"
                            style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 2px solid #D4E8DC;
                                border-radius: 0.5rem;
                                font-size: 1rem;
                                margin-bottom: 1rem;
                            "
                        >
                        <p style="font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
                            Use o mesmo telefone que você usou para fazer os pedidos.
                        </p>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button 
                                id="cancelPhoneBtn"
                                style="
                                    padding: 0.75rem 1.5rem;
                                    border: 2px solid #1C3D2D;
                                    background: white;
                                    color: #1C3D2D;
                                    border-radius: 0.5rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                "
                            >
                                Cancelar
                            </button>
                            <button 
                                id="confirmPhoneBtn"
                                style="
                                    padding: 0.75rem 1.5rem;
                                    border: none;
                                    background: #1C3D2D;
                                    color: white;
                                    border-radius: 0.5rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                "
                            >
                                Buscar Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('phonePromptModal');
            const phoneInput = document.getElementById('phoneInput');
            const confirmBtn = document.getElementById('confirmPhoneBtn');
            const cancelBtn = document.getElementById('cancelPhoneBtn');
            
            // Auto-focus no input
            setTimeout(() => phoneInput.focus(), 100);
            
            // Formatação do telefone enquanto digita
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value;
                
                // Remove tudo que não for número
                value = value.replace(/\D/g, '');
                
                // Formata enquanto digita: (XX) XXXXX-XXXX
                if (value.length > 10) {
                    // Formato para celular com 11 dígitos
                    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                } else if (value.length > 6) {
                    // Formato para telefone fixo com 10 dígitos
                    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                } else if (value.length > 2) {
                    // Apenas DDD
                    value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                } else if (value.length > 0) {
                    // Apenas DDD
                    value = '(' + value;
                }
                
                e.target.value = value;
            });
            
            // Permite usar Backspace para apagar
            phoneInput.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace') {
                    // Permite apagar normalmente
                    setTimeout(() => {
                        let value = e.target.value;
                        value = value.replace(/\D/g, '');
                        
                        if (value.length > 10) {
                            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                        } else if (value.length > 6) {
                            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                        } else if (value.length > 2) {
                            value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                        } else if (value.length > 0) {
                            value = '(' + value;
                        } else {
                            value = '';
                        }
                        
                        e.target.value = value;
                    }, 10);
                }
            });
            
            confirmBtn.onclick = async () => {
                let phone = phoneInput.value.trim();
                
                // Remove formatação, deixa apenas números
                const cleanPhone = phone.replace(/\D/g, '');
                
                if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
                    // Formata para o padrão internacional (+55)
                    this.phone = '55' + cleanPhone;
                    localStorage.setItem('clientePhone', this.phone);
                    modal.remove();
                    
                    // Mostra loading
                    this.showLoading(true);
                    
                    try {
                        await this.loadOrders();
                        this.setupEventListeners();
                        resolve();
                    } catch (error) {
                        console.error('❌ Erro ao carregar pedidos:', error);
                        this.showError('Erro ao carregar pedidos. Tente novamente.');
                        // Tenta novamente pedir o telefone
                        this.phone = null;
                        localStorage.removeItem('clientePhone');
                        this.promptPhone();
                    }
                } else {
                    alert("❌ Por favor, digite um telefone válido com DDD (10 ou 11 dígitos)");
                    phoneInput.focus();
                    phoneInput.select();
                }
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
                // Volta para a página anterior
                if (window.navigateToPage) {
                    window.navigateToPage('inicio');
                }
                resolve();
            };
        });
    },

    async loadOrders() {
        try {
            this.showLoading(true);
            console.log(`📱 Buscando pedidos para telefone: ${this.phone}`);
            
            // Primeiro busca o cliente pelo telefone
            const clientResponse = await fetch(`${this.apiBase}/get-client-by-phone`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    phone: this.phone 
                })
            });
            
            if (!clientResponse.ok) {
                throw new Error(`HTTP ${clientResponse.status} ao buscar cliente`);
            }
            
            const clientResult = await clientResponse.json();
            console.log('👤 Resultado da busca do cliente:', clientResult);
            
            if (clientResult.success && clientResult.client) {
                // Se encontrou o cliente, busca seus pedidos
                const clientId = clientResult.client.id;
                console.log(`📦 Buscando pedidos do cliente ID: ${clientId}`);
                
                const ordersResponse = await fetch(`${this.apiBase}/get-client-orders`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        clientId: clientId 
                    })
                });
                
                if (!ordersResponse.ok) {
                    throw new Error(`HTTP ${ordersResponse.status} ao buscar pedidos`);
                }
                
                const ordersResult = await ordersResponse.json();
                console.log('📦 Resultado da busca de pedidos:', ordersResult);
                
                if (ordersResult.success) {
                    this.orders = ordersResult.orders || [];
                    this.filteredOrders = [...this.orders];
                    this.sortOrders();
                    this.displayOrders();
                    this.updateOrderCount();
                    this.updateNoOrdersMessage();
                    
                    // Mostra mensagem se não houver pedidos
                    if (this.orders.length === 0) {
                        this.showInfo('Nenhum pedido encontrado para este telefone.');
                    }
                } else {
                    throw new Error(ordersResult.message || 'Erro ao carregar pedidos');
                }
            } else {
                // Cliente não encontrado
                this.orders = [];
                this.filteredOrders = [];
                this.displayOrders();
                this.updateOrderCount();
                this.showNoClientMessage();
                this.showInfo('Nenhum cliente encontrado com este telefone.');
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar pedidos:', error);
            this.showError('Erro ao buscar pedidos: ' + error.message);
            
            // Limpa dados
            this.orders = [];
            this.filteredOrders = [];
            this.displayOrders();
            this.updateOrderCount();
            this.updateNoOrdersMessage();
        } finally {
            this.showLoading(false);
        }
    },

    getPaymentMethodText(paymentMethod) {
        const normalizedMethod = paymentMethod?.toLowerCase() || 'pix';
        const paymentMap = {
            'pix': '💰 Pix',
            'cartao': '💳 Cartão',
            'dinheiro': '💵 Dinheiro',
            'card': '💳 Cartão',
            'cash': '💵 Dinheiro',
            'money': '💵 Dinheiro'
        };
        return paymentMap[normalizedMethod] || paymentMethod;
    },

    displayOrders() {
        const tbody = document.getElementById('pedidosBody');
        if (!tbody) {
            console.error('❌ Tabela de pedidos não encontrada');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (this.filteredOrders.length === 0) {
            this.updateNoOrdersMessage();
            return;
        }
        
        // Ordena por data (mais recente primeiro)
        this.filteredOrders.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // NOVO: Limita aos 3 pedidos mais recentes
        const ordersToDisplay = this.filteredOrders.slice(0, 3);
        
        ordersToDisplay.forEach(order => {
            const row = document.createElement('tr');
            
            const date = new Date(order.created_at);
            const total = parseFloat(order.total || order.total_amount || 0);
            const deliveryOption = order.delivery_option || order.deliveryOption || 'entrega';
            const paymentMethod = order.payment_method || order.paymentMethod || 'pix';
            
            row.innerHTML = `
                <td>
                    <strong>${order.order_id || order.id}</strong>
                </td>
                <td><strong>R$ ${total.toFixed(2)}</strong></td>
                <td><span class="status-badge status-${order.status || 'pendente'}">${this.getStatusText(order.status || 'pendente')}</span></td>
                <td>${deliveryOption === 'retirada' ? '🛵 Retirada' : '🚗 Entrega'}</td>
                <td>${this.getPaymentMethodText(paymentMethod)}</td>
                <td>${date.toLocaleDateString('pt-BR')}<br>
                    <small style="color: #666;">${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</small>
                </td>
                <td style="white-space: nowrap;">
                    <a href="/order.html?i=${order.order_id || order.id}" class="action-btn btn-primary" target="_blank">
                        Ver Detalhes
                    </a>
                    ${order.order_id ? `
                        <a href="/order.html?i=${order.order_id || order.id}" target="_blank" class="action-btn btn-info">
                            Ver Página
                        </a>
                    ` : ''}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },

    updateOrderCount() {
        const orderCount = document.getElementById('orderCount');
        if (orderCount) {
            orderCount.textContent = `${this.filteredOrders.length} pedido${this.filteredOrders.length !== 1 ? 's' : ''}`;
        }
    },

    updateNoOrdersMessage() {
        const noOrdersMessage = document.getElementById('noOrdersMessage');
        const tbody = document.getElementById('pedidosBody');
        
        if (this.filteredOrders.length === 0) {
            if (noOrdersMessage) {
                noOrdersMessage.style.display = 'block';
                // Atualiza o link do cardápio
                const menuLink = noOrdersMessage.querySelector('a[data-page="menu"]');
                if (menuLink) {
                    menuLink.onclick = (e) => {
                        e.preventDefault();
                        if (window.navigateToPage) {
                            window.navigateToPage('menu');
                        }
                    };
                }
            }
            if (tbody) tbody.innerHTML = '';
        } else {
            if (noOrdersMessage) noOrdersMessage.style.display = 'none';
        }
    },

    showNoClientMessage() {
        const tbody = document.getElementById('pedidosBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <h3 style="color: #E74C3C; margin-bottom: 1rem;">📭 Cliente não encontrado</h3>
                        <p style="margin-bottom: 1rem;">Nenhum cliente foi encontrado com o telefone: <strong>${this.formatPhone(this.phone)}</strong></p>
                        <p style="margin-bottom: 1.5rem;">Verifique se digitou o número corretamente ou use o mesmo telefone que você usou para fazer pedidos.</p>
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
                            <button onclick="window.PedidosPage.changePhone()" class="action-btn btn-primary">
                                🔄 Digitar Outro Telefone
                            </button>
                            <button onclick="window.navigateToPage ? window.navigateToPage('menu') : window.location.href='#'" class="action-btn btn-success">
                                🍞 Fazer Primeiro Pedido
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    getStatusText(status) {
        const statusMap = {
            'pendente': '📋 Pendente',
            'preparando': '👨‍🍳 Preparando',
            'pronto': '✅ Pronto',
            'entregue': '🚗 Entregue',
            'cancelado': '❌ Cancelado'
        };
        return statusMap[status] || status;
    },

    async viewOrder(orderId) {
        try {
            this.showModalLoading(true);
            const response = await fetch(`${this.apiBase}/get-order/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                const orderDetails = result.orderData;
                this.displayOrderDetails(orderDetails);
                document.getElementById('orderModal').style.display = 'flex';
            } else {
                throw new Error(result.message || 'Pedido não encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro ao visualizar pedido:', error);
            this.showError('Erro ao carregar detalhes do pedido: ' + error.message);
        } finally {
            this.showModalLoading(false);
        }
    },

    displayOrderDetails(orderDetails) {
        const modalContent = document.getElementById('orderModalContent');
        const customer = orderDetails.customer || {};
        const order = orderDetails.order || {};
        const items = orderDetails.items || [];
        
        const subtotal = parseFloat(order.subtotal || order.total || 0);
        const deliveryFee = parseFloat(order.delivery_fee || order.deliveryFee || 0);
        const total = parseFloat(order.total || order.total_amount || 0);
        const createdDate = new Date(order.created_at).toLocaleString('pt-BR');
        const paymentMethod = order.payment_method || order.paymentMethod || 'pix';
        
        modalContent.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h4>📋 Informações do Pedido</h4>
                <p><strong>ID:</strong> ${order.order_id || order.id}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status || 'pendente'}">${this.getStatusText(order.status || 'pendente')}</span></p>
                <p><strong>Data:</strong> ${createdDate}</p>
                <p><strong>Entrega:</strong> ${order.delivery_option === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega'}</p>
                <p><strong>Pagamento:</strong> ${this.getPaymentMethodText(paymentMethod)}</p>
                ${order.observation ? `<p><strong>Observação:</strong> ${order.observation}</p>` : ''}
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h4>👤 Informações do Cliente</h4>
                <p><strong>Nome:</strong> ${customer.name || 'N/A'}</p>
                <p><strong>Telefone:</strong> ${this.formatPhone(customer.phone)}</p>
                ${order.delivery_option === 'entrega' ? `
                    <p><strong>Endereço:</strong> ${customer.address || order.address || 'N/A'}</p>
                    ${customer.street ? `<p><strong>Rua:</strong> ${customer.street}</p>` : ''}
                    ${customer.number ? `<p><strong>Número:</strong> ${customer.number}</p>` : ''}
                    ${customer.neighborhood ? `<p><strong>Bairro:</strong> ${customer.neighborhood}</p>` : ''}
                    ${customer.city ? `<p><strong>Cidade:</strong> ${customer.city}</p>` : ''}
                ` : ''}
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h4>🛒 Itens do Pedido</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 8px; text-align: left;">Produto</th>
                            <th style="padding: 8px; text-align: left;">Quantidade</th>
                            <th style="padding: 8px; text-align: left;">Preço Unit.</th>
                            <th style="padding: 8px; text-align: left;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name || item.name}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${parseFloat(item.price || item.unit_price || 0).toFixed(2)}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">R$ ${(parseFloat(item.price || item.unit_price || 0) * parseInt(item.quantity)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h4>💰 Resumo Financeiro</h4>
                <p><strong>Subtotal:</strong> R$ ${subtotal.toFixed(2)}</p>
                ${deliveryFee > 0 ? `<p><strong>Frete:</strong> R$ ${deliveryFee.toFixed(2)}</p>` : ''}
                <p style="font-weight: bold; border-top: 2px solid #1C3D2D; padding-top: 10px;">
                    <strong>TOTAL:</strong> R$ ${total.toFixed(2)}
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                ${customer.phone ? `
                    <button class="action-btn btn-success" onclick="window.open('https://api.whatsapp.com/send?phone=${customer.phone}&text=Olá ${customer.name || ''}, gostaria de falar sobre meu pedido ${order.order_id || order.id}', '_blank')">
                        📱 Falar no WhatsApp
                    </button>
                ` : ''}
                <button class="action-btn btn-secondary" onclick="window.PedidosPage.closeModal()" style="margin-left: 10px;">
                    Fechar
                </button>
            </div>
        `;
    },

    changePhone() {
        localStorage.removeItem('clientePhone');
        sessionStorage.removeItem('clientePhone');
        this.phone = null;
        this.orders = [];
        this.filteredOrders = [];
        this.displayOrders();
        this.updateOrderCount();
        this.promptPhone();
    },

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const paymentFilter = document.getElementById('paymentFilter')?.value || '';
        const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const startDate = document.getElementById('startDate')?.value || '';
        const endDate = document.getElementById('endDate')?.value || '';
        
        this.filteredOrders = this.orders.filter(order => {
            if (statusFilter && (order.status || 'pendente') !== statusFilter) return false;
            
            const paymentMethod = order.payment_method || order.paymentMethod;
            if (paymentFilter) {
                const normalizedFilter = paymentFilter.toLowerCase();
                const normalizedMethod = (paymentMethod || 'pix').toLowerCase();
                
                const paymentMapping = {
                    'pix': ['pix'],
                    'cartao': ['cartao', 'card', 'credit', 'debit'],
                    'dinheiro': ['dinheiro', 'cash', 'money']
                };
                
                const allowedMethods = paymentMapping[normalizedFilter] || [normalizedFilter];
                if (!allowedMethods.includes(normalizedMethod)) return false;
            }
            
            if (searchTerm) {
                const orderId = (order.order_id || order.id || '').toString().toLowerCase();
                const customerName = (order.client_name || '').toLowerCase();
                
                if (!orderId.includes(searchTerm) && !customerName.includes(searchTerm)) {
                    return false;
                }
            }
            
            if (startDate || endDate) {
                const orderDate = new Date(order.created_at);
                orderDate.setHours(0, 0, 0, 0);
                
                if (startDate) {
                    const start = new Date(startDate);
                    if (orderDate < start) return false;
                }
                
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (orderDate > end) return false;
                }
            }
            
            return true;
        });
        
        this.sortOrders();
        this.displayOrders();
        this.updateOrderCount();
        this.updateNoOrdersMessage();
    },

    sortOrders() {
        this.filteredOrders.sort((a, b) => {
            const aVal = a[this.currentSort.column];
            const bVal = b[this.currentSort.column];
            
            if (this.currentSort.column === 'created_at') {
                return this.currentSort.direction === 'desc' 
                    ? new Date(bVal) - new Date(aVal)
                    : new Date(aVal) - new Date(bVal);
            }
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return this.currentSort.direction === 'desc'
                    ? bVal.localeCompare(aVal)
                    : aVal.localeCompare(bVal);
            }
            
            return this.currentSort.direction === 'desc'
                ? (bVal || 0) - (aVal || 0)
                : (aVal || 0) - (bVal || 0);
        });
    },

setupEventListeners() {
    // Botão de refresh
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        this.loadOrders();
    });
    
    // Botão para alterar telefone - VERIFICA SE JÁ EXISTE
    const pedidosControls = document.querySelector('.pedidos-controls');
    if (pedidosControls) {
        // Remove o botão antigo se existir
        const existingBtn = document.getElementById('changePhoneBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Cria novo botão
        const changePhoneBtn = document.createElement('button');
        changePhoneBtn.id = 'changePhoneBtn';
        changePhoneBtn.className = 'action-btn btn-secondary';
        changePhoneBtn.innerHTML = '📱 Alterar Telefone';
        changePhoneBtn.onclick = () => this.changePhone();
        
        // Adiciona o botão ao lado do botão de refresh
        pedidosControls.appendChild(changePhoneBtn);
    }
    
    // Filtros (resto do código permanece o mesmo)
    document.getElementById('statusFilter')?.addEventListener('change', () => {
        this.applyFilters();
    });
        
        document.getElementById('paymentFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('searchInput')?.addEventListener('input', () => {
            this.applyFilters();
        });
        
        document.getElementById('applyDateFilter')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('clearDateFilter')?.addEventListener('click', () => {
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            this.applyFilters();
        });
        
        // Ordenação
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                
                if (this.currentSort.column === column) {
                    this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSort.column = column;
                    this.currentSort.direction = 'desc';
                }
                
                this.sortOrders();
                this.displayOrders();
            });
        });
    },

    showLoading(show) {
        const tbody = document.getElementById('pedidosBody');
        if (!tbody) return;
        
        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading">
                        <div class="loading-spinner"></div>
                        <p>Buscando seus pedidos...</p>
                    </td>
                </tr>
            `;
        }
    },

    showModalLoading(show) {
        const modalContent = document.getElementById('orderModalContent');
        if (!modalContent) return;
        
        if (show) {
            modalContent.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando detalhes do pedido...</p>
                </div>
            `;
        }
    },

    closeModal() {
        document.getElementById('orderModal').style.display = 'none';
    },

    showError(message) {
        // Usa a função showNotification global se disponível
        if (window.showNotification) {
            window.showNotification(message, 5000, 'error');
        } else {
            alert(message);
        }
    },

    showInfo(message) {
        if (window.showNotification) {
            window.showNotification(message, 3000, 'info');
        }
    },

    formatPhone(phone) {
        if (!phone) return 'N/A';
        
        // Remove o +55 se existir
        let cleanPhone = phone.toString().replace(/\D/g, '');
        if (cleanPhone.startsWith('55')) {
            cleanPhone = cleanPhone.substring(2);
        }
        
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
        } else if (cleanPhone.length === 10) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
        } else if (cleanPhone.length === 9) {
            return `9${cleanPhone.substring(0, 4)}-${cleanPhone.substring(4)}`;
        } else if (cleanPhone.length === 8) {
            return `${cleanPhone.substring(0, 4)}-${cleanPhone.substring(4)}`;
        }
        
        return cleanPhone;
    }
};

// Exporta para ser usado em main.js
export default PedidosPage;