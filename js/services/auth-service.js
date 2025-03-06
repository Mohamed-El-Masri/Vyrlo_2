/**
 * Authentication Service
 * 
 * Handles user authentication, token management, and related operations.
 */

class AuthService {
    constructor() {
        this.API_URL = 'https://virlo.vercel.app';
        this.TOKEN_KEY = 'vr_token';
        this.USER_KEY = 'vr_user';

        console.log('Auth service initialized');
        
        // Create development user if needed
        this.setupDevEnvironment();
    }

    /**
     * Setup development environment with sample data
     */
    setupDevEnvironment() {
        // Only in development mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            if (!localStorage.getItem(this.TOKEN_KEY)) {
                console.warn('Development mode: Creating test token');
                localStorage.setItem(this.TOKEN_KEY, 'test_token_for_development');
                
                // Create test user data if not available
                if (!localStorage.getItem(this.USER_KEY)) {
                    const testUser = {
                        _id: "test_user_id",
                        name: "Test User",
                        email: "test@example.com",
                        mobile: "1234567890"
                    };
                    localStorage.setItem(this.USER_KEY, JSON.stringify(testUser));
                }
            }
        }
    }

    /**
     * Get the current authentication token
     * 
     * @returns {string|null} The authentication token or null if not found
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Store authentication token and user data
     * 
     * @param {string} token - JWT token
     * @param {Object} user - User data
     */
    setAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Remove authentication data
     */
    removeAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * Check if user is logged in
     * 
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        return !!token; // Convert to boolean
    }

    /**
     * Get the current user data
     * 
     * @returns {Object|null} User data or null if not found
     */
    getCurrentUser() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            if (!userData) {
                console.warn('No user data found in localStorage');
                return null;
            }
            
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Login user
     * 
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Response object
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.token) {
                this.setAuth(data.token, data.user);
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Register new user
     * 
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Response object
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.removeAuth();
        // Redirect to home page
        window.location.href = '/index.html';
    }

    /**
     * Request password reset
     * 
     * @param {string} email - User email
     * @returns {Promise<Object>} Response object
     */
    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset request failed');
            }

            return data;
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    }
}

// Create global auth service instance
window.authService = new AuthService();

// Test to make sure the service is working correctly
console.log('Auth service available:', !!window.authService);
console.log('User authenticated:', window.authService?.isAuthenticated());
console.log('Current user:', window.authService?.getCurrentUser());
