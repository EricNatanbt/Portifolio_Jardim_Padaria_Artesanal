// ============================================
// COMPONENTE DE NAVEGAÇÃO
// ============================================
const Navigation = {
    initialize() {
        this.setupMobileMenu();
    },

    setupMobileMenu() {
        const menuToggle = document.getElementById("menuToggle");
        const mobileMenu = document.getElementById("mobileMenu");

        const mobileClose = document.getElementById("mobileClose");

        if (menuToggle && mobileMenu) {
            // Abrir menu
            menuToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                mobileMenu.classList.toggle("active");
                document.body.style.overflow = mobileMenu.classList.contains("active") ? "hidden" : "auto";
            });

            // Não é necessário um botão X, pois o toggle faz o trabalho, e o overlay fecha.
            // O botão X pode ser adicionado no HTML se for o caso, mas a lógica de toggle é mais simples.
            // Se o botão X for adicionado, ele deve ter o ID 'mobileClose' e a lógica abaixo será reativada.
            // if (mobileClose) {
            //     mobileClose.addEventListener("click", () => {
            //         mobileMenu.classList.remove("active");
            //         document.body.style.overflow = "auto";
            //     });
            // }

            // Fechar menu ao clicar em um link mobile
            document.querySelectorAll(".mobile-nav-link").forEach(link => {
                link.addEventListener("click", () => {
                    this.closeMobileMenu();
                });
            });

            // Fechar menu ao clicar fora (no overlay)
            mobileMenu.addEventListener("click", (e) => {
                if (e.target === mobileMenu) {
                    mobileMenu.classList.remove("active");
                    document.body.style.overflow = "auto";
                }
            });

            // Fechar menu ao redimensionar para desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 768) {
                    mobileMenu.classList.remove("active");
                    document.body.style.overflow = "auto";
                }
            });

            // Fechar menu com ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileMenu.classList.contains("active")) {
                    mobileMenu.classList.remove("active");
                    document.body.style.overflow = "auto";
                }
            });
        }
    },

    closeMobileMenu() {
        const mobileMenu = document.getElementById("mobileMenu");
        if (mobileMenu) {
            mobileMenu.classList.remove("active");
            document.body.style.overflow = "auto";
        }
    }
};