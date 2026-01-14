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
            addToCartModal.addEventListener("click", (e) => this.addToCartFromModal(e));
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
        
        // Exibir a foto real do produto
        if (modalProductImage) {
            modalProductImage.src = product.image || product.imagem || "img/logos/Logo.png";
            modalProductImage.alt = product.name;
        }
        
        if (modalProductDescription) {
            const description = product.description || "Delicioso produto artesanal da Padaria Jardim.";
            modalProductDescription.innerHTML = description.replace(/\n/g, '<br>');
        }
        if (modalProductIngredients) {
            const ingredients = product.ingredients || "Ingredientes selecionados com cuidado e qualidade.";
            modalProductIngredients.innerHTML = ingredients.replace(/\n/g, '<br>');
        }
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

    addToCartFromModal(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.currentModalProduct) return;
        
        // Verifica disponibilidade
        const currentDay = window.getCurrentDayName ? window.getCurrentDayName() : 'quarta'; // Fallback
        
        if (!this.currentModalProduct.available_days || 
            !this.currentModalProduct.available_days.includes(currentDay)) {
            const diaDisponivel = this.currentModalProduct.available_days && 
                this.currentModalProduct.available_days.length > 0 
                ? this.currentModalProduct.available_days.join(' e ')
                : 'dias não especificados';
            const message = `❌ ${this.currentModalProduct.name} só está disponível na(s) ${diaDisponivel}.`;
            
            if (window.showNotification) {
                window.showNotification(message, 3000, 'error');
            } else {
                alert(message);
            }
            return;
        }
        
        // Adiciona ao carrinho
        if (window.Cart && window.Cart.addToCart) {
            window.Cart.addToCart(this.currentModalProduct);
        } else {
            console.error('Cart não está disponível');
            alert('Erro ao adicionar ao carrinho. Tente novamente.');
        }
        
        this.closeProductModal();
    }
};

// Exporta para uso em outros módulos
export { Modal };
export default Modal;