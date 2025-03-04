class ContactPage {
    constructor() {
        this.map = null;
        this.init();
    }

    init() {
        this.setupScrollReveal();
        this.initMap();
        this.setupFormHandling();
    }

    setupScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
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

    initMap() {
        // New York coordinates
        const lat = 40.7128;
        const lng = -74.0060;

        this.map = L.map('map').setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add custom marker
        const marker = L.marker([lat, lng]).addTo(this.map);
        marker.bindPopup("<b>Vyrlo Headquarters</b><br>123 Business Avenue").openPopup();
    }

    setupFormHandling() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.vr-contact-form__submit');
            const originalBtnText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<span class="vr-spinner"></span>';
            submitBtn.classList.add('loading');

            // Get form data
            const formData = {
                name: form.name.value,
                email: form.email.value,
                subject: form.subject.value,
                message: form.message.value
            };

            try {
                // Simulate API call
                await this.simulateApiCall();

                // Show success message
                window.toastService.success('Message sent successfully! We\'ll get back to you soon.');
                
                // Reset form
                form.reset();
            } catch (error) {
                window.toastService.error('Failed to send message. Please try again.');
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.classList.remove('loading');
            }
        });
    }

    simulateApiCall() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1500);
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Initialize the page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.contactPage = new ContactPage();
}); 