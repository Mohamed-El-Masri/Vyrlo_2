class ProfilePage {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.form = document.getElementById('editProfileForm');
        this.init();
    }

    async init() {
        try {
            if (!this.getUserId()) {
                window.location.href = '/pages/login.html';
                return;
            }
            await this.loadUserProfile();
            this.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            window.toastService?.error('Failed to initialize profile page');
        }
    }

    async loadUserProfile() {
        try {
            const userId = this.getUserId();
            if (!userId) throw new Error('User ID not found');

            const token = this.getToken();
            if (!token) throw new Error('Authentication token not found');

            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data[0]) {
                throw new Error('Invalid profile data received');
            }

            this.updateProfileUI(data);
        } catch (error) {
            console.error('Error loading user profile:', error);
            if (error.message.includes('Authentication')) {
                window.location.href = '/pages/login.html';
            } else {
                window.toastService?.error('Failed to load profile data');
            }
        }
    }

    updateProfileUI(data) {
        try {
            if (!data || !data[0] || !data[0].userId) {
                throw new Error('Invalid profile data structure');
            }

            const profile = data[0];
            const userData = profile.userId;

            // Fix breadcrumb username update
            const breadcrumbUsername = document.querySelector('.breadcrumb-section h2 span#profileName');
            if (breadcrumbUsername) {
                breadcrumbUsername.textContent = userData.username;
            }

            // Update member since date
            const joinDate = document.getElementById('joinDate');
            if (joinDate && profile.createdAt) {
                const date = new Date(profile.createdAt);
                const formattedDate = new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric'
                }).format(date);
                joinDate.textContent = formattedDate;
            }

            // Update username in breadcrumb and profile
            this.safeUpdateElement('profileDisplayName', userData.username);
            this.safeUpdateElement('profileName', userData.username);
            this.safeUpdateElement('Email', userData.email, false, 'value');
            
            // Update title and other profile details
            this.safeUpdateElement('title', profile.title || '', false, 'value');
            
            // Update listings count
            this.safeUpdateElement('listingsCount', profile.numberOfProjects || 0);

            // Update profile details
            const profileFields = {
                'phoneNumber': profile.phoneNumber,
                'Address': profile.address,
                'City': profile.city,
                'State': profile.state,
                'zipCode': profile.zipCode,
                'bio': profile.about
            };

            Object.entries(profileFields).forEach(([id, value]) => {
                this.safeUpdateElement(id, value || '', false, 'value');
            });

            // Update location display
            const location = this.formatLocation(profile.city, profile.state);
            this.safeUpdateElement('profileLocation', location);

            // Update avatar - handle empty array case
            this.updateAvatar(profile.profilePic);

            // Update social accounts
            this.updateSocialAccounts(profile.socialAccounts);

            // Remove or hide saved count since it's not needed
            const savedCountElement = document.getElementById('favoritesCount');
            if (savedCountElement) {
                savedCountElement.parentElement.style.display = 'none';
            }

        } catch (error) {
            console.error('Error updating UI:', error);
            window.toastService?.error('Failed to update profile display');
        }
    }

    formatLocation(city, state) {
        return (city ? city + ', ' : '') + (state || 'Location not specified');
    }

    safeUpdateElement(id, value, isHTML = false, property = 'textContent') {
        const element = document.getElementById(id);
        if (element) {
            try {
                if (isHTML) {
                    element.innerHTML = value;
                } else {
                    element[property] = value;
                }
            } catch (error) {
                console.error(`Error updating element ${id}:`, error);
            }
        }
    }

    updateAvatar(profilePic) {
        const avatarElement = document.getElementById('profileAvatar');
        if (avatarElement) {
            // Check if profilePic is an array and has items
            avatarElement.src = Array.isArray(profilePic) && profilePic.length > 0
                ? profilePic[0]
                : '/images/defaults/default-avatar.png';
            
            avatarElement.onerror = () => {
                avatarElement.src = '/images/defaults/default-avatar.png';
            };
        }
    }

    updateSocialAccounts(accounts) {
        if (Array.isArray(accounts)) {
            accounts.forEach(account => {
                if (account?.platform && account?.url) {
                    this.safeUpdateElement(account.platform, account.url, false, 'value');
                }
            });
        }
    }

    setupEventListeners() {
        // Handle avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', this.handleAvatarUpload.bind(this));
        }

        // Handle form submission
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Handle logout
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Add handler for "Add Listing" menu item
        const addListingLink = document.querySelector('a[href="/pages/newAddListing.html"]');
        if (addListingLink) {
            addListingLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadAddListingComponent();
            });
        }
    }

    async loadAddListingComponent() {
        try {
            const response = await fetch('/components/profile/addListing.html');
            const html = await response.text();
            
            // Update the main content area
            const contentArea = document.querySelector('.col-md-8 .dashboard');
            if (contentArea) {
                contentArea.innerHTML = html;
                
                // Load required scripts
                await this.loadScript('/js/components/addListing.js');
                await this.loadScript('/css/components/listing-form.css', 'css');
            }
        } catch (error) {
            console.error('Error loading add listing component:', error);
            window.toastService?.error('Failed to load add listing form');
        }
    }

    loadScript(src, type = 'js') {
        return new Promise((resolve, reject) => {
            if (type === 'js') {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            } else if (type === 'css') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = src;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
            }
        });
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('profilePic', file);

            const response = await fetch(`${this.API_BASE_URL}/profile/upload/${this.getUserId()}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload profile picture');

            const result = await response.json();
            document.getElementById('profileAvatar').src = result.imageUrl;
            window.toastService.success('Profile picture updated successfully');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            window.toastService.error('Failed to upload profile picture');
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            address: document.getElementById('Address').value,
            city: document.getElementById('City').value,
            state: document.getElementById('State').value,
            zipCode: document.getElementById('zipCode').value,
            about: document.getElementById('bio').value,
            socialAccounts: [
                {
                    platform: 'facebook',
                    url: document.getElementById('facebook')?.value || ''
                },
                {
                    platform: 'instagram',
                    url: document.getElementById('instagram')?.value || ''
                }
            ]
        };

        try {
            const response = await fetch(`${this.API_BASE_URL}/profile/${this.getUserId()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update profile');
            
            window.toastService.success('Profile updated successfully');
            await this.loadUserProfile(); // Refresh profile data
        } catch (error) {
            console.error('Error updating profile:', error);
            window.toastService.error('Failed to update profile');
        }
    }

    handleLogout() {
        localStorage.removeItem('vr_token');
        localStorage.removeItem('vr_user');
        window.location.href = '/pages/login.html';
    }

    getUserId() {
        try {
            const user = localStorage.getItem('vr_user');
            if (!user) return null;
            const userData = JSON.parse(user);
            return userData?.id || null;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    }

    getToken() {
        try {
            return localStorage.getItem('vr_token') || null;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }
}

// Safe initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ProfilePage();
        handleMenuNavigation();
    } catch (error) {
        console.error('Failed to initialize profile page:', error);
        window.toastService?.error('Failed to load profile page');
    }
});

// Add this function to handle menu navigation
function handleMenuNavigation() {
    document.querySelectorAll('.vr-profile-menu .profile-item a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#') {
                e.preventDefault();
                
                // Remove active class from all items
                document.querySelectorAll('.profile-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked item
                link.parentElement.classList.add('active');
                
                // Hide all content sections
                document.querySelectorAll('.vr-profile__content > div').forEach(div => {
                    div.style.display = 'none';
                });
                
                // Show relevant content
                if (link.parentElement.dataset.page === 'profile') {
                    document.querySelector('.vr-profile__form:not(.vr-listing-wizard)').style.display = 'block';
                    document.getElementById('addListingContainer').style.display = 'none';
                }
            }
        });
    });
}