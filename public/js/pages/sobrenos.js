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
        // Assume que Carousel é um objeto global ou importado em main.js
        // Se Carousel não estiver definido, esta linha pode falhar.
        // Vamos manter a estrutura original para não introduzir novos erros.
        if (typeof Carousel !== 'undefined' && Carousel.destroy) {
            Carousel.destroy('.about-section .carousel-container');
        }

        setTimeout(() => {
            if (typeof Carousel !== 'undefined' && Carousel.initialize) {
                Carousel.initialize('.about-section .carousel-container', {
                    delay: 3000,
                    autoPlay: true
                });
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
