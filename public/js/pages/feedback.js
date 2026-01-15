// ============================================
// PÁGINA DE FEEDBACKS - VERSÃO SIMPLIFICADA
// ============================================

const FeedbackPage = {
    stories: [], // Agora será preenchido pelo HTML
    currentIndex: 0,
    timer: null,

    initialize() {
        console.log('📱 Inicializando página de feedbacks (Modo Dinâmico)...');
        
        setTimeout(() => {
            // 1. Captura os vídeos do HTML (atributo data-videos)
            const container = document.querySelector('#storyContainer');
            if (container && container.dataset.videos) {
                // Transforma a string "video1.mp4, video2.mp4" em um array
                this.stories = container.dataset.videos.split(',').map(s => s.trim());
                console.log('✅ Vídeos carregados do HTML:', this.stories);
            } else {
                console.error('❌ Atributo data-videos não encontrado no #storyContainer');
                return;
            }

            this.setupEventListeners();
            this.updateStory();
        }, 100);
    },

    setupEventListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) prevBtn.onclick = (e) => { e.preventDefault(); this.prevStory(); };
        if (nextBtn) nextBtn.onclick = (e) => { e.preventDefault(); this.nextStory(); };
    },

    updateStory() {
        const storyContent = document.getElementById('storyContent');
        const progressBar = document.getElementById('progressBar');
        
        if (!storyContent || this.stories.length === 0) return;

        if (this.timer) clearTimeout(this.timer);

        const currentSrc = this.stories[this.currentIndex];
        const isVideo = currentSrc.toLowerCase().endsWith('.mp4');

        storyContent.innerHTML = '';

        if (isVideo) {
            const video = document.createElement('video');
            video.className = 'story-video';
            video.src = currentSrc;
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.onended = () => this.nextStory();
            video.play().catch(() => {}); // Ignora erro de autoplay
            storyContent.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.className = 'story-video';
            img.src = currentSrc;
            storyContent.appendChild(img);
            this.timer = setTimeout(() => this.nextStory(), 4000);
        }

        if (progressBar) {
            const progress = ((this.currentIndex + 1) / this.stories.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
    },

    nextStory() {
        this.currentIndex = (this.currentIndex + 1) % this.stories.length;
        this.updateStory();
    },

    prevStory() {
        this.currentIndex = (this.currentIndex - 1 + this.stories.length) % this.stories.length;
        this.updateStory();
    },

    destroy() {
        if (this.timer) clearTimeout(this.timer);
    }
};

export default FeedbackPage;
export { FeedbackPage as FeedbacksPage };
