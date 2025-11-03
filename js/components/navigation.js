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
                mobileMenu.classList.toggle("active");
            });
        }
    },

    closeMobileMenu() {
        const mobileMenu = document.getElementById("mobileMenu");
        if (mobileMenu) {
            mobileMenu.classList.remove("active");
        }
    }
};