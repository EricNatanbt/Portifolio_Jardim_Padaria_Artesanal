const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { readOrders, writeOrders } = require('./public/js/components/db_utils');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define o diretório de arquivos estáticos
const staticPath = path.join(__dirname, 'public');

// --- Rotas de API para Gerenciamento de Pedidos ---

// POST /api/saveOrder - Salvar novo pedido
app.post('/api/saveOrder', async (req, res) => {
    try {
        console.log('API: Pedido recebido:', req.body.client?.name || 'Sem nome');
        const orderId = 'JD' + Date.now().toString().slice(-8);

        const newOrder = {
            id: orderId,
            date: new Date().toISOString(),
            client: req.body.client || {},
            cart: req.body.items || req.body.cart || [],
            total: req.body.order?.total || req.body.total || 0,
            status: 'Concluído'
        };

        const orders = await readOrders();
        orders.unshift(newOrder);
        await writeOrders(orders);

        const orderDetailLink = `/order.html?orderId=${orderId}`;

        res.status(200).json({
            success: true,
            orderId: orderId,
            orderDetailLink: orderDetailLink,
            message: 'Pedido salvo com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao salvar pedido',
            error: error.message
        });
    }
});

// GET /api/orders - Listar últimos 3 pedidos
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readOrders();
        const recentOrders = orders.slice(0, 3).map(order => ({
            id: order.id,
            date: order.date,
            client: order.client,
            cart: order.cart,
            total: order.total,
            status: order.status || 'Concluído',
            items: (order.cart || []).map(item => ({
                id: item.id,
                name: item.name || 'Produto',
                price: item.price || 0,
                quantity: item.quantity || 1,
                total: (item.price || 0) * (item.quantity || 1)
            }))
        }));

        res.json(recentOrders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Erro ao buscar pedidos', 
            error: error.message 
        });
    }
});

// GET /api/orders/by-phone - Listar pedidos por telefone do cliente
app.get('/api/orders/by-phone', async (req, res) => {
    try {
        const clientPhone = req.query.phone;
        if (!clientPhone) {
            return res.status(400).json({ message: 'Telefone do cliente é obrigatório.' });
        }

        const orders = await readOrders();
        const clientOrders = orders.filter(order => 
            order.client && order.client.phone && order.client.phone === clientPhone
        );

        const recentClientOrders = clientOrders.slice(0, 3).map(order => ({
            id: order.id,
            date: order.date,
            client: order.client,
            cart: order.cart,
            total: order.total,
            status: order.status || 'Concluído',
            items: (order.cart || []).map(item => ({
                id: item.id,
                name: item.name || 'Produto',
                price: item.price || 0,
                quantity: item.quantity || 1,
                total: (item.price || 0) * (item.quantity || 1)
            }))
        }));

        res.json(recentClientOrders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Erro ao buscar pedidos por telefone', 
            error: error.message 
        });
    }
});

// GET /api/orders/:id - Detalhar um pedido específico
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orders = await readOrders();
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        const formattedOrder = {
            id: order.id,
            order_id: order.id,
            date: order.date,
            created_at: order.date,
            client: order.client,
            client_name: order.client?.name || 'Cliente',
            client_phone: order.client?.phone || '',
            total: order.total,
            total_amount: order.total,
            status: order.status || 'pendente',
            payment_method: order.client?.paymentMethod || 'pix',
            delivery_option: order.client?.deliveryMethod || 'entrega',
            address: order.client?.address || '',
            observation: order.client?.observation || '',
            items: (order.cart || []).map(item => ({
                id: item.id,
                product_name: item.name || 'Produto',
                price: item.price || 0,
                quantity: item.quantity || 1,
                image: item.image || '/img/produtos/default.png',
                total: (item.price || 0) * (item.quantity || 1)
            }))
        };

        res.json(formattedOrder);
    } catch (error) {
        res.status(500).json({ 
            message: 'Erro ao buscar pedido', 
            error: error.message 
        });
    }
});

