// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
let currentPage = "inicio";

// ============================================
// INICIALIZAÇÃO
// ============================================
function initializeApp() {
    Navigation.initialize();
    Cart.initialize();
    Modal.initialize();
    
    // Inicializa a página atual
    initializePageComponents(currentPage);
}

// ============================================
// NAVEGAÇÃO 
// ============================================
// A lógica de navegação entre páginas (navigateToPage) e o closeMobileMenu
// para fechar o menu mobile após a navegação, foram mantidas.
// A inicialização do menu mobile foi movida para o componente navigation.js.

function closeMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
        mobileMenu.classList.remove("active");
        document.body.style.overflow = "auto";
    }
}

function navigateToPage(page) {
    // Esconde todas as páginas
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Mostra a página selecionada
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        
        // Atualiza navegação
        updateNavigation(page);
        
        // Inicializa componentes da página
        initializePageComponents(page);
        
        // Scroll para o topo
        window.scrollTo(0, 0);
        
        // Fecha menu mobile se estiver aberto
        closeMobileMenu();
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
// INICIALIZAÇÃO DE COMPONENTES POR PÁGINA
// ============================================
function initializePageComponents(pageName) {
    Carousel.destroy('.products-carousel');
    Carousel.destroy('.about-section .carousel-container');
    
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
    const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const date = new Date();
    return days[date.getDay()];
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
    return menuData.filter(item => item.day.includes(day));
}

// ============================================
// FUNÇÃO PARA ABRIR GOOGLE MAPS
// ============================================
function abrirGoogleMaps() {
    const endereco = "Av. Joaquim Caroca, 266 - Universitário, Campina Grande - PB, 58429-120";
    const url = `https://www.google.com/maps/place/Jardim+-+Padaria+Artesanal/@-7.2194373,-35.9162032,17z/data=!3m1!4b1!4m16!1m9!4m8!1m0!1m6!1m2!1s0x7ac1f2513d88d7b:0x2722101e32d4a6ea!2sAv.+Joaquim+Caroca,+266+-+Universitário,+Campina+Grande+-+PB,+58429-120!2m2!1d-35.9136283!2d-7.2194373!3m5!1s0x7ac1f2513d88d7b:0x2722101e32d4a6ea!8m2!3d-7.2194373!4d-35.9136283!16s%2Fg%2F11y2q9h1q6?entry=ttu&g_ep=EgoyMDI1MTAyOS4yIKXMDSoASAFQAw%3D%3D`;
    window.open(url, '_blank');
}

// Também torne o card inteiro clicável (opcional)
function tornarCardsClicaveis() {
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
        // Encontra o card de localização pelo texto
        const texto = card.textContent;
        if (texto.includes('Visite Nossa Loja') || texto.includes('Av. Joaquim Caroca')) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', abrirGoogleMaps);
        }
    });
}

// Inicializa os cards clicáveis quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(tornarCardsClicaveis, 1000);
});

// ============================================
// EXPORTAÇÕES PARA USO EM OUTROS MÓDULOS
// ============================================
window.navigateToPage = navigateToPage;
window.getProductIcon = getProductIcon;
window.getProductsForDay = getProductsForDay;
window.getCurrentDayName = getCurrentDayName;
window.showNotification = showNotification;
window.initializeApp = initializeApp;