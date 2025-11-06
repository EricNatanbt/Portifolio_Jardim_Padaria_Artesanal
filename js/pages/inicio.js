// ============================================
// PÁGINA INICIAL
// ============================================
const InicioPage = {
    currentDayProducts: [],
    currentDayIndex: -1,

    initialize() {
        this.setupTodayProducts();
        this.renderProducts();
        this.setupEventListeners();
        this.initializeProductsCarousel();
    },

    initializeProductsCarousel() {
        // Destrói qualquer carrossel anterior
        Carousel.destroy('.products-carousel');
        
        // Aguarda o DOM estar pronto
        setTimeout(() => {
            // Inicializa APENAS o carrossel de produtos
            Carousel.initialize('.products-carousel', {
                delay: 3000, // 3 segundos fixos para produtos
                autoPlay: true
            });
        }, 100);
    },

    // ... resto do código permanece igual
    setupTodayProducts() {
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
            this.currentDayProducts = getProductsForDay(dias[this.currentDayIndex]);
        }
    },
// destaques da semana suspenso por enquanto
    // renderProducts() {
    //     const productsGrid = document.getElementById("productsGrid");
    //     if (!productsGrid) return;

    //     const productsToRender = this.currentDayProducts.slice(0, 8);
    //     productsGrid.innerHTML = "";

    //     if (productsToRender.length === 0) {
    //         productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted-foreground);">Sem produtos disponíveis hoje</p>';
    //         return;
    //     }

    //     productsToRender.forEach((product) => {
    //         const card = document.createElement("div");
    //         card.className = "product-card";
    //         card.innerHTML = `
    //             <div class="product-image">${getProductIcon(product.category)}</div>
    //             <div class="product-info">
    //                 <h4 class="product-name">${product.name}</h4>
    //                 <p class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
    //                 <button class="add-to-cart-btn" data-product-id="${product.id}">Adicionar</button>
    //             </div>
    //         `;

    //         card.querySelector(".add-to-cart-btn").addEventListener("click", () => {
    //             Cart.addToCart(product);
    //         });

    //         productsGrid.appendChild(card);
    //     });
    // },

    setupEventListeners() {
        const ctaButtons = document.querySelectorAll('.cta-button[data-page]');
        ctaButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = button.dataset.page;
                navigateToPage(page);
            });
        });
    }
};