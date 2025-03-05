/**
 * Authentication Service
 */
class AuthService {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        
        // Initialize state
        this.token = null;
        this.user = null;
        this.profile = null;
        this.uiUpdateCallbacks = new Set();

        // Try to restore state from storage
        this.restoreState();
    }

    restoreState() {
        try {
            this.token = localStorage.getItem('vr_token');
            const storedUser = localStorage.getItem('vr_user');
            const storedProfile = localStorage.getItem('vr_profile');

            if (this.token) {
                // Get user data from token
                const decoded = this.parseJwt(this.token);
                if (decoded) {
                    this.user = {
                        id: decoded.userId,
                        name: decoded.name,
                        email: decoded.email
                    };
                    localStorage.setItem('vr_user', JSON.stringify(this.user));
                }

                if (storedProfile) {
                    this.profile = JSON.parse(storedProfile);
                }

                // Fetch profile if we have user ID
                if (this.user?.id) {
                    this.fetchAndStoreProfile(this.user.id);
                }
            } else {
                this.clearAuthState();
            }
        } catch (error) {
            console.error('Error restoring auth state:', error);
            this.clearAuthState();
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT parse error:', error);
            return null;
        }
    }

    onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            this.uiUpdateCallbacks.add(callback);
            // Initial call with current state
            callback(this.isAuthenticated());
        }
    }

    notifyAuthStateChange() {
        this.uiUpdateCallbacks.forEach(callback => {
            try {
                callback(this.isAuthenticated());
            } catch (error) {
                console.error('Error in auth state change callback:', error);
            }
        });
    }

    async register(name, email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('This email is already registered');
                }
                throw new Error(data.message || 'Registration failed');
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/signin`, {
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

            // Save token
            this.setToken(data.token);

            // Get user data from token
            const decoded = this.parseJwt(data.token);
            if (decoded) {
                const user = {
                    id: decoded.userId,
                    name: decoded.name,
                    email: decoded.email
                };
            this.setUser(user);
            
                // Fetch profile
                await this.fetchAndStoreProfile(user.id);
            }
            
            // Notify UI of state change
            this.notifyAuthStateChange();
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        this.clearAuthState();
        this.notifyAuthStateChange();
        window.location.href = '/pages/login.html';
    }

    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/forgetpass/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset instructions');
            }

            return data;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    async resetPassword(email, newPassword, otp) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/forgetpass/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, newPassword, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            return data;
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/change-pass`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Incorrect old password');
                }
                throw new Error(data.message || 'Failed to change password');
            }

            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    async updateProfile(userId, profileData) {
        try {
            const formData = new FormData();
            
            // Add profile fields
            Object.keys(profileData).forEach(key => {
                if (key === 'profilePic' && profileData[key] instanceof File) {
                        formData.append('profilePic', profileData[key]);
                } else if (key === 'socialAccounts' && Array.isArray(profileData[key])) {
                    formData.append('socialAccounts', JSON.stringify(profileData[key]));
                } else {
                    formData.append(key, profileData[key]);
                }
            });

            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error('Invalid file type');
                }
                throw new Error(data.message || 'Failed to update profile');
            }

            // Update stored profile
            this.setProfile(data);
            
            // Trigger UI update
            this.notifyAuthStateChange();

            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    async fetchAndStoreProfile(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            
            // Handle empty response by creating a new profile
            if (!data || !Array.isArray(data) || data.length === 0) {
                const newProfile = {
                    _id: null,
                    userId: {
                        _id: userId,
                        username: this.user?.name || '',
                        email: this.user?.email || '',
                        isBanned: false
                    },
                    numberOfProjects: 0,
                    profilePic: ['/images/defaults/default-avatar.png'],
                    socialAccounts: [],
                    title: '',
                    phoneNumber: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    about: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.setProfile(this.transformProfileData(newProfile));
                return this.profile;
            }
            
            // Get first profile from array
            const profileData = data[0];
            
            // Transform and store profile
            this.setProfile(this.transformProfileData(profileData));
            return this.profile;
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Set default profile if fetch fails
            const defaultProfile = {
                _id: null,
                userId: {
                    _id: userId,
                    username: this.user?.name || '',
                    email: this.user?.email || '',
                    isBanned: false
                },
                numberOfProjects: 0,
                profilePic: ['/images/defaults/default-avatar.png'],
                socialAccounts: [],
                title: '',
                phoneNumber: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                about: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.setProfile(this.transformProfileData(defaultProfile));
            return this.profile;
        }
    }

    // Helper method to transform API profile data to our internal format
    transformProfileData(profileData) {
        return {
            id: profileData._id,
            userId: profileData.userId?._id,
            name: profileData.userId?.username || this.user?.name || '',
            email: profileData.userId?.email || this.user?.email || '',
            avatar: (profileData.profilePic && profileData.profilePic[0]) || '/images/defaults/default-avatar.png',
            title: profileData.title || '',
            phoneNumber: profileData.phoneNumber || '',
            address: profileData.address || '',
            city: profileData.city || '',
            state: profileData.state || '',
            zipCode: profileData.zipCode || '',
            about: profileData.about || '',
            numberOfProjects: parseInt(profileData.numberOfProjects) || 0,
            socialAccounts: Array.isArray(profileData.socialAccounts) 
                ? profileData.socialAccounts.map(account => ({
                    id: account._id,
                    platform: account.platform,
                    url: account.url
                }))
                : [],
            createdAt: profileData.createdAt,
            updatedAt: profileData.updatedAt,
            isBanned: profileData.userId?.isBanned || false
        };
    }

    clearAuthState() {
        this.token = null;
        this.user = null;
        this.profile = null;
        
        localStorage.removeItem('vr_token');
        localStorage.removeItem('vr_user');
        localStorage.removeItem('vr_profile');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('vr_token', token);
    }

    setUser(user) {
        this.user = user;
        localStorage.setItem('vr_user', JSON.stringify(user));
    }

    setProfile(profile) {
        this.profile = profile;
        localStorage.setItem('vr_profile', JSON.stringify(profile));
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    getProfile() {
        return this.profile;
    }

    isAuthenticated() {
        return this.token !== null;
    }

    getUserId() {
        return this.user?.id;
    }

    updateUI() {
        // Common UI elements
        const authLinks = document.querySelector('.auth-links');
        const userMenu = document.querySelector('.user-menu');
        const profileMenuItems = document.querySelectorAll('.profile-menu-item');
        const adminMenuItems = document.querySelectorAll('.admin-menu-item');
        const authRequiredElements = document.querySelectorAll('[data-requires-auth]');
        
        // Update authentication-dependent UI elements
        if (this.isAuthenticated()) {
            // Show/hide main navigation elements
            if (authLinks) authLinks.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                
                // Update user info in menu
                const userAvatar = userMenu.querySelector('.user-avatar');
                const userName = userMenu.querySelector('.user-name');
                const userEmail = userMenu.querySelector('.user-email');
                
                if (userAvatar && this.profile) {
                    userAvatar.src = this.profile.avatar;
                    userAvatar.alt = this.user?.name || 'User Avatar';
                }
                
                if (userName && this.user) {
                    userName.textContent = this.user.name;
                }

                if (userEmail && this.user) {
                    userEmail.textContent = this.user.email;
                }
            }

            // Show elements that require authentication
            authRequiredElements.forEach(element => {
                element.style.display = '';
            });

            // Update profile-specific elements
            if (this.profile) {
                profileMenuItems.forEach(item => {
                    item.style.display = '';
                });

                // Update any profile information on the current page
                this.updateProfileInfo();
            }

        } else {
            // User is logged out - hide authenticated elements
            if (authLinks) authLinks.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            
            // Hide elements that require authentication
            authRequiredElements.forEach(element => {
                element.style.display = 'none';
            });

            // Hide profile menu items
            profileMenuItems.forEach(item => {
                item.style.display = 'none';
            });

            // Hide admin menu items
            adminMenuItems.forEach(item => {
                item.style.display = 'none';
            });
        }

        // Update page-specific elements
        this.updatePageSpecific();
    }

    updateProfileInfo() {
        // Update profile information if on profile page
        const profileElements = {
            avatar: document.querySelector('.profile-avatar'),
            name: document.querySelector('.profile-name'),
            email: document.querySelector('.profile-email'),
            title: document.querySelector('.profile-title'),
            phone: document.querySelector('.profile-phone'),
            address: document.querySelector('.profile-address'),
            about: document.querySelector('.profile-about')
        };

        if (this.profile && this.user) {
            Object.entries(profileElements).forEach(([key, element]) => {
                if (!element) return;
                
                switch(key) {
                    case 'avatar':
                        element.src = this.profile.avatar;
                        element.alt = this.user.name;
                        break;
                    case 'name':
                        element.textContent = this.user.name;
                        break;
                    case 'email':
                        element.textContent = this.user.email;
                        break;
                    default:
                        if (this.profile[key]) {
                            element.textContent = this.profile[key];
                        }
                }
            });
        }
    }

    updatePageSpecific() {
        // Get current page path
        const currentPath = window.location.pathname;
        
        // Handle specific pages
        if (currentPath.includes('/profile.html')) {
            this.updateProfileInfo();
        } else if (currentPath.includes('/settings.html')) {
            // Update settings page elements
            const settingsForm = document.querySelector('.settings-form');
            if (settingsForm && this.user) {
                const emailInput = settingsForm.querySelector('[name="email"]');
                if (emailInput) emailInput.value = this.user.email;
            }
        }
        
        // Redirect if page requires authentication
        const requiresAuth = document.body.hasAttribute('data-requires-auth');
        if (requiresAuth && !this.isAuthenticated()) {
            window.location.href = '/pages/login.html';
        }
    }

    // Add this method to register for UI updates
    registerUIComponent(element, updateCallback) {
        if (element && typeof updateCallback === 'function') {
            this.onAuthStateChange(() => {
                updateCallback(element, this.isAuthenticated(), this.user, this.profile);
            });
        }
    }
}

// Create global instance
window.authService = new AuthService();

// Update header UI on page load and after any navigation
document.addEventListener('DOMContentLoaded', () => {
    window.authService.updateUI();
});

// Optional: Update header when the page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        window.authService.updateUI();
    }
}); 