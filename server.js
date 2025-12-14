const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { readProducts, writeProducts } = require('./db_utils');

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

// 1. Exemplo de rota de API (para simular o saveOrder)
app.post('/api/saveOrder', (req, res) => {
    console.log('API: Pedido recebido:', req.body.client.name);
    // Simulação de salvamento no banco de dados
    const orderId = 'JD' + Date.now().toString().slice(-8);
    const orderDetailLink = `${req.protocol}://${req.get('host')}/order.html?orderId=${orderId}`;
    
    // Resposta de sucesso para o frontend
    res.json({
        success: true,
        orderId: orderId,
        orderDetailLink: orderDetailLink,
        message: 'Pedido salvo com sucesso!'
    });
});

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
