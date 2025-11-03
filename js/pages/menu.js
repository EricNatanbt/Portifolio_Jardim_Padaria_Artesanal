// ============================================
// PÁGINA MENU
// ============================================
const MenuPage = {
    currentDayIndex: -1,

    initialize() {
        this.setupToday();
        this.renderCardapio(this.currentDayIndex);
        this.setupEventListeners();
    },

    setupToday() {
        const today = new Date().getDay();
        const dayMap = {
            3: 0, // quarta
            4: 1, // quinta
            5: 2, // sexta
            6: 3  // sábado
        };
        
        this.currentDayIndex = dayMap[today] !== undefined ? dayMap[today] : -1;
    },

    renderCardapio(dayIndex) {
        const containerCardapio = document.getElementById("container-cardapio");
        const semFornadas = document.getElementById("sem-fornadas");
        const tituloDia = document.getElementById("titulo-dia");
        const diaAtual = document.getElementById("dia-atual");

        if (!containerCardapio || !semFornadas || !tituloDia || !diaAtual) return;

        // Limpar container
        containerCardapio.innerHTML = '';
        semFornadas.style.display = 'none';

        const dias = ["quarta", "quinta", "sexta", "sabado"];
        const nomesDias = ["Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        
        if (dayIndex >= 0 && dayIndex < dias.length) {
            const dia = dias[dayIndex];
            const produtosDoDia = getProductsForDay(dia);
            
            // Agrupar produtos por categoria
            const produtosPorCategoria = {};
            produtosDoDia.forEach(produto => {
                if (!produtosPorCategoria[produto.category]) {
                    produtosPorCategoria[produto.category] = [];
                }
                produtosPorCategoria[produto.category].push(produto);
            });

            // Atualizar títulos
            tituloDia.textContent = `Cardápio de ${nomesDias[dayIndex]}`;
            diaAtual.textContent = nomesDias[dayIndex];

            // Renderizar categorias e produtos
            for (const [categoria, produtos] of Object.entries(produtosPorCategoria)) {
                const categoriaDiv = document.createElement('div');
                categoriaDiv.className = 'categoria-produtos';
                
                const tituloCategoria = document.createElement('h4');
                tituloCategoria.textContent = categoria;
                categoriaDiv.appendChild(tituloCategoria);

                const listaProdutos = document.createElement('div');
                listaProdutos.className = 'lista-produtos';

                produtos.forEach(produto => {
                    const produtoDiv = document.createElement('div');
                    produtoDiv.className = 'produto-item';
                    produtoDiv.setAttribute('data-product-id', produto.id);

                    produtoDiv.innerHTML = `
                        <div class="produto-info">
                            <div class="produto-nome">${produto.name}</div>
                            <div class="produto-preco">R$ ${produto.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                        <button class="btn-adicionar-rapido" data-product-id="${produto.id}">+</button>
                    `;

                    // Evento para abrir modal ao clicar no produto
                    produtoDiv.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('btn-adicionar-rapido')) {
                            Modal.openProductModal(produto);
                        }
                    });

                    // Evento para adicionar rapidamente
                    const btnRapido = produtoDiv.querySelector('.btn-adicionar-rapido');
                    btnRapido.addEventListener('click', (e) => {
                        e.stopPropagation();
                        Cart.addToCart(produto);
                    });

                    listaProdutos.appendChild(produtoDiv);
                });

                categoriaDiv.appendChild(listaProdutos);
                containerCardapio.appendChild(categoriaDiv);
            }
        } else {
            // Mostrar "sem fornadas"
            tituloDia.textContent = 'Sem Fornadas Hoje';
            diaAtual.textContent = 'Sem Fornadas';
            semFornadas.style.display = 'block';
        }
    },

    setupEventListeners() {
        const prevDayBtn = document.getElementById("prevDay");
        const nextDayBtn = document.getElementById("nextDay");

        if (prevDayBtn) {
            prevDayBtn.addEventListener("click", () => this.previousDay());
        }
        if (nextDayBtn) {
            nextDayBtn.addEventListener("click", () => this.nextDay());
        }
    },

    previousDay() {
        const dias = ["quarta", "quinta", "sexta", "sabado"];
        this.currentDayIndex = (this.currentDayIndex - 1 + (dias.length + 1)) % (dias.length + 1);
        if (this.currentDayIndex === dias.length) this.currentDayIndex = -1;
        this.renderCardapio(this.currentDayIndex);
    },

    nextDay() {
        const dias = ["quarta", "quinta", "sexta", "sabado"];
        this.currentDayIndex = (this.currentDayIndex + 1) % (dias.length + 1);
        if (this.currentDayIndex === dias.length) this.currentDayIndex = -1;
        this.renderCardapio(this.currentDayIndex);
    }
};