class ProfilePage {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        // await this.loadUserListings(); // Commenting out the listings fetch
        this.attachEventListeners();
    }

    async loadUserProfile() {
        try {
            const userId = this.getUserId();
            console.log('Fetching profile for user ID:', userId);
            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`);

            if (!response.ok) throw new Error('Failed to load user profile');

            const data = await response.json();
            console.log('Profile data received:', data);
            this.updateProfileUI(data);
        } catch (error) {
            console.error('Error loading user profile:', error);
            window.toastService.error('Failed to load profile');
        }
    }

    updateProfileUI(data) {
        const userData = data[0].userId;
        const profileNameElement = document.getElementById('profileDisplayName');
        const profileNameInBreadcrumb = document.querySelector('main h2 span#profileName');
        const profileUserName = document.getElementById('Name');
        const profileEmailElement = document.getElementById('Email');
        const profileLocationElement = document.getElementById('profileLocation');
        const profileAddressElement = document.getElementById('Address');
        const profileCityElement = document.getElementById('City');
        const profileStateElement = document.getElementById('State');
        const profileAvatarElement = document.getElementById('profileAvatar');
        const profilePhoneElement = document.getElementById('phoneNumber');
     
        if (profileNameElement) {
            profileNameElement.textContent = userData.username;
        }
        if (profileNameInBreadcrumb) {
            profileNameInBreadcrumb.innerHTML = userData.username;
        }
        if (profileUserName) {
            profileUserName.value = userData.username || ''; // إضافة || '' كاحتياطي  
        }

        if (profilePhoneElement) {
            profilePhoneElement.value = data[0].phoneNumber|| 'error loading phone number';
        }

        if (profileEmailElement) {
            profileEmailElement.value = userData.email || ''; // إضافة || '' كاحتياطي  
        }

        if (profileLocationElement) {
            // دمج المدينة والدولة لعرض الموقع بشكل كامل  
            profileLocationElement.textContent = (data[0].city ? data[0].city + ', ' : '') + (data[0].state || 'Location not specified');
        }

        if (profileAddressElement) {
            profileAddressElement.value = data[0].address || '';
        }

        if (profileCityElement) {
            profileCityElement.value = data[0].city || '';
        }

        if (profileStateElement) {
            profileStateElement.value = data[0].state || '';
        }

        if (profileAvatarElement) {
            profileAvatarElement.src = data[0].profilePic?.length > 0 ? data[0].profilePic[0] : '/images/defaults/default-avatar.png';
        }
    }
    async loadUserListings() {
        try {
            const userId = this.getUserId();
            console.log('Fetching listings for user ID:', userId);
            const response = await fetch(`${this.API_BASE_URL}/listing/user`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });
            if (!response.ok) throw new Error('Failed to load user listings');
            const listings = await response.json();
            console.log('User listings received:', listings);
            this.displayUserListings(listings);
        } catch (error) {
            console.error('Error loading user listings:', error);
            window.toastService.error('Failed to load listings');
        }
    }

    displayUserListings(listings) {
        const listingsGrid = document.getElementById('userListings');
        listingsGrid.innerHTML = listings.map(listing => `
            <div class='vr-listing-card'>
                <h3>${listing.listingName}</h3>
                <p>${listing.location}</p>
                <button class='vr-btn vr-btn--outline' onclick='editListing(${listing._id})'>Edit</button>
                <button class='vr-btn vr-btn--danger' onclick='deleteListing(${listing._id})'>Delete</button>
            </div>
        `).join('');
    }

    async handleEditProfile(event) {
        event.preventDefault();
        const userId = this.getUserId();
        const username = document.getElementById('Name').value;
        const email = document.getElementById('Email').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const address = document.getElementById('Address').value;
        const city = document.getElementById('City').value;
        const state = document.getElementById('State').value;

        try {
            const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    address: address,
                    city: city,
                    state: state
                })
            });

            if (!response.ok) throw new Error('Failed to update profile');
            window.toastService.success('Profile updated successfully');
            await this.loadUserProfile(); // Reload the profile to reflect changes
        } catch (error) {
            console.error('Error updating profile:', error);
            window.toastService.error('Failed to update profile');
        }
    }

    attachEventListeners() {
        const form = document.getElementById('editProfileForm');
        form.addEventListener('submit', (event) => this.handleEditProfile(event));
    }

    getUserId() {
        // Logic to retrieve user ID from local storage or token
        return JSON.parse(localStorage.getItem('vr_user')).id;
    }

    getToken() {
        return localStorage.getItem('vr_token');
    }
}

// Initialize the profile page
const profilePage = new ProfilePage(); 