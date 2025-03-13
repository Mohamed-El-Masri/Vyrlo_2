class RegisterPage {
    constructor() {
        // Initialize properties
        this.form = document.getElementById('registerForm');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        this.passwordToggles = document.querySelectorAll('.vr-password-toggle');
        
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
        // Form submit
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
        const formGroup = input.closest('.vr-form-group');
        const errorElement = formGroup.querySelector('.vr-error-message');
        
        input.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
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

    clearAllErrors() {
        const inputs = [this.nameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput];
        inputs.forEach(input => this.clearError(input));
    }

    validateForm() {
        let isValid = true;
        
        // Reset all errors first
        this.clearAllErrors();

        // Username validation
        if (!this.nameInput.value.trim()) {
            this.showError(this.nameInput, 'Username is required');
            isValid = false;
        } else if (this.nameInput.value.trim().length < 3) {
            this.showError(this.nameInput, 'Username must be at least 3 characters');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.emailInput.value.trim()) {
            this.showError(this.emailInput, 'Email is required');
            isValid = false;
        } else if (!emailRegex.test(this.emailInput.value)) {
            this.showError(this.emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!this.passwordInput.value) {
            this.showError(this.passwordInput, 'Password is required');
            isValid = false;
        } else if (!passwordRegex.test(this.passwordInput.value)) {
            this.showError(this.passwordInput, 'Password must be at least 8 characters with letters and numbers');
            isValid = false;
        }

        // Confirm password validation
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
            
            // Call API to register
            const response = await fetch(`${this.apiBaseUrl}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: this.nameInput.value.trim(),
                    email: this.emailInput.value.trim(),
                    password: this.passwordInput.value
                })
            });

            const data = await response.json();

            // Handle different response statuses
            if (response.status === 409) {
                // Clear previous errors
                this.clearAllErrors();
                
                // Show specific error for email already registered
                this.showError(this.emailInput, 'This email is already registered');
                
                // Show toast message
                this.showToast('error', 'An account with this email already exists. Please try logging in or use a different email.');
                
                // Focus on email input
                this.emailInput.focus();
                
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Show success message
            this.showToast('success', 'Registration successful! Redirecting to login...');
            
            // Clear form
            this.form.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('error', 'Registration failed. Please try again.');
        } finally {
            this.setLoading(false);
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
            new RegisterPage();
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