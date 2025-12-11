const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define o diretório de arquivos estáticos
const staticPath = path.join(__dirname, 'public');

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
app.get('*', (req, res) => {
    if (!req.path.includes('.')) { // Evita tentar servir index.html para arquivos estáticos não encontrados
        res.sendFile(path.join(staticPath, 'index.html'));
    } else {
        res.status(404).send('Not Found');
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
