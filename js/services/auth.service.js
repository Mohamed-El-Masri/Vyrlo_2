/**
 * Authentication Service
 */
class AuthService {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.TOKEN_KEY = 'vr_token';
        this.USER_KEY = 'vr_user';
        this.PROFILE_KEY = 'vr_profile';
        this.initializeAuthListeners();
    }

    initializeAuthListeners() {
        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key === this.TOKEN_KEY || e.key === this.USER_KEY || e.key === this.PROFILE_KEY) {
                this.updateUI();
            }
        });

        // Update UI when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateUI();
            }
        });
    }

    async updateUI() {
        try {
            const token = this.getToken();
            const user = this.getUser();
            const profile = this.getProfile();

            await this.updateAuthViews(user, profile, token);
            
            if (user && profile) {
                await this.updateUserDropdown(user, profile);
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    async updateAuthViews(user, profile, token) {
        const guestView = document.getElementById('guestView');
        const userView = document.getElementById('userView');

        if (!guestView || !userView) {
            throw new Error('Auth views not found');
        }

        if (token && user) {
            guestView.style.display = 'none';
            userView.style.display = 'flex';
        } else {
            guestView.style.display = 'flex';
            userView.style.display = 'none';
        }
    }

    async updateUserDropdown(user, profile) {
        // Get elements
        const profileName = document.getElementById('profileName');
        const headerAvatar = document.getElementById('headerAvatar');
        const profileTrigger = document.getElementById('profileTrigger');
        const profileDropdown = document.getElementById('profileDropdown');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!profileName || !headerAvatar || !profileTrigger || !profileDropdown || !logoutBtn) {
            throw new Error('User dropdown elements not found');
        }

        // Update name and avatar
        profileName.textContent = `Hello, ${user.name}`;
        if (profile && profile.avatar) {
            headerAvatar.src = profile.avatar;
        }

        // Setup dropdown listeners
        this.setupDropdownListeners(profileTrigger, profileDropdown);

        // Setup logout handler
        logoutBtn.addEventListener('click', () => this.logout());
    }

    setupDropdownListeners(trigger, dropdown) {
        // Remove existing listeners
        trigger.removeEventListener('click', this.toggleDropdown);
        document.removeEventListener('click', this.closeDropdown);
        document.removeEventListener('keydown', this.handleEscKey);

        // Store dropdown reference
        this.activeDropdown = dropdown;

        // Toggle dropdown
        this.toggleDropdown = (e) => {
            e.stopPropagation();
            const isActive = dropdown.classList.contains('active');
            if (isActive) {
                dropdown.classList.remove('active');
            } else {
                dropdown.classList.add('active');
            }
        };

        // Close dropdown when clicking outside
        this.closeDropdown = (e) => {
            if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        };

        // Close dropdown on Escape key
        this.handleEscKey = (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        };

        // Add listeners
        trigger.addEventListener('click', this.toggleDropdown);
        document.addEventListener('click', this.closeDropdown);
        document.addEventListener('keydown', this.handleEscKey);
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            
            if (data.token) {
                // Store token
                this.setToken(data.token);
                
                // Parse and store user data from token
                const user = this.parseJwt(data.token);
                
                if (user) {
                    this.setUser(user);
                    
                    // Fetch and store profile data
                    const profile = await this.fetchAndStoreProfile(user.userId);
                    
                    // Update UI
                    await this.updateUI();

                    // Show success message
                    if (window.toastService) {
                        window.toastService.success('Successfully logged in');
                    }

                    // Delay redirect to ensure UI updates are complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                    window.location.href = '/pages/home.html';
                }
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Clear stored data
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            localStorage.removeItem(this.PROFILE_KEY);
            
            // Update UI
            await this.updateUI();
            
            // Redirect to login page
            window.location.href = '/pages/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Parse JWT token
     */
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Get authentication token
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Set user data
     */
    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Get current user
     */
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        return !!token;
    }

    /**
     * Get user data from token
     */
    async getUserData() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const userData = await ApiService.get('/user/profile');
            this.setUser(userData);
            return userData;
        } catch (error) {
            console.error('Error fetching user data:', error);
            this.logout();
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, profileData) {
        try {
            const formData = new FormData();
            
            // Add profile fields to FormData
            Object.keys(profileData).forEach(key => {
                if (key === 'profilePic' && profileData[key] instanceof File) {
                    formData.append(key, profileData[key]);
                } else if (key === 'socialAccounts' && Array.isArray(profileData[key])) {
                    formData.append(key, JSON.stringify(profileData[key]));
                } else {
                    formData.append(key, profileData[key]);
                }
            });

            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Profile update failed');
            }

            const data = await response.json();
            this.setUser({ ...this.getUser(), ...data });

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch profile');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/change-pass`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Password change failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Password reset request failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(email, newPassword, otp) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/forgetpass/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    newPassword,
                    otp
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Password reset failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async fetchAndStoreProfile(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const profileData = await response.json();

            if (Array.isArray(profileData) && profileData.length > 0) {
                const profile = profileData[0];
                this.setProfile(profile);
                return profile;
            }
            return null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    setProfile(profile) {
        localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    }

    getProfile() {
        const profile = localStorage.getItem(this.PROFILE_KEY);
        return profile ? JSON.parse(profile) : null;
    }
}

// Create global instance
window.AuthService = new AuthService();

// Update header UI on page load and after any navigation
document.addEventListener('DOMContentLoaded', () => {
    window.AuthService.updateUI();
});

// Optional: Update header when the page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        window.AuthService.updateUI();
    }
}); 