// GerenciarProdutos.js - COM CRUD REAL NO BANCO DE DADOS

console.log('🚀 gerenciarProdutos.js carregado');

class ProductManager {
    constructor() {
        this.products = [];
        this.diasDaSemana = ['quarta', 'quinta', 'sexta', 'sabado'];
        this.apiBase = '/.netlify/functions';
        console.log('📦 ProductManager construído');
        this.init();
    }

    async init() {
        console.log('📄 Inicializando ProductManager...');
        await this.loadProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Botão Adicionar Produto
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openProductModal());
            console.log('✅ Botão "Adicionar Produto" configurado');
        }

        // Botão Salvar no formulário
        const saveBtn = document.getElementById('saveProductBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFormSubmit(e);
            });
            console.log('✅ Botão "Salvar Produto" configurado');
        }

        // Botão Cancelar
        const cancelBtn = document.querySelector('[onclick="closeProductModal()"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeProductModal());
            console.log('✅ Botão "Cancelar" configurado');
        }

        console.log('✅ Todos os event listeners configurados');
    }

    async loadProducts() {
        console.log('📥 Iniciando carga de produtos...');
        
        const productsBody = document.getElementById('productsBody');
        if (!productsBody) {
            console.error('❌ Elemento #productsBody não encontrado no DOM');
            return;
        }

        // Mostra estado de carregamento
        productsBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner"></div>
                    <p>Carregando produtos do banco de dados...</p>
                </td>
            </tr>`;

        try {
            const apiUrl = `${this.apiBase}/get-products`;
            console.log(`🌐 Fazendo requisição para: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Dados recebidos:', data);
            
            if (data.success) {
                this.products = data.products || [];
                console.log(`✅ ${this.products.length} produtos carregados com sucesso`);
                this.renderProducts();
            } else {
                throw new Error(data.message || 'Erro na resposta da API');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
            this.showError('Erro ao carregar produtos: ' + error.message);
        }
    }

    renderProducts() {
        console.log('🎨 Renderizando tabela de produtos...');
        
        const productsBody = document.getElementById('productsBody');
        const productCount = document.getElementById('productCount');
        const noProductsMessage = document.getElementById('noProductsMessage');
        
        if (!productsBody) {
            console.error('❌ productsBody não encontrado');
            return;
        }

        // Limpa a tabela
        productsBody.innerHTML = '';

        // Atualiza contador
        if (productCount) {
            productCount.textContent = `${this.products.length} produto${this.products.length !== 1 ? 's' : ''}`;
        }

        // Se não há produtos, mostra mensagem
        if (this.products.length === 0) {
            if (noProductsMessage) {
                noProductsMessage.style.display = 'block';
            }
            return;
        }

        // Esconde mensagem de "sem produtos"
        if (noProductsMessage) {
            noProductsMessage.style.display = 'none';
        }

        // Renderiza cada produto
        this.products.forEach((product) => {
            const row = productsBody.insertRow();
            
            // Formata o preço
            const price = parseFloat(product.preco) || 0;
            const formattedPrice = price.toFixed(2).replace('.', ',');
            
            // Dias disponíveis
            const diasDisponiveis = product.dias_disponiveis || [];
            const diasFormatados = this.formatarDiasDisponiveis(diasDisponiveis);
            
            row.innerHTML = `
                <td style="font-family: 'Courier New', monospace; font-size: 0.85em; color: #666;">
                    ${product.id.substring(0, 8)}...
                </td>
                <td>
                    <img src="${product.imagem || '/img/logos/Logo.png'}" 
                         alt="${product.nome}"
                         class="product-thumbnail"
                         onerror="this.src='/img/logos/Logo.png'"
                         style="
                             width: 50px;
                             height: 50px;
                             object-fit: cover;
                             border-radius: 6px;
                             border: 1px solid #e0e0e0;
                         ">
                </td>
                <td>
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
                        ${product.nome}
                    </div>
                    ${product.descricao ? `
                        <div style="font-size: 0.85em; color: #666; line-height: 1.3;">
                            ${product.descricao.substring(0, 80)}${product.descricao.length > 80 ? '...' : ''}
                        </div>
                    ` : ''}
                </td>
                <td>
                    <span class="category-tag" style="
                        display: inline-block;
                        background: ${this.getCategoryColor(product.categoria)};
                        color: white;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.85em;
                        font-weight: 500;
                    ">
                        ${product.categoria}
                    </span>
                </td>
                <td style="font-weight: 700; color: #1C3D2D; font-size: 1.1em;">
                    R$ ${formattedPrice}
                </td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 200px;">
                        ${diasFormatados}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-edit"
                                onclick="productManager.editProduct('${product.id}')"
                                style="
                                    background: #1C3D2D;
                                    color: white;
                                    border: none;
                                    padding: 6px 12px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 0.9em;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                ">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete"
                                onclick="productManager.deleteProduct('${product.id}')"
                                style="
                                    background: #E74C3C;
                                    color: white;
                                    border: none;
                                    padding: 6px 12px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 0.9em;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                ">
                            🗑️ Excluir
                        </button>
                    </div>
                </td>
            `;
        });

        console.log(`✅ Tabela renderizada com ${this.products.length} produtos`);
    }

    formatarDiasDisponiveis(diasArray) {
        if (!diasArray || diasArray.length === 0) {
            return '<span style="color: #999; font-size: 0.85em;">Nenhum dia</span>';
        }
        
        const diasMap = {
            'quarta': { label: 'Qua', color: '#4CAF50' },
            'quinta': { label: 'Qui', color: '#2196F3' },
            'sexta': { label: 'Sex', color: '#FF9800' },
            'sabado': { label: 'Sáb', color: '#9C27B0' }
        };
        
        return diasArray.map(dia => {
            const config = diasMap[dia] || { label: dia, color: '#607D8B' };
            return `
                <span style="
                    display: inline-block;
                    background: ${config.color};
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    font-weight: 600;
                ">
                    ${config.label}
                </span>
            `;
        }).join('');
    }

    getCategoryColor(category) {
        const colors = {
            'Pães': '#4CAF50',
            'Doces': '#9C27B0',
            'Bolos': '#FF9800',
            'Salgados': '#F44336',
            'Bebidas': '#2196F3',
            'Geral': '#607D8B'
        };
        return colors[category] || '#607D8B';
    }

    editProduct(productId) {
        console.log(`✏️ Editando produto: ${productId}`);
        this.openProductModal(productId);
    }

    openProductModal(productId = null) {
        console.log(`📝 Abrindo modal para produto: ${productId || 'novo'}`);
        
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalTitle) {
            console.error('❌ Modal não encontrado');
            return;
        }

        // Limpa o formulário
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        
        // Limpa checkboxes de dias
        this.diasDaSemana.forEach(dia => {
            const checkbox = document.getElementById(`dia-${dia}`);
            if (checkbox) checkbox.checked = false;
        });

        if (productId) {
            // Modo edição
            const product = this.products.find(p => p.id === productId);
            if (product) {
                modalTitle.textContent = 'Editar Produto';
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.nome || '';
                document.getElementById('productDescription').value = product.descricao || '';
                document.getElementById('productPrice').value = product.preco || 0;
                document.getElementById('productCategory').value = product.categoria || 'Geral';
                document.getElementById('productImage').value = product.imagem || '';
                
                // Preenche checkboxes dos dias disponíveis
                const diasDisponiveis = product.dias_disponiveis || [];
                diasDisponiveis.forEach(dia => {
                    const checkbox = document.getElementById(`dia-${dia}`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        } else {
            // Modo novo produto
            modalTitle.textContent = 'Adicionar Produto';
        }

        modal.style.display = 'flex';
    }

    closeProductModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('📝 Submetendo formulário...');
        
        // Mostra loading no botão
        const saveBtn = document.getElementById('saveProductBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Salvando...';
        saveBtn.disabled = true;
        
        try {
            // Coleta dados do formulário
            const productId = document.getElementById('productId').value;
            const isEditing = !!productId;
            
            const productData = {
                nome: document.getElementById('productName').value.trim(),
                descricao: document.getElementById('productDescription').value.trim(),
                preco: parseFloat(document.getElementById('productPrice').value),
                categoria: document.getElementById('productCategory').value,
                imagem: document.getElementById('productImage').value.trim() || '/img/logos/Logo.png',
                dias_disponiveis: this.getSelectedDays()
            };

            // Se for edição, adiciona o ID
            if (isEditing) {
                productData.id = productId;
            }

            // Validação
            if (!productData.nome) {
                throw new Error('O nome do produto é obrigatório');
            }

            if (productData.preco <= 0 || isNaN(productData.preco)) {
                throw new Error('O preço deve ser um número maior que zero');
            }

            console.log('📤 Enviando dados:', productData);
            
            // Decide qual endpoint usar
            const endpoint = isEditing ? 'update-product' : 'create-product';
            const url = `${this.apiBase}/${endpoint}`;
            
            console.log(`📡 Enviando para: ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            console.log('📊 Resposta do servidor:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro do servidor: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Resultado:', result);
            
            if (result.success) {
                // Fecha o modal
                this.closeProductModal();
                
                // Recarrega os produtos do servidor
                await this.loadProducts();
                
                // Mostra mensagem de sucesso
                this.showNotification(`✅ Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            } else {
                throw new Error(result.message || 'Erro ao salvar produto');
            }

        } catch (error) {
            console.error('❌ Erro ao salvar produto:', error);
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        } finally {
            // Restaura o botão
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    getSelectedDays() {
        const selectedDays = [];
        this.diasDaSemana.forEach(dia => {
            const checkbox = document.getElementById(`dia-${dia}`);
            if (checkbox && checkbox.checked) {
                selectedDays.push(dia);
            }
        });
        return selectedDays;
    }

    async deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?\nEsta ação não pode ser desfeita.')) {
            return;
        }
        
        console.log(`🗑️ Excluindo produto: ${productId}`);
        
        try {
            const url = `${this.apiBase}/delete-product`;
            console.log(`📡 Enviando para: ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: productId })
            });

            console.log('📊 Resposta do servidor:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro do servidor: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Resultado:', result);
            
            if (result.success) {
                // Remove localmente
                this.products = this.products.filter(p => p.id !== productId);
                this.renderProducts();
                
                // Mostra mensagem de sucesso
                this.showNotification('✅ Produto excluído com sucesso!');
            } else {
                throw new Error(result.message || 'Erro ao excluir produto');
            }

        } catch (error) {
            console.error('❌ Erro ao excluir produto:', error);
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }

    showNotification(message, type = 'success') {
        // Remove notificações anteriores
        const existingNotifications = document.querySelectorAll('.custom-notification');
        existingNotifications.forEach(n => n.remove());
        
        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#27AE60' : '#E74C3C'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <span style="font-size: 1.2em;">${type === 'success' ? '✅' : '❌'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showError(message) {
        const productsBody = document.getElementById('productsBody');
        if (!productsBody) return;
        
        productsBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: #E74C3C;">
                    <h4>❌ Erro</h4>
                    <p>${message}</p>
                    <button onclick="productManager.loadProducts()" 
                            style="
                                background: #1C3D2D;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-top: 1rem;
                            ">
                        🔄 Tentar Novamente
                    </button>
                </td>
            </tr>`;
    }
}

// Inicialização
console.log('⏳ Aguardando DOMContentLoaded...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded - Iniciando aplicação...');
    
    // Cria instância global
    window.productManager = new ProductManager();
});

// Adiciona estilos CSS
const styles = `
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #1C3D2D;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .btn-edit:hover {
        background: #2A5C42 !important;
        transform: translateY(-1px);
        transition: all 0.2s;
    }
    
    .btn-delete:hover {
        background: #C0392B !important;
        transform: translateY(-1px);
        transition: all 0.2s;
    }
    
    .product-thumbnail:hover {
        transform: scale(1.05);
        transition: transform 0.2s;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .days-checkbox-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 10px 0;
    }
    
    .day-checkbox-item {
        display: flex;
        align-items: center;
        gap: 5px;
        background: #f5f5f5;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .day-checkbox-item:hover {
        background: #e8f5e9;
    }
    
    .day-checkbox-item input[type="checkbox"] {
        margin: 0;
        cursor: pointer;
    }
    
    .day-checkbox-item label {
        cursor: pointer;
        font-weight: 500;
        color: #333;
    }
    
    .day-checkbox-item input[type="checkbox"]:checked + label {
        color: #1C3D2D;
        font-weight: 600;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

console.log('🎯 Script gerenciarProdutos.js carregado e pronto!');