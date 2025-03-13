class ResetPasswordPage {
    constructor() {
        // Initialize properties
        this.form = document.getElementById('resetPasswordForm');
        this.otpInput = document.getElementById('otp');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        this.passwordToggles = document.querySelectorAll('.vr-password-toggle');
        
        // Initialize API URL
        this.apiBaseUrl = 'https://www.vyrlo.com:8080';
        
        // Get email from session storage
        this.email = sessionStorage.getItem('reset_email');
        if (!this.email) {
            window.location.href = '/pages/forgot-password.html';
            return;
        }
        
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
        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Clear errors on input
        [this.otpInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
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

    validateForm() {
        let isValid = true;
        
        // Reset all errors first
        this.clearAllErrors();

        // Validate OTP
        if (!this.otpInput.value.trim()) {
            this.showError(this.otpInput, 'OTP is required');
            isValid = false;
        } else if (!/^\d{6}$/.test(this.otpInput.value.trim())) {
            this.showError(this.otpInput, 'OTP must be 6 digits');
            isValid = false;
        }

        // Validate password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!this.passwordInput.value) {
            this.showError(this.passwordInput, 'New password is required');
            isValid = false;
        } else if (!passwordRegex.test(this.passwordInput.value)) {
            this.showError(this.passwordInput, 'Password must be at least 8 characters with letters and numbers');
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

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        try {
            this.setLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/forgetpass/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.email,
                    newPassword: this.passwordInput.value,
                    otp: this.otpInput.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            // Clear stored email
            sessionStorage.removeItem('reset_email');

            // Show success message
            this.showToast('success', 'Password reset successful! Redirecting to login...');

            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);

        } catch (error) {
            this.showToast('error', error.message || 'Failed to reset password');
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

    clearAllErrors() {
        const inputs = [this.otpInput, this.passwordInput, this.confirmPasswordInput];
        inputs.forEach(input => this.clearError(input));
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
            new ResetPasswordPage();
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