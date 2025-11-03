// ============================================
// PÁGINA SOBRE NÓS - CARROSSEL SEPARADO
// ============================================
const SobreNosPage = {
    initialize() {
        this.initializeAboutCarousel();
    },

    initializeAboutCarousel() {
        // Destrói qualquer carrossel anterior
        Carousel.destroy('.about-section .carousel-container');
        
        // Aguarda o DOM estar pronto
        setTimeout(() => {
            // Inicializa APENAS o carrossel do sobre nós
            Carousel.initialize('.about-section .carousel-container', {
                delay: 3000, // 3 segundos fixos para sobre nós
                autoPlay: true
            });
        }, 100);
    }
};