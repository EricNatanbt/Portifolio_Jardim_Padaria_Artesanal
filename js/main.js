// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
let currentPage = "inicio";

// ============================================
// INICIALIZAÇÃO
// ============================================
function initializeApp() {
    initializeNavigation();
    if (typeof Cart !== 'undefined') Cart.initialize();
    if (typeof Modal !== 'undefined') Modal.initialize();
    
    // Inicializa a página atual
    initializePageComponents(currentPage);
}

// ============================================
// NAVEGAÇÃO
// ============================================
function initializeNavigation() {
    // Menu mobile toggle
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
    const closeMobileMenuBtn = document.getElementById("closeMobileMenu");

    if (menuToggle && mobileMenu && mobileMenuOverlay) {
        menuToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMobileMenu();
        });

        // Fechar menu ao clicar no overlay
        mobileMenuOverlay.addEventListener("click", (e) => {
            e.preventDefault();
            closeMobileMenu();
        });

        // Fechar menu ao clicar no botão de fechar
        if (closeMobileMenuBtn) {
            closeMobileMenuBtn.addEventListener("click", (e) => {
                e.preventDefault();
                closeMobileMenu();
            });
        }

        // Fechar menu ao pressionar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }

    // Navegação entre páginas - PARA DESKTOP E MOBILE
    document.addEventListener('click', (e) => {
        // Verifica tanto os links desktop quanto mobile
        if (e.target.matches('[data-page]')) {
            e.preventDefault();
            const page = e.target.dataset.page;
            navigateToPage(page);
            
            // Fecha o menu mobile se estiver aberto
            closeMobileMenu();
        }
    });
}

function openMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
    
    if (mobileMenu && mobileMenuOverlay) {
        mobileMenu.classList.add("active");
        mobileMenuOverlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
    
    if (mobileMenu && mobileMenuOverlay) {
        mobileMenu.classList.remove("active");
        mobileMenuOverlay.classList.remove("active");
        document.body.style.overflow = '';
    }
}

function navigateToPage(page) {
    // Adiciona transição de saída na página atual
    const currentActivePage = document.querySelector('.page.active');
    if (currentActivePage) {
        currentActivePage.style.opacity = '0';
        currentActivePage.style.transform = 'translateY(20px)';
    }
    
    setTimeout(() => {
        // Esconde todas as páginas
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.style.opacity = '0';
            p.style.transform = 'translateY(20px)';
        });
        
        // Mostra a página selecionada
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
            currentPage = page;
            
            // Força o reflow para garantir a transição
            targetPage.offsetHeight;
            
            // Aplica a transição de entrada
            setTimeout(() => {
                targetPage.style.opacity = '1';
                targetPage.style.transform = 'translateY(0)';
            }, 50);
            
            // Atualiza navegação
            updateNavigation(page);
            
            // Inicializa componentes da página
            initializePageComponents(page);
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, 200);
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
// INICIALIZAÇÃO DE COMPONENTES POR PÁGINA
// ============================================
function initializePageComponents(pageName) {
    if (typeof Carousel !== 'undefined') {
        Carousel.destroy('.products-carousel');
        Carousel.destroy('.about-section .carousel-container');
    }
    
    switch(pageName) {
        case 'inicio':
            if (typeof InicioPage !== 'undefined') InicioPage.initialize();
            break;
        case 'sobre':
            if (typeof SobreNosPage !== 'undefined') SobreNosPage.initialize();
            break;
        case 'menu':
            if (typeof MenuPage !== 'undefined') MenuPage.initialize();
            break;
        case 'cuidados':
            if (typeof CuidadosPage !== 'undefined') CuidadosPage.initialize();
            break;
        case 'feedbacks':
            if (typeof FeedbacksPage !== 'undefined') FeedbacksPage.initialize();
            break;
    }
}

// ============================================
// UTILITÁRIOS
// ============================================
function showNotification(message, duration = 3000, type = 'info') {
    const notificationBar = document.getElementById('notificationBar');
    if (notificationBar) {
        notificationBar.textContent = message;
        notificationBar.classList.remove('info', 'error');
        notificationBar.classList.add(type);
        notificationBar.classList.add('show');

        setTimeout(() => {
            notificationBar.classList.remove('show');
        }, duration);
    }
}

function getCurrentDayName() {
    // SIMULAÇÃO DE DATA: Sempre retorna "quarta" para liberar os produtos desse dia.
    // Para reverter, basta descomentar as linhas originais e apagar esta.
    // const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    // const date = new Date();
    // return days[date.getDay()];
    return "quarta";
}

function getDayNameInPortuguese(dayIndex) {
    const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    return days[dayIndex];
}

function getProductIcon(category) {
    const categoryIcons = {
        "Pães": "🥖",
        "Ciabattas": "🥪",
        "Focaccias": "🍕",
        "Doces": "🧁",
        "Bolos": "🎂",
        "Mini Bolos": "🧁",
        "Chocolate": "🍫"
    };
    return categoryIcons[category] || "✨";
}

function getProductsForDay(day) {
    if (typeof menuData !== 'undefined') {
        return menuData.filter(item => item.day.includes(day));
    }
    return [];
}

// ============================================
// FUNÇÕES DE CONTATO E LOCALIZAÇÃO
// ============================================

// Função para abrir o Google Maps
function abrirGoogleMaps() {
    const url = `https://www.google.com/maps/place/Jardim+-+Padaria+Artesanal/@-7.2194479,-35.9136032,17z/data=!4m15!1m8!3m7!1s0x7ac1e2848add97d:0xd1ca8485544602d4!2sAv.+Joaquim+Caroca,+266+-+Universitário,+Campina+Grande+-+PB,+58429-120!3b1!8m2!3d-7.2194479!4d-35.9136032!16s%2Fg%2F11hbgkf50h!3m5!1s0x7ac1f2513d88d7b:0x2722101e32d4a6ea!8m2!3d-7.2194373!4d-35.9136283!16s%2Fg%2F11y2q9h1q6?entry=ttu&g_ep=EgoyMDI1MTEwNS4wIKXMDSoASAFQAw%3D%3D`;
    window.open(url, '_blank');
}

// Função para abrir o WhatsApp
function abrirWhatsApp() {
    const whatsappLink = "https://api.whatsapp.com/send/?phone=558399204618&text&type=phone_number&app_absent=0";
    window.open(whatsappLink, '_blank');
}

// Função para abrir contato (agora sempre direciona para o WhatsApp)
function abrirContato() {
    abrirWhatsApp();
}



// ============================================
// EXPORTAÇÕES PARA USO EM OUTROS MÓDULOS
// ============================================
window.navigateToPage = navigateToPage;
window.getProductIcon = getProductIcon;
window.getProductsForDay = getProductsForDay;
window.getCurrentDayName = getCurrentDayName;
window.showNotification = showNotification;
window.initializeApp = initializeApp;
window.abrirGoogleMaps = abrirGoogleMaps;

window.abrirWhatsApp = abrirWhatsApp;
window.abrirContato = abrirContato;