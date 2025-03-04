class ResetPasswordPage {
    constructor() {
        this.authService = new AuthService();
        this.toastService = new ToastService();
        this.componentLoader = new ComponentLoader();
        this.form = document.getElementById('resetPasswordForm');
        this.otpInput = document.getElementById('otp');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        this.passwordToggles = document.querySelectorAll('.vr-password-toggle');
        
        // Get email from session storage
        this.email = sessionStorage.getItem('reset_email');
        if (!this.email) {
            window.location.href = 'forgot-password.html';
            return;
        }
        
        this.init();
    }

    async init() {
        // Load components
        await this.componentLoader.loadHeader();
        await this.componentLoader.loadFooter();

        // Add event listeners
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

    clearError(input) {
        input.classList.remove('error');
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

        // Validate OTP
        if (!this.otpInput.value.trim()) {
            this.showError(this.otpInput, 'OTP code is required');
            isValid = false;
        } else if (this.otpInput.value.length !== 6) {
            this.showError(this.otpInput, 'OTP must be 6 digits');
            isValid = false;
        }

        // Validate password
        if (!this.passwordInput.value) {
            this.showError(this.passwordInput, 'New password is required');
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
            
            // Reset password with OTP
            await ApiService.post('/forgetpass/reset', {
                email: this.email,
                newPassword: this.passwordInput.value,
                otp: this.otpInput.value
            });
            
            this.toastService.success('Password has been reset successfully! Redirecting to login...');
            
            // Clear stored email
            sessionStorage.removeItem('reset_email');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            this.toastService.error(error.message || 'Failed to reset password');
        } finally {
            this.setLoading(false);
        }
    }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ResetPasswordPage());
} else {
    new ResetPasswordPage();
} 