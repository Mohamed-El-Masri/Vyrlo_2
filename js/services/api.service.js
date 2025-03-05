/**
 * API Service for handling all API requests
 */

class ApiService {
    constructor() {
        this.BASE_URL = 'https://virlo.vercel.app';
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];

        this.initializeDefaultInterceptors();
    }

    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
    }

    async applyRequestInterceptors(config) {
        let currentConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            currentConfig = await interceptor(currentConfig);
        }
        return currentConfig;
    }

    async applyResponseInterceptors(response) {
        let currentResponse = response;
        for (const interceptor of this.responseInterceptors) {
            currentResponse = await interceptor(currentResponse);
        }
        return currentResponse;
    }

    async applyErrorInterceptors(error) {
        let currentError = error;
        for (const interceptor of this.errorInterceptors) {
            try {
                currentError = await interceptor(currentError);
            } catch (e) {
                console.error('Error in error interceptor:', e);
            }
        }
        throw currentError;
    }

    async request(url, method, data = null) {
        try {
            // Prepare request config
            let config = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            };

            // Add auth token if available
            const token = window.authService?.getToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // Add request body if present
            if (data) {
                config.body = JSON.stringify(data);
            }

            // Apply request interceptors
            config = await this.applyRequestInterceptors(config);

            // Make the request
            const response = await fetch(`${this.BASE_URL}${url}`, config);
            
            // Handle response
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Apply response interceptors
            responseData = await this.applyResponseInterceptors(responseData);

            // Handle error responses
            if (!response.ok) {
                const error = new Error(responseData.message || 'API request failed');
                error.status = response.status;
                error.data = responseData;
                throw error;
            }

            return responseData;
        } catch (error) {
            // Apply error interceptors
            return this.applyErrorInterceptors(error);
        }
    }

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${url}${queryString ? `?${queryString}` : ''}`, 'GET');
    }

    async post(url, data) {
        return this.request(url, 'POST', data);
    }

    async put(url, data) {
        return this.request(url, 'PUT', data);
    }

    async delete(url) {
        return this.request(url, 'DELETE');
    }

    // Helper methods for common operations
    async uploadFile(url, file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.BASE_URL}${url}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.authService?.getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('File upload failed');
            }

            return await response.json();
        } catch (error) {
            return this.applyErrorInterceptors(error);
        }
    }

    // Initialize default interceptors
    initializeDefaultInterceptors() {
        // Add auth error interceptor
        this.addErrorInterceptor(async (error) => {
            if (error.status === 401) {
                // Clear auth state and redirect to login
                window.authService?.clearAuthState();
                window.location.href = '/pages/login.html';
            }
            return error;
        });

        // Add response error handler
        this.addErrorInterceptor(async (error) => {
            // Show error toast
            window.toastService?.error(
                error.message || 'An error occurred while processing your request'
            );
            return error;
        });
    }

    // Categories
    async getCategories() {
        return this.get('/categories');
    }

    // Listings
    async getListings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/listings${queryString ? `?${queryString}` : ''}`);
    }

    async getListing(id) {
        return this.get(`/listings/${id}`);
    }

    async createListing(listingData) {
        return this.post('/listings', listingData);
    }

    async updateListing(id, listingData) {
        return this.put(`/listings/${id}`, listingData);
    }

    async deleteListing(id) {
        return this.delete(`/listings/${id}`);
    }

    // Profile
    async getProfile(userId) {
        return this.get(`/profile/${userId}`);
    }

    async updateProfile(userId, profileData) {
        return this.put(`/profile/${userId}`, profileData);
    }
}

// Create global instance
window.apiService = new ApiService();

// Initialize default interceptors
window.apiService.initializeDefaultInterceptors(); 
window.ApiService = ApiService; 