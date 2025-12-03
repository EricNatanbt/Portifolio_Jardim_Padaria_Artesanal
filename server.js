const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Define o diretório de arquivos estáticos
const staticPath = path.join(__dirname, 'public');

// 1. Serve arquivos estáticos com configurações específicas
app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    // Configura MIME types corretos para arquivos JS
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Adicione outros tipos se necessário
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// 2. Rota de fallback apenas para rotas que não correspondem a arquivos existentes
app.get('*', (req, res, next) => {
  const filePath = path.join(staticPath, req.path);
  
  // Verifica se o arquivo existe fisicamente
  const fs = require('fs');
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Arquivo não existe, serve o index.html para SPA
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      // Arquivo existe, passa para o próximo middleware (express.static)
      next();
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});