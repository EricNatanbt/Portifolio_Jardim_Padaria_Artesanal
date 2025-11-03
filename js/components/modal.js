// ============================================
// COMPONENTE DO MODAL
// ============================================
const Modal = {
    currentModalProduct: null,

    initialize() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        const modalOverlay = document.getElementById("modalOverlay");
        const closeModal = document.getElementById("closeModal");
        const addToCartModal = document.getElementById("addToCartModal");

        if (modalOverlay) {
            modalOverlay.addEventListener("click", () => this.closeProductModal());
        }
        if (closeModal) {
            closeModal.addEventListener("click", () => this.closeProductModal());
        }
        if (addToCartModal) {
            addToCartModal.addEventListener("click", () => this.addToCartFromModal());
        }
    },

    openProductModal(product) {
        this.currentModalProduct = product;
        
        const modalProductName = document.getElementById("modalProductName");
        const modalProductImage = document.getElementById("modalProductImage");
        const modalProductDescription = document.getElementById("modalProductDescription");
        const modalProductIngredients = document.getElementById("modalProductIngredients");
        const modalProductPrice = document.getElementById("modalProductPrice");
        const productModal = document.getElementById("productModal");
        
        // Preencher dados do modal
        if (modalProductName) modalProductName.textContent = product.name;
        if (modalProductImage) modalProductImage.textContent = getProductIcon(product.category);
        if (modalProductDescription) modalProductDescription.textContent = product.description;
        if (modalProductIngredients) modalProductIngredients.textContent = product.ingredients || "Ingredientes selecionados com cuidado e qualidade.";
        if (modalProductPrice) modalProductPrice.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
        
        if (productModal) {
            productModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },

    closeProductModal() {
        const productModal = document.getElementById("productModal");
        if (productModal) {
            productModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.currentModalProduct = null;
        }
    },

    addToCartFromModal() {
        if (this.currentModalProduct) {
            Cart.addToCart(this.currentModalProduct);
            this.closeProductModal();
        }
    }
};