class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollReveal();
        this.animateStats();
    }

    setupScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    
                    // If it's a stats number, start the counter
                    if (entry.target.classList.contains('vr-stats__item')) {
                        this.animateNumber(entry.target.querySelector('.vr-stats__number'));
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll('[data-scroll-reveal]').forEach(el => {
            observer.observe(el);
        });
    }

    animateStats() {
        document.querySelectorAll('.vr-stats__item').forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
        });
    }

    animateNumber(element) {
        const finalNumber = this.parseNumber(element.textContent);
        const duration = 2000; // 2 seconds
        const steps = 60;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const increment = finalNumber / steps;
        const decimals = this.getDecimals(element.textContent);

        const animation = setInterval(() => {
            currentStep++;
            const current = increment * currentStep;

            if (currentStep === steps) {
                element.textContent = this.formatNumber(finalNumber, decimals);
                clearInterval(animation);
            } else {
                element.textContent = this.formatNumber(current, decimals);
            }
        }, stepDuration);
    }

    parseNumber(string) {
        return parseFloat(string.replace(/[^0-9.]/g, ''));
    }

    getDecimals(string) {
        const match = string.match(/\.[0-9]+/);
        return match ? match[0].length - 1 : 0;
    }

    formatNumber(number, decimals) {
        const formatted = number.toFixed(decimals);
        if (formatted >= 1000) {
            return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        return formatted;
    }
}

// Initialize the page
new AboutPage(); 