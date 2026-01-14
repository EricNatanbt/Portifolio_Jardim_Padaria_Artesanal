// ============================================
// DADOS DE PRODUTOS
// ============================================
const products = menuData;

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
let currentPage = "inicio";
let selectedCategory = "";
let cartItems = [];
let searchQuery = "";
let currentDayProducts = [];
let currentDayIndex = -1;

// ============================================
// ELEMENTOS DO DOM
// ============================================
const contactModal = document.getElementById("contactModal");
const contactModalOverlay = document.getElementById("contactModalOverlay");
const closeContactModal = document.getElementById("closeContactModal");
const mainContactCard = document.getElementById("mainContactCard");
const contactOptionCall = document.getElementById("contactOptionCall");
const contactOptionEmail = document.getElementById("contactOptionEmail");
const contactOptionWhatsapp = document.getElementById("contactOptionWhatsapp");
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const productsGrid = document.getElementById("productsGrid");
const sectionTitle = document.getElementById("sectionTitle");
const cartItemsContainer = document.getElementById("cartItems");
const cartFooter = document.getElementById("cartFooter");
const cartTotal = document.getElementById("cartTotal");

// Elementos do cardápio
const tituloDia = document.getElementById("titulo-dia");
const diaAtual = document.getElementById("dia-atual");
const containerCardapio = document.getElementById("container-cardapio");
const semFornadas = document.getElementById("sem-fornadas");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");

// Elementos do modal
const productModal = document.getElementById("productModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModal = document.getElementById("closeModal");
const modalProductName = document.getElementById("modalProductName");
const modalProductImage = document.getElementById("modalProductImage");
const modalProductDescription = document.getElementById("modalProductDescription");
const modalProductPrice = document.getElementById("modalProductPrice");
const addToCartModal = document.getElementById("addToCartModal");

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().getDay();
    const dayMap = {
        3: 0, // quarta
        4: 1, // quinta
        5: 2, // sexta
        6: 3  // sábado
    };
    
    currentDayIndex = dayMap[today] !== undefined ? dayMap[today] : -1;
    
    if (currentDayIndex !== -1) {
        const dias = ["quarta", "quinta", "sexta", "sabado"];
        currentDayProducts = getProductsForDay(dias[currentDayIndex]);
    }
    
    initializeEventListeners();
    setupPageNavigation();
    renderProducts("inicio");
    setupCarousel(); // Inicializa o carrossel de imagens
    setupCardapio(); // Inicializa o cardápio
});

// ============================================
// PAGE NAVIGATION
// ============================================
function setupPageNavigation() {
    // Desktop navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });

    // Mobile navigation
    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
            closeMobileMenu();
        });
    });

    // Footer navigation
    document.querySelectorAll(".footer-nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });

    // CTA Button
    document.querySelector(".cta-button").addEventListener("click", () => {
        navigateToPage("menu");
    });
}

function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll(".page").forEach((p) => {
        p.classList.remove("active");
    });

    // Show selected page
    const selectedPage = document.getElementById(`page-${page}`);
    if (selectedPage) {
        selectedPage.classList.add("active");
        currentPage = page;

        // Update navigation active states
        updateNavigation(page);

        // Render content based on page
        if (page === "inicio") {
            renderProducts("inicio");
        } else if (page === "menu") {
            setupCardapio();
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }
}

function updateNavigation(page) {
    // Desktop navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
        if (link.dataset.page === page) {
            link.classList.add("active");
        }
    });

    // Mobile navigation
    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
        link.classList.remove("active");
        if (link.dataset.page === page) {
            link.classList.add("active");
        }
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
    // Menu Mobile
    menuToggle.addEventListener("click", toggleMobileMenu);

    // Carrinho
    cartBtn.addEventListener("click", openCart);
    cartOverlay.addEventListener("click", closeCartSidebar);
    closeCart.addEventListener("click", closeCartSidebar);

    // Modal
    modalOverlay.addEventListener("click", closeProductModal);
    closeModal.addEventListener("click", closeProductModal);
    addToCartModal.addEventListener("click", addToCartFromModal);

	    // Navegação do cardápio
	    prevDayBtn.addEventListener("click", previousDay);
	    nextDayBtn.addEventListener("click", nextDay);

	    // Contatos
	    if (mainContactCard) {
	        mainContactCard.addEventListener("click", handleMainContactClick);
	    }
	    if (contactModalOverlay) {
	        contactModalOverlay.addEventListener("click", closeContactModalFunc);
	    }
	    if (closeContactModal) {
	        closeContactModal.addEventListener("click", closeContactModalFunc);
	    }
	    if (contactOptionCall) {
	        contactOptionCall.addEventListener("click", () => window.location.href = "tel:+5583999204618");
	    }
	    if (contactOptionEmail) {
	        contactOptionEmail.addEventListener("click", () => window.location.href = "mailto:jardimpadariacg@gmail.com");
	    }
	    if (contactOptionWhatsapp) {
	        contactOptionWhatsapp.addEventListener("click", () => window.open("https://wa.me/5583999204618", "_blank"));
	    }
	}

// ============================================
// MENU MOBILE
// ============================================
function toggleMobileMenu() {
    mobileMenu.classList.toggle("active");
}

