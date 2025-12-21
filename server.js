const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { readProducts, writeProducts, readOrders, writeOrders } = require('./public/js/components/db_utils');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define o diretório de arquivos estáticos
const staticPath = path.join(__dirname, 'public');

// 1. Exemplo de rota de API (para simular o saveOrder)

// --- Rotas de API para Gerenciamento de Produtos (CRUD) ---

// GET /api/produtos - Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const products = await readProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
});

// POST /api/produtos - Adicionar novo produto
app.post('/api/produtos', async (req, res) => {
    try {
        const newProduct = req.body;
        if (!newProduct.nome || !newProduct.preco) {
            return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
        }

        const products = await readProducts();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        
        const productToAdd = {
            id: newId,
            nome: newProduct.nome,
            descricao: newProduct.descricao || '',
            preco: parseFloat(newProduct.preco) || 0.00,
            categoria: newProduct.categoria || 'Geral',
            imagem: newProduct.imagem || '/img/produtos/default.png'
        };

        products.push(productToAdd);
        await writeProducts(products);
        res.status(201).json(productToAdd);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

// PUT /api/produtos/:id - Atualizar produto existente
app.put('/api/produtos/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const updatedProductData = req.body;

        let products = await readProducts();
        const index = products.findIndex(p => p.id === productId);

        if (index === -1) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        const updatedProduct = {
            ...products[index],
            nome: updatedProductData.nome || products[index].nome,
            descricao: updatedProductData.descricao || products[index].descricao,
            preco: parseFloat(updatedProductData.preco) || products[index].preco,
            categoria: updatedProductData.categoria || products[index].categoria,
            imagem: updatedProductData.imagem || products[index].imagem
        };

        products[index] = updatedProduct;
        await writeProducts(products);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar produto', error: error.message });
    }
});

// DELETE /api/produtos/:id - Excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        let products = await readProducts();
        const initialLength = products.length;
        products = products.filter(p => p.id !== productId);

        if (products.length === initialLength) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        await writeProducts(products);
        res.status(204).send(); // No Content
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir produto', error: error.message });
    }
});

// --- Fim das Rotas de API para Gerenciamento de Produtos ---

// --- Rotas de API para Gerenciamento de Pedidos ---

// POST /api/saveOrder - Salvar novo pedido
app.post('/api/saveOrder', async (req, res) => {
    console.log('API: Pedido recebido:', req.body.client.name);
    const orderId = 'JD' + Date.now().toString().slice(-8);
    
    // Salvar no banco de dados (orders.json)
    const newOrder = {
        id: orderId,
        date: new Date().toISOString(),
        client: req.body.client,
        cart: req.body.cart,
        total: req.body.total,
        status: 'Concluído'
    };

    const orders = await readOrders();
    orders.unshift(newOrder); // Adiciona no início para facilitar a busca dos últimos pedidos
    await writeOrders(orders);

    const orderDetailLink = `${req.protocol}://${req.get('host')}/order.html?orderId=${orderId}`;
    
    // Resposta de sucesso para o frontend
    res.json({
        success: true,
        orderId: orderId,
        orderDetailLink: orderDetailLink,
        message: 'Pedido salvo com sucesso!'
    });
});


// GET /api/orders - Listar os últimos 3 pedidos com detalhes completos (Geral)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readOrders();
        // Retorna os 3 últimos pedidos com informações formatadas
        const recentOrders = orders.slice(0, 3).map(order => ({
            id: order.id,
            date: order.date,
            client: order.client,
            cart: order.cart,
            total: order.total,
            status: order.status || 'Concluído',
            // Garante que os itens tenham nome e preço
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
        
        // Filtra pedidos pelo telefone do cliente (assumindo que o telefone está em order.client.phone)
        const clientOrders = orders.filter(order => 
            order.client && order.client.phone && order.client.phone === clientPhone
        );

        // Retorna os 3 últimos pedidos do cliente
        const recentClientOrders = clientOrders.slice(0, 3).map(order => ({
            id: order.id,
            date: order.date,
            client: order.client,
            cart: order.cart,
            total: order.total,
            status: order.status || 'Concluído',
            // Garante que os itens tenham nome e preço
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

// GET /api/orders/:id - Detalhar um pedido
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readOrders();
        // Retorna os 3 últimos pedidos com informações formatadas
        const recentOrders = orders.slice(0, 3).map(order => ({
            id: order.id,
            date: order.date,
            client: order.client,
            cart: order.cart,
            total: order.total,
            status: order.status || 'Concluído',
            // Garante que os itens tenham nome e preço
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

// GET /api/orders/:id - Detalhar um pedido
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orders = await readOrders();
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        // Formata os dados do pedido para o frontend
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
// --- Fim das Rotas de API para Gerenciamento de Pedidos ---

// 2. Serve arquivos estáticos
app.use(express.static(staticPath));

// 3. Rota de fallback para servir index.html (SPA) para rotas não encontradas
app.get(/^(?!\/api\/)/, (req, res) => {
    if (!req.path.includes('.')) { // Evita tentar servir index.html para arquivos estáticos não encontrados
        res.sendFile(path.join(staticPath, 'index.html'));
    } else {
        res.status(404).send('Not Found');
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});