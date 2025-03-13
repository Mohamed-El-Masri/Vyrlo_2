/**
 * Common utility functions for the application
 * 
 */

export class Utils {
    /**
     * Format date to locale string
     */
    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format time to locale string
     */
    static formatTime(time) {
        return new Date(time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format currency
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Validate email
     */
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Get query parameters from URL
     */
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    /**
     * Set query parameter in URL
     */
    static setQueryParam(param, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    }

    /**
     * Scroll to top of the page
     */
    static scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    /**
     * Check if element is in viewport
     */
    static isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Copy text to clipboard
     */
    static copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }

    /**
     * Generate a random color
     */
    static getRandomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    /**
     * Truncate text
     */
    static truncateText(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    /**
     * Generate a unique ID
     */
    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get query parameters from URL
     */
    static getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Generate random ID
     */
    static generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Check if device is mobile
     */
    static isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Scroll to element
     */
    static scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Formats a price number to a currency string
     */
    static formatPrice(price, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    }

    /**
     * Generates a random string of specified length
     */
    static generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Gets a value from localStorage with expiry check
     */
    static getWithExpiry(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const stored = JSON.parse(item);
        if (stored.expiry && new Date().getTime() > stored.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return stored.value;
    }

    /**
     * Sets a value in localStorage with expiry
     */
    static setWithExpiry(key, value, ttl) {
        const item = {
            value: value,
            expiry: new Date().getTime() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    }
}

// Export a singleton instance
export const utils = new Utils(); 