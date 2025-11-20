// ============================================
// COMPONENTE DO CARRINHO
// ============================================
const Cart = {
    cartItems: [],
    
    initialize() {
        this.setupEventListeners();
        this.loadCartFromStorage();
        this.updateCartUI();
    },

    setupEventListeners() {
        const cartBtn = document.getElementById("cartBtn");
        const cartOverlay = document.getElementById("cartOverlay");
        const closeCart = document.getElementById("closeCart");

        if (cartBtn) {
            cartBtn.addEventListener("click", () => this.openCart());
        }
        if (cartOverlay) {
            cartOverlay.addEventListener("click", () => this.closeCart());
        }
        if (closeCart) {
            closeCart.addEventListener("click", () => this.closeCart());
        }
    },

    addToCart(product) {
        // 1. Obter o dia da semana atual
        const currentDay = window.getCurrentDayName();

        // 2. Verificar se o produto está disponível hoje
        if (!product.day.includes(currentDay)) {
            // Se o produto não estiver disponível, exibir uma notificação e interromper
            const message = `❌ ${product.name} só está disponível na(s) ${product.day.join(' e ')}.`;
            window.showNotification(message, 3000, 'error');
            return;
        }

        // 3. Adicionar ao carrinho se a validação passar
        const existingItem = this.cartItems.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({ ...product, quantity: 1 });
        }

        this.saveCartToStorage();
        this.updateCartUI();
        this.showCartNotification();
    },

    removeFromCart(productId) {
        const itemIndex = this.cartItems.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            const item = this.cartItems[itemIndex];
            item.quantity -= 1;

            if (item.quantity <= 0) {
                this.cartItems.splice(itemIndex, 1);
            }
            
            this.saveCartToStorage();
            this.updateCartUI();
        }
    },

    updateCartUI() {
        const cartCount = document.getElementById("cartCount");
        const cartItemsContainer = document.getElementById("cartItems");
        const cartFooter = document.getElementById("cartFooter");
        const cartTotal = document.getElementById("cartTotal");

        // Atualizar contador
        if (cartCount) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            if (totalItems > 0) {
                cartCount.textContent = totalItems;
                cartCount.style.display = "flex";
            } else {
                cartCount.style.display = "none";
            }
        }

            // Renderizar itens do carrinho
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = "";

                if (this.cartItems.length === 0) {
                    cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
                    if (cartFooter) cartFooter.style.display = "none";
                    return;
                }

                this.cartItems.forEach((item) => {
                    const cartItem = document.createElement("div");
                    cartItem.className = "cart-item";
                    cartItem.innerHTML = `
                        <div class="cart-item-info">
                            <p class="cart-item-name">${item.name} x${item.quantity}</p>
                            <p class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <button class="remove-item-btn" data-id="${item.id}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    `;

                    cartItem.querySelector(".remove-item-btn").addEventListener("click", () => {
                        this.removeFromCart(item.id);
                    });

                    cartItemsContainer.appendChild(cartItem);
                });

                // Atualizar total
                if (cartTotal && cartFooter) {
                    const total = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
                    cartFooter.style.display = "flex";
                }
            }
    },

    openCart() {
        const cartSidebar = document.getElementById("cartSidebar");
        if (cartSidebar) {
            cartSidebar.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    },

    closeCart() {
        const cartSidebar = document.getElementById("cartSidebar");
        if (cartSidebar) {
            cartSidebar.style.display = "none";
            document.body.style.overflow = "auto";
        }
    },

    showCartNotification() {
        const cartBtn = document.getElementById("cartBtn");
        if (cartBtn) {
            cartBtn.style.transform = "scale(1.1)";
            setTimeout(() => {
                cartBtn.style.transform = "scale(1)";
            }, 200);
        }
    },

    saveCartToStorage() {
        localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    },

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            this.cartItems = JSON.parse(savedCart);
        }
    }
};