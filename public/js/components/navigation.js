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
                mobileMenu.classList.add("active");
                document.body.style.overflow = "hidden";
            });

            // Fechar menu com botão X
            if (mobileClose) {
                mobileClose.addEventListener("click", () => {
                    mobileMenu.classList.remove("active");
                    document.body.style.overflow = "auto";
                });
            }

            // Fechar menu ao clicar em um link mobile (a função navigateToPage no main.js já faz isso, mas vamos manter a lógica de fechar aqui também, caso a navegação não seja usada)
            document.querySelectorAll(".mobile-nav-link").forEach(link => {
                link.addEventListener("click", () => {
                    mobileMenu.classList.remove("active");
                    document.body.style.overflow = "auto";
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