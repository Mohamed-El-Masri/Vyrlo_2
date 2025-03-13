class ListingDetailsPage {
    constructor() {
        this.API_BASE_URL = 'https://www.vyrlo.com:8080';
        this.listing = null;
        this.reviews = [];
        this.reviewsPage = 1;
        this.hasMoreReviews = true;
        this.map = null;
        this.marker = null;
        
        this.init();
    }

    async init() {
        try {
            await this.setupElements();
            await this.loadListing();
            this.initializeSliders();
            this.attachEventListeners();
            await this.loadReviews();
            await this.loadSimilarListings();
        } catch (error) {
            console.error('Error initializing page:', error);
            window.toastService.error('Failed to load listing details');
        }
    }

    async setupElements() {
        // Gallery elements
        this.galleryWrapper = document.getElementById('galleryWrapper');
        
        // Info elements
        this.listingName = document.getElementById('listingName');
        this.listingLocation = document.getElementById('listingLocation');
        this.listingCategory = document.getElementById('listingCategory');
        this.listingDescription = document.getElementById('listingDescription');
        this.listingAmenities = document.getElementById('listingAmenities');
        this.listingHours = document.getElementById('listingHours');
        this.sidebarHours = document.getElementById('sidebarHours');
        this.currentStatus = document.getElementById('currentStatus');
        
        // Contact elements
        this.listingPhone = document.getElementById('listingPhone');
        this.listingEmail = document.getElementById('listingEmail');
        this.listingWebsite = document.getElementById('listingWebsite');
        
        // Map element
        this.listingMap = document.getElementById('listingMap');
        
        // Reviews elements
        this.reviewsList = document.getElementById('reviewsList');
        this.loadMoreReviews = document.getElementById('loadMoreReviews');
        
        // Similar listings
        this.similarListings = document.getElementById('similarListings');
        
        // Action buttons
        this.shareListing = document.getElementById('shareListing');
        this.saveListing = document.getElementById('saveListing');
        this.writeReview = document.getElementById('writeReview');
        this.getDirections = document.getElementById('getDirections');
    }

    async loadListing() {
        try {
            const listingId = this.getListingIdFromUrl();
            if (!listingId) {
                throw new Error('Listing ID not found in URL');
            }

            const response = await fetch(`${this.API_BASE_URL}/listing/${listingId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.message === "Listing is not found") {
                throw new Error('Listing not found');
            }

            this.listing = data;
            this.updateUI();
            this.initMap();
        } catch (error) {
            console.error('Error loading listing:', error);
            window.toastService.error(error.message || 'Failed to load listing details');
            
            // Show error state in UI
            this.showErrorState();
        }
    }

    showErrorState() {
        const container = document.querySelector('.vr-listing-info__main');
        if (container) {
            container.innerHTML = `
                <div class="vr-empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load listing details</p>
                    <a href="/pages/listings.html" class="vr-btn vr-btn--primary">
                        Back to Listings
                    </a>
                </div>
            `;
        }
    }

    getListingIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    updateUI() {
        if (!this.listing) return;

        // Update basic info
        if (this.listingName) this.listingName.textContent = this.listing.listingName;
        if (this.listingLocation) this.listingLocation.textContent = this.listing.location;
        if (this.listingCategory) this.listingCategory.textContent = this.listing.categoryId?.categoryName || 'Uncategorized';
        if (this.listingDescription) this.listingDescription.textContent = this.listing.description;
        
        // Update gallery
        this.updateGallery();
        
        // Update amenities
        this.updateAmenities();
        
        // Update contact info
        this.updateContactInfo();
        
        // Update business hours
        this.updateBusinessHours();
        
        // Update page title
        document.title = `${this.listing.listingName} - Vyrlo`;
    }

    updateGallery() {
        const images = this.listing.gallery?.length ? 
            this.listing.gallery : [this.listing.mainImage || '/images/defaults/default-listing.jpg'];
        
        const slides = images.map(image => `
            <div class="swiper-slide">
                <img src="${image}" alt="${this.listing.listingName}" 
                     onerror="this.src='/images/defaults/default-listing.jpg'">
            </div>
        `).join('');
        
        this.galleryWrapper.innerHTML = slides;
        
        // Reinitialize the gallery Swiper
        if (this.gallery) {
            this.gallery.destroy();
        }
        
        this.gallery = new Swiper('.vr-listing-gallery .swiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            }
        });
    }

    updateAmenities() {
        if (!this.listing.amenitielsList?.length) {
            this.listingAmenities.innerHTML = '<p>No amenities listed</p>';
            return;
        }

        const amenities = this.listing.amenitielsList.map(amenity => `
            <div class="vr-listing-amenity">
                <i class="fas fa-check-circle"></i>
                <span>${amenity}</span>
            </div>
        `).join('');

        this.listingAmenities.innerHTML = amenities;
    }

    updateBusinessHours() {
        if (!this.sidebarHours) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const today = new Date().toLocaleString('en-us', { weekday: 'long' });
        const currentStatus = this.getOpenStatus();

        const hoursHtml = days.map(day => {
            const daySchedule = this.listing.openingTimes?.[day];
            const isToday = day === today;
            
            return `
                <div class="vr-listing-hours__day ${isToday ? 'today' : ''} 
                            ${daySchedule?.status === 'close' ? 'closed' : ''}">
                    <span>${day}</span>
                    <span>
                        ${daySchedule?.status === 'open' 
                            ? `${daySchedule.from} - ${daySchedule.to}`
                            : 'Closed'}
                    </span>
                </div>
            `;
        }).join('');

        this.sidebarHours.innerHTML = hoursHtml;
        
        // Update status badge
        if (this.currentStatus) {
            this.currentStatus.className = `vr-listing-status vr-listing-status--${currentStatus.isOpen ? 'open' : 'closed'}`;
            this.currentStatus.textContent = currentStatus.isOpen ? 'Open Now' : 'Closed';
        }
    }

    getOpenStatus() {
        const now = new Date();
        const today = now.toLocaleString('en-us', { weekday: 'long' });
        const currentTime = now.toLocaleString('en-US', { 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: false 
        });

        const todaySchedule = this.listing.openingTimes?.[today];
        if (!todaySchedule || todaySchedule.status === 'close') {
            return { isOpen: false };
        }

        const isOpen = this.isTimeBetween(currentTime, todaySchedule.from, todaySchedule.to);
        return { isOpen };
    }

    isTimeBetween(current, from, to) {
        const [currentHour, currentMinute] = current.split(':').map(Number);
        const [fromHour, fromMinute] = from.split(':').map(Number);
        const [toHour, toMinute] = to.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;
        const fromMinutes = fromHour * 60 + fromMinute;
        const toMinutes = toHour * 60 + toMinute;

        return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    }

    updateContactInfo() {
        if (this.listing.mobile) {
            this.listingPhone.href = `tel:${this.listing.mobile}`;
            this.listingPhone.textContent = this.listing.mobile;
        }

        if (this.listing.email) {
            this.listingEmail.href = `mailto:${this.listing.email}`;
            this.listingEmail.textContent = this.listing.email;
        }

        if (this.listing.website) {
            this.listingWebsite.href = this.listing.website;
            this.listingWebsite.textContent = new URL(this.listing.website).hostname;
        }
    }

    initMap() {
        if (!this.listing?.latitude || !this.listing?.longitude) return;
        
        try {
            if (!this.map && this.listingMap) {
                this.map = L.map(this.listingMap).setView([
                    parseFloat(this.listing.latitude),
                    parseFloat(this.listing.longitude)
                ], 15);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.map);
                
                this.marker = L.marker([
                    parseFloat(this.listing.latitude),
                    parseFloat(this.listing.longitude)
                ]).addTo(this.map);
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    async loadReviews() {
        try {
            // Implement reviews loading
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    async loadSimilarListings() {
        try {
            if (!this.listing?.categoryId?._id) return;
            
            const response = await fetch(`${this.API_BASE_URL}/listing/active?categoryId=${this.listing.categoryId._id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch similar listings');
            
            const data = await response.json();
            const similarListings = data.listings
                .filter(listing => listing._id !== this.listing._id)
                .slice(0, 3);

            this.renderSimilarListings(similarListings);
        } catch (error) {
            console.error('Error loading similar listings:', error);
            // Don't show error toast for similar listings as it's not critical
        }
    }

    renderSimilarListings(listings) {
        if (!listings?.length) {
            this.similarListings.innerHTML = `
                <div class="swiper-slide">
                    <div class="vr-empty-state">
                        <i class="fas fa-store"></i>
                        <p>No similar listings found</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = listings.map(listing => `
            <div class="swiper-slide" data-listing-id="${listing._id}">
                <article class="vr-similar-card">
                    <div class="vr-similar-card__image">
                        <img src="${listing.mainImage || '/images/defaults/default-listing.jpg'}" 
                             alt="${listing.listingName}"
                             loading="lazy"
                             onerror="this.src='/images/defaults/default-listing.jpg'">
                        ${listing.isPosted ? '<span class="vr-similar-card__badge">Featured</span>' : ''}
                        ${this.renderSimilarCardStatus(listing.openingTimes)}
                    </div>
                    <div class="vr-similar-card__content">
                        <h3 class="vr-similar-card__title">${listing.listingName}</h3>
                        <div class="vr-similar-card__meta">
                            ${listing.location ? `
                                <span class="vr-similar-card__meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${listing.location}
                                </span>
                            ` : ''}
                            ${listing.categoryId?.categoryName ? `
                                <span class="vr-similar-card__meta-item">
                                    <i class="fas fa-tag"></i>
                                    ${listing.categoryId.categoryName}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </article>
            </div>
        `).join('');

        this.similarListings.innerHTML = html;
        this.similarSlider.update();
    }

    renderSimilarCardStatus(openingTimes) {
        if (!openingTimes) return '';

        const today = new Date().toLocaleString('en-us', {weekday: 'long'});
        const status = openingTimes[today];

        if (!status) return '';

        const isOpen = status.status === 'open';
        return `
            <span class="vr-similar-card__status ${isOpen ? 'vr-similar-card__status--open' : 'vr-similar-card__status--closed'}">
                <i class="fas fa-clock"></i>
                ${isOpen ? 'Open' : 'Closed'}
            </span>
        `;
    }

    attachEventListeners() {
        // Share button
        this.shareListing?.addEventListener('click', () => this.handleShare());
        
        // Save button
        this.saveListing?.addEventListener('click', () => this.handleSave());
        
        // Write review button
        this.writeReview?.addEventListener('click', () => this.handleWriteReview());
        
        // Get directions button
        this.getDirections?.addEventListener('click', () => this.handleGetDirections());
        
        // Load more reviews button
        this.loadMoreReviews?.addEventListener('click', () => this.loadMoreReviews());
        
        // Similar listings click
        this.similarListings?.addEventListener('click', (e) => {
            const slide = e.target.closest('.swiper-slide');
            if (slide) {
                const listingId = slide.dataset.listingId;
                if (listingId) {
                    window.location.href = `/pages/listing-details.html?id=${listingId}`;
                }
            }
        });
    }

    handleShare() {
        if (navigator.share) {
            navigator.share({
                title: this.listing.listingName,
                text: this.listing.description,
                url: window.location.href
            });
        } else {
            window.toastService.info('Share feature coming soon');
        }
    }

    handleSave() {
        window.toastService.info('Save feature coming soon');
    }

    handleWriteReview() {
        window.toastService.info('Review feature coming soon');
    }

    handleGetDirections() {
        if (!this.listing.latitude || !this.listing.longitude) return;
        
        const url = `https://www.google.com/maps/dir/?api=1&destination=${this.listing.latitude},${this.listing.longitude}`;
        window.open(url, '_blank');
    }

    // Add static method for card click handling
    static handleCardClick(event) {
        const card = event.target.closest('.vr-featured__card');
        if (card) {
            const listingId = card.dataset.listingId;
            if (listingId) {
                window.location.href = `/listing/${listingId}`;
            }
        }
    }

    initializeSliders() {
        // Initialize main gallery Swiper
        this.gallery = new Swiper('.vr-listing-gallery .swiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            }
        });

        // Initialize similar listings Swiper
        this.similarSlider = new Swiper('.similar-listings-slider', {
            slidesPerView: 1,
            spaceBetween: 20,
            navigation: {
                nextEl: '.similar-next',
                prevEl: '.similar-prev'
            },
            breakpoints: {
                640: {
                    slidesPerView: 2
                },
                1024: {
                    slidesPerView: 3
                }
            }
        });
    }
}

// Initialize the page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.listingDetailsPage = new ListingDetailsPage();
}); 