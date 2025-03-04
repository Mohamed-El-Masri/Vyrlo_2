class ForgotPasswordPage {
    constructor() {
        this.authService = new AuthService();
        this.toastService = new ToastService();
        this.componentLoader = new ComponentLoader();
        
        this.form = document.getElementById('forgotPasswordForm');
        this.emailInput = document.getElementById('email');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        
        this.init();
    }

    async init() {
        // Load components
        await this.componentLoader.loadHeader();
        await this.componentLoader.loadFooter();

        // Add event listeners
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
        if (this.emailInput) {
            this.emailInput.addEventListener('input', () => this.clearError(this.emailInput));
        }
    }

    clearError(input) {
        input.classList.remove('error');
        const errorText = input.parentElement.querySelector('.vr-error-text');
        if (errorText) {
            errorText.textContent = '';
        }
    }

    showError(input, message) {
        input.classList.add('error');
        const errorText = input.parentElement.querySelector('.vr-error-text');
        if (errorText) {
            errorText.textContent = message;
        }
    }

    validateForm() {
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!this.emailInput.value.trim()) {
            this.showError(this.emailInput, 'Email address is required');
            isValid = false;
        } else if (!emailRegex.test(this.emailInput.value)) {
            this.showError(this.emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        return isValid;
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

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        try {
            this.setLoading(true);
            
            // Request OTP
            await this.authService.forgotPassword(this.emailInput.value.trim());
            
            this.toastService.success('OTP has been sent to your email address');
            
            // Store email in session storage for reset page
            sessionStorage.setItem('reset_email', this.emailInput.value.trim());
            
            // Redirect to reset password page
            setTimeout(() => {
                window.location.href = 'reset-password.html';
            }, 1500);
            
        } catch (error) {
            this.toastService.error(error.message || 'Failed to send reset instructions');
        } finally {
            this.setLoading(false);
        }
    }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ForgotPasswordPage());
} else {
    new ForgotPasswordPage();
} 