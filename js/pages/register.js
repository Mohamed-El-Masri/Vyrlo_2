class RegisterPage {
    constructor() {
        // Use global service instances
        this.authService = window.authService;
        this.toastService = window.toastService;
        this.componentLoader = window.componentLoader;

        // Form elements
        this.form = document.getElementById('registerForm');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        this.passwordToggles = document.querySelectorAll('.vr-password-toggle');
        
        this.init();
    }

    async init() {
        try {
            // Load components first
            await Promise.all([
                this.componentLoader.loadHeader(),
                this.componentLoader.loadFooter()
            ]);

            // Then initialize form handlers
            this.initializeFormHandlers();
        } catch (error) {
            console.error('Error initializing page:', error);
            this.toastService.error('Failed to initialize page');
        }
    }

    initializeFormHandlers() {
        // Add event listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Clear errors on input
        [this.nameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
            input.addEventListener('input', () => this.clearError(input));
        });

        // Password visibility toggle
        this.passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });
    }

    togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
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

        // Validate username
        if (!this.nameInput.value.trim()) {
            this.showError(this.nameInput, 'Username is required');
            isValid = false;
        } else if (this.nameInput.value.trim().length < 3) {
            this.showError(this.nameInput, 'Username must be at least 3 characters');
            isValid = false;
        }

        // Validate email
        if (!this.emailInput.value.trim()) {
            this.showError(this.emailInput, 'Email address is required');
            isValid = false;
        } else if (!emailRegex.test(this.emailInput.value)) {
            this.showError(this.emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        // Validate password
        if (!this.passwordInput.value) {
            this.showError(this.passwordInput, 'Password is required');
            isValid = false;
        } else if (this.passwordInput.value.length < 8) {
            this.showError(this.passwordInput, 'Password must be at least 8 characters');
            isValid = false;
        }

        // Validate confirm password
        if (!this.confirmPasswordInput.value) {
            this.showError(this.confirmPasswordInput, 'Please confirm your password');
            isValid = false;
        } else if (this.confirmPasswordInput.value !== this.passwordInput.value) {
            this.showError(this.confirmPasswordInput, 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    setLoading(loading) {
        if (loading) {
            this.submitButton.classList.add('loading');
            this.submitButton.disabled = true;
        } else {
            this.submitButton.classList.remove('loading');
            this.submitButton.disabled = false;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        try {
            this.setLoading(true);
            
            await window.ApiService.post('/signup', {
                username: this.nameInput.value.trim(),
                email: this.emailInput.value.trim(),
                password: this.passwordInput.value
            });
            
            this.toastService.success('Account created successfully! Redirecting to login...');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            if (error.message.includes('already registered')) {
                this.toastService.error('This email is already registered');
            } else {
                this.toastService.error(error.message || 'Failed to create account');
            }
        } finally {
            this.setLoading(false);
        }
    }
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.registerPage = new RegisterPage();
}); 