// ============================================
// COMPONENTE DE NAVEGAÇÃO
// ============================================
const Navigation = {
    initialize() {
        this.setupMobileMenu();
        this.setupNavigationLinks();
    },

    setupMobileMenu() {
        const menuToggle = document.getElementById("menuToggle");
        const mobileMenu = document.getElementById("mobileMenu");

        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener("click", () => {
                mobileMenu.classList.toggle("active");
            });
        }
    },

    setupNavigationLinks() {
        // Adiciona event listeners para todos os links de navegação
        document.addEventListener('click', (e) => {
            // Verifica se o clique foi em um link de navegação do menu mobile
            if (e.target.matches('.mobile-nav-link[data-page]')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.navigateToPage(page);
            }
        });
    },

    navigateToPage(page) {
        // Fecha o menu mobile primeiro
        this.closeMobileMenu();
        
        // Navega para a página usando a função global
        if (typeof window.navigateToPage === 'function') {
            window.navigateToPage(page);
        }
    },

    closeMobileMenu() {
        const mobileMenu = document.getElementById("mobileMenu");
        if (mobileMenu) {
            mobileMenu.classList.remove("active");
        }
    }
};