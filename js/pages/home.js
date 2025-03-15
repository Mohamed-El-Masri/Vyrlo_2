import { Utils } from '../core/utils.js';
import { toastService } from '../services/toast.service.js';

class HomePage {
    constructor() {
        // API Configuration
        this.API_BASE_URL = 'https://www.vyrlo.com:8080';
        
        // Search Configuration
        this.minSearchLength = 2;
        this.searchDebounceTime = 300;
        this.maxSuggestions = {
            listings: 4,
            categories: 3,
            locations: 5
        };
        this.selectedIndex = -1;
        this.currentSuggestions = [];
        
        this.categoryPage = 1;
        this.listingPage = 1;
        this.isLoadingCategories = false;
        this.isLoadingListings = false;
        this.loadedListings = new Set(); // Track loaded listing IDs
        this.previousListingsCount = 0; // Track previous listings count
        this.noMoreListings = false; // Flag to indicate no more listings

        // Use the global toastService instance
        this.toastService = window.toastService;
        
        // Categories Slider Configuration
        this.categoriesConfig = {
            scrollStep: 200,
            scrollBehavior: 'smooth',
            autoplayDelay: 5000,
            autoplayEnabled: true
        };
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupScrollReveal();
        this.loadInitialContent();
        this.setupEventListeners();
        this.initializeCategoriesSlider();
    }

