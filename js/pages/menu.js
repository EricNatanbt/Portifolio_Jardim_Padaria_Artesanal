// ============================================
// PÁGINA MENU
// ============================================
const MenuPage = {
    initialize() {
        // Criar uma nova instância limpa sempre que inicializar
        this.menuInstance = new MenuInstance();
        this.menuInstance.initialize();
    },

    // Métodos para acesso externo (se necessário)
    previousDay() {
        if (this.menuInstance) {
            this.menuInstance.previousDay();
        }
    },

    nextDay() {
        if (this.menuInstance) {
            this.menuInstance.nextDay();
        }
    }
};

// Classe para gerenciar o estado do menu
class MenuInstance {
    constructor() {
        this.dias = ["quarta", "quinta", "sexta", "sabado"];
        this.nomesDias = ["Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        this.currentDayIndex = this.getTodayIndex(); // Sempre começa com o dia atual
    }

    initialize() {
        this.renderCardapio(this.currentDayIndex);
        this.setupEventListeners();
    }

    getTodayIndex() {
        const hoje = new Date();
        const diaSemana = 5; //hoje.getDay(); // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
        
        const diaParaIndice = {
            3: 0, // quarta -> índice 0
            4: 1, // quinta -> índice 1
            5: 2, // sexta -> índice 2
            6: 3  // sábado -> índice 3
        };

        return diaParaIndice[diaSemana] !== undefined ? diaParaIndice[diaSemana] : -1;
    }

    renderCardapio(dayIndex) {
        const containerCardapio = document.getElementById("container-cardapio");
        const semFornadas = document.getElementById("sem-fornadas");
        const tituloDia = document.getElementById("titulo-dia");
        const diaAtual = document.getElementById("dia-atual");

        if (!containerCardapio || !semFornadas || !tituloDia || !diaAtual) return;

        // Limpar container
        containerCardapio.innerHTML = '';
        semFornadas.style.display = 'none';

        // Verificar se está mostrando o cardápio do dia atual
        const hojeIndex = this.getTodayIndex();
        const isMostrandoHoje = dayIndex === hojeIndex && hojeIndex !== -1;

        if (dayIndex >= 0 && dayIndex < this.dias.length) {
            const dia = this.dias[dayIndex];
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
            tituloDia.textContent = `Cardápio de ${this.nomesDias[dayIndex]}`;
            diaAtual.textContent = this.nomesDias[dayIndex];

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

                    // Evento para adicionar rapidamente (só funciona se for o dia atual)
                    const btnRapido = produtoDiv.querySelector('.btn-adicionar-rapido');
                    btnRapido.addEventListener('click', (e) => {
                        e.stopPropagation();
                        
                        if (isMostrandoHoje) {
                            Cart.addToCart(produto);
                        } else {
                            const message = `❌ ${produto.name} só está disponível na(s) ${produto.day.join(' e ')}.`;
                            showNotification(message, 3000, 'error');
                        }
                    });

                    listaProdutos.appendChild(produtoDiv);
                });

                categoriaDiv.appendChild(listaProdutos);
                containerCardapio.appendChild(categoriaDiv);
            }
        } else {
            // Mostrar "sem fornadas"
            tituloDia.textContent = 'Sem Fornadas';
            diaAtual.textContent = 'Hoje';
            semFornadas.style.display = 'block';
        }

        // Atualizar o índice atual
        this.currentDayIndex = dayIndex;
    }

    setupEventListeners() {
        const prevDayBtn = document.getElementById("prevDay");
        const nextDayBtn = document.getElementById("nextDay");

        if (prevDayBtn) {
            prevDayBtn.addEventListener("click", () => this.previousDay());
        }
        if (nextDayBtn) {
            nextDayBtn.addEventListener("click", () => this.nextDay());
        }
    }

    previousDay() {
        let newIndex;

        if (this.currentDayIndex === -1) {
            // De "sem fornadas" vai para sábado
            newIndex = this.dias.length - 1;
        } else if (this.currentDayIndex === 0) {
            // De quarta vai para "sem fornadas"
            newIndex = -1;
        } else {
            // Dias normais: vai para o anterior
            newIndex = this.currentDayIndex - 1;
        }

        this.renderCardapio(newIndex);
    }

    nextDay() {
        let newIndex;

        if (this.currentDayIndex === -1) {
            // De "sem fornadas" vai para quarta
            newIndex = 0;
        } else if (this.currentDayIndex === this.dias.length - 1) {
            // De sábado vai para "sem fornadas"
            newIndex = -1;
        } else {
            // Dias normais: vai para o próximo
            newIndex = this.currentDayIndex + 1;
        }

        this.renderCardapio(newIndex);
    }
}

// Função auxiliar fora do objeto
function getProductsForDay(day) {
    if (typeof menuData === 'undefined') {
        console.error("menuData não está definido. Verifique se data/menuData.js foi carregado corretamente.");
        return [];
    }
    return menuData.filter(produto => produto.day.includes(day));
}