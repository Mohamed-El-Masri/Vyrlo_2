import { authService } from './auth.service.js';
import { toastService } from './toast.service.js';

/**
 * API Service for handling all API requests
 */

class ApiService {
    constructor() {
        this.BASE_URL = 'https://www.vyrlo.com:8080';
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

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

    async request(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'token': authService.getToken()
                },
            };

<<<<<<< HEAD
            const fullUrl = `${this.BASE_URL}${url}`;
=======
            // Add auth token if available
            const token = authService?.getToken();
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
>>>>>>> 17a7816a8bd55cc63d106a03db097bc21290641b
            
            const finalOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };

            if (options.body instanceof FormData) {
                delete finalOptions.headers['Content-Type'];
            }

            const response = await fetch(fullUrl, finalOptions);

            if (response.status === 401) {
                authService.clearAuthState();
                window.location.href = '/pages/login.html';
                throw new Error('Unauthorized');
            }

            if (response.status === 403) {
                throw new Error('Forbidden');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                toastService.error('Network error. Please check your connection.');
            } else {
                toastService.error(error.message || 'An error occurred');
            }
            
            throw error;
        }
    }

    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    async uploadFile(url, file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.BASE_URL}${url}`, {
                method: 'POST',
                headers: {
<<<<<<< HEAD
                    'Authorization': `Bearer ${localStorage.getItem('vr_token')}`
=======
                    'Authorization': `Bearer ${authService?.getToken()}`
>>>>>>> 17a7816a8bd55cc63d106a03db097bc21290641b
                },
                body: formData,
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error('File upload failed');
            }

            return await response.json();
        } catch (error) {
            toastService.error('Failed to upload file');
            throw error;
        }
    }

    initializeDefaultInterceptors() {
        this.addErrorInterceptor(async (error) => {
            if (error.status === 401) {
<<<<<<< HEAD
                authService.clearAuthState();
=======
                // Clear auth state and redirect to login
                authService?.clearAuthState();
>>>>>>> 17a7816a8bd55cc63d106a03db097bc21290641b
                window.location.href = '/pages/login.html';
            }
            return error;
        });

        this.addErrorInterceptor(async (error) => {
<<<<<<< HEAD
            toastService.error(
=======
            // Show error toast
            toastService?.error(
>>>>>>> 17a7816a8bd55cc63d106a03db097bc21290641b
                error.message || 'An error occurred while processing your request'
            );
            return error;
        });
    }

    async getCategories() {
        return this.get('/categories');
    }

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

    async getProfile(userId) {
        return this.get(`/profile/${userId}`);
    }

    async updateProfile(userId, profileData) {
        return this.put(`/profile/${userId}`, profileData);
    }
}

<<<<<<< HEAD
export const apiService = new ApiService();

=======
// Export a singleton instance
export const apiService = new ApiService();

// Initialize default interceptors
>>>>>>> 17a7816a8bd55cc63d106a03db097bc21290641b
apiService.initializeDefaultInterceptors(); 