function closeMobileMenu() {
    mobileMenu.classList.remove("active");
}

// ============================================
// RENDERIZAR PRODUTOS - PÁGINA INÍCIO
// ============================================
function renderProducts(page) {
    if (page !== "inicio") return;

    const productsToRender = currentDayProducts.slice(0, 8);

    productsGrid.innerHTML = "";

    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted-foreground);">Sem produtos disponíveis hoje</p>';
        return;
    }

    productsToRender.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-image">${getProductIcon(product.category)}</div>
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Adicionar</button>
            </div>
        `;

        card.querySelector(".add-to-cart-btn").addEventListener("click", () => {
            addToCart(product);
        });

        productsGrid.appendChild(card);
    });
}

// ============================================
// CARDÁPIO SEMANAL
// ============================================
function setupCardapio() {
    renderCardapio(currentDayIndex);
}

function renderCardapio(dayIndex) {
    const dias = ["quarta", "quinta", "sexta", "sabado"];
    const nomesDias = ["Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    
    // Limpar container
    containerCardapio.innerHTML = '';
    semFornadas.style.display = 'none';

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
                        openProductModal(produto);
                    }
                });

                // Evento para adicionar rapidamente
                const btnRapido = produtoDiv.querySelector('.btn-adicionar-rapido');
                btnRapido.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(produto);
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
}

function previousDay() {
    const dias = ["quarta", "quinta", "sexta", "sabado"];
    currentDayIndex = (currentDayIndex - 1 + (dias.length + 1)) % (dias.length + 1);
    if (currentDayIndex === dias.length) currentDayIndex = -1;
    renderCardapio(currentDayIndex);
}

function nextDay() {
    const dias = ["quarta", "quinta", "sexta", "sabado"];
    currentDayIndex = (currentDayIndex + 1) % (dias.length + 1);
    if (currentDayIndex === dias.length) currentDayIndex = -1;
    renderCardapio(currentDayIndex);
}

// ============================================
// CONTATOS
// ============================================

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function openContactModal() {
    if (contactModal) {
        contactModal.style.display = "flex";
        setTimeout(() => contactModal.classList.add("active"), 10);
    }
}

function closeContactModalFunc() {
    if (contactModal) {
        contactModal.classList.remove("active");
        setTimeout(() => contactModal.style.display = "none", 300);
    }
}

function handleMainContactClick() {
    const email = "jardimpadariacg@gmail.com";
    const subject = "Pedido/Contato via Portfólio";
    const body = "Olá, gostaria de entrar em contato sobre...";

    if (!isMobile()) {
        // Lógica para PC: Abrir Gmail ou cliente de email padrão
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
        // Lógica para Mobile: Abrir modal de opções
        openContactModal();
    }
}

// ============================================
// MODAL DE DETALHES DO PRODUTO
// ============================================
let currentModalProduct = null;

function openProductModal(product) {
    currentModalProduct = product;
    
    // Preencher dados do modal
    modalProductName.textContent = product.name;
    modalProductImage.textContent = getProductIcon(product.category);
    modalProductDescription.textContent = product.description;
    modalProductPrice.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
    
    productModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentModalProduct = null;
}

function addToCartFromModal() {
    if (currentModalProduct) {
        addToCart(currentModalProduct);
        closeProductModal();
    }
}

// ============================================
// CARRINHO
// ============================================
function addToCart(product) {
    cartItems.push(product);
    updateCartUI();
    
    // Feedback visual
    showCartNotification();
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    // Atualizar contador
    if (cartItems.length > 0) {
        cartCount.textContent = cartItems.length;
        cartCount.style.display = "flex";
    } else {
        cartCount.style.display = "none";
    }

    // Renderizar itens do carrinho
    renderCartItems();
}

function renderCartItems() {
    cartItemsContainer.innerHTML = "";

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        cartFooter.style.display = "none";
        return;
    }

    cartItems.forEach((item, index) => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <p class="cart-item-name">${item.name}</p>
                <p class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <button class="remove-item-btn" data-index="${index}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        cartItem.querySelector(".remove-item-btn").addEventListener("click", () => {
            removeFromCart(index);
        });

        cartItemsContainer.appendChild(cartItem);
    });

    // Atualizar total
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    cartFooter.style.display = "flex";
}

function openCart() {
    cartSidebar.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeCartSidebar() {
    cartSidebar.style.display = "none";
    document.body.style.overflow = "auto";
}

function showCartNotification() {
    // Adicionar animação visual ao botão do carrinho
    cartBtn.style.transform = "scale(1.1)";
    setTimeout(() => {
        cartBtn.style.transform = "scale(1)";
    }, 200);
}

// ============================================
// CARROSSEL AUTOMÁTICO
// ============================================




function setupCarousel() {
    const carouselImages = document.querySelectorAll('.carousel-image');
    if (carouselImages.length === 0) return;

    let currentIndex = 0;

    function showNextImage() {
        // Remove 'active' class from current image
        carouselImages[currentIndex].classList.remove('active');

        // Calculate next index
        currentIndex = (currentIndex + 1) % carouselImages.length;

        // Add 'active' class to next image
        carouselImages[currentIndex].classList.add('active');
    }

    // Start the automatic slideshow (e.g., every 3000ms or 3 seconds)
    setInterval(showNextImage, 4500);
}