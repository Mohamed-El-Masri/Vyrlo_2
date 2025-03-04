class HomePage {
    constructor() {
        // API Configuration
        this.API_BASE_URL = 'https://virlo.vercel.app';
        
        this.categoryPage = 1;
        this.listingPage = 1;
        this.isLoadingCategories = false;
        this.isLoadingListings = false;
        this.searchTimeout = null;
        this.loadedListings = new Set(); // Track loaded listing IDs
        this.previousListingsCount = 0; // Track previous listings count
        this.noMoreListings = false; // Flag to indicate no more listings

        // Use the global toastService instance
        this.toastService = window.toastService;
        
        this.init();
    }

    init() {
        this.setupVariables();
        this.setupScrollReveal();
        this.loadInitialContent();
        this.attachEventListeners();
        this.initializeSearch();
    }

    setupVariables() {
        this.categoriesGrid = document.querySelector('.vr-categories__grid');
        this.featuredGrid = document.querySelector('.vr-featured__grid');
        this.loadMoreCategoriesBtn = document.getElementById('loadMoreCategories');
        this.loadMoreListingsBtn = document.getElementById('loadMoreListings');
        this.searchForm = document.getElementById('searchForm');
        this.searchInput = document.getElementById('searchInput');
        this.locationInput = document.getElementById('locationInput');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.locationSuggestions = document.getElementById('locationSuggestions');
    }

    setupScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add specific animation based on data attribute
                    const animationType = entry.target.dataset.scrollReveal || 'fade-up';
                    entry.target.classList.add('active');
                    entry.target.style.transform = 'none';
                    
                    // Add animation to children if it's the How It Works section
                    if (entry.target.classList.contains('vr-how-it-works')) {
                        const items = entry.target.querySelectorAll('.vr-how-it-works__item');
                        items.forEach((item, index) => {
                            setTimeout(() => {
                                item.classList.add('active');
                            }, index * 200);
                        });
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Observe all elements with data-scroll-reveal
        document.querySelectorAll('[data-scroll-reveal]').forEach(el => {
            // Set initial transform based on animation type
            const animationType = el.dataset.scrollReveal || 'fade-up';
            switch (animationType) {
                case 'fade-up':
                    el.style.transform = 'translateY(30px)';
                    break;
                case 'fade-down':
                    el.style.transform = 'translateY(-30px)';
                    break;
                case 'fade-left':
                    el.style.transform = 'translateX(-30px)';
                    break;
                case 'fade-right':
                    el.style.transform = 'translateX(30px)';
                    break;
                case 'scale':
                    el.style.transform = 'scale(0.9)';
                    break;
            }
            observer.observe(el);
        });

        // Special handling for How It Works section
        const howItWorksSection = document.querySelector('.vr-how-it-works');
        if (howItWorksSection) {
            observer.observe(howItWorksSection);
        }
    }

    attachEventListeners() {
        // Load More Buttons
        this.loadMoreCategoriesBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.loadCategories();
        });

        this.loadMoreListingsBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.loadListings();
        });

        // Search Form
        this.searchForm?.addEventListener('submit', (e) => this.handleSearch(e));

        // Category Click Events
        this.categoriesGrid?.addEventListener('click', (e) => this.handleCategoryClick(e));

        // Listing Click Events
        this.featuredGrid?.addEventListener('click', (e) => {
            const card = e.target.closest('.vr-featured__card');
            if (card) {
                const listingId = card.dataset.listingId;
                if (listingId) {
                    window.location.href = `/pages/listing-details.html?id=${listingId}`;
                }
            }
        });
    }

    async loadInitialContent() {
        await Promise.all([
            this.loadCategories(),
            this.loadListings()
        ]);
    }

    async loadCategories() {
        if (this.isLoadingCategories) return;
        
        this.isLoadingCategories = true;
        this.setLoadingState(this.loadMoreCategoriesBtn, true);

        // Create loader
        const loader = this.showLoader(this.categoriesGrid);

        try {
            const response = await fetch('https://virlo.vercel.app/categories');
            const categories = await response.json();
            
            // Filter out test categories
            const filteredCategories = categories.filter(cat => !cat.categoryName.toLowerCase().includes('test'));
            
            // Get the next batch of categories
            const startIndex = (this.categoryPage - 1) * 4;
            const endIndex = startIndex + 4;
            const currentBatch = filteredCategories.slice(startIndex, endIndex);
            
            // Remove loader before rendering new content
            loader.remove();
            
            this.renderCategories(currentBatch, this.categoryPage > 1);
            this.categoryPage++;
            
            // Hide "Load More" if no more categories
            if (endIndex >= filteredCategories.length) {
                this.loadMoreCategoriesBtn.style.display = 'none';
            } else {
                this.loadMoreCategoriesBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showEmptyState(this.categoriesGrid, 'Failed to load categories');
        } finally {
            this.isLoadingCategories = false;
            this.setLoadingState(this.loadMoreCategoriesBtn, false);
        }
    }

    async loadListings() {
        if (this.isLoadingListings || this.noMoreListings) return;
        
        this.isLoadingListings = true;
        this.setLoadingState(this.loadMoreListingsBtn, true);

        // Create loader
        const loader = this.showLoader(this.featuredGrid);

        try {
            const response = await fetch(`${this.API_BASE_URL}/listing/?lastValue=${this.listingPage}`);
            const { listings } = await response.json();
            
            // Remove loader before rendering new content
            loader.remove();
            
            if (listings && listings.length > 0) {
                // Filter active OR posted listings (changed from active only)
                const filteredListings = listings.filter(listing => 
                    listing.isActive === true || listing.isPosted === true
                );
                const newListings = filteredListings.filter(listing => 
                    !this.loadedListings.has(listing._id)
                );
                
                // Check if we're getting the same number of listings multiple times
                if (filteredListings.length === this.previousListingsCount && filteredListings.length > 0) {
                    this.noMoreListings = true;
                    this.loadMoreListingsBtn.style.display = 'none';
                    return;
                }
                
                if (newListings.length > 0) {
                    // Add new listing IDs to our Set
                    newListings.forEach(listing => this.loadedListings.add(listing._id));
                    
                    // Render the new listings
                    this.renderListings(newListings, this.listingPage > 1);
                    this.listingPage++;
                    
                    // Update previous listings count with filtered listings count
                    this.previousListingsCount = filteredListings.length;
                    
                    // Show the load more button
                    this.loadMoreListingsBtn.style.display = 'block';
                } else {
                    // If no new active listings after filtering
                    if (this.listingPage === 1) {
                        this.showEmptyState(this.featuredGrid, 'No active or posted listings available');
                    }
                    this.noMoreListings = true;
                    this.loadMoreListingsBtn.style.display = 'none';
                }
            } else {
                // If no listings returned
                this.noMoreListings = true;
                this.loadMoreListingsBtn.style.display = 'none';
                if (this.listingPage === 1) {
                    this.showEmptyState(this.featuredGrid, 'No listings available');
                }
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            this.showEmptyState(this.featuredGrid, 'Failed to load listings');
        } finally {
            this.isLoadingListings = false;
            this.setLoadingState(this.loadMoreListingsBtn, false);
        }
    }

    resetListings() {
        this.listingPage = 1;
        this.loadedListings.clear();
        this.previousListingsCount = 0;
        this.noMoreListings = false;
        this.featuredGrid.innerHTML = '';
    }

    renderCategories(categories, append = false) {
        const html = categories.map((category, index) => `
            <a href="/pages/listings.html?categoryId=${category._id}" 
               class="vr-categories__item"
               data-category-id="${category._id}"
               data-scroll-reveal
               style="animation-delay: ${index * 0.1}s">
                <div class="vr-categories__icon-wrapper">
                    <img src="${category.iconOne || '/images/defaults/default-category.png'}" 
                         alt="${category.categoryName}" 
                         class="vr-categories__icon"
                         loading="lazy"
                         onerror="this.src='/images/defaults/default-category.png'">
                </div>
                <div class="vr-categories__content">
                    <h3 class="vr-categories__name">${category.categoryName}</h3>
                </div>
            </a>
        `).join('');

        if (append) {
            this.categoriesGrid.insertAdjacentHTML('beforeend', html);
        } else {
            this.categoriesGrid.innerHTML = html;
        }

        this.initializeNewElements();
    }

    renderListings(listings, append = false) {
        const html = listings.map((listing, index) => `
            <article class="vr-featured__card" 
                     data-listing-id="${listing._id}"
                     data-scroll-reveal
                     style="animation-delay: ${index * 0.1}s">
                <div class="vr-featured__image-wrapper">
                    <img src="${listing.mainImage || '/images/defaults/default-listing.jpg'}" 
                         alt="${listing.listingName}"
                         class="vr-featured__image"
                         loading="lazy"
                         onerror="this.src='/images/defaults/default-listing.jpg'">
                    ${listing.isPosted ? '<span class="vr-featured__badge">Featured</span>' : ''}
                    ${this.renderOpenStatus(listing.openingTimes)}
                </div>
                <div class="vr-featured__content">
                    <h3 class="vr-featured__title">${listing.listingName}</h3>
                    <div class="vr-featured__meta">
                        ${listing.location ? `
                            <span class="vr-featured__location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${listing.location}
                            </span>
                        ` : ''}
                        ${listing.categoryId?.categoryName ? `
                            <span class="vr-featured__category">
                                <i class="fas fa-tag"></i>
                                ${listing.categoryId.categoryName}
                            </span>
                        ` : ''}
                    </div>
                    <div class="vr-featured__stats">
                        ${listing.mobile ? `
                            <span class="vr-featured__stat">
                                <i class="fas fa-phone"></i>
                                ${listing.mobile}
                            </span>
                        ` : ''}
                        ${listing.email ? `
                            <span class="vr-featured__stat">
                                <i class="fas fa-envelope"></i>
                                ${listing.email}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </article>
        `).join('');

        if (append) {
            this.featuredGrid.insertAdjacentHTML('beforeend', html);
        } else {
            this.featuredGrid.innerHTML = html;
        }

        this.initializeNewElements();
    }

    renderOpenStatus(openingTimes) {
        if (!openingTimes) return '';

        const today = new Date().toLocaleString('en-us', {weekday: 'long'});
        const status = openingTimes[today];

        if (!status) return '';

        const isOpen = status.status === 'open';
        return `
            <span class="vr-featured__status ${isOpen ? 'vr-featured__status--open' : 'vr-featured__status--closed'}">
                <i class="fas fa-clock"></i>
                ${isOpen ? `Open: ${status.from} - ${status.to}` : 'Closed'}
            </span>
        `;
    }

    showLoader(container) {
        const loader = document.createElement('div');
        loader.className = 'vr-loader';
        loader.innerHTML = `
                <div class="vr-spinner"></div>
            <p class="vr-loader__text">Loading...</p>
        `;
        
        // If container is empty, replace content
        if (!container.children.length) {
            container.appendChild(loader);
        } else {
            // If container has content, append loader after content
            container.insertAdjacentElement('beforeend', loader);
        }
        return loader;
    }

    showEmptyState(container, message) {
        container.innerHTML = `
            <div class="vr-empty-state">
                <i class="fas fa-inbox"></i>
                <p>${message}</p>
            </div>
        `;
    }

    setLoadingState(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('vr-btn--loading');
            button.disabled = true;
            // Store original text
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span>Loading...</span>';
        } else {
            button.classList.remove('vr-btn--loading');
            button.disabled = false;
            // Restore original text
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        }
    }

    initializeNewElements() {
        document.querySelectorAll('[data-scroll-reveal]:not(.active)').forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('active');
        });
    }

    initializeSearch() {
        // Search input event listeners
        this.searchInput?.addEventListener('input', (e) => this.handleSearchInput(e));
        this.locationInput?.addEventListener('input', (e) => this.handleLocationInput(e));
        
        // Submit form event
        this.searchForm?.addEventListener('submit', (e) => this.handleSearch(e));
        
        // Close suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.vr-search-form__input-wrapper')) {
                this.searchSuggestions.classList.remove('active');
                this.locationSuggestions.classList.remove('active');
            }
        });

        // Load popular categories dynamically
        this.loadPopularCategories();

        // Check URL parameters and fill search inputs if coming from listings page
        const params = new URLSearchParams(window.location.search);
        if (params.has('name')) {
            this.searchInput.value = params.get('name');
        }
        if (params.has('location')) {
            this.locationInput.value = params.get('location');
        }
    }

    async handleSearchInput(e) {
        const value = e.target.value.trim().toLowerCase();
        
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (value.length < 2) {
            this.searchSuggestions.classList.remove('active');
            return;
        }

        // Show loading indicator immediately
        this.searchSuggestions.innerHTML = '<div class="vr-search-form__loading">Loading suggestions...</div>';
        this.searchSuggestions.classList.add('active');

        this.searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/listing/active/?name=${value}`);
                const data = await response.json();
                
                if (!data.listings || data.listings.length === 0) {
                    this.searchSuggestions.innerHTML = '<div class="vr-search-form__no-results">No results found</div>';
                    return;
                }

                this.renderSearchSuggestions(data.listings);
            } catch (error) {
                console.error('Error fetching search suggestions:', error);
                this.searchSuggestions.innerHTML = '<div class="vr-search-form__error">Error loading suggestions</div>';
            }
        }, 300);
    }

    async handleSearch(e) {
        e.preventDefault();
        // Implement search functionality
    }

    async handleLocationInput(e) {
        // Implement location input functionality
    }

    async handleCategoryClick(e) {
        // Implement category click functionality
    }

    async handleListingClick(e) {
        // Implement listing click functionality
    }

    async loadPopularCategories() {
        // Implement loading popular categories functionality
    }

    async renderSearchSuggestions(listings) {
        // Implement rendering search suggestions functionality
    }

    handleSave(listingId) {
        this.toastService.info('Save feature coming soon');
    }

    handleShare(listing) {
        if (navigator.share) {
            navigator.share({
                title: listing.listingName,
                text: listing.description,
                url: window.location.href
            });
        } else {
            this.toastService.info('Share feature coming soon');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.homePage = new HomePage();
});