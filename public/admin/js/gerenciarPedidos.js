// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentSort = { column: 'created_at', direction: 'desc' };
        this.currentOrderId = null;
        this.apiBase = window.location.origin + '/api';
        this.isLoading = false;
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log('🚀 Inicializando AdminPanel...');
        
        // Setup event listeners first
        this.setupEventListeners();
        
        // Then load data
        await this.loadAllData();
        
        // Update timestamp
        this.updateTimestamp();
        
        console.log('✅ AdminPanel inicializado');
    }
    
    async loadAllData() {
        try {
            // Use Promise.allSettled to handle partial failures
            const [ordersPromise, statsPromise] = await Promise.allSettled([
                this.loadOrders(),
                this.loadStats()
            ]);
            
            // Handle results
            if (ordersPromise.status === 'rejected') {
                console.error('❌ Falha ao carregar pedidos:', ordersPromise.reason);
                this.showOrdersError('Erro ao carregar pedidos');
            }
            
            if (statsPromise.status === 'rejected') {
                console.error('❌ Falha ao carregar estatísticas:', statsPromise.reason);
                this.showStatsError('Erro ao carregar estatísticas');
            }
            
        } catch (error) {
            console.error('❌ Erro inesperado em loadAllData:', error);
            this.showError('Erro inesperado ao carregar dados');
        }
    }
    
    async loadOrders() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            console.log('📥 Carregando pedidos...');
            
            const response = await fetch(`${this.apiBase}/get-all-orders`);
            
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.warn('⚠️ Erro ao parsear JSON:', jsonError);
                result = { success: false, message: 'Erro ao processar resposta' };
            }
            
            console.log('📦 Resultado da API:', result);
            
            if (result.success) {
                this.orders = result.orders || [];
                this.filteredOrders = [...this.orders];
                this.sortOrders();
                this.displayOrders();
                this.updateOrderCount();
                this.updateNoOrdersMessage();
            } else {
                console.warn('⚠️ API retornou success: false:', result.message);
                this.orders = [];
                this.filteredOrders = [];
                this.displayOrders();
                this.updateOrderCount();
                this.showOrdersError(result.message || 'Erro ao carregar pedidos');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar pedidos:', error);
            this.orders = [];
            this.filteredOrders = [];
            this.displayOrders();
            this.updateOrderCount();
            this.showOrdersError('Erro de conexão com o servidor');
            
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    async loadStats() {
        try {
            console.log('📊 Carregando estatísticas...');
            
            const response = await fetch(`${this.apiBase}/get-admin-stats`);
            
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.warn('⚠️ Erro ao parsear JSON de stats:', jsonError);
                result = { success: false };
            }
            
            console.log('📈 Resultado de stats:', result);
            
            if (result.success) {
                this.displayStats(result.stats || this.getEmptyStats());
            } else {
                console.warn('⚠️ API de stats retornou success: false');
                this.displayStats(this.getEmptyStats());
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
            this.displayStats(this.getEmptyStats());
        }
    }
    
    // NOVO MÉTODO: Calcular estatísticas localmente a partir dos pedidos carregados
    calculateLocalStats() {
        const stats = this.getEmptyStats();
        
        stats.total = this.orders.length;
        
        this.orders.forEach(order => {
            const status = order.status || 'pendente';
            const value = parseFloat(order.total || order.total_amount || 0);
            
            // Conta por status
            switch(status.toLowerCase()) {
                case 'pendente':
                    stats.pendente++;
                    break;
                case 'preparando':
                    stats.preparando++;
                    break;
                case 'pronto':
                    stats.pronto++;
                    break;
                case 'entregue':
                    stats.entregue++;
                    break;
                case 'cancelado':
                    stats.cancelado++;
                    break;
                default:
                    stats.pendente++;
            }
            
            // Soma valores
            if (!isNaN(value)) {
                stats.total_value += value;
            }
        });
        
        return stats;
    }
    
    // NOVO MÉTODO: Atualizar estatísticas após mudanças
    updateStats() {
        const localStats = this.calculateLocalStats();
        this.displayStats(localStats);
        console.log('📊 Estatísticas atualizadas localmente:', localStats);
    }
    
    async getOrderDetails(orderId) {
        try {
            console.log(`🔍 Buscando detalhes do pedido: ${orderId}`);
            
            const response = await fetch(`${this.apiBase}/get-order/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                return result.orderData;
            } else {
                throw new Error(result.message || 'Pedido não encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes do pedido:', error);
            throw error;
        }
    }
    
    async updateOrderStatus(orderId, newStatus) {
        try {
            console.log(`🔄 Atualizando status do pedido ${orderId} para ${newStatus}`);
            
            const response = await fetch(`${this.apiBase}/update-order-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    status: newStatus
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Status atualizado no banco de dados:', result);
                return result;
            } else {
                throw new Error(result.message || 'Erro ao atualizar status');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            throw error;
        }
    }
    
    getEmptyStats() {
        return {
            total: 0,
            pendente: 0,
            preparando: 0,
            pronto: 0,
            entregue: 0,
            cancelado: 0,
            total_value: 0
        };
    }
    
    displayStats(stats) {
        const statsGrid = document.getElementById('statsGrid');
        
        if (!statsGrid) return;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.total || 0}</div>
                <div class="stat-label">Total de Pedidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.pendente || 0}</div>
                <div class="stat-label">Pendentes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.preparando || 0}</div>
                <div class="stat-label">Em Preparação</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.pronto || 0}</div>
                <div class="stat-label">Prontos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.entregue || 0}</div>
                <div class="stat-label">Entregues</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">R$ ${(stats.total_value || 0).toFixed(2)}</div>
                <div class="stat-label">Valor Total</div>
            </div>
        `;
    }
    
    displayOrders() {
        const tbody = document.getElementById('ordersBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.filteredOrders.length === 0) {
            this.updateNoOrdersMessage();
            return;
        }
        
        this.filteredOrders.forEach(order => {
            const row = document.createElement('tr');
            
            const date = new Date(order.created_at).toLocaleString('pt-BR');
            const total = parseFloat(order.total || order.total_amount || 0);
            const deliveryOption = order.delivery_option || order.deliveryOption || 'entrega';
            const paymentMethod = order.payment_method || order.paymentMethod || 'pix';
            
            row.innerHTML = `
                <td>
                    <a href="/order.html?orderId=${order.order_id || order.id}" 
                       target="_blank" 
                       class="order-id-link"
                       title="Abrir página do pedido">
                        ${order.order_id || order.id}
                    </a>
                </td>
                <td>
                    <strong>${order.client_name || order.client?.name || 'N/A'}</strong>
                </td>
                <td>
                    <span class="phone-number">${this.formatPhone(order.client_phone || order.client?.phone)}</span>
                </td>
                <td>
                    <strong>R$ ${total.toFixed(2)}</strong>
                </td>
                <td>
                    <span class="status-badge status-${order.status || 'pendente'}">
                        ${this.getStatusText(order.status || 'pendente')}
                    </span>
                </td>
                <td>
                    ${deliveryOption === 'retirada' ? 
                        '<span title="Retirada na Loja">🛵 Retirada</span>' : 
                        '<span title="Entrega em Domicílio">🚗 Entrega</span>'}
                </td>
                <td>
                    ${this.getPaymentMethodText(paymentMethod)}
                </td>
                <td>
                    <span class="date-time" title="${date}">
                        ${new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-primary" 
                                onclick="AdminPanel.viewOrder('${order.order_id || order.id}')"
                                title="Ver detalhes do pedido">
                            👁️ Ver
                        </button>
                        <button class="action-btn btn-info" 
                                onclick="AdminPanel.editOrderStatus('${order.order_id || order.id}')"
                                title="Alterar status do pedido">
                            ✏️ Status
                        </button>
                        ${(order.status || 'pendente') === 'pendente' ? 
                            `<button class="action-btn btn-success" 
                                    onclick="AdminPanel.updateOrderStatusQuick('${order.order_id || order.id}', 'preparando')"
                                    title="Iniciar preparação do pedido">
                                🍳 Preparar
                            </button>` : ''}
                        ${(order.status || 'pendente') === 'preparando' ? 
                            `<button class="action-btn btn-warning" 
                                    onclick="AdminPanel.updateOrderStatusQuick('${order.order_id || order.id}', 'pronto')"
                                    title="Marcar pedido como pronto">
                                ✅ Pronto
                            </button>` : ''}
                        ${(order.status || 'pendente') === 'pronto' ? 
                            `<button class="action-btn btn-success" 
                                    onclick="AdminPanel.updateOrderStatusQuick('${order.order_id || order.id}', 'entregue')"
                                    title="Marcar pedido como entregue">
                                🚚 Entregar
                            </button>` : ''}
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    getPaymentMethodText(paymentMethod) {
        const paymentMap = {
            'pix': '<span title="Pagamento via Pix">💰 Pix</span>',
            'cartao': '<span title="Pagamento com Cartão">💳 Cartão</span>',
            'dinheiro': '<span title="Pagamento em Dinheiro">💵 Dinheiro</span>',
            'card': '<span title="Pagamento com Cartão">💳 Cartão</span>',
            'cash': '<span title="Pagamento em Dinheiro">💵 Dinheiro</span>',
            'money': '<span title="Pagamento em Dinheiro">💵 Dinheiro</span>'
        };
        
        // Normaliza o método de pagamento para minúsculas
        const normalizedMethod = paymentMethod?.toLowerCase() || 'pix';
        
        return paymentMap[normalizedMethod] || `<span title="Pagamento via ${paymentMethod}">${paymentMethod}</span>`;
    }
    
    updateOrderCount() {
        const orderCount = document.getElementById('orderCount');
        if (orderCount) {
            orderCount.textContent = `${this.filteredOrders.length} pedido${this.filteredOrders.length !== 1 ? 's' : ''}`;
        }
    }
    
    updateNoOrdersMessage() {
        const noOrdersMessage = document.getElementById('noOrdersMessage');
        const tbody = document.getElementById('ordersBody');
        
        if (this.filteredOrders.length === 0) {
            noOrdersMessage.style.display = 'block';
            tbody.innerHTML = '';
        } else {
            noOrdersMessage.style.display = 'none';
        }
    }
    
    getStatusText(status) {
        const statusMap = {
            'pendente': '📋 Pendente',
            'preparando': '👨‍🍳 Preparando',
            'pronto': '✅ Pronto',
            'entregue': '🚗 Entregue',
            'cancelado': '❌ Cancelado'
        };
        return statusMap[status] || status;
    }
    
    formatPhone(phone) {
        if (!phone) return 'N/A';
        const cleanPhone = phone.toString().replace(/\D/g, '');
        
        if (cleanPhone.length === 13) { // +55 format
            return `(${cleanPhone.substring(3, 5)}) ${cleanPhone.substring(5, 10)}-${cleanPhone.substring(10)}`;
        } else if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
        } else if (cleanPhone.length === 10) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
        }
        return phone;
    }
    
    async viewOrder(orderId) {
        try {
            this.showModalLoading(true);
            const orderDetails = await this.getOrderDetails(orderId);
            
            const modalContent = document.getElementById('modalContent');
            
            const customer = orderDetails.customer || {};
            const order = orderDetails.order || {};
            const items = orderDetails.items || [];
            
            const subtotal = parseFloat(order.subtotal || order.total || 0);
            const deliveryFee = parseFloat(order.delivery_fee || order.deliveryFee || 0);
            const total = parseFloat(order.total || order.total_amount || 0);
            const createdDate = new Date(order.created_at).toLocaleString('pt-BR');
            
            // CORREÇÃO: Usar a função getPaymentMethodText para mostrar o método de pagamento corretamente
            const paymentMethodText = this.getPaymentMethodText(order.payment_method || order.paymentMethod || 'pix');
            const paymentHtml = paymentMethodText.replace('<span', '<span style="display: inline-flex; align-items: center; gap: 5px;"');
            
            modalContent.innerHTML = `
                <div class="modal-section">
                    <h4>📋 Informações do Pedido</h4>
                    <div class="info-row">
                        <span class="info-label">ID do Pedido:</span>
                        <span><code>${order.order_id || order.id}</code></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span><span class="status-badge status-${order.status || 'pendente'}">${this.getStatusText(order.status || 'pendente')}</span></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Data e Hora:</span>
                        <span>${createdDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Entrega:</span>
                        <span>${order.delivery_option === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Pagamento:</span>
                        <span>${paymentHtml}</span>
                    </div>
                    ${order.observation ? `
                    <div class="info-row">
                        <span class="info-label">Observação:</span>
                        <span style="color: #e67e22; font-style: italic;">${order.observation}</span>
                    </div>` : ''}
                </div>
                
                <div class="modal-section">
                    <h4>👤 Informações do Cliente</h4>
                    <div class="info-row">
                        <span class="info-label">Nome:</span>
                        <span><strong>${customer.name || 'N/A'}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Telefone:</span>
                        <span>${this.formatPhone(customer.phone)}</span>
                    </div>
                    ${order.delivery_option === 'entrega' ? `
                    <div class="info-row">
                        <span class="info-label">Endereço:</span>
                        <span>${customer.address || order.address || 'N/A'}</span>
                    </div>
                    ${customer.street ? `<div class="info-row">
                        <span class="info-label">Rua:</span>
                        <span>${customer.street}</span>
                    </div>` : ''}
                    ${customer.number ? `<div class="info-row">
                        <span class="info-label">Número:</span>
                        <span>${customer.number}</span>
                    </div>` : ''}
                    ${customer.neighborhood ? `<div class="info-row">
                        <span class="info-label">Bairro:</span>
                        <span>${customer.neighborhood}</span>
                    </div>` : ''}
                    ${customer.city ? `<div class="info-row">
                        <span class="info-label">Cidade:</span>
                        <span>${customer.city}</span>
                    </div>` : ''}
                    ${customer.cep ? `<div class="info-row">
                        <span class="info-label">CEP:</span>
                        <span>${customer.cep}</span>
                    </div>` : ''}
                    ${customer.complement ? `<div class="info-row">
                        <span class="info-label">Complemento:</span>
                        <span>${customer.complement}</span>
                    </div>` : ''}` : ''}
                </div>
                
                <div class="modal-section">
                    <h4>🛒 Itens do Pedido</h4>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Preço Unit.</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td><strong>${item.product_name || item.name}</strong></td>
                                    <td>${item.quantity}</td>
                                    <td>R$ ${parseFloat(item.price || item.unit_price || 0).toFixed(2)}</td>
                                    <td><strong>R$ ${(parseFloat(item.price || item.unit_price || 0) * parseInt(item.quantity)).toFixed(2)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="modal-section">
                    <h4>💰 Resumo Financeiro</h4>
                    <div class="info-row">
                        <span class="info-label">Subtotal:</span>
                        <span>R$ ${subtotal.toFixed(2)}</span>
                    </div>
                    ${deliveryFee > 0 ? `
                    <div class="info-row">
                        <span class="info-label">Frete:</span>
                        <span>R$ ${deliveryFee.toFixed(2)}</span>
                    </div>` : ''}
                    <div class="info-row" style="font-weight: bold; border-top: 2px solid var(--primary); padding-top: 1rem;">
                        <span class="info-label">Total:</span>
                        <span style="color: var(--primary); font-size: 1.1em;">R$ ${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="action-btn btn-primary" 
                            onclick="AdminPanel.editOrderStatus('${order.order_id || order.id}')">
                        ✏️ Alterar Status
                    </button>
                    <a href="/order.html?orderId=${order.order_id || order.id}" 
                       target="_blank" 
                       class="action-btn btn-info">
                        📄 Ver Página do Pedido
                    </a>
                    ${customer.phone ? `
                    <a href="https://api.whatsapp.com/send?phone=${customer.phone}&text=Olá ${customer.name || ''}, vi seu pedido na Padaria Jardim!" 
                       target="_blank" 
                       class="action-btn btn-success">
                        📱 WhatsApp
                    </a>` : ''}
                </div>
            `;
            
            document.getElementById('orderModal').style.display = 'flex';
            
        } catch (error) {
            console.error('❌ Erro ao visualizar pedido:', error);
            this.showError('Erro ao carregar detalhes do pedido: ' + error.message);
        } finally {
            this.showModalLoading(false);
        }
    }
    
    editOrderStatus(orderId) {
        this.currentOrderId = orderId;
        document.getElementById('editStatusModal').style.display = 'flex';
    }
    
    async saveOrderStatus() {
        if (!this.currentOrderId) {
            this.showError('Nenhum pedido selecionado');
            return;
        }
        
        const newStatus = document.getElementById('newStatusSelect').value;
        
        try {
            // Atualiza no banco de dados
            const result = await this.updateOrderStatus(this.currentOrderId, newStatus);
            
            if (result.success) {
                // Atualiza localmente
                const orderIndex = this.orders.findIndex(o => 
                    o.order_id === this.currentOrderId || o.id === this.currentOrderId
                );
                
                if (orderIndex > -1) {
                    this.orders[orderIndex].status = newStatus;
                    this.filteredOrders = [...this.orders];
                    this.applyFilters();
                    this.displayOrders();
                    this.updateOrderCount();
                    
                    // ATUALIZADO: Atualiza estatísticas
                    this.updateStats();
                }
                
                this.closeEditStatusModal();
                this.showSuccess('✅ Status atualizado com sucesso!');
            } else {
                throw new Error(result.message || 'Erro ao atualizar status');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            this.showError('❌ Erro ao atualizar status: ' + error.message);
        }
    }
    
    async updateOrderStatusQuick(orderId, newStatus) {
        if (!confirm(`Deseja alterar o status do pedido para "${this.getStatusText(newStatus)}"?`)) {
            return;
        }
        
        try {
            // Atualiza no banco de dados
            const result = await this.updateOrderStatus(orderId, newStatus);
            
            if (result.success) {
                // Atualiza localmente
                const orderIndex = this.orders.findIndex(o => 
                    o.order_id === orderId || o.id === orderId
                );
                
                if (orderIndex > -1) {
                    this.orders[orderIndex].status = newStatus;
                    this.filteredOrders = [...this.orders];
                    this.applyFilters();
                    this.displayOrders();
                    this.updateOrderCount();
                    
                    // ATUALIZADO: Atualiza estatísticas
                    this.updateStats();
                }
                
                this.showSuccess(`✅ Status atualizado para: ${this.getStatusText(newStatus)}`);
            } else {
                throw new Error(result.message || 'Erro ao atualizar status');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            this.showError('❌ Erro ao atualizar status: ' + error.message);
        }
    }
    
    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const deliveryFilter = document.getElementById('deliveryFilter').value;
        const paymentFilter = document.getElementById('paymentFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        this.filteredOrders = this.orders.filter(order => {
            // Filtro por status
            const orderStatus = order.status || 'pendente';
            if (statusFilter && orderStatus !== statusFilter) return false;
            
            // Filtro por tipo de entrega
            const deliveryOption = order.delivery_option || order.deliveryOption;
            if (deliveryFilter && deliveryOption !== deliveryFilter) return false;
            
            // Filtro por forma de pagamento
            const paymentMethod = order.payment_method || order.paymentMethod;
            if (paymentFilter) {
                // Normaliza ambos para comparação
                const normalizedFilter = paymentFilter.toLowerCase();
                const normalizedMethod = (paymentMethod || 'pix').toLowerCase();
                
                // Mapeia sinônimos para os valores do filtro
                const paymentMapping = {
                    'pix': ['pix'],
                    'cartao': ['cartao', 'card', 'credit', 'debit'],
                    'dinheiro': ['dinheiro', 'cash', 'money']
                };
                
                const allowedMethods = paymentMapping[normalizedFilter] || [normalizedFilter];
                if (!allowedMethods.includes(normalizedMethod)) return false;
            }
            
            // Filtro por busca
            if (searchTerm) {
                const searchableText = `
                    ${order.order_id || order.id || ''}
                    ${order.client_name || order.client?.name || ''}
                    ${order.client_phone || order.client?.phone || ''}
                `.toLowerCase();
                
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            // Filtro por data
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
    }
    
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
    }
    
    exportData() {
        if (this.filteredOrders.length === 0) {
            this.showError('Não há dados para exportar');
            return;
        }
        
        const data = this.filteredOrders.map(order => ({
            ID: order.order_id || order.id,
            Cliente: order.client_name || order.client?.name || '',
            Telefone: order.client_phone || order.client?.phone || '',
            Total: `R$ ${parseFloat(order.total || order.total_amount || 0).toFixed(2)}`,
            Status: this.getStatusText(order.status || 'pendente'),
            Entrega: order.delivery_option || order.deliveryOption || 'entrega',
            Pagamento: this.getPaymentMethodText(order.payment_method || order.paymentMethod || 'pix').replace(/<[^>]*>/g, ''),
            Data: new Date(order.created_at).toLocaleString('pt-BR')
        }));
        
        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, `pedidos_jardim_${new Date().toISOString().split('T')[0]}.csv`);
    }
    
    convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    setupEventListeners() {
        // Botão de refresh - ATUALIZADO para recarregar estatísticas também
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadAllData();
            this.showSuccess('🔄 Dados atualizados');
        });
        
        // Botão de exportar
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        // Filtros
        document.getElementById('statusFilter')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('deliveryFilter')?.addEventListener('change', () => {
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
        
        // Ordenação das colunas
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
        
        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeEditStatusModal();
                this.closeErrorModal();
            }
        });
    }
    
    showLoading(show) {
        const tbody = document.getElementById('ordersBody');
        if (!tbody) return;
        
        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="loading">
                        <div class="loading-spinner"></div>
                        <p>Carregando pedidos...</p>
                    </td>
                </tr>
            `;
        }
    }
    
    showModalLoading(show) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        if (show) {
            modalContent.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando detalhes do pedido...</p>
                </div>
            `;
        }
    }
    
    showOrdersError(message) {
        const tbody = document.getElementById('ordersBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem;">
                        <div class="error-message">
                            <p><strong>❌ ${message}</strong></p>
                            <p style="font-size: 0.9em; margin-top: 0.5rem;">Verifique a conexão com o servidor</p>
                        </div>
                        <button onclick="AdminPanel.loadOrders()" class="action-btn btn-primary" style="margin-top: 1.5rem;">
                            🔄 Tentar Novamente
                        </button>
                    </td>
                </tr>
            `;
        }
    }
    
    showStatsError(message) {
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card" style="grid-column: 1 / -1;">
                    <div class="stat-value" style="color: var(--error);">❌</div>
                    <div class="stat-label">${message}</div>
                </div>
            `;
        }
    }
    
    showError(message) {
        const errorContent = document.getElementById('errorContent');
        if (errorContent) {
            errorContent.innerHTML = `<p>${message}</p>`;
        }
        document.getElementById('errorModal').style.display = 'flex';
    }
    
    showSuccess(message) {
        // Cria um toast notification temporário
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--success);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 0.75rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                z-index: 9999;
                animation: slideIn 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    closeModal() {
        document.getElementById('orderModal').style.display = 'none';
    }
    
    closeEditStatusModal() {
        document.getElementById('editStatusModal').style.display = 'none';
        this.currentOrderId = null;
    }
    
    closeErrorModal() {
        document.getElementById('errorModal').style.display = 'none';
    }
    
    updateTimestamp() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleString('pt-BR');
        }
    }
}