// GET /api/get-all-orders - Listar todos os pedidos para o admin
app.get('/api/get-all-orders', async (req, res) => {
    try {
        const orders = await readOrders();
        const formattedOrders = orders.map(order => ({
            id: order.id,
            order_id: order.id,
            date: order.date,
            created_at: order.date,
            client_name: order.client?.name || 'Cliente',
            client_phone: order.client?.phone || '',
            total: order.total,
            total_amount: order.total,
            status: order.status || 'pendente',
            payment_method: order.client?.paymentMethod || 'pix',
            delivery_option: order.client?.deliveryMethod || 'entrega',
            address: order.client?.address || '',
            observation: order.client?.observation || '',
            items: (order.cart || []).map(item => ({
                product_name: item.name || 'Produto',
                price: item.price || 0,
                quantity: item.quantity || 1,
                total: (item.price || 0) * (item.quantity || 1)
            }))
        }));

        res.json({
            success: true,
            orders: formattedOrders
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Erro ao buscar todos os pedidos', 
            error: error.message 
        });
    }
});

// POST /api/update-order-status - Atualizar status de um pedido
app.post('/api/update-order-status', async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: 'ID e status são obrigatórios.' });
        }

        const orders = await readOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
        }

        orders[orderIndex].status = status;
        await writeOrders(orders);

        res.json({ success: true, message: 'Status atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Erro ao atualizar status', 
            error: error.message 
        });
    }
});

// DELETE /api/delete-order - Excluir um pedido
app.delete('/api/delete-order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orders = await readOrders();
        const filteredOrders = orders.filter(o => o.id !== orderId);

        if (orders.length === filteredOrders.length) {
            return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
        }

        await writeOrders(filteredOrders);
        res.json({ success: true, message: 'Pedido excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Erro ao excluir pedido', 
            error: error.message 
        });
    }
});

// GET /api/reports/generate - Gerar dados para relatório
app.get('/api/reports/generate', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const orders = await readOrders();
        
        let filteredOrders = orders;
        const now = new Date();
        let start = new Date(startDate);
        let end = new Date(endDate || now);

        if (type === 'daily') {
            start = new Date();
            start.setHours(0, 0, 0, 0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        } else if (type === 'weekly') {
            start = new Date();
            start.setDate(now.getDate() - 7);
        } else if (type === 'monthly') {
            start = new Date();
            start.setDate(now.getDate() - 30);
        }

        if (type !== 'all' && (startDate || type)) {
            filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Filtrar pedidos válidos para cálculos financeiros (não cancelados)
        const validOrders = filteredOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelado');

        // Calcular métricas
        const totalRevenue = validOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
        
        const statusCount = {};
        const paymentCount = {};
        const productSales = {};

        // Contagem de status usa todos os pedidos filtrados por data
        filteredOrders.forEach(order => {
            const status = order.status || 'pendente';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        // Cálculos financeiros e de produtos usam apenas pedidos válidos
        validOrders.forEach(order => {
            const pm = order.client?.paymentMethod || 'não informado';
            paymentCount[pm] = (paymentCount[pm] || 0) + 1;

            (order.cart || []).forEach(item => {
                const name = item.name || 'Produto';
                if (!productSales[name]) {
                    productSales[name] = { quantity: 0, revenue: 0 };
                }
                productSales[name].quantity += (item.quantity || 0);
                productSales[name].revenue += (item.price || 0) * (item.quantity || 0);
            });
        });

        res.json({
            success: true,
            period: { start, end },
            metrics: {
                totalOrders: filteredOrders.length,
                totalRevenue,
                avgOrderValue
            },
            data: {
                orders: filteredOrders,
                statusCount,
                paymentCount,
                productSales: Object.entries(productSales).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.revenue - a.revenue)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório', error: error.message });
    }
});

// --- Fim das Rotas de API para Pedidos ---

// Serve arquivos estáticos
app.use(express.static(staticPath));

// Rota de fallback para SPA
app.get(/^(?!\/api\/)/, (req, res) => {
    // Se for uma requisição de arquivo (tem extensão), mas não foi encontrado pelo express.static
    if (path.extname(req.path)) {
        return res.status(404).send('Not Found');
    }
    // Se for uma rota de navegação (sem extensão), envia o index.html
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
