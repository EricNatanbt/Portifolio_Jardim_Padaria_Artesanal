// ============================================
// GERADOR DE IMAGENS PARA PEDIDOS
// ============================================

const ImageGenerator = {
    /**
     * Cria uma imagem com as informações do pedido
     */
    async generateOrderImage(orderData) {
        return new Promise((resolve, reject) => {
            // Criar canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Configurações do canvas - aumentei a altura para mais espaço
            canvas.width = 800;
            canvas.height = 1600; // Aumentei a altura para mais espaço
            
            // Cor de fundo
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Cabeçalho
            this.drawHeader(ctx, canvas);
            
            // Informações do cliente
            const customerEndY = this.drawCustomerInfo(ctx, canvas, orderData.customer, 120);
            
            // NOVA SEÇÃO: Observações (se existirem)
            const observationStartY = this.drawObservationSection(ctx, canvas, orderData.customer, customerEndY + 30);
            
            // Itens do pedido - começa depois das observações
            const itemsStartY = observationStartY + 30;
            const itemsEndY = this.drawOrderItems(ctx, canvas, orderData.order, itemsStartY);
            
            // Resumo financeiro
            this.drawOrderSummary(ctx, canvas, orderData.order, itemsEndY + 60);
            
            // Rodapé
            this.drawFooter(ctx, canvas);
            
            // Converter para imagem
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Falha ao gerar imagem'));
                }
            }, 'image/jpeg', 0.95);
        });
    },
    
    /**
     * Desenha o cabeçalho da imagem
     */
    drawHeader(ctx, canvas) {
        // Fundo do cabeçalho
        ctx.fillStyle = '#1C3D2D';
        ctx.fillRect(0, 0, canvas.width, 100);
        
        // Logo/Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍞 JARDIM PADARIA ARTESANAL', canvas.width / 2, 45);
        
        ctx.font = '18px "Inter", sans-serif';
        ctx.fillText('COMPROVANTE DE PEDIDO', canvas.width / 2, 75);
        
        // Linha decorativa
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50, 85);
        ctx.lineTo(canvas.width - 50, 85);
        ctx.stroke();
    },
    
    /**
     * Desenha as informações do cliente
     */
    drawCustomerInfo(ctx, canvas, customer, startY) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.fillText('👤 INFORMAÇÕES DO CLIENTE', 40, startY);
        
        ctx.font = '18px "Inter", sans-serif';
        ctx.fillStyle = '#333333';
        
        let currentY = startY + 40;
        
        ctx.fillText(`Nome: ${customer.name}`, 40, currentY);
        currentY += 30;
        
        ctx.fillText(`Telefone: ${this.formatPhone(customer.phone)}`, 40, currentY);
        currentY += 30;
        
        ctx.fillText(`Entrega: ${customer.deliveryOption === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega'}`, 40, currentY);
        currentY += 30;
        
        ctx.fillText(`Pagamento: ${customer.paymentMethod === 'pix' ? '💰 Pix' : '💳 Cartão'}`, 40, currentY);
        currentY += 30;
        
        if (customer.deliveryOption === 'entrega') {
            // Quebra o endereço em múltiplas linhas se for muito longo
            const addressLines = this.wrapText(ctx, `Endereço: ${customer.address}`, 40, currentY, canvas.width - 80, 20);
            addressLines.forEach((line, index) => {
                ctx.fillText(line, 40, currentY + (index * 20));
            });
            currentY += (addressLines.length * 20) + 10;
        }
        
        // Linha divisória
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, currentY + 20);
        ctx.lineTo(canvas.width - 40, currentY + 20);
        ctx.stroke();
        
        return currentY + 40;
    },

    /**
     * NOVO: Desenha a seção de observações
     */
    drawObservationSection(ctx, canvas, customer, startY) {
        // Se não há observação, retorna a posição inicial
        if (!customer.observation || customer.observation.trim() === '') {
            return startY;
        }

        // Fundo destacado para observações
        ctx.fillStyle = 'rgba(255, 193, 7, 0.1)'; // Amarelo bem suave
        ctx.fillRect(30, startY - 10, canvas.width - 60, 120);
        
        // Borda
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, startY - 10, canvas.width - 60, 120);

        // Título da seção
        ctx.textAlign = 'left';
        ctx.fillStyle = '#E67E22'; // Laranja
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('📝 OBSERVAÇÕES DO PEDIDO', 40, startY + 20);

        // Texto da observação
        ctx.fillStyle = '#8B4513'; // Marrom escuro
        ctx.font = '16px "Inter", sans-serif';
        
        const observationLines = this.wrapText(ctx, customer.observation, 50, startY + 50, canvas.width - 100, 16);
        
        observationLines.forEach((line, index) => {
            ctx.fillText(line, 50, startY + 50 + (index * 20));
        });

        // Linha divisória após observações
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, startY + 50 + (observationLines.length * 20) + 20);
        ctx.lineTo(canvas.width - 40, startY + 50 + (observationLines.length * 20) + 20);
        ctx.stroke();

        return startY + 50 + (observationLines.length * 20) + 40;
    },
    
    /**
     * Desenha os itens do pedido
     */
    drawOrderItems(ctx, canvas, order, startY) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.fillText('📋 ITENS DO PEDIDO', 40, startY);
        
        let currentY = startY + 40;
        
        // Adiciona um fundo alternado para melhor legibilidade
        order.items.forEach((item, index) => {
            // Fundo alternado para melhor legibilidade
            if (index % 2 === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.03)';
                ctx.fillRect(30, currentY - 15, canvas.width - 60, 25);
            }
            
            ctx.fillStyle = index % 2 === 0 ? '#333333' : '#555555';
            ctx.font = '16px "Inter", sans-serif';
            
            // Nome do produto - quebra linha se for muito longo
            const productName = `${item.quantity}x ${item.name}`;
            const nameLines = this.wrapText(ctx, productName, 40, currentY, canvas.width - 160, 16);
            
            if (nameLines.length > 1) {
                // Se o nome quebrou em múltiplas linhas, desenha cada linha
                nameLines.forEach((line, lineIndex) => {
                    ctx.fillText(line, 40, currentY + (lineIndex * 18));
                });
                // Preço alinhado à direita
                ctx.textAlign = 'right';
                ctx.fillText(`R$ ${(item.price * item.quantity).toFixed(2)}`, canvas.width - 40, currentY);
                ctx.textAlign = 'left';
                
                currentY += (nameLines.length * 18) + 10;
            } else {
                // Nome em uma linha só
                ctx.fillText(productName, 40, currentY);
                
                // Preço
                ctx.textAlign = 'right';
                ctx.fillText(`R$ ${(item.price * item.quantity).toFixed(2)}`, canvas.width - 40, currentY);
                ctx.textAlign = 'left';
                
                currentY += 30;
            }
        });
        
        // Linha divisória antes do resumo
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, currentY + 20);
        ctx.lineTo(canvas.width - 40, currentY + 20);
        ctx.stroke();
        
        return currentY + 40;
    },
    
    /**
     * Desenha o resumo financeiro
     */
    drawOrderSummary(ctx, canvas, order, startY) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.fillText('💵 RESUMO DO PEDIDO', 40, startY);
        
        let currentY = startY + 40;
        
        // Fundo para a seção de resumo
        ctx.fillStyle = 'rgba(28, 61, 45, 0.05)';
        ctx.fillRect(30, currentY - 10, canvas.width - 60, 140);
        
        ctx.font = '18px "Inter", sans-serif';
        ctx.fillStyle = '#333333';
        
        // Subtotal
        ctx.fillText('Subtotal:', 40, currentY + 20);
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${order.subtotal.toFixed(2)}`, canvas.width - 40, currentY + 20);
        
        // Frete (se houver)
        if (order.deliveryFee > 0) {
            ctx.textAlign = 'left';
            ctx.fillText('Frete:', 40, currentY + 50);
            ctx.textAlign = 'right';
            ctx.fillText(`R$ ${order.deliveryFee.toFixed(2)}`, canvas.width - 40, currentY + 50);
        }
        
        // Total
        const totalY = order.deliveryFee > 0 ? currentY + 90 : currentY + 70;
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText('TOTAL:', 40, totalY);
        
        ctx.textAlign = 'right';
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.fillText(`R$ ${order.total.toFixed(2)}`, canvas.width - 40, totalY);
        
        // ID do pedido
        ctx.textAlign = 'center';
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(`Pedido: ${order.orderId} • ${order.timestamp}`, canvas.width / 2, totalY + 50);
        
        return totalY + 70;
    },
    
    /**
     * Desenha o rodapé
     */
    drawFooter(ctx, canvas) {
        const footerY = canvas.height - 80;
        
        // Linha divisória
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, footerY - 20);
        ctx.lineTo(canvas.width - 40, footerY - 20);
        ctx.stroke();
        
        // Texto do rodapé
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666666';
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillText('Agradecemos pela preferência! 🌿', canvas.width / 2, footerY + 10);
        ctx.fillText('Entraremos em contato em breve para confirmação.', canvas.width / 2, footerY + 30);
    },
    
    /**
     * Formata o número de telefone
     */
    formatPhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 12) { // +55 format
            return `(${cleanPhone.substring(2, 4)}) ${cleanPhone.substring(4, 9)}-${cleanPhone.substring(9)}`;
        } else if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
        }
        return phone;
    },
    
    /**
     * Quebra texto em múltiplas linhas
     */
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    },
    
    /**
     * Converte blob para base64 (para APIs que precisam)
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
};