// Funções globais para acesso via onclick
window.AdminPanel = new AdminPanel();

// Shortcut functions
window.viewOrder = (orderId) => AdminPanel.viewOrder(orderId);
window.editOrderStatus = (orderId) => AdminPanel.editOrderStatus(orderId);
window.updateOrderStatusQuick = (orderId, status) => AdminPanel.updateOrderStatusQuick(orderId, status);
window.closeModal = () => AdminPanel.closeModal();
window.closeEditStatusModal = () => AdminPanel.closeEditStatusModal();
window.closeErrorModal = () => AdminPanel.closeErrorModal();

// Adiciona estilo CSS para o toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .toast-notification {
        transition: all 0.3s ease;
    }
    
    .phone-number {
        font-family: 'Courier New', monospace;
        font-weight: 500;
    }
    
    .date-time {
        white-space: nowrap;
    }
    
    .payment-method {
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
`;
document.head.appendChild(style);

// Cria instância global
let adminPanelInstance = null;

// Inicializa quando o DOM carrega
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, inicializando AdminPanel...');
    adminPanelInstance = new AdminPanel();
    
    // Torna os métodos disponíveis globalmente
    window.adminPanel = adminPanelInstance;
    
    // Funções de atalho globais
    window.viewOrder = (orderId) => adminPanelInstance.viewOrder(orderId);
    window.editOrderStatus = (orderId) => adminPanelInstance.editOrderStatus(orderId);
    window.updateOrderStatusQuick = (orderId, status) => adminPanelInstance.updateOrderStatusQuick(orderId, status);
    window.closeModal = () => adminPanelInstance.closeModal();
    window.closeEditStatusModal = () => adminPanelInstance.closeEditStatusModal();
    window.closeErrorModal = () => adminPanelInstance.closeErrorModal();
    window.saveOrderStatus = () => adminPanelInstance.saveOrderStatus();
    
    console.log('✅ AdminPanel disponível globalmente como window.adminPanel');
});