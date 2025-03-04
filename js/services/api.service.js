/**
 * API Service for handling all API requests
 */

class ApiService {
    static BASE_URL = 'https://virlo.vercel.app';

    static async get(url) {
        return this.request(url, 'GET');
    }

    static async post(url, data) {
        return this.request(url, 'POST', data);
    }

    static async put(url, data) {
        return this.request(url, 'PUT', data);
    }

    static async delete(url) {
        return this.request(url, 'DELETE');
    }

    static async request(url, method, data = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add auth token if available
        const token = localStorage.getItem('vr_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
            mode: 'cors',
            credentials: 'omit'
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.BASE_URL}${url}`, config);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                // Clear auth data
                localStorage.removeItem('vr_token');
                localStorage.removeItem('vr_user');
                window.location.href = '/pages/login.html';
                throw new Error('Unauthorized');
            }

            const responseData = await response.json();

            // Handle API error responses
            if (!response.ok) {
                throw new Error(responseData.message || 'API request failed');
            }

            return responseData;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Categories
    static async getCategories() {
        return this.get('/categories');
    }

    // Listings
    static async getListings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/listings${queryString ? `?${queryString}` : ''}`);
    }

    static async getListing(id) {
        return this.get(`/listings/${id}`);
    }

    static async createListing(listingData) {
        return this.post('/listings', listingData);
    }

    static async updateListing(id, listingData) {
        return this.put(`/listings/${id}`, listingData);
    }

    static async deleteListing(id) {
        return this.delete(`/listings/${id}`);
    }

    // Profile
    static async getProfile(userId) {
        return this.get(`/profile/${userId}`);
    }

    static async updateProfile(userId, profileData) {
        return this.put(`/profile/${userId}`, profileData);
    }
}

// Make it globally available
window.ApiService = ApiService; 