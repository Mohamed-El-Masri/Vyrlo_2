/**
 * Authentication Helper
 * Provides utility functions for handling authentication
 */

class AuthHelper {
    /**
     * Retrieves the authentication token from localStorage
     * 
     * @returns {string|null} The authentication token or null if not found
     */
    static getToken() {
        return localStorage.getItem('vr_token');
    }
    
    /**
     * Checks if the user is authenticated
     * 
     * @returns {boolean} True if authenticated, false otherwise
     */
    static isAuthenticated() {
        const token = this.getToken();
        return !!token;
    }
    
    /**
     * Gets the authentication headers for API requests
     * 
     * @returns {Object} Headers object with token
     */
    static getAuthHeaders() {
        const token = this.getToken();
        if (!token) return {};
        
        // The API expects a header with key 'token' and raw token value
        return { 'token': token };
    }
    
    /**
     * Force refreshes the authentication state
     * This can be called when API returns auth errors
     */
    static refreshAuthState() {
        // Check if there's an auth service available
        if (window.authService) {
            // Use the auth service to refresh or validate token
            const isValid = window.authService.checkToken();
            console.log('Token validation check:', isValid ? 'Valid' : 'Invalid');
            return isValid;
        }
        
        // Fallback - just check if token exists
        return this.isAuthenticated();
    }
    
    /**
     * Gets a refreshed token (or the existing one if refreshing isn't possible)
     * 
     * @returns {string} The bearer token
     */
    static getRefreshedToken() {
        // In a real app, this would call a refresh token endpoint
        // For now, we just ensure the format is correct
        
        const token = this.getToken();
        if (!token) return '';
        
        // Clean token of any quotes
        const cleanToken = token.replace(/^["'](.+)["']$/, '$1');
        
        return cleanToken.startsWith('Bearer ') 
            ? cleanToken 
            : `Bearer ${cleanToken}`;
    }
    
    /**
     * Debug authentication information
     */
    static debug() {
        console.group('🔐 Auth Debug Info');
        console.log('Token exists:', this.isAuthenticated());
        
        const token = this.getToken();
        if (token) {
            console.log('Token format check:', token.startsWith('Bearer ') ? 'Has Bearer prefix' : 'Missing Bearer prefix');
            console.log('Token length:', token.length);
            console.log('Token preview:', `${token.substring(0, 15)}...`);
            
            try {
                // Try to decode JWT payload (middle part)
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log('Token payload:', payload);
                    
                    // Check expiration
                    if (payload.exp) {
                        const now = Math.floor(Date.now() / 1000);
                        const isExpired = payload.exp < now;
                        console.log('Token expired:', isExpired ? '🔴 Yes' : '🟢 No');
                        if (!isExpired) {
                            const expiresIn = payload.exp - now;
                            console.log('Expires in:', `${Math.floor(expiresIn / 3600)} hours ${Math.floor((expiresIn % 3600) / 60)} minutes`);
                        }
                    }
                }
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }
        console.groupEnd();
    }
}

// Auto-run debug on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure localStorage is accessible
    setTimeout(() => {
        AuthHelper.debug();
    }, 500);
});

// Make available globally
window.AuthHelper = AuthHelper;
