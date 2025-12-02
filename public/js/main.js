// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
let currentPage = "inicio";
let Cart = null;
let Modal = null;

// ============================================
// INICIALIZAÇÃO
// ============================================
async function initializeApp() {
    console.log('🚀 Inicializando aplicação Jardim Padaria...');
    console.log('📅 Simulação: Hoje é QUARTA-FEIRA');
    
    // 1. Inicializa navegação primeiro (não depende de imports)
    initializeNavigation();
    
    try {
        // 2. Carrega componentes dinamicamente
        await loadComponents();
        
        // 3. Inicializa componentes se estiverem disponíveis
        if (Modal && typeof Modal.initialize === 'function') {
            Modal.initialize();
            console.log('✅ Modal inicializado');
        }
        
        if (Cart && typeof Cart.initialize === 'function') {
            Cart.initialize();
            console.log('✅ Carrinho inicializado');
        }
        
        // 4. Inicializa a página atual
        initializePageComponents(currentPage);
        
        console.log('🎉 Aplicação inicializada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showNotification('Erro ao carregar a aplicação. Recarregue a página.', 5000, 'error');
    }
}

// ============================================
// CARREGAR COMPONENTES DINAMICAMENTE
// ============================================
async function loadComponents() {
    try {
        console.log('📦 Carregando componentes...');
        
        // Carrega Modal
        const modalModule = await import('./components/modal.js');
        Modal = modalModule.default || modalModule.Modal;
        window.Modal = Modal;
        
        // Carrega Cart
        const cartModule = await import('./components/cart.js');
        Cart = cartModule.default || cartModule.Cart;
        window.Cart = Cart;
        
        console.log('✅ Componentes carregados:', { 
            Modal: !!Modal, 
            Cart: !!Cart 
        });
        
    } catch (error) {
        console.error('❌ Erro ao carregar componentes:', error);
        // Tenta carregar novamente após 2 segundos
        setTimeout(() => loadComponents(), 2000);
        throw error;
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================
function initializeNavigation() {
    // Menu mobile toggle
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

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
        const link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            const page = link.dataset.page;
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
async function initializePageComponents(pageName) {
    console.log(`📄 Inicializando página: ${pageName}`);
    
    try {
        switch(pageName) {
            case 'inicio':
                if (typeof InicioPage !== 'undefined') {
                    await InicioPage.initialize();
                    console.log('✅ Página Início inicializada');
                } else {
                    // Tenta carregar dinamicamente
                    const inicioModule = await import('./pages/inicio.js');
                    window.InicioPage = inicioModule.default || inicioModule.InicioPage;
                    if (window.InicioPage.initialize) {
                        await window.InicioPage.initialize();
                    }
                }
                break;
                
            case 'menu':
                if (typeof MenuPage !== 'undefined') {
                    MenuPage.initialize();
                    console.log('✅ Página Menu inicializada');
                } else {
                    // Tenta carregar dinamicamente
                    const menuModule = await import('./pages/menu.js');
                    window.MenuPage = menuModule.default || menuModule.MenuPage;
                    if (window.MenuPage.initialize) {
                        window.MenuPage.initialize();
                    }
                }
                break;
                
            case 'sobre':
                if (typeof SobreNosPage !== 'undefined') {
                    SobreNosPage.initialize();
                    console.log('✅ Página Sobre Nós inicializada');
                }
                break;
                
            case 'cuidados':
                if (typeof CuidadosPage !== 'undefined') {
                    CuidadosPage.initialize();
                    console.log('✅ Página Cuidados inicializada');
                }
                break;
                
            case 'feedbacks':
                if (typeof FeedbacksPage !== 'undefined') {
                    FeedbacksPage.initialize();
                    console.log('✅ Página Feedbacks inicializada');
                }
                break;
        }
    } catch (error) {
        console.error(`❌ Erro ao inicializar página ${pageName}:`, error);
    }
}

// ============================================
// UTILITÁRIOS
// ============================================
function showNotification(message, duration = 3000, type = 'info') {
    const notificationBar = document.getElementById('notificationBar');
    if (notificationBar) {
        notificationBar.textContent = message;
        notificationBar.classList.remove('info', 'error', 'success');
        notificationBar.classList.add(type);
        notificationBar.classList.add('show');

        setTimeout(() => {
            notificationBar.classList.remove('show');
        }, duration);
    } else {
        // Fallback para console se a notificação não estiver disponível
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

function getCurrentDayName() {
    // SIMULAÇÃO: Sempre retorna "quarta" para teste
    // Para voltar ao normal, descomente as linhas abaixo e apague o return "quarta";
    
    // const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    // const date = new Date();
    // const dayName = days[date.getDay()];
    // console.log(`📅 Dia atual: ${dayName}`);
    // return dayName;
    
    console.log('📅 [SIMULAÇÃO] Hoje é QUARTA-FEIRA');
    return "quarta";
}

function getTodayIndex() {
    // SIMULAÇÃO: Sempre retorna índice da quarta (0)
    // Para voltar ao normal, descomente as linhas abaixo:
    
    // const hoje = new Date();
    // const diaSemana = hoje.getDay();
    // const diaParaIndice = {
    //     3: 0, // quarta
    //     4: 1, // quinta
    //     5: 2, // sexta
    //     6: 3  // sábado
    // };
    // return diaParaIndice[diaSemana] !== undefined ? diaParaIndice[diaSemana] : -1;
    
    return 0; // Índice da quarta-feira
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
        "Chocolate": "🍫",
        "Pronta-Entrega": "📦"
    };
    return categoryIcons[category] || "✨";
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
// FUNÇÕES AUXILIARES PARA SIMULAÇÃO
// ============================================

// Função para alternar entre modo simulação e modo real
function toggleSimulationMode() {
    const currentMode = localStorage.getItem('simulationMode') || 'quarta';
    const newMode = currentMode === 'real' ? 'quarta' : 'real';
    localStorage.setItem('simulationMode', newMode);
    
    showNotification(`Modo simulação: ${newMode === 'quarta' ? 'QUARTA-FEIRA' : 'REAL'}`, 3000);
    location.reload();
}

// Função para verificar o modo atual
function getSimulationMode() {
    return localStorage.getItem('simulationMode') || 'quarta';
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA QUANDO O DOM ESTIVER PRONTO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado');
    console.log(`🎮 Modo simulação: ${getSimulationMode()}`);
    
    // Adiciona botão de debug para alternar modo (apenas em desenvolvimento)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const debugButton = document.createElement('button');
        debugButton.textContent = '🔄 Alternar Modo Simulação';
        debugButton.style.position = 'fixed';
        debugButton.style.bottom = '10px';
        debugButton.style.right = '10px';
        debugButton.style.zIndex = '9999';
        debugButton.style.padding = '8px 12px';
        debugButton.style.background = '#1C3D2D';
        debugButton.style.color = 'white';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '4px';
        debugButton.style.cursor = 'pointer';
        debugButton.style.fontSize = '12px';
        debugButton.style.opacity = '0.7';
        debugButton.addEventListener('click', toggleSimulationMode);
        document.body.appendChild(debugButton);
    }
    
    // Pequeno delay para garantir que tudo está carregado
    setTimeout(() => {
        initializeApp();
    }, 100);
});

// ============================================
// EXPORTAÇÕES PARA USO EM OUTROS MÓDULOS
// ============================================
window.navigateToPage = navigateToPage;
window.getProductIcon = getProductIcon;
window.getCurrentDayName = getCurrentDayName;
window.getTodayIndex = getTodayIndex; // Nova exportação
window.showNotification = showNotification;
window.initializeApp = initializeApp;
window.abrirGoogleMaps = abrirGoogleMaps;
window.abrirWhatsApp = abrirWhatsApp;
window.abrirContato = abrirContato;
window.toggleSimulationMode = toggleSimulationMode; // Para debug
window.getSimulationMode = getSimulationMode; // Para debug

// Exporta para uso em módulos ES6
export {
    navigateToPage,
    getProductIcon,
    getCurrentDayName,
    getTodayIndex,
    showNotification,
    initializeApp,
    abrirGoogleMaps,
    abrirWhatsApp,
    abrirContato
};