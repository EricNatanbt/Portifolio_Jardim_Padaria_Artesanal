// Relatórios Administrativos JavaScript - Replicado do Gerenciador de Pedidos
class ReportsPanel {
    constructor() {
        this.orders = [];
        this.apiBase = window.location.origin + '/api';
        
        // Cache para o PDF atual sendo visualizado
        this.currentPDF = {
            blob: null,
            url: null,
            filename: null
        };

        // Inicializa
        this.init();
    }

    async init() {
        console.log('Inicializando ReportsPanel...');

        // Configura listeners
        this.setupEventListeners();

        // Carrega dados
        await this.loadAllData();

        // Atualiza timestamp
        this.updateTimestamp();

        console.log('✅ ReportsPanel inicializado');
    }

    setupEventListeners() {
        // Botão gerar relatório principal
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
                const card = btn.closest('.template-card');
                const template = card ? card.dataset.template : null;
                if (template) {
                    this.generateTemplateReport(template);
                }
            });
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('reportViewerModal')?.style.display === 'flex') {
                    this.closeReportViewer();
                }
            }
        });

        // Fechar modal ao clicar no overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-modal')) {
                if (e.target.id === 'reportViewerModal') {
                    this.closeReportViewer();
                }
            }
        });
    }

    async loadAllData() {
        try {
            this.showLoading(true);
            await this.loadOrders();
            this.loadReportsHistory();
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
            const response = await fetch(`${window.location.origin}/.netlify/functions/get-all-orders`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.orders) {
                    this.orders = result.orders;
                    return;
                }
            }
            this.orders = [];
        } catch (error) {
            console.error('❌ Erro ao carregar pedidos:', error);
            this.orders = [];
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        if (reportType === 'custom') {
            this.showInfo('Selecione um template ou use um período pré-definido.');
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`${window.location.origin}/.netlify/functions/reports-generate?type=${reportType}`);
            const result = await response.json();

            if (result.success) {
                const { metrics, data, period } = result;
                const reportName = document.getElementById('reportType').options[document.getElementById('reportType').selectedIndex].text;
                const periodText = `${new Date(period.start).toLocaleDateString('pt-BR')} - ${new Date(period.end).toLocaleDateString('pt-BR')}`;
                
                this.exportEnhancedPDF(data.orders, metrics, reportName, periodText);
                this.addToReportsHistory(reportName, 'pdf', periodText, reportType, { metrics, data, periodText });
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Erro ao gerar relatório: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async generateTemplateReport(template) {
        const templateNames = {
            'daily': 'Relatório Diário',
            'weekly': 'Relatório Semanal',
            'monthly': 'Relatório Mensal',
            'financial': 'Relatório Financeiro',
            'products': 'Relatório de Produtos',
            'kitchen': 'Pedidos para Cozinha',
            'delivery': 'Rota de Entregas',
            'client': 'Clientes Frequentes'
        };

        const reportName = templateNames[template] || 'Relatório';

        try {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${window.location.origin}/.netlify/functions/reports-generate?type=${template}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        const { metrics, data, period } = result;
                        const periodText = `${new Date(period.start).toLocaleDateString('pt-BR')} - ${new Date(period.end).toLocaleDateString('pt-BR')}`;
                        
                        if (template === 'financial') {
                            this.exportToExcel(data.orders, `Financeiro_${periodText.replace(/\//g, '-')}`);
                        } else if (template === 'kitchen') {
                            this.generateKitchenReport();
                        } else if (template === 'delivery') {
                            this.generateDeliveryPDF();
                        } else if (template === 'client') {
                            this.generateClientsPDF();
                        } else if (template === 'products') {
                            this.generateProductsPDF();
                        } else {
                            this.exportEnhancedPDF(data.orders, metrics, reportName, periodText, template);
                        }
                        this.addToReportsHistory(reportName, template === 'financial' ? 'xlsx' : 'pdf', 'Hoje', template, { metrics, data, periodText });
                        return;
                    }
                }
            } catch (e) {
                console.warn('API de relatórios indisponível, usando processamento local');
            }

            // Fallback Local
            if (template === 'kitchen') {
                this.generateKitchenReport();
            } else if (template === 'delivery') {
                this.generateDeliveryPDF();
            } else if (template === 'client') {
                this.generateClientsPDF();
            } else if (template === 'products') {
                this.generateProductsPDF();
            } else if (template === 'financial') {
                this.exportToExcel(this.orders, `Financeiro_Local_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`);
            } else {
                this.exportToPDF(this.orders, reportName.toLowerCase().replace(/\s+/g, '_'));
            }
            
            this.addToReportsHistory(reportName, template === 'financial' ? 'xlsx' : 'pdf', 'Hoje', template);
        } catch (error) {
            this.showError('Erro ao gerar template: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    generatePDFDocument(orders, metrics, title, period, type = 'general') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const primaryColor = [28, 61, 45];
        const secondaryColor = [245, 245, 240];
        
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Jardim Padaria Artesanal', 14, 22);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(title.toUpperCase(), 14, 32);
        doc.text(`PERÍODO: ${period}`, 14, 38);
        
        doc.setFontSize(9);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 196, 15, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INDICADORES DE DESEMPENHO', 14, 60);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 63, 196, 63);

        const cardWidth = 58;
        const cardHeight = 25;
        const cardY = 68;
        
        const drawCard = (x, label, value, color = primaryColor) => {
            doc.setFillColor(...secondaryColor);
            doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F');
            doc.setTextColor(...color);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(label, x + 5, cardY + 8);
            doc.setFontSize(14);
            doc.text(value, x + 5, cardY + 18);
        };

        if (type === 'products') {
            drawCard(14, 'TOTAL PRODUTOS', metrics.totalProducts?.toString() || '0');
            drawCard(76, 'MAIS VENDIDO', metrics.topProduct || 'N/A');
            drawCard(138, 'RECEITA TOTAL', `R$ ${metrics.totalRevenue.toFixed(2)}`);
        } else if (type === 'client') {
            drawCard(14, 'TOTAL CLIENTES', metrics.totalClients?.toString() || '0');
            drawCard(76, 'CLIENTE TOP', metrics.topClient || 'N/A');
            drawCard(138, 'TICKET MÉDIO', `R$ ${metrics.avgOrderValue.toFixed(2)}`);
        } else {
            drawCard(14, 'TOTAL DE PEDIDOS', metrics.totalOrders.toString());
            drawCard(76, 'FATURAMENTO BRUTO', `R$ ${metrics.totalRevenue.toFixed(2)}`);
            drawCard(138, 'TICKET MÉDIO', `R$ ${metrics.avgOrderValue.toFixed(2)}`);
        }

        let currentY = 105;

        if (type === 'products' && metrics.productSales) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('RANKING DE PRODUTOS MAIS VENDIDOS', 14, currentY);
            
            const productData = metrics.productSales.map((p, index) => [
                index + 1, p.name, p.quantity, `R$ ${p.revenue.toFixed(2)}`, `${((p.revenue / metrics.totalRevenue) * 100).toFixed(1)}%`
            ]);

            doc.autoTable({
                startY: currentY + 5,
                head: [['#', 'Produto', 'Qtd', 'Receita', '% Part.']],
                body: productData,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, fontStyle: 'bold' }
            });
            currentY = doc.lastAutoTable.finalY + 15;
        } else if (type === 'client' && metrics.clientRanking) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('RANKING DE CLIENTES', 14, currentY);
            
            const clientData = metrics.clientRanking.map((c, index) => [
                index + 1, c.name, c.orders, `R$ ${c.totalSpent.toFixed(2)}`, `R$ ${c.avgTicket.toFixed(2)}`
            ]);

            doc.autoTable({
                startY: currentY + 5,
                head: [['#', 'Cliente', 'Pedidos', 'Total Gasto', 'Ticket Médio']],
                body: clientData,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, fontStyle: 'bold' }
            });
            currentY = doc.lastAutoTable.finalY + 15;
        }

        if (type !== 'products' || orders.length > 0) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('DETALHAMENTO DOS PEDIDOS', 14, currentY);
            
            const tableData = orders.map(o => {
                const clientName = o.client_name || (o.client && o.client.name) || 'N/A';
                return [
                    o.order_id || o.id,
                    new Date(o.created_at || o.date).toLocaleDateString('pt-BR'),
                    clientName,
                    o.payment_method || 'N/A',
                    `R$ ${parseFloat(o.total_numeric || o.total || 0).toFixed(2)}`,
                    (o.status || 'PENDENTE').toUpperCase()
                ];
            });

            doc.autoTable({
                startY: currentY + 5,
                head: [['ID', 'Data', 'Cliente', 'Pagamento', 'Total', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, fontStyle: 'bold' }
            });
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Jardim Padaria Artesanal - Relatório Administrativo`, 14, 287);
            doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: 'right' });
        }

        return doc;
    }

    exportEnhancedPDF(orders, metrics, title, period, type = 'general') {
        const doc = this.generatePDFDocument(orders, metrics, title, period, type);
        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
        this.showSuccess('Relatório profissional gerado com sucesso!');
    }

    exportToPDF(orders, filename) {
        if (orders.length === 0) {
            this.showError('Não há dados para exportar');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Jardim Padaria Artesanal - Relatório de Pedidos', 14, 22);
        const tableData = orders.map(o => [
            o.order_id || o.id,
            new Date(o.created_at || o.date).toLocaleDateString('pt-BR'),
            o.client_name || 'N/A',
            `R$ ${parseFloat(o.total_numeric || o.total || 0).toFixed(2)}`,
            (o.status || 'PENDENTE').toUpperCase()
        ]);
        doc.autoTable({
            startY: 30,
            head: [['ID', 'Data', 'Cliente', 'Total', 'Status']],
            body: tableData,
            headStyles: { fillColor: [28, 61, 45] }
        });
        doc.save(`${filename}.pdf`);
    }

    exportToExcel(orders, filename) {
        if (orders.length === 0) {
            this.showError('Não há dados para exportar');
            return;
        }
        const data = orders.map(o => ({
            'ID Pedido': o.order_id || o.id,
            'Data': new Date(o.created_at || o.date).toLocaleString('pt-BR'),
            'Cliente': o.client_name || 'N/A',
            'Total (R$)': parseFloat(o.total_numeric || o.total || 0).toFixed(2),
            'Status': o.status
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }

    generateKitchenReport() {
        const activeOrders = this.orders.filter(o => ['pendente', 'preparando'].includes(o.status));
        if (activeOrders.length === 0) {
            this.showError('Não há pedidos para a cozinha');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Pedidos para Cozinha', 14, 22);
        const tableData = [];
        activeOrders.forEach(o => {
            if (o.items) {
                o.items.forEach(item => {
                    tableData.push([o.order_id || o.id, item.product_name || item.name, item.quantity, o.observation || '-']);
                });
            }
        });
        doc.autoTable({
            startY: 30,
            head: [['Pedido', 'Produto', 'Qtd', 'Observação']],
            body: tableData,
            headStyles: { fillColor: [28, 61, 45] }
        });
        doc.save('pedidos_cozinha.pdf');
    }

    generateDeliveryPDF() {
        const pendingOrders = this.orders.filter(o => o.delivery_option === 'entrega' && o.status !== 'cancelado');
        if (pendingOrders.length === 0) {
            this.showError('Não há entregas pendentes');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Rota de Entregas', 14, 22);
        const tableData = pendingOrders.map(o => [
            o.order_id || o.id, o.client_name || 'N/A', o.address || 'N/A', o.client_phone || 'N/A'
        ]);
        doc.autoTable({
            startY: 30,
            head: [['ID', 'Cliente', 'Endereço', 'Telefone']],
            body: tableData,
            headStyles: { fillColor: [28, 61, 45] }
        });
        doc.save('rota_entregas.pdf');
    }

    generateClientsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const clientMap = {};

        this.orders.forEach(o => {
            if ((o.status || '').toLowerCase() === 'cancelado') return;

            const clientName = o.client_name || 'Cliente';
            const clientPhone = o.client_phone || 'N/A';

            if (!clientMap[clientName]) {
                clientMap[clientName] = { name: clientName, phone: clientPhone, count: 0, total: 0 };
            }
            clientMap[clientName].count++;
            clientMap[clientName].total += parseFloat(o.total_numeric || o.total || 0);
        });

        const clients = Object.values(clientMap).sort((a, b) => b.total - a.total);

        if (clients.length === 0) {
            this.showError('Não há dados de clientes para gerar o relatório');
            return;
        }

        doc.setFontSize(18);
        doc.text('Relatório de Clientes Frequentes', 14, 22);
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

        const tableData = clients.map(c => [
            c.name,
            c.phone,
            c.count,
            `R$ ${c.total.toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 35,
            head: [['Cliente', 'Telefone', 'Pedidos', 'Total Gasto']],
            body: tableData,
            headStyles: { fillColor: [28, 61, 45] }
        });

        doc.save('clientes_frequentes.pdf');
        this.showSuccess('Relatório de clientes gerado com sucesso!');
    }

    generateProductsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const productMap = {};

        this.orders.forEach(o => {
            if ((o.status || '').toLowerCase() === 'cancelado') return;

            if (o.items && Array.isArray(o.items)) {
                o.items.forEach(item => {
                    const name = item.product_name || item.name || 'Produto';
                    if (!productMap[name]) {
                        productMap[name] = { name: name, qty: 0, total: 0 };
                    }
                    productMap[name].qty += parseInt(item.quantity || 0);
                    productMap[name].total += parseFloat(item.total || (item.price * item.quantity) || 0);
                });
            }
        });

        const products = Object.values(productMap).sort((a, b) => b.qty - a.qty);

        if (products.length === 0) {
            this.showError('Não há dados de produtos para gerar o relatório');
            return;
        }

        doc.setFontSize(18);
        doc.text('Relatório de Produtos Mais Vendidos', 14, 22);
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

        const tableData = products.map(p => [
            p.name,
            p.qty,
            `R$ ${p.total.toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 35,
            head: [['Produto', 'Quantidade Vendida', 'Total em Vendas']],
            body: tableData,
            headStyles: { fillColor: [28, 61, 45] }
        });

        doc.save('produtos_mais_vendidos.pdf');
        this.showSuccess('Relatório de produtos gerado com sucesso!');
    }

    loadReportsHistory() {
        const tbody = document.getElementById('reportsHistoryBody');
        if (!tbody) return;
        let reports = JSON.parse(localStorage.getItem('admin_reports_history') || '[]');
        tbody.innerHTML = '';
        reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(report.date).toLocaleDateString('pt-BR')}</td>
                <td><span class="report-type-badge">${report.type}</span></td>
                <td>${report.period}</td>
                <td>${report.file}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-view-report" data-report-id="${report.id}" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-download-report" data-report-id="${report.id}" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners to new buttons
        tbody.querySelectorAll('.btn-view-report').forEach(btn => {
            btn.onclick = () => this.viewReport(btn.dataset.reportId);
        });
        tbody.querySelectorAll('.btn-download-report').forEach(btn => {
            btn.onclick = () => this.downloadReport(btn.dataset.reportId);
        });
    }

    addToReportsHistory(reportName, format = 'pdf', period = 'Hoje', template = 'general', snapshot = null) {
        const today = new Date();
        const fileName = `${reportName.toLowerCase().replace(/ /g, '_')}_${today.toISOString().split('T')[0]}.${format}`;
        const newReport = {
            id: `rpt-${Date.now()}`,
            name: reportName,
            type: reportName,
            template: template,
            period: period,
            format: format,
            file: fileName,
            date: today.toISOString(),
            snapshot: snapshot // Salva os dados exatos do relatório
        };
        let history = JSON.parse(localStorage.getItem('admin_reports_history') || '[]');
        history.unshift(newReport);
        localStorage.setItem('admin_reports_history', JSON.stringify(history.slice(0, 20)));
        this.loadReportsHistory();
    }

    viewReport(reportId) {
        const history = JSON.parse(localStorage.getItem('admin_reports_history') || '[]');
        const report = history.find(r => r.id === reportId);
        if (!report) return;

        if (report.format === 'pdf') {
            this.previewPDFReport(report);
        } else {
            this.showInfo('Visualização disponível apenas para PDF. Use o download para Excel.');
        }
    }

    async previewPDFReport(report) {
        const modal = document.getElementById('reportViewerModal');
        const content = document.getElementById('reportViewerContent');
        this.showLoading(true);
        
        if (this.currentPDF.url) URL.revokeObjectURL(this.currentPDF.url);
        
        try {
            let metrics, data, periodText;
            let reportType = report.template || 'general';

            // Se tivermos um snapshot salvo, usamos ele para garantir que é o MESMO relatório
            if (report.snapshot) {
                metrics = report.snapshot.metrics;
                data = report.snapshot.data;
                periodText = report.snapshot.periodText;
            } else {
                // Fallback para relatórios antigos sem snapshot
                const response = await fetch(`${window.location.origin}/.netlify/functions/reports-generate?type=${reportType}`);
                if (!response.ok) throw new Error('Falha na resposta da API');
                const result = await response.json();
                if (!result.success) throw new Error(result.message);
                
                metrics = result.metrics;
                data = result.data;
                periodText = result.period.start ? 
                    `${new Date(result.period.start).toLocaleDateString('pt-BR')} - ${new Date(result.period.end).toLocaleDateString('pt-BR')}` : 
                    'Período não definido';
            }

            const doc = this.generatePDFDocument(data.orders, metrics, report.type, periodText, reportType);
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            this.currentPDF = { blob: pdfBlob, url: pdfUrl, filename: report.file };
            content.innerHTML = `<iframe src="${pdfUrl}" width="100%" height="600px" style="border: none; border-radius: 8px;"></iframe>`;
            modal.style.display = 'flex';
        } catch (e) {
            console.error('Erro no preview:', e);
            this.showError('Erro ao visualizar PDF: ' + e.message);
        } finally {
            this.showLoading(false);
        }
    }

    downloadReport(reportId) {
        const history = JSON.parse(localStorage.getItem('admin_reports_history') || '[]');
        const report = history.find(r => r.id === reportId);
        if (report) {
            this.generateTemplateReport(report.template);
        }
    }

    static closeReportViewer() {
        const modal = document.getElementById('reportViewerModal');
        if (modal) modal.style.display = 'none';
        // Limpar o iframe para liberar memória
        const content = document.getElementById('reportViewerContent');
        if (content) content.innerHTML = '';
    }

    updateTimestamp() {
        const el = document.getElementById('lastUpdate');
        if (el) el.textContent = `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;
    }

    showLoading(show) {
        const btn = document.getElementById('generateReport');
        if (btn) {
            if (show) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-cogs"></i> Gerar Agora';
            }
        }
    }

    showNotification(message, type = 'info') {
        const bar = document.getElementById('notificationBar');
        if (bar) {
            bar.textContent = message;
            bar.className = `notification-bar show ${type}`;
            setTimeout(() => bar.className = 'notification-bar', 3000);
        }
    }

    showError(message) { this.showNotification(message, 'error'); }
    showSuccess(message) { this.showNotification(message, 'success'); }
    showInfo(message) { this.showNotification(message, 'info'); }
}

document.addEventListener('DOMContentLoaded', () => {
    window.ReportsPanel = new ReportsPanel();
});
