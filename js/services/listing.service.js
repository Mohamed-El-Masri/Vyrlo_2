class ListingService {
    constructor() {
        this.baseUrl = 'https://virlo.vercel.app';
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    /**
     * Get active listings with filters and caching
     */
    async getActiveListings(filters = {}) {
        try {
            const cacheKey = this.generateCacheKey('active', filters);
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Check if there's a pending request
            if (this.pendingRequests.has(cacheKey)) {
                return this.pendingRequests.get(cacheKey);
            }

            // Build query string
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const url = `${this.baseUrl}/listing/active${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            
            // Create new request promise
            const requestPromise = window.ApiService.get(url)
                .then(response => {
                    this.cache.set(cacheKey, response);
                    this.pendingRequests.delete(cacheKey);
                    return response;
                })
                .catch(error => {
                    this.pendingRequests.delete(cacheKey);
                    throw error;
                });

            this.pendingRequests.set(cacheKey, requestPromise);
            return requestPromise;
        } catch (error) {
            console.error('Error fetching active listings:', error);
            window.toastService.error('Failed to fetch listings');
            throw error;
        }
    }

    /**
     * Generate cache key for requests
     */
    generateCacheKey(type, params = {}) {
        return `${type}-${JSON.stringify(params)}`;
    }

    /**
     * Clear cache for specific type
     */
    clearCache(type = null) {
        if (type) {
            Array.from(this.cache.keys())
                .filter(key => key.startsWith(type))
                .forEach(key => this.cache.delete(key));
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get listing by ID
     * @param {string} id - Listing ID
     * @returns {Promise} - Response from API
     */
    async getListingById(id) {
        try {
            const response = await window.ApiService.get(`${this.baseUrl}/listing/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching listing details:', error);
            window.toastService.error('Failed to fetch listing details');
            throw error;
        }
    }

    /**
     * Get user's listings
     * @returns {Promise} - Response from API
     */
    async getUserListings() {
        try {
            const response = await window.ApiService.get(`${this.baseUrl}/listing/user`);
            return response;
        } catch (error) {
            console.error('Error fetching user listings:', error);
            window.toastService.error('Failed to fetch your listings');
            throw error;
        }
    }

    /**
     * Create new listing
     * @param {Object} listingData - Listing data
     * @returns {Promise} - Response from API
     */
    async createListing(listingData) {
        try {
            const response = await window.ApiService.post(`${this.baseUrl}/listing`, listingData);
            window.toastService.success('Listing created successfully');
            return response;
        } catch (error) {
            console.error('Error creating listing:', error);
            window.toastService.error('Failed to create listing');
            throw error;
        }
    }

    /**
     * Update listing
     * @param {string} id - Listing ID
     * @param {Object} updateData - Updated listing data
     * @returns {Promise} - Response from API
     */
    async updateListing(id, updateData) {
        try {
            const response = await window.ApiService.put(`${this.baseUrl}/listing/${id}`, updateData);
            window.toastService.success('Listing updated successfully');
            return response;
        } catch (error) {
            console.error('Error updating listing:', error);
            window.toastService.error('Failed to update listing');
            throw error;
        }
    }

    /**
     * Delete listing
     * @param {string} id - Listing ID
     * @returns {Promise} - Response from API
     */
    async deleteListing(id) {
        try {
            const response = await window.ApiService.delete(`${this.baseUrl}/listing/${id}`);
            window.toastService.success('Listing deleted successfully');
            return response;
        } catch (error) {
            console.error('Error deleting listing:', error);
            window.toastService.error('Failed to delete listing');
            throw error;
        }
    }

    /**
     * Check if listing is open based on opening times
     * @param {Object} openingTimes - Opening times object
     * @returns {boolean} - True if listing is currently open
     */
    isListingOpen(openingTimes) {
        if (!openingTimes) return false;

        const now = new Date();
        const dayOfWeek = now.toLocaleString('en-us', { weekday: 'long' });
        const currentTime = now.toLocaleString('en-US', { 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: false 
        });

        const todaySchedule = openingTimes[dayOfWeek];
        if (!todaySchedule || todaySchedule.status === 'close') return false;

        const { from, to } = todaySchedule;
        return this.isTimeBetween(currentTime, from, to);
    }

    /**
     * Check if current time is between opening hours
     * @param {string} current - Current time (HH:mm)
     * @param {string} from - Opening time (HH:mm)
     * @param {string} to - Closing time (HH:mm)
     * @returns {boolean} - True if current time is between opening hours
     */
    isTimeBetween(current, from, to) {
        const [currentHour, currentMinute] = current.split(':').map(Number);
        const [fromHour, fromMinute] = from.split(':').map(Number);
        const [toHour, toMinute] = to.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;
        const fromMinutes = fromHour * 60 + fromMinute;
        const toMinutes = toHour * 60 + toMinute;

        return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    }
}

// Export a singleton instance
export const listingService = new ListingService(); 