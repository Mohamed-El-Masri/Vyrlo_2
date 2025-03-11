import ListingWizard from '../components/listingWizard.js';
import { listingService } from '../services/listing.service.js';
import { toastService } from '../services/toast.service.js';
import { apiService } from '../services/api.service.js';
import { authService } from '../services/auth.service.js';

class ProfilePage {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.form = document.getElementById('editProfileForm');
        this.currentSection = new URLSearchParams(window.location.search).get('section') || 'profile';
        this.listingWizard = null;
        this.init();
    }

    async init() {
        try {
            if (!authService.isAuthenticated()) {
                window.location.href = '/pages/login.html';
                return;
            }
            await this.loadUserProfile();
            this.setupEventListeners();
            this.loadSection(this.currentSection);
        } catch (error) {
            console.error('Initialization error:', error);
            toastService.error('Failed to initialize profile page');
        }
    }

    async loadUserProfile() {
        try {
            const userId = authService.getUserId();
            if (!userId) throw new Error('User ID not found');

            const token = authService.getToken();
            if (!token) throw new Error('Authentication token not found');

            const response = await apiService.get(`/profile/${userId}`);
            if (!response || !response[0]) {
                throw new Error('Invalid profile data received');
            }

            this.updateProfileUI(response);
        } catch (error) {
            console.error('Error loading user profile:', error);
            if (error.message.includes('Authentication')) {
                window.location.href = '/pages/login.html';
            } else {
                toastService.error('Failed to load profile data');
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
            toastService.error('Failed to update profile display');
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

        // Add section navigation handlers
        document.querySelectorAll('[data-section]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.loadSection(section);
            });
        });
    }

    loadSection(section) {
        // Remove active class from all menu items
        document.querySelectorAll('.profile-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected menu item
        const menuItem = document.querySelector(`.profile-item[data-section="${section}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }

        // Hide all sections first
        document.querySelectorAll('.vr-profile__section').forEach(div => {
            div.style.display = 'none';
        });

        // Show selected section
        const sectionElement = document.getElementById(`${section}Container`);
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }

        // Load section-specific content
        switch(section) {
            case 'addListing':
                this.loadAddListingComponent();
                break;
            case 'listings':
                this.loadUserListings();
                break;
            case 'profile':
            default:
                // Profile section is loaded by default
                break;
        }

        // Update URL without reloading
        const url = new URL(window.location);
        url.searchParams.set('section', section);
        window.history.pushState({}, '', url);
    }

    async loadAddListingComponent() {
        try {
            const container = document.getElementById('addListingContainer');
            if (!container) {
                throw new Error('Add listing container not found');
            }

            // Show the container before initializing the wizard
            container.style.display = 'block';

            // Clean up existing instance if any
            if (this.listingWizard) {
                // Add cleanup method if needed
                this.listingWizard = null;
            }

            // Clean up any existing map containers
            document.querySelectorAll('.leaflet-container').forEach(container => {
                container.remove();
            });

            // Initialize new wizard
            this.listingWizard = new ListingWizard('addListingContainer', {
                onSubmit: async (formData) => {
                    try {
                        await listingService.createListing(formData);
                        toastService.success('Listing created successfully');
                        this.loadSection('listings');
                    } catch (error) {
                        console.error('Error creating listing:', error);
                        toastService.error('Failed to create listing');
                    }
                },
                onCancel: () => {
                    this.loadSection('listings');
                }
            });

        } catch (error) {
            console.error('Error loading add listing component:', error);
            toastService.error('Failed to load add listing form');
        }
    }

    async loadUserListings() {
        try {
            const container = document.getElementById('listingsContainer');
            if (!container) return;

            const listings = await listingService.getUserListings();
            
            if (!listings || listings.length === 0) {
                container.innerHTML = this.getEmptyListingsTemplate();
                return;
            }

            container.innerHTML = this.getListingsTemplate(listings);

        } catch (error) {
            console.error('Error loading user listings:', error);
            toastService.error('Failed to load your listings');
        }
    }

    getEmptyListingsTemplate() {
        return `
            <div class="vr-empty-state">
                <i class="fas fa-list"></i>
                <h3>No Listings Yet</h3>
                <p>Create your first listing to start growing your business</p>
                <button class="vr-btn vr-btn--primary" onclick="profilePage.loadSection('addListing')">
                    <i class="fas fa-plus"></i>
                    Create Listing
                </button>
            </div>
        `;
    }

    getListingsTemplate(listings) {
        return `
            <div class="vr-listings-header">
                <h2>My Listings</h2>
                <button class="vr-btn vr-btn--primary" onclick="profilePage.loadSection('addListing')">
                    <i class="fas fa-plus"></i>
                    Add New Listing
                </button>
            </div>
            <div class="vr-listings-grid">
                ${listings.map(listing => this.getListingCardTemplate(listing)).join('')}
            </div>
        `;
    }

    getListingCardTemplate(listing) {
        return `
            <div class="vr-listing-card">
                <div class="vr-listing-card__image">
                    <img src="${listing.images[0] || '/images/defaults/listing-placeholder.jpg'}" 
                         alt="${listing.title}">
                </div>
                <div class="vr-listing-card__content">
                    <h3>${listing.title}</h3>
                    <p>${listing.description.substring(0, 100)}...</p>
                </div>
                <div class="vr-listing-card__actions">
                    <button class="vr-btn vr-btn--primary" onclick="profilePage.editListing('${listing.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="vr-btn vr-btn--danger" onclick="profilePage.deleteListing('${listing.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
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
            toastService.success('Profile picture updated successfully');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toastService.error('Failed to upload profile picture');
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
            
            toastService.success('Profile updated successfully');
            await this.loadUserProfile(); // Refresh profile data
        } catch (error) {
            console.error('Error updating profile:', error);
            toastService.error('Failed to update profile');
        }
    }

    handleLogout() {
        authService.logout();
    }

    getUserId() {
        return authService.getUserId();
    }

    getToken() {
        return authService.getToken();
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

    handleListingSubmit = async (data) => {
        try {
            // Show loading state
            toastService.info('Submitting your listing...');

            // Validate required fields
            if (!this.validateListingData(data)) {
                throw new Error('Please fill in all required fields');
            }

            // Upload images first
            const imageUrls = await this.uploadListingImages(data);
            
            // Prepare listing data
            const listingData = {
                ...data,
                ...imageUrls,
                userId: this.getUserId()
            };

            // Create listing
            const listing = await listingService.createListing(listingData);
            
            // Show success message
            toastService.success('Listing created successfully');
            
            // Navigate to listings section
            this.loadSection('listings');
            
            // Refresh listings grid
            await this.loadUserListings();

        } catch (error) {
            console.error('Error creating listing:', error);
            toastService.error(error.message || 'Failed to create listing');
        }
    }

    validateListingData(data) {
        const required = ['businessName', 'category', 'description', 'phone', 'email'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            toastService.error(`Missing required fields: ${missing.join(', ')}`);
            return false;
        }

        if (data.description.length < 100) {
            toastService.error('Description must be at least 100 characters');
            return false;
        }

        return true;
    }

    async uploadListingImages(data) {
        const imageUrls = {
            mainImageUrl: null,
            galleryUrls: []
        };

        try {
            // Upload main image
            if (data.mainImage) {
                const mainImageUrl = await this.uploadImage(data.mainImage);
                imageUrls.mainImageUrl = mainImageUrl;
            }

            // Upload gallery images
            if (data.galleryImages && data.galleryImages.length > 0) {
                const uploadPromises = data.galleryImages.map(file => this.uploadImage(file));
                imageUrls.galleryUrls = await Promise.all(uploadPromises);
            }

        } catch (error) {
            console.error('Error uploading images:', error);
            throw new Error('Failed to upload images');
        }

        return imageUrls;
    }

    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.API_BASE_URL}/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            return data.url;

        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }
}

// Initialize the profile page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
        new ProfilePage();
});