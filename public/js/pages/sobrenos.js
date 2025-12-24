// ============================================
// PÁGINA SOBRE NÓS - CARROSSEL SEPARADO
// ============================================
const SobreNosPage = {
    textIndex: 0,
    textSlides: [],

    initialize() {
        this.initializeAboutCarousel();
        this.initializeTextCarousel();
    },

    initializeAboutCarousel() {
        // O componente Carousel agora é carregado globalmente em main.js
        if (window.Carousel && window.Carousel.destroy) {
            window.Carousel.destroy('.about-section .carousel-container');
        }

        setTimeout(() => {
            if (window.Carousel && window.Carousel.initialize) {
                window.Carousel.initialize('.about-section .carousel-container', {
                    delay: 3000,
                    autoPlay: true
                });
            } else {
                console.error('Componente Carousel não encontrado para inicializar em sobrenos.js');
            }
        }, 100);
    },

    // Novo método para o carrossel de texto
    initializeTextCarousel() {
        // Delay para garantir que o DOM foi carregado pelo pages-loader
        setTimeout(() => {
            this.textSlides = document.querySelectorAll(".text-slide");
            const prevText = document.querySelector(".text-prev");
            const nextText = document.querySelector(".text-next");

            if (!this.textSlides.length || !prevText || !nextText) return;

            this.textIndex = 0;
            this.showTextSlide(this.textIndex); // Garante que o primeiro slide está ativo

            prevText.addEventListener("click", () => {
                this.textIndex = (this.textIndex - 1 + this.textSlides.length) % this.textSlides.length;
                this.showTextSlide(this.textIndex);
            });

            nextText.addEventListener("click", () => {
                this.textIndex = (this.textIndex + 1) % this.textSlides.length;
                this.showTextSlide(this.textIndex);
            });
        }, 150);
    },

    showTextSlide(i) {
        this.textSlides.forEach(slide => slide.classList.remove("active"));
        this.textSlides[i].classList.add("active");
    }
};

// Exporta para ser usado em main.js
export default SobreNosPage;