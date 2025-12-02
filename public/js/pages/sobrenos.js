// ============================================
// PÁGINA SOBRE NÓS - CARROSSEL SEPARADO
// ============================================
const SobreNosPage = {
    initialize() {
        this.initializeAboutCarousel();
        this.initializeTextCarousel(); // <-- garantir que chama
    },

    initializeAboutCarousel() {
        Carousel.destroy('.about-section .carousel-container');

        setTimeout(() => {
            Carousel.initialize('.about-section .carousel-container', {
                delay: 3000,
                autoPlay: true
            });
        }, 100);
    },

    // Novo método para o carrossel de texto
    initializeTextCarousel() {
        setTimeout(() => {
            const textSlides = document.querySelectorAll(".text-slide");
            const prevText = document.querySelector(".text-prev");
            const nextText = document.querySelector(".text-next");

            if (!textSlides.length || !prevText || !nextText) return;

            let textIndex = 0;

            function showTextSlide(i) {
                textSlides.forEach(slide => slide.classList.remove("active"));
                textSlides[i].classList.add("active");
            }

            prevText.addEventListener("click", () => {
                textIndex = (textIndex - 1 + textSlides.length) % textSlides.length;
                showTextSlide(textIndex);
            });

            nextText.addEventListener("click", () => {
                textIndex = (textIndex + 1) % textSlides.length;
                showTextSlide(textIndex);
            });
        }, 150);
    },
};
