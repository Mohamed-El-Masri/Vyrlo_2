import { authService } from '../services/auth.service.js';
import { toastService } from '../services/toast.service.js';
import { componentLoader } from '../core/componentLoader.js';

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.submitButton = this.form.querySelector('.vr-auth__submit');
        
        this.apiBaseUrl = 'https://www.vyrlo.com:8080';
        
        // Wait for toast service to be available
        this.waitForToastService().then(() => {
            this.init();
        });
    }

    async waitForToastService(attempts = 0) {
        const maxAttempts = 50; // 5 seconds maximum wait time
        const waitTime = 100; // 100ms between attempts

        return new Promise((resolve) => {
            const check = () => {
                if (window.toastService) {
                    resolve();
                } else if (attempts < maxAttempts) {
                    setTimeout(() => check(), waitTime);
                } else {
                    console.error('Toast service not available');
                    resolve(); // Continue anyway
                }
            };
            check();
        });
    }

    async init() {
        try {
            // Use the componentLoader instance instead of static methods
            await componentLoader.loadHeader();
            await componentLoader.loadFooter();
            
            // Add event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing login page:', error);
            this.showToast('error', 'Failed to initialize page');
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('input', () => this.clearError(this.emailInput));
        this.passwordInput.addEventListener('input', () => this.clearError(this.passwordInput));
        this.setupPasswordToggle();
    }

    setupPasswordToggle() {
        const toggleButton = document.querySelector('.vr-password-toggle');
        toggleButton.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            toggleButton.querySelector('i').className = `fas fa-${type === 'password' ? 'eye' : 'eye-slash'}`;
        });
    }

    clearError(input) {
        input.classList.remove('error');
        const formGroup = input.closest('.vr-form-group');
        const errorMessage = formGroup.querySelector('.vr-error-message');
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
    }

    clearAllErrors() {
        [this.emailInput, this.passwordInput].forEach(input => this.clearError(input));
    }

    showError(input, message) {
        input.classList.add('error');
        const formGroup = input.closest('.vr-form-group');
        const errorMessage = formGroup.querySelector('.vr-error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
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

        try {
            this.setLoading(true);

            const response = await fetch(`${this.apiBaseUrl}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: this.emailInput.value,
                    password: this.passwordInput.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 500) {
                    this.showError(this.emailInput, 'Invalid email or password');
                    this.showError(this.passwordInput, 'Invalid email or password');
                    throw new Error('Invalid credentials');
                }
                throw new Error(data.message || 'Login failed');
            }

            // Store token
            localStorage.setItem('vr_token', data.token);

            // Show success toast
            this.showToast('success', 'Login successful! Redirecting...');

            // Clear any previous errors
            this.clearAllErrors();

            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/';
            }, 1500); // Give time for the success toast to be seen

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Failed to login';
            
            if (error.message.includes('credentials')) {
                errorMessage = 'Invalid email or password';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection';
            }
            
            // Show error toast
            this.showToast('error', errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    showToast(type, message) {
        if (window.toastService) {
            window.toastService[type](message, {
                duration: type === 'error' ? 5000 : 3000, // Show errors longer
                position: 'top-right'
            });
        }
    }
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
}); 