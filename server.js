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

// 3. Rota de fallback para servir index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