    setupElements() {
        // Search Elements
        this.searchForm = document.getElementById('searchForm');
        this.searchInput = document.getElementById('searchInput');
        this.locationInput = document.getElementById('locationInput');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.locationSuggestions = document.getElementById('locationSuggestions');
        
        // Other page elements
        this.categoriesTrack = document.querySelector('.vr-categories__track');
        this.featuredGrid = document.querySelector('.vr-featured__grid');
        this.loadMoreListingsBtn = document.getElementById('loadMoreListings');
        
        // Categories Slider Elements
        this.prevButton = document.querySelector('.vr-categories__nav--prev');
        this.nextButton = document.querySelector('.vr-categories__nav--next');
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

    setupEventListeners() {
        // Search Form Events
        this.searchForm?.addEventListener('submit', (e) => this.handleSearch(e));
        
        // Enhanced Search Input Events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', Utils.debounce(() => this.handleSearchInput(), this.searchDebounceTime));
            this.searchInput.addEventListener('focus', () => this.showSearchSuggestions());
            this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        }
        
        // Enhanced Location Input Events
        if (this.locationInput) {
            this.locationInput.addEventListener('input', Utils.debounce(() => this.handleLocationInput(), this.searchDebounceTime));
            this.locationInput.addEventListener('focus', () => this.showLocationSuggestions());
            this.locationInput.addEventListener('keydown', (e) => this.handleLocationKeydown(e));
        }
        
        // Close suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.vr-search-form__input-wrapper') && 
                !e.target.closest('.vr-search-suggestions')) {
                this.hideSuggestions();
                this.hideLocationSuggestions();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSuggestions();
                this.hideLocationSuggestions();
            }
        });

        // Load More Listings Button
        this.loadMoreListingsBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.loadListings();
        });

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

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.hideSuggestions();
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
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
        
        try {
            this.isLoadingCategories = true;
            this.showCategoriesLoader();

            const response = await fetch(`${this.API_BASE_URL}/categories`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const categories = await response.json();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            if (this.toastService) {
                this.toastService.showError('Unable to load categories. Please try again later.');
            }
            this.showCategoriesError();
        } finally {
            this.isLoadingCategories = false;
            this.hideCategoriesLoader();
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
                // تعديل: تصفية القوائم لعرض isPosted === true فقط (الأعمال المميزة)
                const featuredListings = listings.filter(listing => 
                    listing.isPosted === true
                );
                
                const newListings = featuredListings.filter(listing => 
                    !this.loadedListings.has(listing._id)
                );
                
                // تغيير منطق التحقق من استنفاد القوائم ليعتمد على القوائم المميزة فقط
                if (featuredListings.length === this.previousListingsCount && featuredListings.length > 0) {
                    this.noMoreListings = true;
                    this.loadMoreListingsBtn.style.display = 'none';
                    return;
                }
                
                if (newListings.length > 0) {
                    // Sort by premium (isPosted) first
                    const sortedListings = [...newListings].sort((a, b) => {
                        // القوائم المميزة أولاً
                        if (a.isPosted && !b.isPosted) return -1;
                        if (!a.isPosted && b.isPosted) return 1;
                        return 0;
                    });
                    
                    // Add new listing IDs to our Set
                    sortedListings.forEach(listing => this.loadedListings.add(listing._id));
                    
                    // Render the new listings
                    this.renderListings(sortedListings, this.listingPage > 1);
                    this.listingPage++;
                    
                    // Update previous listings count with filtered listings count
                    this.previousListingsCount = featuredListings.length;
                    
                    // Show the load more button
                    this.loadMoreListingsBtn.style.display = 'block';
                } else {
                    // إذا لم يتم العثور على قوائم مميزة جديدة
                    if (this.listingPage === 1) {
                        this.showEmptyState(this.featuredGrid, 'No featured listings available');
                    }
                    this.noMoreListings = true;
                    this.loadMoreListingsBtn.style.display = 'none';
                }
            } else {
                // If no listings returned
                this.noMoreListings = true;
                this.loadMoreListingsBtn.style.display = 'none';
                if (this.listingPage === 1) {
                    this.showEmptyState(this.featuredGrid, 'No featured listings available');
                }
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            this.showEmptyState(this.featuredGrid, 'Failed to load featured listings');
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

    renderCategories(categories) {
        if (!this.categoriesTrack) return;

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

        this.categoriesTrack.innerHTML = html;
        this.initializeNewElements();
        this.updateSliderState();
    }

    renderListings(listings, append = false) {
        const html = listings.map((listing, index) => `
            <article class="vr-featured__card ${listing.isPosted ? 'vr-featured__card--premium' : ''}" 
                     data-listing-id="${listing._id}"
                     data-scroll-reveal
                     style="animation-delay: ${index * 0.1}s">
                <div class="vr-featured__image-wrapper">
                    <img src="${listing.mainImage || '/images/defaults/default-listing.jpg'}" 
                         alt="${listing.listingName}"
                         class="vr-featured__image"
                         loading="lazy"
                         onerror="this.src='/images/defaults/default-listing.jpg'">
                    ${listing.isPosted ? `
                    <div class="vr-featured__badge-premium">
                        <i class="fas fa-star"></i> Featured
                    </div>` : ''}
                    ${this.renderOpenStatus(listing.openingTimes)}
                </div>
                <div class="vr-featured__content">
                    <div class="vr-featured__rating">
                        ${this.generateRatingStars(listing.rating || 5)}
                        <span class="vr-featured__reviews-count">${listing.reviewIds?.length || 0} reviews</span>
                    </div>
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
                    <p class="vr-featured__description">
                        ${listing.description ? this.truncateText(listing.description, 100) : 'No description available'}
                    </p>
                    <div class="vr-featured__footer">
                        <div class="vr-featured__contact">
                            ${listing.mobile ? `
                                <a href="tel:${listing.mobile}" class="vr-featured__contact-item">
                                    <i class="fas fa-phone"></i>
                                    <span class="vr-sr-only">Call</span>
                                </a>
                            ` : ''}
                            ${listing.email ? `
                                <a href="mailto:${listing.email}" class="vr-featured__contact-item">
                                    <i class="fas fa-envelope"></i>
                                    <span class="vr-sr-only">Email</span>
                                </a>
                            ` : ''}
                            ${listing.website ? `
                                <a href="${listing.website}" class="vr-featured__contact-item" target="_blank" rel="noopener">
                                    <i class="fas fa-globe"></i>
                                    <span class="vr-sr-only">Website</span>
                                </a>
                            ` : ''}
                        </div>
                        <a href="/pages/listing-details.html?id=${listing._id}" class="vr-featured__view-more">
                            View Details <i class="fas fa-arrow-right"></i>
                        </a>
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

    async handleSearchInput() {
        try {
            const query = this.searchInput.value.trim();
            const location = this.locationInput.value.trim();
            
            if (!query && !location) {
                this.hideSuggestions();
                return;
            }

            if (query.length < this.minSearchLength && !location) {
                return;
            }

            const [listingsData, categories] = await Promise.all([
                this.fetchListings(query, location),
                this.fetchCategories()
            ]);

            const suggestions = [];
            
            // Add listing suggestions
            if (listingsData && listingsData.listings) {
                suggestions.push(...listingsData.listings
                    .slice(0, this.maxSuggestions.listings)
                    .map(listing => ({
                        type: 'listing',
                        id: listing._id,
                        name: listing.listingName,
                        location: listing.location,
                        category: listing.categoryId?.categoryName || 'Uncategorized',
                        isActive: listing.isActive
                    }))
                );
            }

            // Add category suggestions
            if (categories && categories.length && query) {
                const matchingCategories = categories
                    .filter(cat => cat.categoryName.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, this.maxSuggestions.categories)
                    .map(cat => ({
                        type: 'category',
                        id: cat._id,
                        name: cat.categoryName,
                        amenities: cat.amenities?.slice(0, 3) || []
                    }));
                
                if (matchingCategories.length) {
                    suggestions.push(...matchingCategories);
                }
            }

            this.currentSuggestions = suggestions;
            this.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Search error:', error);
            this.toastService.showError('Search is temporarily unavailable. Please try again later.');
            this.hideSuggestions();
        }
    }

    handleSearchKeydown(e) {
        const suggestions = this.searchSuggestions.querySelectorAll('.vr-search-suggestions__item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, suggestions.length - 1);
                this.updateSelectedSuggestion(suggestions);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelectedSuggestion(suggestions);
                break;
                
            case 'Enter':
                if (this.selectedIndex >= 0 && this.selectedIndex < suggestions.length) {
                    e.preventDefault();
                    const selectedItem = suggestions[this.selectedIndex];
                    this.handleSuggestionSelect(selectedItem);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideSearchSuggestions();
                break;
        }
    }

    updateSelectedSuggestion(suggestions) {
        suggestions.forEach((item, index) => {
            item.setAttribute('aria-selected', index === this.selectedIndex);
            if (index === this.selectedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    handleSuggestionSelect(item) {
        const type = item.dataset.type;
        const id = item.dataset.id;
        
        if (type === 'listing') {
            const listing = item.querySelector('.vr-search-suggestions__name').textContent;
            this.searchInput.value = listing;
            this.hideSearchSuggestions();
        } else if (type === 'category') {
            window.location.href = `/pages/listings.html?categoryId=${id}`;
        }
    }

    async handleLocationInput() {
        const query = this.locationInput.value.trim().toLowerCase();
        this.selectedIndex = -1;
        
        if (query.length < this.minSearchLength) {
            this.hideLocationSuggestions();
            return;
        }

        this.showLoadingSuggestions(this.locationSuggestions);
        this.locationInput.setAttribute('aria-expanded', 'true');

        try {
            const listings = await this.fetchListings({});
            const locations = this.processLocationResults(query, listings);
            this.currentSuggestions = locations;
            this.renderLocationSuggestions(locations);
        } catch (error) {
            console.error('Location search error:', error);
            this.showErrorSuggestions(this.locationSuggestions);
        }
    }

    handleLocationKeydown(e) {
        const suggestions = this.locationSuggestions.querySelectorAll('.vr-search-suggestions__item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, suggestions.length - 1);
                this.updateSelectedSuggestion(suggestions);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelectedSuggestion(suggestions);
                break;
                
            case 'Enter':
                if (this.selectedIndex >= 0 && this.selectedIndex < suggestions.length) {
                    e.preventDefault();
                    const selectedItem = suggestions[this.selectedIndex];
                    this.handleLocationSelect(selectedItem);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideLocationSuggestions();
                break;
        }
    }

    handleLocationSelect(item) {
        const location = item.dataset.location;
        this.locationInput.value = location;
        this.hideLocationSuggestions();
    }

    async handleSearch(e) {
        e.preventDefault();
        
        const searchQuery = this.searchInput.value.trim();
        const locationQuery = this.locationInput.value.trim();
        
        if (!searchQuery && !locationQuery) {
            toastService.warning('Please enter a search term or location');
            return;
        }

        // Analytics tracking
        this.trackSearch(searchQuery, locationQuery);

        // Redirect to listings page with search parameters
        const params = new URLSearchParams();
        if (searchQuery) params.set('name', searchQuery);
        if (locationQuery) params.set('location', locationQuery);
        
        window.location.href = `/pages/listings.html?${params.toString()}`;
    }

    trackSearch(searchQuery, locationQuery) {
        // Implement analytics tracking
        if (window.gtag) {
            gtag('event', 'search', {
                search_term: searchQuery,
                location: locationQuery
            });
        }
    }

    async fetchListings(query = '', location = '', categoryId = '', lastValue = 1) {
        try {
            const url = new URL(`${this.API_BASE_URL}/listing/`);
            url.searchParams.append('lastValue', lastValue);
            if (query) url.searchParams.append('name', query);
            if (location) url.searchParams.append('location', location);
            if (categoryId) url.searchParams.append('categoryId', categoryId);

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
                const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching listings:', error);
            this.toastService.showError('Unable to fetch listings. Please try again later.');
            return { listings: [], lastValue: 1, totalItems: 0 };
        }
    }

    async fetchCategories() {
        const response = await fetch(`${this.API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    }

    processSearchResults(query, nameResults, categories) {
        const results = {
            listings: [],
            categories: []
        };

        // Process listings
        if (nameResults.listings) {
            results.listings = nameResults.listings
                .filter(listing => listing.isActive || listing.isPosted)
                .filter(listing => this.matchesSearch(listing.listingName, query))
                .slice(0, 4);
        }

        // Process categories
        if (categories) {
            results.categories = categories
                .filter(category => this.matchesSearch(category.categoryName, query))
                .slice(0, 3);
        }

        return results;
    }

    processLocationResults(query, results) {
        if (!results.listings) return [];

        // Extract unique locations
        const locations = [...new Set(
            results.listings
                .filter(listing => listing.location)
                .map(listing => listing.location)
        )];

        // Filter and sort by relevance
        return locations
            .filter(location => this.matchesSearch(location.toLowerCase(), query))
            .sort((a, b) => {
                const aScore = this.getMatchScore(a.toLowerCase(), query);
                const bScore = this.getMatchScore(b.toLowerCase(), query);
                return bScore - aScore;
            })
            .slice(0, 5);
    }

    matchesSearch(text, query) {
        if (!text) return false;
        text = text.toLowerCase();
        query = query.toLowerCase();
        
        // Exact match gets highest priority
        if (text === query) return true;
        
        // Contains match gets second priority
        if (text.includes(query)) return true;
        
        // Fuzzy match gets lowest priority
        return this.getLevenshteinDistance(text, query) <= 3;
    }

    getMatchScore(text, query) {
        if (text === query) return 100;
        if (text.includes(query)) return 75;
        return 50 - this.getLevenshteinDistance(text, query);
    }

    getLevenshteinDistance(str1, str2) {
        const track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) track[0][i] = i;
        for (let j = 0; j <= str2.length; j++) track[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator
                );
            }
        }
        
        return track[str2.length][str1.length];
    }

    renderSearchSuggestions(results) {
        const { listings, categories } = results;
        
        if (listings.length === 0 && categories.length === 0) {
            this.showEmptySuggestions(this.searchSuggestions);
                    return;
                }

        let html = '';

        // Render listings section
        if (listings.length > 0) {
            html += `
                <div class="vr-search-suggestions__group">
                    <div class="vr-search-suggestions__title">
                        <i class="fas fa-store"></i>
                        <span>Listings</span>
                    </div>
                    ${listings.map(listing => `
                        <div class="vr-search-suggestions__item" data-id="${listing._id}" data-type="listing">
                            <div class="vr-search-suggestions__icon">
                                <i class="fas ${this.getCategoryIcon(listing.categoryId?.categoryName)}"></i>
                            </div>
                            <div class="vr-search-suggestions__content">
                                <div class="vr-search-suggestions__name">${listing.listingName}</div>
                                <div class="vr-search-suggestions__details">
                                    ${listing.location ? `<span><i class="fas fa-map-marker-alt"></i> ${listing.location}</span>` : ''}
                                    ${listing.categoryId ? `<span><i class="fas fa-tag"></i> ${listing.categoryId.categoryName}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Render categories section
        if (categories.length > 0) {
            html += `
                <div class="vr-search-suggestions__group">
                    <div class="vr-search-suggestions__title">
                        <i class="fas fa-th-large"></i>
                        <span>Categories</span>
                    </div>
                    ${categories.map(category => `
                        <div class="vr-search-suggestions__item" data-id="${category._id}" data-type="category">
                            <div class="vr-search-suggestions__icon">
                                <i class="fas ${this.getCategoryIcon(category.categoryName)}"></i>
                            </div>
                            <div class="vr-search-suggestions__content">
                                <div class="vr-search-suggestions__name">${category.categoryName}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');
        this.addSearchSuggestionListeners();
    }

    renderLocationSuggestions(locations) {
        if (locations.length === 0) {
            this.showEmptySuggestions(this.locationSuggestions);
            return;
        }

        const html = `
            <div class="vr-search-suggestions__group">
                <div class="vr-search-suggestions__title">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Locations</span>
                </div>
                ${locations.map(location => `
                    <div class="vr-search-suggestions__item" data-location="${location}">
                        <div class="vr-search-suggestions__icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="vr-search-suggestions__content">
                            <div class="vr-search-suggestions__name">${location}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.locationSuggestions.innerHTML = html;
        this.locationSuggestions.classList.add('active');
        this.addLocationSuggestionListeners();
    }

    addSearchSuggestionListeners() {
        this.searchSuggestions.querySelectorAll('.vr-search-suggestions__item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                
                if (type === 'listing') {
                    const listing = item.querySelector('.vr-search-suggestions__name').textContent;
                    this.searchInput.value = listing;
                    this.hideSearchSuggestions();
                } else if (type === 'category') {
                    window.location.href = `/pages/listings.html?categoryId=${id}`;
                }
            });
        });
    }

    addLocationSuggestionListeners() {
        this.locationSuggestions.querySelectorAll('.vr-search-suggestions__item').forEach(item => {
            item.addEventListener('click', () => {
                const location = item.dataset.location;
                this.locationInput.value = location;
                this.hideLocationSuggestions();
            });
        });
    }

    showLoadingSuggestions(container) {
        container.innerHTML = `
            <div class="vr-search-suggestions__loading" role="status" aria-label="Loading suggestions">
                <div class="vr-spinner"></div>
                <span>Searching...</span>
            </div>
        `;
        container.classList.add('active');
    }

    showEmptySuggestions(container) {
        container.innerHTML = `
            <div class="vr-search-suggestions__empty" role="status" aria-label="No results found">
                <i class="fas fa-search" aria-hidden="true"></i>
                <span>No results found</span>
            </div>
        `;
        container.classList.add('active');
    }

    showErrorSuggestions(container) {
        container.innerHTML = `
            <div class="vr-search-suggestions__error" role="alert">
                <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                <span>Error loading suggestions</span>
            </div>
        `;
        container.classList.add('active');
    }

    hideSearchSuggestions() {
        this.searchSuggestions?.classList.remove('active');
        this.searchInput?.setAttribute('aria-expanded', 'false');
        this.selectedIndex = -1;
    }

    hideLocationSuggestions() {
        this.locationSuggestions?.classList.remove('active');
        this.locationInput?.setAttribute('aria-expanded', 'false');
        this.selectedIndex = -1;
    }

    showSearchSuggestions() {
        if (this.searchInput.value.trim().length >= this.minSearchLength) {
            this.searchSuggestions.classList.add('active');
        }
    }

    showLocationSuggestions() {
        if (this.locationInput.value.trim().length >= this.minSearchLength) {
            this.locationSuggestions.classList.add('active');
        }
    }

    getCategoryIcon(categoryName) {
        const icons = {
            'Restaurant': 'fa-utensils',
            'Hotel': 'fa-hotel',
            'Shopping': 'fa-shopping-bag',
            'Health': 'fa-hospital',
            'Beauty': 'fa-spa',
            'Education': 'fa-graduation-cap',
            'Automotive': 'fa-car',
            'Real Estate': 'fa-home',
            'Technology': 'fa-laptop',
            'Entertainment': 'fa-film',
            'Sports': 'fa-futbol',
            'Pets': 'fa-paw',
            'Legal': 'fa-gavel',
            'Financial': 'fa-dollar-sign',
            'Travel': 'fa-plane',
            'default': 'fa-store'
        };

        if (!categoryName) return icons.default;
        
        // Try to find a matching icon by checking if the category name includes any key
        const matchingKey = Object.keys(icons).find(key => 
            categoryName.toLowerCase().includes(key.toLowerCase())
        );
        
        return icons[matchingKey] || icons.default;
    }

    async handleListingClick(e) {
        // Implement listing click functionality
    }

    async loadPopularCategories() {
        // Implement loading popular categories functionality
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

    showCategoriesLoader() {
        if (!this.categoriesTrack) return;
        
        const loader = document.createElement('div');
        loader.className = 'vr-loader';
        loader.innerHTML = `
            <div class="vr-spinner"></div>
            <div class="vr-loader__text">Loading categories...</div>
        `;
        
        this.categoriesTrack.innerHTML = '';
        this.categoriesTrack.appendChild(loader);
    }

    hideCategoriesLoader() {
        if (!this.categoriesTrack) return;
        const loader = this.categoriesTrack.querySelector('.vr-loader');
        if (loader) {
            loader.remove();
        }
    }

    showCategoriesError() {
        if (!this.categoriesTrack) return;
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'vr-empty-state';
        errorMessage.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>Unable to load categories</p>
            <button class="vr-btn vr-btn--primary" onclick="window.location.reload()">
                <i class="fas fa-sync"></i> Try Again
            </button>
        `;
        
        this.categoriesTrack.innerHTML = '';
        this.categoriesTrack.appendChild(errorMessage);
    }

    displaySuggestions(suggestions) {
        if (!this.searchSuggestions) return;

        if (!suggestions || !suggestions.length) {
            this.searchSuggestions.innerHTML = `
                <div class="vr-search-suggestions__empty">
                    <i class="fas fa-search"></i>
                    <p>No results found</p>
                </div>
            `;
            this.searchSuggestions.classList.add('active');
            return;
        }

        const html = suggestions.map((suggestion, index) => `
            <div class="vr-search-suggestions__item" 
                 role="option" 
                 tabindex="0"
                 aria-selected="${this.selectedIndex === index}"
                 data-index="${index}"
                 data-type="${suggestion.type}"
                 data-id="${suggestion.id}">
                <div class="vr-search-suggestions__icon">
                    <i class="fas fa-${suggestion.type === 'listing' ? 'building' : 'tag'}"></i>
                </div>
                <div class="vr-search-suggestions__content">
                    <div class="vr-search-suggestions__name">${suggestion.name}</div>
                    ${suggestion.type === 'listing' ? `
                        <div class="vr-search-suggestions__details">
                            <span><i class="fas fa-map-marker-alt"></i> ${suggestion.location}</span>
                            ${suggestion.category ? `
                                <span><i class="fas fa-tag"></i> ${suggestion.category}</span>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="vr-search-suggestions__details">
                            ${suggestion.amenities.slice(0, 2).map(amenity => `
                                <span><i class="fas fa-check"></i> ${amenity}</span>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `).join('');

        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');

        // Add event listeners
        this.searchSuggestions.querySelectorAll('.vr-search-suggestions__item').forEach(item => {
            item.addEventListener('click', () => this.handleSuggestionSelect(item));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleSuggestionSelect(item);
                }
            });
        });
    }

    hideSuggestions() {
        this.searchSuggestions?.classList.remove('active');
        this.searchInput?.setAttribute('aria-expanded', 'false');
        this.selectedIndex = -1;
    }

    initializeCategoriesSlider() {
        if (!this.categoriesTrack) return;

        // Add navigation buttons
        this.addSliderNavigation();

        // Setup touch handling
        this.setupTouchHandling();

        // Setup infinite scroll
        this.setupInfiniteScroll();

        // Setup autoplay with smooth transitions
        if (this.categoriesConfig.autoplayEnabled) {
            this.startAutoplay();
        }

        // Initial state update
        this.updateSliderState();

        // Handle scroll events with debounce
        this.categoriesTrack.addEventListener('scroll', Utils.debounce(() => {
            this.updateSliderState();
            this.pauseAutoplay();
        }, 100));

        // Handle resize events
        window.addEventListener('resize', Utils.debounce(() => {
            this.updateSliderState();
        }, 150));
    }

    addSliderNavigation() {
        if (!this.prevButton || !this.nextButton) {
            const sliderContainer = this.categoriesTrack.parentElement;
            
            // Create navigation buttons if they don't exist
            this.prevButton = document.createElement('button');
            this.nextButton = document.createElement('button');
            
            this.prevButton.className = 'vr-categories__nav vr-categories__nav--prev';
            this.nextButton.className = 'vr-categories__nav vr-categories__nav--next';
            
            this.prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            this.nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            
            sliderContainer.appendChild(this.prevButton);
            sliderContainer.appendChild(this.nextButton);
        }

        // Add click handlers
        this.prevButton.addEventListener('click', () => this.scrollCategories('prev'));
        this.nextButton.addEventListener('click', () => this.scrollCategories('next'));
    }

    setupInfiniteScroll() {
        if (!this.categoriesTrack) return;

        // Store categories count
        this.categoriesCount = this.categoriesTrack.querySelectorAll('.vr-categories__item').length;

        // Clone first and last items for smooth infinite scroll
        const items = Array.from(this.categoriesTrack.children);
        const firstItemClone = items[0].cloneNode(true);
        const lastItemClone = items[items.length - 1].cloneNode(true);
        
        firstItemClone.setAttribute('aria-hidden', 'true');
        lastItemClone.setAttribute('aria-hidden', 'true');
        
        this.categoriesTrack.appendChild(firstItemClone);
        this.categoriesTrack.insertBefore(lastItemClone, items[0]);

        // Update scroll position to skip clone
        this.categoriesTrack.scrollLeft = this.getItemWidth();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = entry.target;
                
                if (entry.isIntersecting) {
                    // Calculate visibility percentage
                    const ratio = entry.intersectionRatio;
                    const scale = 0.95 + (ratio * 0.05);
                    const opacity = 0.6 + (ratio * 0.4);
                    
                    item.style.transform = `scale(${scale})`;
                    item.style.opacity = opacity;
                    
                    if (ratio > 0.8) {
                        item.classList.add('active');
                    }
                } else {
                    item.classList.remove('active');
                }
            });
        }, {
            root: this.categoriesTrack,
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '0px'
        });

        this.categoriesTrack.querySelectorAll('.vr-categories__item').forEach(item => {
            observer.observe(item);
        });
    }

    updateSliderState() {
        if (!this.categoriesTrack) return;

        const { scrollLeft, scrollWidth, clientWidth } = this.categoriesTrack;
        const itemWidth = this.getItemWidth();
        
        // Handle infinite scroll effect
        if (scrollLeft <= itemWidth / 2) {
            // If we're at the start (showing cloned last item)
            this.categoriesTrack.style.scrollBehavior = 'auto';
            this.categoriesTrack.scrollLeft = scrollWidth - (itemWidth * 3);
            requestAnimationFrame(() => {
                this.categoriesTrack.style.scrollBehavior = 'smooth';
            });
        } else if (scrollLeft >= scrollWidth - (itemWidth * 1.5)) {
            // If we're at the end (showing cloned first item)
            this.categoriesTrack.style.scrollBehavior = 'auto';
            this.categoriesTrack.scrollLeft = itemWidth;
            requestAnimationFrame(() => {
                this.categoriesTrack.style.scrollBehavior = 'smooth';
            });
        }

        this.updateActiveItems();
    }

    updateActiveItems() {
        if (!this.categoriesTrack) return;

        const items = this.categoriesTrack.querySelectorAll('.vr-categories__item');
        const { scrollLeft, clientWidth } = this.categoriesTrack;
        const centerPosition = scrollLeft + (clientWidth / 2);

        items.forEach((item, index) => {
            // Skip cloned items in counting
            const isClone = index === 0 || index === items.length - 1;
            if (!isClone) {
                const rect = item.getBoundingClientRect();
                const itemCenter = rect.left + (rect.width / 2);
                const distanceFromCenter = Math.abs(itemCenter - (clientWidth / 2));
                const viewportWidth = clientWidth;
                
                // Calculate scale and opacity based on distance from center
                const scale = Math.max(0.95, 1 - (distanceFromCenter / viewportWidth) * 0.1);
                const opacity = Math.max(0.6, 1 - (distanceFromCenter / viewportWidth) * 0.4);
                
                // Apply smooth transitions
                item.style.transform = `scale(${scale})`;
                item.style.opacity = opacity;
                
                // Update active state
                if (distanceFromCenter < rect.width / 2) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });
    }

    scrollCategories(direction) {
        if (!this.categoriesTrack) return;

        const itemWidth = this.getItemWidth();
        const scrollAmount = direction === 'next' ? itemWidth : -itemWidth;

        this.categoriesTrack.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });

        this.pauseAutoplay();
    }

    getItemWidth() {
        const item = this.categoriesTrack.querySelector('.vr-categories__item');
        if (!item) return 0;
        
        const gap = parseInt(getComputedStyle(this.categoriesTrack).gap) || 16;
        return item.offsetWidth + gap;
    }

    startAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }

        this.autoplayInterval = setInterval(() => {
            this.scrollCategories('next');
        }, this.categoriesConfig.autoplayDelay);
    }

    setupTouchHandling() {
        if (!this.categoriesTrack) return;

        let startX, startScrollLeft, isDragging = false;
        let lastDragTime = 0, lastDragX = 0;
        const DRAG_THRESHOLD = 5;

        const startDragging = (e) => {
            isDragging = true;
            this.categoriesTrack.classList.add('dragging');
            startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
            startScrollLeft = this.categoriesTrack.scrollLeft;
            lastDragTime = Date.now();
            lastDragX = startX;
        };

        const stopDragging = () => {
            if (!isDragging) return;
            
            isDragging = false;
            this.categoriesTrack.classList.remove('dragging');
            
            // Calculate momentum
            const dragEndTime = Date.now();
            const timeDiff = dragEndTime - lastDragTime;
            const distanceDiff = lastDragX - startX;
            
            if (timeDiff < 100 && Math.abs(distanceDiff) > 20) {
                const momentum = (distanceDiff / timeDiff) * 300;
                this.categoriesTrack.scrollBy({
                    left: -momentum,
                    behavior: 'smooth'
                });
            }
        };

        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const x = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
            const diff = x - startX;
            
            if (Math.abs(diff) > DRAG_THRESHOLD) {
                this.categoriesTrack.scrollLeft = startScrollLeft - diff;
                lastDragTime = Date.now();
                lastDragX = x;
            }
        };

        // Touch events
        this.categoriesTrack.addEventListener('touchstart', startDragging, { passive: true });
        this.categoriesTrack.addEventListener('touchend', stopDragging);
        this.categoriesTrack.addEventListener('touchmove', drag, { passive: false });

        // Mouse events
        this.categoriesTrack.addEventListener('mousedown', startDragging);
        this.categoriesTrack.addEventListener('mouseleave', stopDragging);
        this.categoriesTrack.addEventListener('mouseup', stopDragging);
        this.categoriesTrack.addEventListener('mousemove', drag);

        // Prevent click during drag
        this.categoriesTrack.addEventListener('click', (e) => {
            if (this.categoriesTrack.classList.contains('dragging')) {
                e.preventDefault();
            }
        });
    }

    pauseAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            
            // Restart autoplay after user interaction
            if (this.categoriesConfig.autoplayEnabled) {
                clearTimeout(this.autoplayTimeout);
                this.autoplayTimeout = setTimeout(() => {
                    this.startAutoplay();
                }, 2000);
            }
        }
    }

    // إضافة طريقة لتوليد نجوم التقييم
    generateRatingStars(rating = 0) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return `
            <div class="vr-featured__stars">
                ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
                ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
                ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
                <span class="vr-featured__rating-value">${rating.toFixed(1)}</span>
            </div>
        `;
    }

    // طريقة لتقصير النص الطويل
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});