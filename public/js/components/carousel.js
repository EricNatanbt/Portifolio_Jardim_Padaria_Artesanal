// ============================================
// COMPONENTE DO CARROSSEL
// ============================================
const Carousel = {
    intervals: new Map(),

    initialize(selector, options = {}) {
        const defaultOptions = {
            delay: 3000, // 3 segundos
            autoPlay: true
        };

        const settings = { ...defaultOptions, ...options };

        const carousels = document.querySelectorAll(selector);
        carousels.forEach((carousel, index) => {
            // Verifica se já foi inicializado
            if (carousel.getAttribute('data-carousel-initialized') === 'true') {
                return;
            }
            
            this.setupCarousel(carousel, settings, index);
        });
    },

    setupCarousel(carousel, settings, index) {
        const carouselImages = carousel.querySelectorAll('.carousel-image');
        
        if (carouselImages.length === 0) return;

        let currentIndex = 0;

        // Mostra a primeira imagem
        this.showImage(carouselImages, currentIndex);

        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % carouselImages.length;
            this.showImage(carouselImages, currentIndex);
        };

        // Inicia o carrossel automático
        const startAutoPlay = () => {
            if (settings.autoPlay) {
                // Para qualquer intervalo existente
                this.stop(index);
                
                const intervalId = setInterval(nextSlide, settings.delay);
                this.intervals.set(index, intervalId);
            }
        };

        // Inicia automaticamente
        startAutoPlay();

        // Previne múltiplas inicializações
        carousel.setAttribute('data-carousel-initialized', 'true');
    },

    showImage(images, index) {
        // Remove a classe active de todas as imagens
        images.forEach(img => {
            img.style.opacity = '0';
            img.classList.remove('active');
        });

        // Adiciona a classe active na imagem atual
        setTimeout(() => {
            images[index].style.opacity = '1';
            images[index].classList.add('active');
        }, 50);
    },

    // Método para destruir um carrossel
    destroy(selector) {
        const carousels = document.querySelectorAll(selector);
        carousels.forEach((carousel, index) => {
            this.stop(index);
            carousel.removeAttribute('data-carousel-initialized');
        });
    },

    stop(carouselIndex) {
        const intervalId = this.intervals.get(carouselIndex);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(carouselIndex);
        }
    }
};
export default Carousel;