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
    console.log('API: Pedido recebido:', req.body.client.name);
    const orderId = 'JD' + Date.now().toString().slice(-8);

    const newOrder = {
        id: orderId,
        date: new Date().toISOString(),
        client: req.body.client,
        cart: req.body.cart,
        total: req.body.total,
        status: 'Concluído'
    };

    const orders = await readOrders();
    orders.unshift(newOrder); // Adiciona no início
    await writeOrders(orders);

    const orderDetailLink = `${req.protocol}://${req.get('host')}/order.html?orderId=${orderId}`;

    res.json({
        success: true,
        orderId: orderId,
        orderDetailLink: orderDetailLink,
        message: 'Pedido salvo com sucesso!'
    });
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
            date: order.date,
            client: order.client,
            total: order.total,
            status: order.status || 'Concluído',
            items: (order.cart || []).map(item => ({
                id: item.id,
                name: item.name || 'Produto',
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

// --- Fim das Rotas de API para Pedidos ---

// Serve arquivos estáticos
app.use(express.static(staticPath));

// Rota de fallback para SPA
app.get(/^(?!\/api\/)/, (req, res) => {
    if (!req.path.includes('.')) {
        res.sendFile(path.join(staticPath, 'index.html'));
    } else {
        res.status(404).send('Not Found');
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
