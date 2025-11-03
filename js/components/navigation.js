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

        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener("click", () => {
                mobileMenu.style.display = mobileMenu.style.display === "none" ? "block" : "none";
                mobileMenu.classList.toggle("active");
            });

            // Fechar menu ao clicar em um link (mobile)
            document.querySelectorAll(".mobile-nav-link").forEach(link => {
                link.addEventListener("click", () => {
                    mobileMenu.style.display = "none";
                    mobileMenu.classList.remove("active");
                });
            });
        }
    },

    closeMobileMenu() {
        const mobileMenu = document.getElementById("mobileMenu");
        if (mobileMenu) {
            mobileMenu.style.display = "none";
            mobileMenu.classList.remove("active");
        }
    }
};