class LoginPage {
    constructor() {
        this.authService = new AuthService();
        this.toastService = new ToastService();
        this.componentLoader = new ComponentLoader();
        
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.submitButton = document.querySelector('.vr-auth__submit');
        
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
        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => this.clearError(this.passwordInput));
        }
        
        // Password toggle
        const toggleButton = document.querySelector('.vr-password-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                const type = this.passwordInput.type === 'password' ? 'text' : 'password';
                this.passwordInput.type = type;
                toggleButton.querySelector('i').className = `fas fa-${type === 'password' ? 'eye' : 'eye-slash'}`;
            });
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

        if (!this.passwordInput.value) {
            this.showError(this.passwordInput, 'Password is required');
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

        this.setLoading(true);

        try {
            const response = await this.authService.login(
                this.emailInput.value,
                this.passwordInput.value
            );

            if (response.token) {
                // Show success message
                this.toastService.success('Successfully logged in');

                // Redirect to home page after successful login
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.toastService.error(error.message || 'Failed to login. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LoginPage());
} else {
    new LoginPage();
} 