import { supabase } from '../supabaseClient.js';
import Cart from '../components/cart.js';

// ============================================
// PÁGINA INICIAL
// ============================================
const InicioPage = {
    currentDayProducts: [],
    currentDayIndex: -1,

    async initialize() {
        await this.setupTodayProducts();
        this.renderProducts();
        this.setupEventListeners();
        this.initializeProductsCarousel();
    },

    initializeProductsCarousel() {
        // Destrói qualquer carrossel anterior
        if (typeof Carousel !== 'undefined') {
            Carousel.destroy('.products-carousel');
            
            // Aguarda o DOM estar pronto
            setTimeout(() => {
                // Inicializa APENAS o carrossel de produtos
                Carousel.initialize('.products-carousel', {
                    delay: 3000, // 3 segundos fixos para produtos
                    autoPlay: true
                });
            }, 100);
        }
    },

    async setupTodayProducts() {
        try {
            const today = new Date().getDay();
            const dayMap = {
                3: 0, // quarta
                4: 1, // quinta
                5: 2, // sexta
                6: 3  // sábado
            };
            
            this.currentDayIndex = dayMap[today] !== undefined ? dayMap[today] : -1;
            
            if (this.currentDayIndex !== -1) {
                const dias = ["quarta", "quinta", "sexta", "sabado"];
                const todayDay = dias[this.currentDayIndex];
                
                // Buscar produtos do dia atual do Supabase
                this.currentDayProducts = await this.getProductsForDay(todayDay);
            } else {
                this.currentDayProducts = [];
            }
        } catch (error) {
            console.error('Erro ao configurar produtos do dia:', error);
            this.currentDayProducts = [];
        }
    },

    async getProductsForDay(day) {
        try {
            const { data: products, error } = await window.supabase
                .from('products')
                .select('*')
                .contains('available_days', [day])
                .limit(8); // Limita a 8 produtos para a página inicial

            if (error) throw error;

            return products.map(item => ({
                id: item.id,
                name: item.name,
                price: parseFloat(item.price),
                description: item.description,
                ingredients: item.ingredients,
                category: item.category,
                available_days: item.available_days || [],
                day: item.available_days || [] // Mantém compatibilidade
            }));
        } catch (error) {
            console.error('Erro ao buscar produtos do dia:', error);
            return [];
        }
    },

    renderProducts() {
        const productsGrid = document.getElementById("productsGrid");
        if (!productsGrid) return;

        const productsToRender = this.currentDayProducts.slice(0, 8);
        productsGrid.innerHTML = "";

        if (productsToRender.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <p style="color: var(--muted-foreground); margin-bottom: 1rem;">
                        Sem produtos disponíveis hoje. Confira nosso cardápio completo!
                    </p>
                    <button class="cta-button primary" data-page="menu" 
                            style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                        Ver Cardápio Completo
                    </button>
                </div>`;
            return;
        }

        productsToRender.forEach((product) => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.setAttribute('data-product-id', product.id);
            
            card.innerHTML = `
                <div class="product-image">
                    <img src="img/logos/Logo.png" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        Adicionar
                    </button>
                </div>
            `;

            // Evento para abrir modal de detalhes
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-to-cart-btn')) {
                    this.openProductModal(product);
                }
            });

            // Evento para adicionar ao carrinho
            const addBtn = card.querySelector(".add-to-cart-btn");
            addBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                
                // Verifica se o produto está disponível hoje
                const currentDay = window.getCurrentDayName();
                if (!product.available_days || !product.available_days.includes(currentDay)) {
                    const diaDisponivel = product.available_days && product.available_days.length > 0 
                        ? product.available_days.join(' e ')
                        : 'dias não especificados';
                    const message = `❌ ${product.name} só está disponível na(s) ${diaDisponivel}.`;
                    window.showNotification(message, 3000, 'error');
                    return;
                }
                
                Cart.addToCart(product);
            });

            productsGrid.appendChild(card);
        });
    },

    openProductModal(product) {
        // Usa o sistema de modal existente
        if (window.Modal && typeof window.Modal.openProductModal === 'function') {
            window.Modal.openProductModal(product);
        } else {
            // Fallback manual
            const modal = document.getElementById('productModal');
            const modalProductName = document.getElementById('modalProductName');
            const modalProductDescription = document.getElementById('modalProductDescription');
            const modalProductIngredients = document.getElementById('modalProductIngredients');
            const modalProductPrice = document.getElementById('modalProductPrice');
            const addToCartModal = document.getElementById('addToCartModal');

            if (modal && modalProductName && modalProductDescription && 
                modalProductIngredients && modalProductPrice && addToCartModal) {
                
                modalProductName.textContent = product.name;
                modalProductDescription.textContent = product.description || 'Sem descrição disponível.';
                modalProductIngredients.textContent = product.ingredients || 'Ingredientes não especificados.';
                modalProductPrice.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
                
                // Atualizar função do botão de adicionar ao carrinho
                addToCartModal.onclick = () => {
                    // Verifica disponibilidade
                    const currentDay = window.getCurrentDayName();
                    if (!product.available_days || !product.available_days.includes(currentDay)) {
                        const diaDisponivel = product.available_days && product.available_days.length > 0 
                            ? product.available_days.join(' e ')
                            : 'dias não especificados';
                        const message = `❌ ${product.name} só está disponível na(s) ${diaDisponivel}.`;
                        window.showNotification(message, 3000, 'error');
                        return;
                    }
                    
                    Cart.addToCart(product);
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                };
                
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
    },

    setupEventListeners() {
        const ctaButtons = document.querySelectorAll('.cta-button[data-page]');
        ctaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = button.dataset.page;
                window.navigateToPage(page);
            });
        });

        // Event listener para o botão de ver cardápio na mensagem de sem produtos
        const noProductsButton = document.querySelector('#productsGrid .cta-button[data-page="menu"]');
        if (noProductsButton) {
            noProductsButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.navigateToPage('menu');
            });
        }
    }
};

// Exporta para uso global
window.InicioPage = InicioPage;