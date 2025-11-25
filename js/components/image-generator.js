// ============================================
// GERADOR DE IMAGENS PARA PEDIDOS - VERSÃO MOBILE CORRIGIDA
// ============================================

const ImageGenerator = {
    /**
     * Cria uma imagem com as informações do pedido - VERSÃO MOBILE COMPATÍVEL
     */
    async generateOrderImage(orderData) {
        return new Promise((resolve, reject) => {
            try {
                // Criar canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Configurações do canvas - otimizado para mobile
                canvas.width = 800;
                const estimatedHeight = this.calculateEstimatedHeight(orderData);
                canvas.height = Math.max(estimatedHeight, 1200);
                
                // Cor de fundo do sistema
                ctx.fillStyle = '#FCF9F5';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Desenhar todas as seções
                const headerEndY = this.drawHeader(ctx, canvas);
                const customerEndY = this.drawCustomerInfo(ctx, canvas, orderData.customer, headerEndY + 40);
                const observationEndY = this.drawObservationSection(ctx, canvas, orderData.customer, customerEndY + 30);
                const itemsEndY = this.drawOrderItems(ctx, canvas, orderData.order, observationEndY + 40);
                const summaryEndY = this.drawOrderSummary(ctx, canvas, orderData.order, itemsEndY + 50);
                this.drawFooter(ctx, canvas, summaryEndY + 40);
                
                // Método alternativo para mobile - converter para data URL primeiro
                setTimeout(() => {
                    try {
                        // Tenta converter para blob primeiro
                        canvas.toBlob(blob => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                // Fallback para data URL se blob falhar
                                console.log('Blob falhou, usando data URL como fallback');
                                const dataURL = canvas.toDataURL('image/jpeg', 0.95);
                                resolve(this.dataURLToBlob(dataURL));
                            }
                        }, 'image/jpeg', 0.95);
                    } catch (blobError) {
                        console.error('Erro no toBlob:', blobError);
                        // Fallback direto para data URL
                        try {
                            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
                            resolve(this.dataURLToBlob(dataURL));
                        } catch (dataUrlError) {
                            reject(dataUrlError);
                        }
                    }
                }, 100); // Pequeno delay para garantir que o canvas foi renderizado
                
            } catch (error) {
                console.error('Erro no generateOrderImage:', error);
                reject(error);
            }
        });
    },
    
    /**
     * Converte data URL para blob (fallback para mobile)
     */
    dataURLToBlob(dataURL) {
        try {
            const byteString = atob(dataURL.split(',')[1]);
            const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            return new Blob([ab], { type: mimeString });
        } catch (error) {
            console.error('Erro na conversão dataURL para blob:', error);
            throw error;
        }
    },
    
    /**
     * Calcula altura estimada baseada no conteúdo
     */
    calculateEstimatedHeight(orderData) {
        let height = 200;
        height += 180;
        
        if (orderData.customer.observation && orderData.customer.observation.trim() !== '') {
            const obsLines = Math.ceil(orderData.customer.observation.length / 50);
            height += 80 + (obsLines * 20);
        }
        
        height += 60;
        orderData.order.items.forEach(item => {
            const nameLines = Math.ceil(item.name.length / 30);
            height += 40 + (nameLines * 18);
        });
        
        height += 160;
        height += 100;
        
        return height;
    },
    
    /**
     * Desenha o cabeçalho da imagem
     */
    drawHeader(ctx, canvas) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#1C3D2D');
        gradient.addColorStop(1, '#2A5C42');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 120);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JARDIM PADARIA ARTESANAL', canvas.width / 2, 50);
        
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('COMPROVANTE DE PEDIDO', canvas.width / 2, 80);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 4, 95);
        ctx.lineTo(3 * canvas.width / 4, 95);
        ctx.stroke();
        
        return 120;
    },
    
    /**
     * Desenha as informações do cliente
     */
    drawCustomerInfo(ctx, canvas, customer, startY) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('👤 INFORMAÇÕES DO CLIENTE', 40, startY);
        
        ctx.fillStyle = 'rgba(232, 240, 235, 0.5)';
        ctx.fillRect(30, startY + 10, canvas.width - 60, 160);
        ctx.strokeStyle = '#D4E8DC';
        ctx.lineWidth = 1;
        ctx.strokeRect(30, startY + 10, canvas.width - 60, 160);
        
        let currentY = startY + 40;
        const lineHeight = 28;
        
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillStyle = '#333333';
        
        ctx.fillText(`Nome: ${customer.name}`, 50, currentY);
        currentY += lineHeight;
        
        ctx.fillText(`Telefone: ${this.formatPhone(customer.phone)}`, 50, currentY);
        currentY += lineHeight;
        
        const deliveryText = customer.deliveryOption === 'retirada' ? '🛵 Retirada na Loja' : '🚗 Entrega';
        ctx.fillText(`Entrega: ${deliveryText}`, 50, currentY);
        currentY += lineHeight;
        
        const paymentText = customer.paymentMethod === 'pix' ? '💰 Pix' : '💳 Cartão';
        ctx.fillText(`Pagamento: ${paymentText}`, 50, currentY);
        currentY += lineHeight;
        
        if (customer.deliveryOption === 'entrega' && customer.address) {
            const addressLines = this.wrapText(ctx, `Endereço: ${customer.address}`, 50, currentY, canvas.width - 100, 16);
            addressLines.forEach((line, index) => {
                ctx.fillText(line, 50, currentY + (index * 20));
            });
            currentY += (addressLines.length * 20);
        }
        
        return startY + 180;
    },

    /**
     * Desenha a seção de observações
     */
    drawObservationSection(ctx, canvas, customer, startY) {
        if (!customer.observation || customer.observation.trim() === '') {
            return startY;
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#E67E22';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText('📝 OBSERVAÇÕES DO PEDIDO', 40, startY);
        
        const observationLines = this.wrapText(ctx, customer.observation, 50, startY + 40, canvas.width - 100, 16);
        const containerHeight = 60 + (observationLines.length * 20);
        
        ctx.fillStyle = 'rgba(255, 193, 7, 0.08)';
        ctx.fillRect(30, startY + 20, canvas.width - 60, containerHeight);
        
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, startY + 20, canvas.width - 60, containerHeight);
        
        ctx.fillStyle = '#8B4513';
        ctx.font = '15px "Inter", sans-serif';
        
        observationLines.forEach((line, index) => {
            ctx.fillText(line, 50, startY + 50 + (index * 20));
        });

        return startY + 30 + containerHeight;
    },
    
    /**
     * Desenha os itens do pedido
     */
    drawOrderItems(ctx, canvas, order, startY) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('📋 ITENS DO PEDIDO', 40, startY);
        
        let currentY = startY + 40;
        
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText('PRODUTO', 50, currentY);
        ctx.textAlign = 'right';
        ctx.fillText('SUBTOTAL', canvas.width - 50, currentY);
        ctx.textAlign = 'left';
        
        currentY += 25;
        
        ctx.strokeStyle = '#1C3D2D';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, currentY);
        ctx.lineTo(canvas.width - 50, currentY);
        ctx.stroke();
        
        currentY += 15;
        
        order.items.forEach((item, index) => {
            const itemHeight = this.drawOrderItem(ctx, canvas, item, currentY, index);
            currentY += itemHeight + 10;
        });
        
        return currentY;
    },
    
    /**
     * Desenha um item individual do pedido
     */
    drawOrderItem(ctx, canvas, item, startY, index) {
        const backgroundColor = index % 2 === 0 ? 'rgba(232, 240, 235, 0.3)' : 'rgba(255, 255, 255, 0.5)';
        
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(40, startY - 10, canvas.width - 80, 50);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#333333';
        ctx.font = '15px "Inter", sans-serif';
        
        const productText = `${item.quantity}x ${item.name}`;
        const nameLines = this.wrapText(ctx, productText, 50, startY + 10, canvas.width - 200, 15);
        
        nameLines.forEach((line, lineIndex) => {
            ctx.fillText(line, 50, startY + 10 + (lineIndex * 18));
        });
        
        ctx.fillStyle = '#666666';
        ctx.font = '13px "Inter", sans-serif';
        ctx.fillText(`(R$ ${item.price.toFixed(2)} un)`, 50, startY + 15 + (nameLines.length * 18));
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillText(`R$ ${(item.price * item.quantity).toFixed(2)}`, canvas.width - 50, startY + 15);
        
        return 30 + (nameLines.length * 18);
    },
    
    /**
     * Desenha o resumo financeiro
     */
    drawOrderSummary(ctx, canvas, order, startY) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('💵 RESUMO DO PEDIDO', 40, startY);
        
        const containerY = startY + 30;
        const containerHeight = 120;
        
        const gradient = ctx.createLinearGradient(0, containerY, 0, containerY + containerHeight);
        gradient.addColorStop(0, 'rgba(162, 178, 142, 0.1)');
        gradient.addColorStop(1, 'rgba(212, 232, 220, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(30, containerY, canvas.width - 60, containerHeight);
        
        ctx.strokeStyle = '#A2B28E';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, containerY, canvas.width - 60, containerHeight);
        
        let currentY = containerY + 30;
        
        this.drawSummaryLine(ctx, canvas, 'Subtotal:', `R$ ${order.subtotal.toFixed(2)}`, currentY);
        currentY += 25;
        
        if (order.deliveryFee > 0) {
            this.drawSummaryLine(ctx, canvas, 'Frete:', `R$ ${order.deliveryFee.toFixed(2)}`, currentY);
            currentY += 25;
        }
        
        ctx.strokeStyle = '#1C3D2D';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, currentY + 5);
        ctx.lineTo(canvas.width - 50, currentY + 5);
        ctx.stroke();
        
        currentY += 15;
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1C3D2D';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText('TOTAL:', 50, currentY);
        
        ctx.textAlign = 'right';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText(`R$ ${order.total.toFixed(2)}`, canvas.width - 50, currentY);
        
        return containerY + containerHeight;
    },
    
    /**
     * Desenha uma linha do resumo
     */
    drawSummaryLine(ctx, canvas, label, value, y) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#5A7A6A';
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText(label, 50, y);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#333333';
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText(value, canvas.width - 50, y);
    },
    
    /**
     * Desenha o rodapé
     */
    drawFooter(ctx, canvas, startY) {
        const footerY = Math.max(startY, canvas.height - 100);
        
        const gradient = ctx.createLinearGradient(0, footerY, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(28, 61, 45, 0.05)');
        gradient.addColorStop(1, 'rgba(28, 61, 45, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, footerY, canvas.width, canvas.height - footerY);
        
        ctx.strokeStyle = '#1C3D2D';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, footerY + 10);
        ctx.lineTo(canvas.width - 50, footerY + 10);
        ctx.stroke();
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#5A7A6A';
        ctx.font = '14px "Inter", sans-serif';
        
        ctx.fillText('Agradecemos pela preferência! 🌿', canvas.width / 2, footerY + 35);
        ctx.fillText('Entraremos em contato em breve para confirmação.', canvas.width / 2, footerY + 55);
        
        ctx.fillStyle = '#888888';
        ctx.font = '12px "Inter", sans-serif';
        ctx.fillText(`Pedido: ${orderData.order.orderId} • ${orderData.order.timestamp}`, canvas.width / 2, footerY + 75);
    },
    
    /**
     * Formata o número de telefone
     */
    formatPhone(phone) {
        if (!phone) return 'Não informado';
        
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 12) {
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