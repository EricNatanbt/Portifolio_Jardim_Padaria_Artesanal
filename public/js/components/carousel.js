// ============================================
// COMPONENTE DO CARROSSEL
// ============================================
const Carousel = {
    intervals: new Map(),

    initialize(selector, options = {}) {
        const defaultOptions = {
            delay: 3000,
            autoPlay: true,
            force: false
        };

        const settings = { ...defaultOptions, ...options };

        const carousels = document.querySelectorAll(selector);
        carousels.forEach((carousel, index) => {
            if (settings.force) {
                carousel.removeAttribute('data-carousel-initialized');
                this.stop(index);
            }

            if (carousel.getAttribute('data-carousel-initialized') === 'true') {
                return;
            }
            
            this.setupCarousel(carousel, settings, index);
        });
    },

    setupCarousel(carousel, settings, index) {
        const carouselImages = carousel.querySelectorAll('.carousel-image');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const dots = carousel.querySelectorAll('.carousel-dot');
        
        if (carouselImages.length === 0) return;

        let currentIndex = 0;

        const updateCarousel = (newIndex) => {
            currentIndex = newIndex;
            this.showImage(carouselImages, currentIndex);
            this.updateDots(dots, currentIndex);
        };

        // Mostra a primeira imagem
        updateCarousel(currentIndex);

        const nextSlide = () => {
            let nextIndex = (currentIndex + 1) % carouselImages.length;
            updateCarousel(nextIndex);
        };

        const prevSlide = () => {
            let prevIndex = (currentIndex - 1 + carouselImages.length) % carouselImages.length;
            updateCarousel(prevIndex);
        };

        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                prevSlide();
                if (settings.autoPlay) restartAutoPlay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                nextSlide();
                if (settings.autoPlay) restartAutoPlay();
            });
        }

        
        dots.forEach((dot, dotIndex) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                updateCarousel(dotIndex);
                if (settings.autoPlay) restartAutoPlay();
            });
        });

        // Inicia o carrossel automático
        const startAutoPlay = () => {
            if (settings.autoPlay) {
                this.stop(index);
                const intervalId = setInterval(nextSlide, settings.delay);
                this.intervals.set(index, intervalId);
            }
        };

        const restartAutoPlay = () => {
            this.stop(index);
            startAutoPlay();
        };

        startAutoPlay();

        
        carousel.addEventListener('mouseenter', () => this.stop(index));
        carousel.addEventListener('mouseleave', () => startAutoPlay());

        carousel.setAttribute('data-carousel-initialized', 'true');
    },

    showImage(images, index) {
        images.forEach(img => {
            img.classList.remove('active');
            img.style.opacity = '0';
            img.style.zIndex = '0';
        });

        if (images[index]) {
            const activeImage = images[index];
            activeImage.classList.add('active');
            activeImage.style.opacity = '1';
            activeImage.style.zIndex = '1';
        }
    },

    updateDots(dots, index) {
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    },

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
