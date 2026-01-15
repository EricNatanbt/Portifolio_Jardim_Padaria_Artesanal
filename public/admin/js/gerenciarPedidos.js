// Admin Panel JavaScript - Enhanced Version
class AdminPanel {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.allOrderItems = [];
        this.currentSort = { column: 'created_at', direction: 'desc' };
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalPages = 1;
        this.charts = {};
        this.selectedOrders = new Set();
        this.apiBase = window.location.origin + '/api';
        this.productAnalysis = [];
        this.productCombinations = [];
        
        // Inicializa
        this.init();
    }
    
    async init() {
        console.log('🚀 Inicializando AdminPanel Enhanced...');
        
        // Configura abas
        this.setupTabs();
        
        // Configura listeners
        this.setupEventListeners();
        
        // Carrega dados
        await this.loadAllData();
        
        // Atualiza timestamp
        this.updateTimestamp();
        
        console.log('✅ AdminPanel Enhanced inicializado');
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const tabId = tab.dataset.tab;
                const content = document.getElementById(`tab-${tabId}`);
                if (content) {
                    content.classList.add('active');
                    
                    // Carrega dados específicos da aba
                    this.loadTabData(tabId);
                }
            });
        });
    }
    
    loadTabData(tabId) {
        switch(tabId) {
            case 'orders':
                this.setupOrdersTab();
                break;
            case 'analytics':
                this.setupAnalyticsTab();
                break;
            case 'products':
                this.setupProductsTab();
                break;
            case 'reports':
                this.setupReportsTab();
                break;
        }
    }
    
    async loadAllData() {
        try {
            this.showLoading(true);
            
            // Carrega pedidos
            await this.loadOrders();
            
            // Processa dados
            await this.processOrdersData();
            
            // Analisa produtos
            this.analyzeProducts();
            
            // Atualiza estatísticas
            this.updateStats();
            
            // Atualiza gráficos iniciais
            this.updateCharts();
            
            // Atualiza timestamp
            this.updateTimestamp();
            
            this.showSuccess('✅ Dados carregados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadOrders() {
        try {
            // Tenta buscar da API local
            const response = await fetch(`${this.apiBase}/get-all-orders`);
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.orders) {
                    this.orders = result.orders;
                    console.log(`✅ ${this.orders.length} pedidos carregados da API`);
                    
                    // Se não houver pedidos na API, usa os de exemplo para preencher a tela
                    if (this.orders.length === 0) {
                        console.log('⚠️ API retornou 0 pedidos, usando dados de exemplo para demonstração');
                        this.orders = this.getSampleOrders();
                    }
                    return;
                }
            }
            
            // Se não conseguir da API, usa dados de exemplo
            this.orders = this.getSampleOrders();
            console.log(`⚠️ Usando dados de exemplo: ${this.orders.length} pedidos`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar pedidos:', error);
            
            // Fallback para dados de exemplo
            this.orders = this.getSampleOrders();
            console.log(`⚠️ Usando dados de exemplo (fallback): ${this.orders.length} pedidos`);
        }
    }
    
    // Dados de exemplo para demonstração
    getSampleOrders() {
        const statuses = ['pendente', 'preparando', 'pronto', 'entregue', 'cancelado'];
        const paymentMethods = ['pix', 'cartao', 'dinheiro'];
        const deliveryOptions = ['entrega', 'retirada'];
        const clientNames = ['Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Carla Rodrigues'];
        const products = [
            { name: 'Pão Francês', price: 0.50 },
            { name: 'Pão de Queijo', price: 2.50 },
            { name: 'Croissant', price: 4.00 },
            { name: 'Bolo de Cenoura', price: 8.00 },
            { name: 'Torta de Frango', price: 6.50 },
            { name: 'Café Expresso', price: 3.00 },
            { name: 'Suco Natural', price: 5.00 },
            { name: 'Brigadeiro', price: 1.50 }
        ];
        
        const orders = [];
        const now = new Date();
        
        for (let i = 1; i <= 50; i++) {
            const orderDate = new Date();
            orderDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
            orderDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
            
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const itemCount = 1 + Math.floor(Math.random() * 4);
            let total = 0;
            const items = [];
            
            for (let j = 0; j < itemCount; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = 1 + Math.floor(Math.random() * 3);
                const itemTotal = product.price * quantity;
                total += itemTotal;
                
                items.push({
                    product_name: product.name,
                    quantity: quantity,
                    price: product.price,
                    total: itemTotal
                });
            }
            
            // Adiciona taxa de entrega se for entrega
            const deliveryOption = deliveryOptions[Math.floor(Math.random() * deliveryOptions.length)];
            if (deliveryOption === 'entrega') {
                total += 5.00; // Taxa de entrega
            }
            
            orders.push({
                id: `ORD${String(i).padStart(4, '0')}`,
                order_id: `ORD${String(i).padStart(4, '0')}`,
                client_name: clientNames[Math.floor(Math.random() * clientNames.length)],
                client_phone: `1198765${String(1000 + i).substring(1)}`,
                total: total.toFixed(2),
                total_amount: total.toFixed(2),
                status: status,
                payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                delivery_option: deliveryOption,
                created_at: orderDate.toISOString(),
                observation: i % 3 === 0 ? 'Sem cebola' : i % 4 === 0 ? 'Entrega rápida' : '',
                items: items,
                address: deliveryOption === 'entrega' ? `Rua Exemplo, ${i}00, Centro` : ''
            });
        }
        
        return orders;
    }
    
    async processOrdersData() {
        try {
            // Converte datas e adiciona propriedades úteis
            this.orders.forEach(order => {
                // Garante que temos uma data válida
                if (!order.created_at) {
                    order.created_at = new Date().toISOString();
                }
                
                order.dateObj = new Date(order.created_at);
                order.total_numeric = parseFloat(order.total || order.total_amount || 0) || 0;
                order.status = order.status || 'pendente';
                order.dayOfWeek = order.dateObj.getDay();
                order.hourOfDay = order.dateObj.getHours();
                order.monthYear = `${order.dateObj.getFullYear()}-${(order.dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
            });
            
            // Ordena por data mais recente primeiro
            this.orders.sort((a, b) => b.dateObj - a.dateObj);
            
            // Inicializa filteredOrders com todos os pedidos
            this.filteredOrders = [...this.orders];
            
            console.log(`📊 ${this.orders.length} pedidos processados`);
            
        } catch (error) {
            console.error('❌ Erro ao processar dados dos pedidos:', error);
            throw error;
        }
    }
    
    analyzeProducts() {
        // Análise de produtos mais vendidos
        const productSales = {};
        
        this.orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productName = item.product_name || 'Produto sem nome';
                    const key = productName;
                    
                    if (!productSales[key]) {
                        productSales[key] = {
                            name: productName,
                            quantity: 0,
                            revenue: 0,
                            orders: new Set()
                        };
                    }
                    
                    const quantity = parseInt(item.quantity) || 1;
                    const price = parseFloat(item.price || 0);
                    const total = quantity * price;
                    
                    productSales[key].quantity += quantity;
                    productSales[key].revenue += total;
                    productSales[key].orders.add(order.id);
                });
            }
        });
        
        // Converte para array e ordena
        this.productAnalysis = Object.values(productSales)
            .map(p => ({
                ...p,
                orderCount: p.orders.size,
                avgOrderValue: p.orderCount > 0 ? p.revenue / p.orderCount : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);
        
        console.log('📊 Análise de produtos concluída:', this.productAnalysis.length, 'produtos');
    }
    
    updateStats() {
        const stats = this.calculateLocalStats();
        this.displayStats(stats);
    }
    
    calculateLocalStats() {
        const stats = {
            total: 0,
            pendente: 0,
            preparando: 0,
            pronto: 0,
            entregue: 0,
            cancelado: 0,
            total_value: 0,
            avg_ticket: 0
        };
        
        this.orders.forEach(order => {
            stats.total++;
            
            const status = order.status || 'pendente';
            if (stats[status] !== undefined) {
                stats[status]++;
            } else {
                stats.pendente++;
            }
            
            const value = parseFloat(order.total || order.total_amount || 0);
            if (!isNaN(value)) {
                stats.total_value += value;
            }
        });
        
        stats.avg_ticket = stats.total > 0 ? stats.total_value / stats.total : 0;
        
        return stats;
    }
    
    displayStats(stats) {
        // Atualiza os elementos da visão geral
        const elements = {
            totalOrders: stats.total,
            pendingOrders: stats.pendente,
            preparingOrders: stats.preparando,
            readyOrders: stats.pronto,
            deliveredOrders: stats.entregue,
            totalValue: `R$ ${stats.total_value.toFixed(2)}`,
            avgOrderValue: `R$ ${stats.avg_ticket.toFixed(2)}`
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }
    
    updateCharts() {
        // Gráfico de status
        this.updateStatusChart();
        
        // Gráfico de vendas diárias
        this.updateDailySalesChart();
    }
    
    updateStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        const statusCounts = {
            pendente: 0,
            preparando: 0,
            pronto: 0,
            entregue: 0,
            cancelado: 0
        };
        
        this.orders.forEach(order => {
            const status = order.status || 'pendente';
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });
        
        if (this.charts.status) {
            this.charts.status.destroy();
        }
        
        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Cancelado'],
                datasets: [{
                    data: [
                        statusCounts.pendente,
                        statusCounts.preparando,
                        statusCounts.pronto,
                        statusCounts.entregue,
                        statusCounts.cancelado
                    ],
                    backgroundColor: [
                        '#FFE0B2',
                        '#BBDEFB',
                        '#C8E6C9',
                        '#A5D6A7',
                        '#FFCDD2'
                    ],
                    borderColor: [
                        '#FFB74D',
                        '#64B5F6',
                        '#81C784',
                        '#66BB6A',
                        '#EF5350'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
    
    updateDailySalesChart() {
        const ctx = document.getElementById('dailySalesChart');
        if (!ctx) return;
        
        // Agrupa vendas por dia (últimos 7 dias)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const dailySales = last7Days.map(date => {
            const dayOrders = this.orders.filter(order => {
                const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                return orderDate === date;
            });
            
            return dayOrders.reduce((sum, order) => {
                return sum + parseFloat(order.total || order.total_amount || 0);
            }, 0);
        });
        
        if (this.charts.dailySales) {
            this.charts.dailySales.destroy();
        }
        
        this.charts.dailySales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(date => {
                    const d = new Date(date);
                    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Vendas (R$)',
                    data: dailySales,
                    borderColor: 'rgb(28, 61, 45)',
                    backgroundColor: 'rgba(28, 61, 45, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // TAB: Todos os Pedidos
    setupOrdersTab() {
        console.log('📋 Configurando aba de Pedidos');
        
        // Aplica filtros iniciais
        this.applyFilters();
        
        // Configura visualizações
        this.setupViewOptions();
        
        // Configura paginação
        this.setupPagination();
        
        // Configura seleção
        this.setupSelection();
    }
    
    setupViewOptions() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const views = ['table', 'cards', 'timeline'];
        
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                viewButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Hide all views
                views.forEach(view => {
                    const viewElement = document.getElementById(`${view}View`);
                    if (viewElement) {
                        viewElement.style.display = 'none';
                    }
                });
                
                // Show selected view
                const selectedView = btn.dataset.view;
                const selectedViewElement = document.getElementById(`${selectedView}View`);
                if (selectedViewElement) {
                    selectedViewElement.style.display = 'block';
                }
                
                // Update content for selected view
                if (selectedView === 'cards') {
                    this.displayOrdersAsCards();
                } else if (selectedView === 'timeline') {
                    this.displayOrdersAsTimeline();
                } else {
                    this.displayOrders();
                }
            });
        });
    }
    
    setupPagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageSizeSelect = document.getElementById('pageSize');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.displayCurrentView();
                    this.updatePaginationInfo();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.displayCurrentView();
                    this.updatePaginationInfo();
                }
            });
        }
        
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => {
                this.pageSize = parseInt(pageSizeSelect.value);
                this.currentPage = 1;
                this.calculateTotalPages();
                this.displayCurrentView();
                this.updatePaginationInfo();
            });
        }
    }
    
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize);
    }
    
    updatePaginationInfo() {
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === this.totalPages;
        }
    }
    
    setupSelection() {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.order-select');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    const orderId = cb.dataset.orderId;
                    if (e.target.checked) {
                        this.selectedOrders.add(orderId);
                    } else {
                        this.selectedOrders.delete(orderId);
                    }
                });
                
                this.updateSelectionUI();
            });
        }
    }
    
    updateSelectionUI() {
        const selectedCount = document.getElementById('selectedCount');
        const batchActions = document.getElementById('batchActions');
        
        if (selectedCount) {
            selectedCount.textContent = `${this.selectedOrders.size} selecionado${this.selectedOrders.size !== 1 ? 's' : ''}`;
        }
        
        if (batchActions) {
            batchActions.style.display = this.selectedOrders.size > 0 ? 'flex' : 'none';
        }
    }
    
    applyFilters() {
        const filters = this.getCurrentFilters();
        this.filteredOrders = this.applyAdvancedFilters(this.orders, filters);
        this.calculateTotalPages();
        this.currentPage = 1;
        this.displayCurrentView();
        this.updatePaginationInfo();
        this.updateFilterStats();
    }
    
    getCurrentFilters() {
        const statusCheckboxes = document.querySelectorAll('.status-checkbox:checked');
        const paymentCheckboxes = document.querySelectorAll('.payment-checkbox:checked');
        
        return {
            startDate: document.getElementById('startDate')?.value || '',
            endDate: document.getElementById('endDate')?.value || '',
            minValue: document.getElementById('minValue')?.value ? 
                     parseFloat(document.getElementById('minValue').value) : null,
            maxValue: document.getElementById('maxValue')?.value ? 
                     parseFloat(document.getElementById('maxValue').value) : null,
            statuses: Array.from(statusCheckboxes).map(cb => cb.value),
            deliveryType: document.querySelector('input[name="delivery"]:checked')?.value || 'todos',
            paymentMethods: Array.from(paymentCheckboxes).map(cb => cb.value),
            searchTerm: document.getElementById('searchInput')?.value.toLowerCase() || ''
        };
    }
    
    applyAdvancedFilters(orders, filters) {
        return orders.filter(order => {
            // Filtro por data
            if (filters.startDate || filters.endDate) {
                const orderDate = new Date(order.created_at);
                
                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    if (orderDate < startDate) return false;
                }
                
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    if (orderDate > endDate) return false;
                }
            }
            
            // Filtro por valor
            const orderValue = order.total_numeric || 0;
            if (filters.minValue !== null && orderValue < filters.minValue) return false;
            if (filters.maxValue !== null && orderValue > filters.maxValue) return false;
            
            // Filtro por status
            if (filters.statuses.length > 0 && !filters.statuses.includes(order.status || 'pendente')) {
                return false;
            }
            
            // Filtro por tipo de entrega
            const deliveryOption = (order.delivery_option || 'entrega').toLowerCase();
            if (filters.deliveryType !== 'todos' && deliveryOption !== filters.deliveryType) {
                return false;
            }
            
            // Filtro por método de pagamento
            if (filters.paymentMethods.length > 0) {
                const paymentMethod = (order.payment_method || 'pix').toLowerCase();
                const matchesPayment = filters.paymentMethods.some(method => {
                    return paymentMethod.includes(method.toLowerCase());
                });
                if (!matchesPayment) return false;
            }
            
            // Filtro de busca
            if (filters.searchTerm) {
                const searchableText = `
                    ${order.order_id || order.id || ''}
                    ${order.client_name || ''}
                    ${order.client_phone || ''}
                    ${order.observation || ''}
                    ${order.address || ''}
                `.toLowerCase();
                
                if (!searchableText.includes(filters.searchTerm)) return false;
            }
            
            return true;
        });
    }
    
    updateFilterStats() {
        const orderCount = document.getElementById('orderCount');
        const filteredValue = document.getElementById('filteredValue');
        
        if (orderCount) {
            orderCount.textContent = `${this.filteredOrders.length} pedido${this.filteredOrders.length !== 1 ? 's' : ''}`;
        }
        
        if (filteredValue) {
            const totalValue = this.filteredOrders.reduce((sum, order) => {
                return sum + (order.total_numeric || 0);
            }, 0);
            filteredValue.textContent = `Total: R$ ${totalValue.toFixed(2)}`;
        }
    }
    
    displayCurrentView() {
        const activeView = document.querySelector('.view-btn.active')?.dataset.view || 'table';
        
        switch(activeView) {
            case 'table':
                this.displayOrders();
                break;
            case 'cards':
                this.displayOrdersAsCards();
                break;
            case 'timeline':
                this.displayOrdersAsTimeline();
                break;
        }
        
        this.updateNoOrdersMessage();
    }
    
    displayOrders() {
        const tbody = document.getElementById('ordersBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.filteredOrders.length === 0) {
            this.updateNoOrdersMessage();
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);
        
        pageOrders.forEach(order => {
            const row = this.createOrderRow(order);
            tbody.appendChild(row);
        });
    }
    
    createOrderRow(order) {
        const row = document.createElement('tr');
        const orderId = order.order_id || order.id;
        
        const date = new Date(order.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const total = order.total_numeric || 0;
        const deliveryOption = order.delivery_option || 'entrega';
        const paymentMethod = order.payment_method || 'pix';
        const isSelected = this.selectedOrders.has(orderId);
        
        if (isSelected) {
            row.classList.add('selected');
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="order-select" 
                       data-order-id="${orderId}"
                       ${isSelected ? 'checked' : ''}
                       onchange="window.AdminPanel.toggleOrderSelection('${orderId}', this.checked)">
            </td>
            <td>
                <a href="#" class="order-id-link" title="Ver detalhes do pedido" onclick="window.AdminPanel.openOrderDetails('${orderId}'); return false;">
                    <strong>${orderId}</strong>
                </a>
            </td>
            <td>
                <div class="customer-cell">
                    <strong>${order.client_name || 'N/A'}</strong>
                    ${order.client_phone ? `
                    <br><small class="phone-hint" title="${this.formatPhone(order.client_phone)}">
                        📞 ${this.formatPhone(order.client_phone)}
                    </small>` : ''}
                </div>
            </td>
            <td>
                <span class="phone-number" title="${order.client_phone || ''}">
                    ${this.formatPhone(order.client_phone)}
                </span>
            </td>
            <td>
                <strong class="order-value">R$ ${total.toFixed(2)}</strong>
            </td>
            <td>
                <span class="status-badge status-${order.status || 'pendente'}">
                    ${this.getStatusText(order.status || 'pendente')}
                </span>
            </td>
            <td>
                ${deliveryOption === 'retirada' ? 
                    '<span class="delivery-type" title="Retirada na Loja"><i class="fas fa-store"></i> Retirada</span>' : 
                    '<span class="delivery-type" title="Entrega em Domicílio"><i class="fas fa-motorcycle"></i> Entrega</span>'}
            </td>
            <td>
                ${paymentMethod === 'pix' ? '<span title="Pagamento via Pix"><i class="fas fa-qrcode"></i> Pix</span>' : 
                  paymentMethod === 'cartao' ? '<span title="Pagamento com Cartão"><i class="far fa-credit-card"></i> Cartão</span>' : 
                  '<span title="Pagamento em Dinheiro"><i class="fas fa-money-bill-wave"></i> Dinheiro</span>'}
            </td>
            <td>
                <span class="date-time" title="${date.toLocaleString('pt-BR')}">
                    <i class="far fa-calendar"></i> ${formattedDate}
                    <br><i class="far fa-clock"></i> ${formattedTime}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-primary" title="Ver detalhes do pedido" onclick="window.AdminPanel.openOrderDetails('${orderId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-info" title="Alterar status do pedido" onclick="window.AdminPanel.openEditStatus('${orderId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${order.client_phone ? `
                    <button class="action-btn btn-success" title="Abrir WhatsApp" 
                            onclick="window.open('https://api.whatsapp.com/send?phone=${order.client_phone}', '_blank')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        return row;
    }

    async openOrderDetails(orderId) {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBase}/orders/${orderId}`);
            if (!response.ok) throw new Error('Pedido não encontrado');
            
            const order = await response.json();
            const modal = document.getElementById('orderModal');
            const content = document.getElementById('modalContent');
            
            if (modal && content) {
                const date = new Date(order.created_at);
                content.innerHTML = `
                    <div class="order-details-grid">
                        <div class="details-section">
                            <h3><i class="fas fa-user"></i> Cliente</h3>
                            <p><strong>Nome:</strong> ${order.client_name}</p>
                            <p><strong>Telefone:</strong> ${this.formatPhone(order.client_phone)}</p>
                            <p><strong>Endereço:</strong> ${order.address || 'Retirada na loja'}</p>
                        </div>
                        <div class="details-section">
                            <h3><i class="fas fa-info-circle"></i> Pedido</h3>
                            <p><strong>ID:</strong> ${order.order_id}</p>
                            <p><strong>Data:</strong> ${date.toLocaleString('pt-BR')}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span></p>
                            <p><strong>Pagamento:</strong> ${order.payment_method}</p>
                        </div>
                    </div>
                    <div class="order-items-section">
                        <h3><i class="fas fa-shopping-basket"></i> Itens</h3>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Qtd</th>
                                    <th>Preço</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.product_name}</td>
                                        <td>${item.quantity}</td>
                                        <td>R$ ${parseFloat(item.price).toFixed(2)}</td>
                                        <td>R$ ${parseFloat(item.total).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                                    <td><strong>R$ ${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    ${order.observation ? `
                    <div class="order-obs-section">
                        <h3><i class="fas fa-comment"></i> Observação</h3>
                        <p>${order.observation}</p>
                    </div>
                    ` : ''}
                    <div class="modal-footer">
                        <button class="btn btn-info" onclick="window.AdminPanel.openEditStatus('${orderId}')">Alterar Status</button>
                        <button class="btn btn-danger" onclick="window.AdminPanel.deleteOrder('${orderId}')">Excluir Pedido</button>
                    </div>
                `;
                modal.style.display = 'flex';
            }
        } catch (error) {
            this.showError('Erro ao carregar detalhes: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    openEditStatus(orderId) {
        const order = this.orders.find(o => (o.order_id || o.id) === orderId);
        if (!order) return;

        const modal = document.getElementById('editStatusModal');
        const content = document.getElementById('editStatusContent');
        
        if (modal && content) {
            content.innerHTML = `
                <p>Alterar status do pedido <strong>${orderId}</strong></p>
                <div class="status-options">
                    ${['pendente', 'preparando', 'pronto', 'entregue', 'cancelado'].map(s => `
                        <label class="status-option">
                            <input type="radio" name="newStatus" value="${s}" ${order.status === s ? 'checked' : ''}>
                            <span class="status-badge status-${s}">${this.getStatusText(s)}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="modal-footer" style="margin-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="window.AdminPanel.updateOrderStatus('${orderId}')">Salvar Alteração</button>
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    async updateOrderStatus(orderId) {
        const selectedStatus = document.querySelector('input[name="newStatus"]:checked')?.value;
        if (!selectedStatus) return;

        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBase}/update-order-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: selectedStatus })
            });

            if (response.ok) {
                this.showSuccess('Status atualizado com sucesso!');
                this.closeEditStatusModal();
                this.closeModal();
                await this.loadAllData();
            } else {
                throw new Error('Erro ao atualizar status');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async deleteOrder(orderId) {
        if (!confirm(`Tem certeza que deseja excluir o pedido ${orderId}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBase}/delete-order/${orderId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showSuccess('Pedido excluído com sucesso!');
                this.closeModal();
                await this.loadAllData();
            } else {
                throw new Error('Erro ao excluir pedido');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    displayOrdersAsCards() {
        const container = document.getElementById('cardsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.filteredOrders.length === 0) {
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);
        
        pageOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';
            
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR');
            const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const total = order.total_numeric || 0;
            const deliveryOption = order.delivery_option || 'entrega';
            const paymentMethod = order.payment_method || 'pix';
            
            card.innerHTML = `
                <div class="order-card-header">
                    <div class="order-card-id">Pedido ${order.order_id || order.id}</div>
                    <input type="checkbox" class="order-select" 
                           data-order-id="${order.order_id || order.id}"
                           onchange="window.AdminPanel.toggleOrderSelection('${order.order_id || order.id}', this.checked)">
                </div>
                <div class="order-card-client">
                    <div class="order-card-client-name">${order.client_name || 'Cliente'}</div>
                    <div class="order-card-client-phone">${this.formatPhone(order.client_phone)}</div>
                </div>
                <div class="order-card-details">
                    <div class="order-card-detail">
                        <i class="fas fa-money-bill"></i>
                        R$ ${total.toFixed(2)}
                    </div>
                    <div class="order-card-detail">
                        <i class="fas fa-truck"></i>
                        ${deliveryOption === 'retirada' ? 'Retirada' : 'Entrega'}
                    </div>
                    <div class="order-card-detail">
                        <i class="fas fa-credit-card"></i>
                        ${paymentMethod === 'pix' ? 'PIX' : 
                          paymentMethod === 'cartao' ? 'Cartão' : 'Dinheiro'}
                    </div>
                </div>
                <div class="order-card-status">
                    <span class="status-badge status-${order.status || 'pendente'}">
                        ${this.getStatusText(order.status || 'pendente')}
                    </span>
                </div>
                <div class="order-card-actions">
                    <button class="action-btn btn-primary small" title="Ver detalhes" onclick="window.AdminPanel.openOrderDetails('${order.order_id || order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-info small" title="Alterar status" onclick="window.AdminPanel.openEditStatus('${order.order_id || order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${order.client_phone ? `
                    <button class="action-btn btn-success small" title="WhatsApp"
                            onclick="window.open('https://api.whatsapp.com/send?phone=${order.client_phone}', '_blank')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    ` : ''}
                </div>
                <div class="order-card-time">
                    <small><i class="fas fa-clock"></i> ${formattedDate} ${formattedTime}</small>
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    displayOrdersAsTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.filteredOrders.length === 0) {
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);
        
        pageOrders.forEach(order => {
            const item = document.createElement('div');
            item.className = `timeline-item ${order.status || 'pendente'}`;
            
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR');
            const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const total = order.total_numeric || 0;
            
            item.innerHTML = `
                <div class="timeline-time">
                    <i class="fas fa-clock"></i> ${formattedDate} ${formattedTime}
                </div>
                <div class="timeline-content">
                    <div>
                        <strong>Pedido ${order.order_id || order.id}</strong>
                        <br>${order.client_name || 'Cliente'}
                        <br><small>${this.formatPhone(order.client_phone)}</small>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>R$ ${total.toFixed(2)}</strong></div>
                        <div>
                            <span class="status-badge status-${order.status || 'pendente'}">
                                ${this.getStatusText(order.status || 'pendente')}
                            </span>
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <button class="action-btn btn-primary small" title="Ver detalhes" onclick="window.AdminPanel.openOrderDetails('${order.order_id || order.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    toggleOrderSelection(orderId, selected) {
        if (selected) {
            this.selectedOrders.add(orderId);
        } else {
            this.selectedOrders.delete(orderId);
        }
        
        this.updateSelectionUI();
    }
    
    // TAB: Análises
    setupAnalyticsTab() {
        console.log('📈 Configurando aba de Análises');
        
        // Atualiza gráficos de análise
        this.updateAnalyticsCharts();
        
        // Gera insights
        this.generateInsights();
        
        // Configura período de análise
        this.setupAnalyticsPeriod();
    }
    
    updateAnalyticsCharts() {
        this.updatePeakHoursChart();
        this.updateWeekdayChart();
        this.updatePaymentMethodsChart();
        this.updateDeliveryChart();
        this.updateClientsChart();
        this.updateSalesTrendChart();
    }
    
    updatePeakHoursChart() {
        const ctx = document.getElementById('peakHoursChart');
        if (!ctx) return;
        
        const hourCounts = Array(24).fill(0);
        const hourRevenue = Array(24).fill(0);
        
        this.orders.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            const value = parseFloat(order.total || order.total_amount || 0);
            
            hourCounts[hour]++;
            hourRevenue[hour] += value;
        });
        
        if (this.charts.peakHours) {
            this.charts.peakHours.destroy();
        }
        
        const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        
        this.charts.peakHours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Número de Pedidos',
                    data: hourCounts,
                    backgroundColor: 'rgba(28, 61, 45, 0.6)',
                    borderColor: 'rgba(28, 61, 45, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Pedidos'
                        }
                    }
                }
            }
        });
        
        // Atualiza resumo
        const summaryDiv = document.getElementById('peakHoursSummary');
        if (summaryDiv) {
            let maxCount = 0;
            let maxHour = 0;
            hourCounts.forEach((count, hour) => {
                if (count > maxCount) {
                    maxCount = count;
                    maxHour = hour;
                }
            });
            
            summaryDiv.innerHTML = `
                <p><strong>Horário de Pico:</strong> ${maxHour}:00</p>
                <p><strong>Pedidos no pico:</strong> ${maxCount}</p>
            `;
        }
    }
    
    updateWeekdayChart() {
        const ctx = document.getElementById('weekdayChart');
        if (!ctx) return;
        
        const weekdayCounts = Array(7).fill(0);
        
        this.orders.forEach(order => {
            const weekday = new Date(order.created_at).getDay();
            weekdayCounts[weekday]++;
        });
        
        if (this.charts.weekday) {
            this.charts.weekday.destroy();
        }
        
        const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        this.charts.weekday = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekdayNames,
                datasets: [{
                    label: 'Número de Pedidos',
                    data: weekdayCounts,
                    backgroundColor: 'rgba(28, 61, 45, 0.7)',
                    borderColor: 'rgba(28, 61, 45, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Atualiza resumo
        const summaryDiv = document.getElementById('weekdaySummary');
        if (summaryDiv) {
            let maxCount = 0;
            let maxDay = 0;
            weekdayCounts.forEach((count, day) => {
                if (count > maxCount) {
                    maxCount = count;
                    maxDay = day;
                }
            });
            
            summaryDiv.innerHTML = `
                <p><strong>Melhor dia:</strong> ${weekdayNames[maxDay]}</p>
                <p><strong>Pedidos:</strong> ${maxCount}</p>
            `;
        }
    }
    
    updatePaymentMethodsChart() {
        const ctx = document.getElementById('paymentMethodsChart');
        if (!ctx) return;
        
        const paymentMethods = {
            pix: { label: 'PIX', count: 0, value: 0 },
            cartao: { label: 'Cartão', count: 0, value: 0 },
            dinheiro: { label: 'Dinheiro', count: 0, value: 0 }
        };
        
        this.orders.forEach(order => {
            const method = (order.payment_method || 'pix').toLowerCase();
            const value = parseFloat(order.total || order.total_amount || 0);
            
            if (paymentMethods[method]) {
                paymentMethods[method].count++;
                paymentMethods[method].value += value;
            } else if (method.includes('cart') || method.includes('card')) {
                paymentMethods.cartao.count++;
                paymentMethods.cartao.value += value;
            } else if (method.includes('cash') || method.includes('money') || method.includes('dinheiro')) {
                paymentMethods.dinheiro.count++;
                paymentMethods.dinheiro.value += value;
            } else {
                paymentMethods.pix.count++;
                paymentMethods.pix.value += value;
            }
        });
        
        if (this.charts.paymentMethods) {
            this.charts.paymentMethods.destroy();
        }
        
        this.charts.paymentMethods = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.values(paymentMethods).map(p => p.label),
                datasets: [{
                    data: Object.values(paymentMethods).map(p => p.count),
                    backgroundColor: [
                        'rgba(28, 61, 45, 0.8)',
                        'rgba(216, 166, 94, 0.8)',
                        'rgba(230, 126, 34, 0.8)'
                    ],
                    borderColor: [
                        'rgb(28, 61, 45)',
                        'rgb(216, 166, 94)',
                        'rgb(230, 126, 34)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
        
        // Atualiza resumo
        const summaryDiv = document.getElementById('paymentSummary');
        if (summaryDiv) {
            let html = '<ul style="list-style: none; padding: 0;">';
            Object.values(paymentMethods).forEach(method => {
                if (method.count > 0) {
                    const avg = method.value / method.count;
                    html += `
                        <li style="margin-bottom: 0.5rem;">
                            <strong>${method.label}:</strong>
                            <br>${method.count} pedidos
                            <br>R$ ${method.value.toFixed(2)}
                        </li>
                    `;
                }
            });
            html += '</ul>';
            summaryDiv.innerHTML = html;
        }
    }
    
    updateDeliveryChart() {
        const ctx = document.getElementById('deliveryChart');
        if (!ctx) return;
        
        const deliveryTypes = {
            entrega: { label: 'Entrega', count: 0, value: 0 },
            retirada: { label: 'Retirada', count: 0, value: 0 }
        };
        
        this.orders.forEach(order => {
            const type = (order.delivery_option || 'entrega').toLowerCase();
            const value = parseFloat(order.total || order.total_amount || 0);
            
            if (deliveryTypes[type]) {
                deliveryTypes[type].count++;
                deliveryTypes[type].value += value;
            } else if (type.includes('retirada') || type.includes('pickup')) {
                deliveryTypes.retirada.count++;
                deliveryTypes.retirada.value += value;
            } else {
                deliveryTypes.entrega.count++;
                deliveryTypes.entrega.value += value;
            }
        });
        
        if (this.charts.delivery) {
            this.charts.delivery.destroy();
        }
        
        this.charts.delivery = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.values(deliveryTypes).map(d => d.label),
                datasets: [{
                    data: Object.values(deliveryTypes).map(d => d.count),
                    backgroundColor: [
                        'rgba(28, 61, 45, 0.8)',
                        'rgba(216, 166, 94, 0.8)'
                    ],
                    borderColor: [
                        'rgb(28, 61, 45)',
                        'rgb(216, 166, 94)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
        
        // Atualiza resumo
        const summaryDiv = document.getElementById('deliverySummary');
        if (summaryDiv) {
            let html = '<ul style="list-style: none; padding: 0;">';
            Object.values(deliveryTypes).forEach(type => {
                if (type.count > 0) {
                    const avg = type.value / type.count;
                    html += `
                        <li style="margin-bottom: 0.5rem;">
                            <strong>${type.label}:</strong>
                            <br>${type.count} pedidos
                            <br>R$ ${type.value.toFixed(2)}
                        </li>
                    `;
                }
            });
            html += '</ul>';
            summaryDiv.innerHTML = html;
        }
    }
    
    updateClientsChart() {
        const ctx = document.getElementById('clientsChart');
        if (!ctx) return;
        
        // Análise de clientes recorrentes (simplificada)
        const clientOrders = {};
        
        this.orders.forEach(order => {
            const clientPhone = order.client_phone;
            if (clientPhone) {
                if (!clientOrders[clientPhone]) {
                    clientOrders[clientPhone] = {
                        name: order.client_name || 'Cliente',
                        phone: clientPhone,
                        orderCount: 0,
                        totalSpent: 0
                    };
                }
                
                clientOrders[clientPhone].orderCount++;
                clientOrders[clientPhone].totalSpent += parseFloat(order.total || order.total_amount || 0);
            }
        });
        
        // Converte para array e ordena
        const clientsArray = Object.values(clientOrders)
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5); // Top 5 clientes
        
        if (this.charts.clients) {
            this.charts.clients.destroy();
        }
        
        this.charts.clients = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: clientsArray.map(c => c.name.substring(0, 10) + (c.name.length > 10 ? '...' : '')),
                datasets: [{
                    label: 'Número de Pedidos',
                    data: clientsArray.map(c => c.orderCount),
                    backgroundColor: 'rgba(28, 61, 45, 0.7)',
                    borderColor: 'rgba(28, 61, 45, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Atualiza resumo
        const summaryDiv = document.getElementById('clientsSummary');
        if (summaryDiv && clientsArray.length > 0) {
            const topClient = clientsArray[0];
            
            summaryDiv.innerHTML = `
                <p><strong>Cliente mais fiel:</strong> ${topClient.name}</p>
                <p><strong>Pedidos:</strong> ${topClient.orderCount}</p>
                <p><strong>Total gasto:</strong> R$ ${topClient.totalSpent.toFixed(2)}</p>
            `;
        }
    }
    
    updateSalesTrendChart() {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;
        
        // Agrupa vendas por mês (simplificado)
        const monthlyData = {};
        
        this.orders.forEach(order => {
            const date = new Date(order.created_at);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const value = parseFloat(order.total || order.total_amount || 0);
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    count: 0,
                    revenue: 0
                };
            }
            
            monthlyData[monthKey].count++;
            monthlyData[monthKey].revenue += value;
        });
        
        // Ordena por data
        const sortedMonths = Object.entries(monthlyData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6); // Últimos 6 meses
        
        if (this.charts.salesTrend) {
            this.charts.salesTrend.destroy();
        }
        
        const monthNames = sortedMonths.map(([key]) => {
            const [year, month] = key.split('-');
            return `${month}/${year.substring(2)}`;
        });
        
        const revenueData = sortedMonths.map(([_, data]) => data.revenue);
        
        this.charts.salesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: revenueData,
                    borderColor: 'rgb(28, 61, 45)',
                    backgroundColor: 'rgba(28, 61, 45, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    generateInsights() {
        const insightsContainer = document.getElementById('insightsContainer');
        if (!insightsContainer) return;
        
        const insights = [];
        
        // 1. Insight sobre status pendentes
        const pendingOrders = this.orders.filter(o => o.status === 'pendente');
        if (pendingOrders.length > 3) {
            insights.push({
                type: 'warning',
                title: '⚠️ Pedidos Pendentes',
                message: `${pendingOrders.length} pedidos aguardando processamento.`,
                action: 'Ver pendentes'
            });
        }
        
        // 2. Insight sobre produtos populares
        if (this.productAnalysis.length > 0) {
            const topProduct = this.productAnalysis[0];
            insights.push({
                type: 'positive',
                title: '⭐ Produto Estrela',
                message: `"${topProduct.name}" é o mais vendido: ${topProduct.quantity} unidades.`,
                action: 'Ver produtos'
            });
        }
        
        // 3. Insight sobre ticket médio
        const totalRevenue = this.orders.reduce((sum, order) => {
            return sum + parseFloat(order.total || order.total_amount || 0);
        }, 0);
        
        const avgTicket = totalRevenue / this.orders.length;
        insights.push({
            type: 'info',
            title: '💰 Ticket Médio',
            message: `Ticket médio de R$ ${avgTicket.toFixed(2)} por pedido.`,
            action: 'Ver análise'
        });
        
        // Renderiza insights
        insightsContainer.innerHTML = '';
        insights.forEach(insight => {
            const insightEl = document.createElement('div');
            insightEl.className = `insight-card ${insight.type}`;
            insightEl.innerHTML = `
                <h4 style="margin: 0 0 0.5rem 0;">${insight.title}</h4>
                <p style="margin: 0 0 0.5rem 0; font-size: 0.9em;">${insight.message}</p>
            `;
            insightsContainer.appendChild(insightEl);
        });
    }
    
    setupAnalyticsPeriod() {
        const periodSelect = document.getElementById('analyticsPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                const value = periodSelect.value;
                const customPeriod = document.getElementById('customPeriod');
                
                if (value === 'custom') {
                    if (customPeriod) customPeriod.style.display = 'flex';
                } else {
                    if (customPeriod) customPeriod.style.display = 'none';
                    // Atualiza gráficos com novo período
                    this.updateAnalyticsCharts();
                }
            });
        }
    }
    
    // TAB: Produtos
    setupProductsTab() {
        console.log('📦 Configurando aba de Produtos');
        
        // Atualiza análise de produtos
        this.updateProductsAnalysis();
        
        // Atualiza gráficos de produtos
        this.updateProductsCharts();
        
        // Configura período de produtos
        this.setupProductsPeriod();
    }
    
    updateProductsAnalysis() {
        const tbody = document.getElementById('productsRankingBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.productAnalysis.slice(0, 10).forEach((product, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><strong>#${index + 1}</strong></td>
                <td><strong>${product.name}</strong><br>
                    <small>${product.orderCount} pedidos</small></td>
                <td>${product.quantity} unidades</td>
                <td><strong>R$ ${product.revenue.toFixed(2)}</strong></td>
                <td>R$ ${product.avgOrderValue.toFixed(2)}</td>
                <td>${index < 3 ? '📈 Alta' : index < 7 ? '➡️ Estável' : '📉 Baixa'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    updateProductsCharts() {
        this.updateTopProductsChart();
        this.updateCategoriesChart();
    }
    
    updateTopProductsChart() {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) return;
        
        const top10 = this.productAnalysis.slice(0, 10);
        
        if (this.charts.topProducts) {
            this.charts.topProducts.destroy();
        }
        
        this.charts.topProducts = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top10.map(p => p.name.substring(0, 15) + (p.name.length > 15 ? '...' : '')),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: top10.map(p => p.revenue),
                    backgroundColor: 'rgba(28, 61, 45, 0.7)',
                    borderColor: 'rgba(28, 61, 45, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateCategoriesChart() {
        const ctx = document.getElementById('categoriesChart');
        if (!ctx) return;
        
        // Categorias simuladas baseadas no nome do produto
        const categories = {
            'Pães': 0,
            'Bolos': 0,
            'Salgados': 0,
            'Doces': 0,
            'Bebidas': 0,
            'Outros': 0
        };
        
        this.productAnalysis.forEach(product => {
            const name = product.name.toLowerCase();
            if (name.includes('pão')) {
                categories['Pães'] += product.quantity;
            } else if (name.includes('bolo')) {
                categories['Bolos'] += product.quantity;
            } else if (name.includes('salgado') || name.includes('torta')) {
                categories['Salgados'] += product.quantity;
            } else if (name.includes('doce') || name.includes('brigadeiro')) {
                categories['Doces'] += product.quantity;
            } else if (name.includes('café') || name.includes('suco')) {
                categories['Bebidas'] += product.quantity;
            } else {
                categories['Outros'] += product.quantity;
            }
        });
        
        if (this.charts.categories) {
            this.charts.categories.destroy();
        }
        
        this.charts.categories = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        'rgba(28, 61, 45, 0.8)',
                        'rgba(216, 166, 94, 0.8)',
                        'rgba(230, 126, 34, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(149, 165, 166, 0.8)'
                    ],
                    borderColor: [
                        'rgb(28, 61, 45)',
                        'rgb(216, 166, 94)',
                        'rgb(230, 126, 34)',
                        'rgb(155, 89, 182)',
                        'rgb(52, 152, 219)',
                        'rgb(149, 165, 166)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
    
    setupProductsPeriod() {
        const periodSelect = document.getElementById('productsPeriod');
        const refreshBtn = document.getElementById('refreshProducts');
        
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                // Aqui você pode filtrar produtos por período
                console.log('Período de produtos alterado:', periodSelect.value);
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.showSuccess('📦 Análise de produtos atualizada');
                this.updateProductsAnalysis();
                this.updateProductsCharts();
            });
        }
    }
    
    // TAB: Relatórios
    setupReportsTab() {
        console.log('📄 Configurando aba de Relatórios');
        
        // Configura botões de relatórios
        this.setupReportButtons();
        
        // Carrega histórico de relatórios
        this.loadReportsHistory();
    }
    
    setupReportButtons() {
        // Botão gerar relatório
        const generateBtn = document.getElementById('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }
        
        // Botões de templates
        const templateButtons = document.querySelectorAll('.btn-template');
        templateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const template = btn.closest('.template-card').dataset.template;
                this.generateTemplateReport(template);
            });
        });
    }
    
    generateReport() {
        const reportType = document.getElementById('reportType').value;
        let reportName = '';
        
        switch(reportType) {
            case 'daily':
                reportName = 'Relatório Diário';
                break;
            case 'weekly':
                reportName = 'Relatório Semanal';
                break;
            case 'monthly':
                reportName = 'Relatório Mensal';
                break;
            default:
                reportName = 'Relatório Personalizado';
        }
        
        this.showSuccess(`📄 ${reportName} gerado com sucesso`);
        this.addToReportsHistory(reportName);
    }
    
    generateTemplateReport(template) {
        const templateNames = {
            'kitchen': 'Pedidos para Cozinha',
            'delivery': 'Rota de Entregas',
            'financial': 'Relatório Financeiro',
            'client': 'Clientes Frequentes',
            'products': 'Estoque e Vendas',
            'custom': 'Relatório Personalizado'
        };
        
        const reportName = templateNames[template] || 'Relatório';
        this.showSuccess(`📄 ${reportName} preparado para impressão`);
        this.addToReportsHistory(reportName);
    }
    
    loadReportsHistory() {
        const tbody = document.getElementById('reportsHistoryBody');
        if (!tbody) return;
        
        // Dados de exemplo para histórico
        const reports = [
            { date: '2024-01-15', type: 'Diário', period: 'Hoje', file: 'relatorio_diario_2024-01-15.pdf' },
            { date: '2024-01-14', type: 'Semanal', period: '08-14/01', file: 'relatorio_semanal_2024-01-14.pdf' },
            { date: '2024-01-10', type: 'Financeiro', period: 'Janeiro', file: 'financeiro_janeiro_2024.xlsx' },
            { date: '2024-01-05', type: 'Produtos', period: 'Dezembro', file: 'produtos_dezembro_2023.pdf' }
        ];
        
        tbody.innerHTML = '';
        
        reports.forEach(report => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${report.date}</td>
                <td>${report.type}</td>
                <td>${report.period}</td>
                <td>${report.file}</td>
                <td>
                    <button class="action-btn btn-primary small" title="Baixar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn btn-info small" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    addToReportsHistory(reportName) {
        const tbody = document.getElementById('reportsHistoryBody');
        if (!tbody) return;
        
        const today = new Date().toISOString().split('T')[0];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${today}</td>
            <td>${reportName}</td>
            <td>Hoje</td>
            <td>${reportName.toLowerCase().replace(/ /g, '_')}_${today}.pdf</td>
            <td>
                <button class="action-btn btn-primary small" title="Baixar">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        `;
        
        // Adiciona no início da tabela
        tbody.insertBefore(row, tbody.firstChild);
    }
    
    // Métodos de utilidade
    getStatusText(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'preparando': 'Preparando',
            'pronto': 'Pronto',
            'entregue': 'Entregue',
            'cancelado': 'Cancelado'
        };
        
        return statusMap[status.toLowerCase()] || status;
    }
    
    formatPhone(phone) {
        if (!phone) return 'N/A';
        
        let clean = phone.toString().replace(/\D/g, '');
        
        // Remove código do país se tiver
        if (clean.length > 10) {
            clean = clean.slice(2);
        }
        
        // Formata: (XX) XXXXX-XXXX
        return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    updateTimestamp() {
        const timestampElement = document.getElementById('lastUpdate');
        if (timestampElement) {
            timestampElement.textContent = `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;
        }
    }
    
    updateNoOrdersMessage() {
        const noOrdersElement = document.getElementById('noOrdersMessage');
        const tableContainer = document.getElementById('tableContainer');
        
        if (noOrdersElement && tableContainer) {
            if (this.filteredOrders.length === 0) {
                noOrdersElement.style.display = 'block';
                tableContainer.style.display = 'none';
            } else {
                noOrdersElement.style.display = 'none';
                tableContainer.style.display = 'block';
            }
        }
    }

    exportToExcel(orders, filename) {
        if (orders.length === 0) {
            this.showError('Não há dados para exportar');
            return;
        }

        let csv = 'ID,Data,Cliente,Telefone,Total,Status,Pagamento,Entrega\n';
        orders.forEach(o => {
            csv += `${o.order_id || o.id},${o.created_at},${o.client_name},${o.client_phone},${o.total_numeric},${o.status},${o.payment_method},${o.delivery_option}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showSuccess(`Arquivo ${filename}.csv exportado com sucesso!`);
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    // Métodos de UI
    showLoading(show) {
        let loadingEl = document.getElementById('loadingOverlay');
        
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'loadingOverlay';
            loadingEl.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                flex-direction: column;
            `;
            
            loadingEl.innerHTML = `
                <div class="spinner" style="
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #1C3D2D;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                "></div>
                <div style="color: #1C3D2D; font-weight: 600;">Carregando...</div>
            `;
            
            document.body.appendChild(loadingEl);
        }
        
        loadingEl.style.display = show ? 'flex' : 'none';
    }
    
    showNotification(message, type = 'info') {
        let notificationBar = document.getElementById('notificationBar');
        
        if (!notificationBar) {
            notificationBar = document.createElement('div');
            notificationBar.id = 'notificationBar';
            notificationBar.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(notificationBar);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideIn 0.3s ease;
            border-left: 4px solid ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#1C3D2D'};
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 
                               type === 'success' ? 'check-circle' : 
                               type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button style="background: none; border: none; color: #666; cursor: pointer; padding: 0.25rem; margin-left: 1rem;" 
                    onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notificationBar.appendChild(notification);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showWarning(message) {
        this.showNotification(message, 'warning');
    }
    
    // Event Listeners
    setupEventListeners() {
        // Configura abas
        this.setupTabs();
        
        // Botão de refresh
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAllData();
                this.showSuccess('🔄 Dados atualizados');
            });
        }

        // Botão Exportar Geral
        const exportAllBtn = document.getElementById('exportAllBtn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportToExcel(this.filteredOrders, 'todos_os_pedidos');
            });
        }

        // Botão Relatório Diário (Ação Rápida)
        const generateDailyReportBtn = document.getElementById('generateDailyReport');
        if (generateDailyReportBtn) {
            generateDailyReportBtn.addEventListener('click', () => {
                const today = new Date().toISOString().split('T')[0];
                const todayOrders = this.orders.filter(o => o.created_at.startsWith(today));
                this.exportToExcel(todayOrders, `relatorio_diario_${today}`);
            });
        }

        // Botão Lembretes WhatsApp
        const sendWhatsAppRemindersBtn = document.getElementById('sendWhatsAppReminders');
        if (sendWhatsAppRemindersBtn) {
            sendWhatsAppRemindersBtn.addEventListener('click', () => {
                const pending = this.orders.filter(o => o.status === 'pendente');
                if (pending.length === 0) {
                    this.showInfo('Não há pedidos pendentes para enviar lembretes.');
                    return;
                }
                this.showSuccess(`Enviando lembretes para ${pending.length} pedidos...`);
                // Simulação de envio
            });
        }
        
        // Botões de filtro rápido de data
        document.querySelectorAll('.date-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const days = parseInt(e.target.dataset.days);
                this.setQuickDateFilter(days);
            });
        });
        
        // Botão aplicar filtros
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        // Botão limpar filtros
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // Filtros em tempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                if (searchTimeout) clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.applyFilters(), 500);
            });
        }
        
        // Checkboxes de status
        document.querySelectorAll('.status-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.applyFilters());
        });
        
        // Radios de entrega
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', () => this.applyFilters());
        });
        
        // Checkboxes de pagamento
        document.querySelectorAll('.payment-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.applyFilters());
        });
        
        // Ações em lote
        const applyBatchActionBtn = document.getElementById('applyBatchAction');
        if (applyBatchActionBtn) {
            applyBatchActionBtn.addEventListener('click', () => {
                this.applyBatchAction();
            });
        }
        
        // Botões de ação rápida
        const printTodayBtn = document.getElementById('printTodayOrders');
        if (printTodayBtn) {
            printTodayBtn.addEventListener('click', () => {
                this.generateKitchenReport();
            });
        }
        
        const viewPendingBtn = document.getElementById('viewPendingOrders');
        if (viewPendingBtn) {
            viewPendingBtn.addEventListener('click', () => {
                this.filterPendingOrders();
            });
        }
    }
    
    setQuickDateFilter(days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = startDate.toISOString().split('T')[0];
            endDateInput.value = endDate.toISOString().split('T')[0];
            
            this.applyFilters();
        }
    }
    
    clearAllFilters() {
        // Limpa datas
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        
        // Limpa valores
        const minValue = document.getElementById('minValue');
        const maxValue = document.getElementById('maxValue');
        if (minValue) minValue.value = '';
        if (maxValue) maxValue.value = '';
        
        // Limpa busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        // Reseta status (marca todos exceto cancelado)
        document.querySelectorAll('.status-checkbox').forEach(cb => {
            cb.checked = cb.value !== 'cancelado';
        });
        
        // Reseta entrega
        const todosRadio = document.querySelector('input[name="delivery"][value="todos"]');
        if (todosRadio) todosRadio.checked = true;
        
        // Reseta pagamento
        document.querySelectorAll('.payment-checkbox').forEach(cb => {
            cb.checked = true;
        });
        
        // Aplica filtros
        this.applyFilters();
        this.showSuccess('✅ Filtros limpos');
    }
    
    filterPendingOrders() {
        // Marca apenas pendente
        document.querySelectorAll('.status-checkbox').forEach(cb => {
            cb.checked = cb.value === 'pendente';
        });
        
        // Filtra por hoje
        const today = new Date().toISOString().split('T')[0];
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && endDate) {
            startDate.value = today;
            endDate.value = today;
        }
        
        this.applyFilters();
        this.showSuccess('✅ Mostrando apenas pendentes de hoje');
    }
    
    applyBatchAction() {
        const actionSelect = document.getElementById('batchActionSelect');
        if (!actionSelect) return;
        
        const action = actionSelect.value;
        if (!action || this.selectedOrders.size === 0) {
            this.showError('Selecione uma ação e pelo menos um pedido');
            return;
        }
        
        const selectedIds = Array.from(this.selectedOrders);
        
        switch(action) {
            case 'status_preparando':
                this.batchUpdateStatus(selectedIds, 'preparando');
                break;
            case 'status_pronto':
                this.batchUpdateStatus(selectedIds, 'pronto');
                break;
            case 'status_entregue':
                this.batchUpdateStatus(selectedIds, 'entregue');
                break;
            case 'export_selected':
                const selectedOrdersData = this.orders.filter(o => selectedIds.includes(o.order_id || o.id));
                this.exportToExcel(selectedOrdersData, 'pedidos_selecionados');
                break;
            case 'print_selected':
                this.showInfo('Preparando impressão para ' + selectedIds.length + ' pedidos...');
                // Simulação de impressão
                break;
            default:
                this.showError('Ação não implementada');
        }
    }
    
    batchUpdateStatus(orderIds, newStatus) {
        if (!confirm(`Deseja alterar o status de ${orderIds.length} pedido(s) para "${this.getStatusText(newStatus)}"?`)) {
            return;
        }
        
        // Atualiza localmente (simulação)
        orderIds.forEach(orderId => {
            const order = this.orders.find(o => (o.order_id || o.id) === orderId);
            if (order) {
                order.status = newStatus;
            }
        });
        
        // Atualiza filteredOrders também
        this.filteredOrders.forEach(order => {
            if (orderIds.includes(order.order_id || order.id)) {
                order.status = newStatus;
            }
        });
        
        // Limpa seleção
        this.selectedOrders.clear();
        this.updateSelectionUI();
        
        // Atualiza visualização
        this.applyFilters();
        this.updateStats();
        
        this.showSuccess(`✅ ${orderIds.length} pedido(s) atualizado(s) para ${this.getStatusText(newStatus)}`);
    }
    
    generateKitchenReport() {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = this.orders.filter(order => {
            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
            return orderDate === today && ['pendente', 'preparando'].includes(order.status || 'pendente');
        });
        
        if (todayOrders.length === 0) {
            this.showError('Nenhum pedido para preparação hoje');
            return;
        }
        
        this.showSuccess(`📋 Relatório para cozinha gerado: ${todayOrders.length} pedidos`);
        
        // Abre modal de impressão (simulação)
        this.showNotification('Relatório pronto para impressão. Use Ctrl+P para imprimir.', 'info');
    }
    
    // Métodos estáticos para acesso global
    static handleInsightAction(action) {
        console.log('Ação de insight:', action);
        // Implementar ações específicas se necessário
    }
    
    static generateKitchenReport() {
        if (window.AdminPanel) {
            window.AdminPanel.generateKitchenReport();
        }
    }
    
    static generateDeliveryReport() {
        if (window.AdminPanel) {
            window.AdminPanel.showSuccess('🚚 Relatório de entregas gerado');
        }
    }
    
    static generateFinancialReport() {
        if (window.AdminPanel) {
            window.AdminPanel.showSuccess('💰 Relatório financeiro gerado');
        }
    }
    
    static generateClientsReport() {
        if (window.AdminPanel) {
            window.AdminPanel.showSuccess('👥 Relatório de clientes gerado');
        }
    }
    
    static generateProductsReport() {
        if (window.AdminPanel) {
            window.AdminPanel.showSuccess('📦 Relatório de produtos gerado');
        }
    }
    
    static openCustomReport() {
        const modal = document.getElementById('customReportModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    static closeCustomReportModal() {
        const modal = document.getElementById('customReportModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    static closePrintModal() {
        const modal = document.getElementById('printModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    static closeEditStatusModal() {
        const modal = document.getElementById('editStatusModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    static closeModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Inicializa quando o DOM carrega
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, inicializando AdminPanel Enhanced...');
    window.AdminPanel = new AdminPanel();
    
    // Adiciona animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});