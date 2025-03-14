import { apiService } from './api.service.js';
import { toastService } from './toast.service.js';
import { authService } from './auth.service.js';

class ListingService {
    constructor() {
        this.baseUrl = 'https://www.vyrlo.com:8080';
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
            console.log('==== REQUEST START: GET USER LISTINGS ====');
            
            // 1. الحصول على التوكن
            const token = authService.getToken();
            console.log('Token being used:', token);
            
            // 2. بناء URL وهيدرز
            const url = `${this.baseUrl}/listing/user`;  // بدون شرطة في النهاية
            console.log('Request URL:', url);
            
            const headers = { 'token': token };
            console.log('Request Headers:', headers);
            
            // 3. إرسال الطلب
            console.log('Sending request with method: GET');
            const requestDetails = {
                method: 'GET',
                headers: headers
            };
            
            const response = await fetch(url, requestDetails);
            
            // 4. تسجيل نتيجة الاستجابة
            console.log('Response status:', response.status);
            console.log('Response OK:', response.ok);
            
            // 5. في حالة الخطأ
            if (!response.ok) {
                let errorBody = '';
                try {
                    errorBody = await response.text();
                    console.error('Error Response Body:', errorBody);
                } catch (e) {
                    console.error('Could not read error response body');
                }
                throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
            }
            
            // 6. معالجة البيانات
            const data = await response.json();
            console.log('Response Data Type:', Array.isArray(data) ? 'Array' : typeof data);
            console.log('Response Data Length:', Array.isArray(data) ? data.length : 'N/A');
            
            const result = {
                listings: Array.isArray(data) ? data : [],
                total: Array.isArray(data) ? data.length : 0,
                page: 1,
                pages: 1
            };
            
            console.log('==== REQUEST END: SUCCESS ====');
            return result;
            
        } catch (error) {
            console.error('==== REQUEST END: ERROR ====');
            console.error('Error Type:', error.name);
            console.error('Error Message:', error.message);
            throw error;
        }
    }

    /**
     * Create new listing
     * @param {Object} data - Listing data
     * @returns {Promise} - Response from API
     */
    async createListing(data) {
        try {
            const response = await apiService.post('/listing', data);
            toastService.success('Listing created successfully');
            return response;
        } catch (error) {
            console.error('Error creating listing:', error);
            toastService.error('Failed to create listing');
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
        // استخدام apiService المستورد بدلاً من window.ApiService
        const token = authService.getToken();
        const headers = { 'token': token };
        
        // عنوان URL الصحيح كما ذكرت
        const url = `${this.baseUrl}/listing/${id}`;
        
        // إضافة تسجيل لتتبع العملية
        console.log('Deleting listing:', id);
        console.log('Using URL:', url);
        console.log('With token:', token);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: headers
        });
        
        // التحقق من نجاح الطلب
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete request failed:', response.status, errorText);
            throw new Error(`Failed to delete: ${response.status}`);
        }
        
        // إظهار رسالة نجاح
        toastService.success('Listing deleted successfully');
        
        // حذف من الكاش إذا كان موجوداً
        this.clearCache('active');
        
        return await response.json().catch(() => ({})); // بعض API تعيد JSON، وبعضها لا تعيد
    } catch (error) {
        console.error('Error deleting listing:', error);
        toastService.error('Failed to delete listing');
        throw error;
    }
}

/**
 * تصحيح عنوان الـ API وطريقة تحديث حالة القائمة
 * @param {string} id - معرّف القائمة
 * @param {Object} statusData - بيانات التحديث (isActive, freeTrialStart, freeTrialEnd)
 * @returns {Promise} - استجابة من API
 */
async updateListingStatus(id, statusData) {
    try {
        // استخدام token من خدمة المصادقة
        const token = authService.getToken();
        
        console.log('Updating listing status:', { id, statusData });
        
        // تصحيح عنوان URL وإرسال البيانات المطلوبة فقط
        const url = `${this.baseUrl}/listing/${id}`;
        
        // إرسال البيانات الأساسية فقط: isActive
        const updateData = {
            isActive: statusData.isActive
        };
        
        // إضافة معلومات الفترة التجريبية المجانية إلى التعليقات في حال احتاجها الخادم مستقبلاً
        if (statusData.freeTrialStart) {
            updateData._freeTrialStart = statusData.freeTrialStart;
        }
        
        if (statusData.freeTrialEnd) {
            updateData._freeTrialEnd = statusData.freeTrialEnd;
        }
        
        console.log('Sending update with data:', updateData);
        
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify(updateData)
        };
        
        // إرسال الطلب إلى API
        const response = await fetch(url, options);
        
        // التحقق من استجابة الخادم
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Update failed with status ${response.status}:`, errorText);
            throw new Error(`Failed to update status: ${response.status}`);
        }
        
        // معالجة استجابة الخادم
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // بعض واجهات API قد لا ترجع JSON
            data = { success: true, id };
        }
        
        // تحديث الكاش
        this.clearCache('active');
        
        toastService.success('Listing status updated successfully');
        return data;
    } catch (error) {
        console.error('Error updating listing status:', error);
        toastService.error('Failed to update listing status');
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

    // Get Categories
    async getCategories() {
        try {
            const response = await apiService.get('/categories');
            return response.data || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            toastService.error('Failed to load categories');
            throw error;
        }
    }

    // Upload listing images
    async uploadListingImages(files) {
        try {
            const uploadPromises = files.map(file => 
                window.ApiService.uploadFile('/upload', file)
            );
            const results = await Promise.all(uploadPromises);
            return results.map(result => result.url);
        } catch (error) {
            window.toastService.error('Failed to upload images');
            throw error;
        }
    }

    // Get listing by ID
    async getListing(id) {
        try {
            return await window.ApiService.get(`/listings/${id}`);
        } catch (error) {
            window.toastService.error('Failed to load listing');
            throw error;
        }
    }

    // Update listing
    async updateListing(id, data) {
        try {
            const response = await window.ApiService.put(`/listings/${id}`, data);
            window.toastService.success('Listing updated successfully');
            return response;
        } catch (error) {
            window.toastService.error('Failed to update listing');
            throw error;
        }
    }

    
}

// Export a singleton instance
export const listingService = new ListingService();