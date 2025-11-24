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
    // ============================================
    // ADICIONAR AO CARRINHO 
    // ============================================
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
    // ============================================
    // REMOVER UM ITEM DO CARRINHO
    // ============================================
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
    // ============================================
    // REMOVER DIRETO DO CARRINHO - botão de remover
    // ============================================
    deleteItem(productId) {
        this.cartItems = this.cartItems.filter(item => item.id !== productId);
        this.saveCartToStorage();
        this.updateCartUI();
    },
    // ============================================
    // ATUALIZAR A INTERFACE DO CARRINHO
    // ============================================
    updateCartUI() {
        const cartCount = document.getElementById("cartCount");
        const cartItemsContainer = document.getElementById("cartItems");
        const cartFooter = document.getElementById("cartFooter");
        const cartTotal = document.getElementById("cartTotal");

        // Atualizar contador
        if (cartCount) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? "flex" : "none";
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
                <img src="${item.image}" class="cart-item-img" alt="${item.name}">

                <div class="cart-item-info">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>

                    <div class="cart-qty-controls">
                        <button class="qty-btn decrease" data-id="${item.id}">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn increase" data-id="${item.id}">+</button>
                    </div>
                </div>

                <button class="delete-item-btn" data-id="${item.id}">🗑</button>
            `;
                //Aumenta quantidade
                cartItem.querySelector(".increase").addEventListener("click", () => {
                    this.addToCart(item);
                });
                //Diminui quantidade
                cartItem.querySelector(".decrease").addEventListener("click", () => {
                    this.removeFromCart(item.id);
                });
                // Remover direto
                cartItem.querySelector(".delete-item-btn").addEventListener("click", () => {
                    this.deleteItem(item.id);
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

    // ============================================
    // ABRIR / FECHAR CARRINHO
    // ============================================
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
    // ============================================
    // ANIMAÇÃO AO ADICIONAR
    // ============================================
    showCartNotification() {
        const cartBtn = document.getElementById("cartBtn");
        if (cartBtn) {
            cartBtn.style.transform = "scale(1.1)";
            setTimeout(() => {
                cartBtn.style.transform = "scale(1)";
            }, 200);
        }
    },
    // ============================================
    // PERSISTÊNCIA 
    // ============================================
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

// Inicializa o carrinho
Cart.initialize();