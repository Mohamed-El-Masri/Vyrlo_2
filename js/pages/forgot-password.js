class ForgotPasswordPage {
    constructor() {
        // Initialize properties
        this.form = document.getElementById('forgotPasswordForm');
        this.emailInput = document.getElementById('email');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        
        // Initialize API URL
        this.apiBaseUrl = 'https://www.vyrlo.com:8080';
        
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing page:', error);
            this.showToast('error', 'Failed to initialize page');
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('input', () => this.clearError(this.emailInput));
    }

    validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!this.emailInput.value.trim()) {
            this.showError(this.emailInput, 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(this.emailInput.value)) {
            this.showError(this.emailInput, 'Please enter a valid email');
            return false;
        }
        
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateEmail()) {
            return;
        }

        try {
            this.setLoading(true);

            // Call API to send OTP
            const response = await fetch(`${this.apiBaseUrl}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.emailInput.value.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            // Store email for reset password page
            sessionStorage.setItem('reset_email', this.emailInput.value.trim());

            // Show success message
            this.showToast('success', 'OTP sent to your email');

            // Redirect to reset password page
            setTimeout(() => {
                window.location.href = '/pages/reset-password.html';
            }, 2000);

        } catch (error) {
            this.showToast('error', error.message || 'Failed to send reset instructions');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        const spinner = this.submitButton.querySelector('.vr-spinner');
        const text = this.submitButton.querySelector('span');
        
        if (loading) {
            this.submitButton.disabled = true;
            spinner.style.display = 'block';
            text.style.opacity = '0';
        } else {
            this.submitButton.disabled = false;
            spinner.style.display = 'none';
            text.style.opacity = '1';
        }
    }

    showError(input, message) {
        const formGroup = input.closest('.vr-form-group');
        const errorElement = formGroup.querySelector('.vr-error-message');
        
        input.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearError(input) {
        const formGroup = input.closest('.vr-form-group');
        const errorElement = formGroup.querySelector('.vr-error-message');
        
        input.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    showToast(type, message) {
        if (window.toastService) {
            window.toastService[type](message);
        } else {
            alert(message); // Fallback if toast service is not available
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds with 100ms interval
    
    const initializePage = () => {
        if (window.toastService) {
            new ForgotPasswordPage();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(initializePage, 100);
        } else {
            console.error('Services failed to load');
            alert('Failed to initialize page. Please refresh.');
        }
    };

    initializePage();
}); 