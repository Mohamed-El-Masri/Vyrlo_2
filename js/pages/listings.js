import { Utils } from '../core/utils.js';
import { componentLoader } from '../core/componentLoader.js';
import { toastService } from '../services/toast.service.js';
import { listingService } from '../services/listing.service.js';

/**
 * Listings page functionality
 */
class ListingsPage {
    constructor() {
        // API Configuration
        this.API_BASE_URL = 'https://virlo.vercel.app';
        
        // State
        this.page = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.filters = {
            name: '',
            location: '',
            categoryId: '',
            sortBy: 'newest'
        };
        this.loadedListings = new Set();
        this.previousListingsCount = 0;
        this.searchTimeout = null;
        this.locationTimeout = null;

        // Services
        this.componentLoader = componentLoader;
        this.toastService = toastService;
        this.listingService = listingService;
        
        this.searchCache = new Map();
        this.searchDebounceTimeout = null;
        this.minSearchLength = 2;
        this.locationDebounceTimeout = null;
        
        // Add pagination settings
        this.itemsPerPage = 12; // Number of items to show per page
        this.allListings = []; // Store all listings
        this.filteredListings = []; // Store filtered listings
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            console.log('Initializing ListingsPage...');
            await this.setupElements();
            await this.loadCategories();
            this.attachEventListeners();
            this.checkUrlParams();
            await this.loadInitialListings();
            console.log('ListingsPage initialized successfully');
        } catch (error) {
            console.error('Error initializing ListingsPage:', error);
            toastService.error('Failed to initialize page');
        }
    }

    async setupElements() {
        console.log('Setting up elements...');
        
        // Forms and inputs
        this.searchForm = document.getElementById('searchForm');
        this.searchInput = document.getElementById('searchInput');
        this.locationInput = document.getElementById('locationInput');
        this.categorySelect = document.getElementById('categorySelect');
        
        // Results elements
        this.listingsGrid = document.getElementById('listingsGrid');
        this.resultsCount = document.getElementById('resultsCount');
        this.loadMoreBtn = document.getElementById('loadMore');
        
        // Active filters container
        this.activeFiltersContainer = document.getElementById('activeFilters');

        if (!this.searchForm || !this.listingsGrid || !this.activeFiltersContainer) {
            throw new Error('Required elements not found');
        }

        // Create suggestions containers
        this.searchSuggestions = document.createElement('div');
        this.searchSuggestions.className = 'vr-search-suggestions';
        this.searchInput.parentNode.appendChild(this.searchSuggestions);

        this.locationSuggestions = document.createElement('div');
        this.locationSuggestions.className = 'vr-search-suggestions';
        this.locationInput.parentNode.appendChild(this.locationSuggestions);

        console.log('Elements setup completed');
    }

    async loadCategories() {
        try {
            console.log('Loading categories...');
            const response = await fetch('https://virlo.vercel.app/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const categories = await response.json();
            const filteredCategories = categories.filter(cat => 
                !cat.categoryName.toLowerCase().includes('test')
            );
            
            this.renderCategories(filteredCategories);
            console.log('Categories loaded successfully');
        } catch (error) {
            console.error('Failed to load categories:', error);
            toastService.error('Failed to load categories');
        }
    }

    renderCategories(categories) {
        if (!this.categorySelect) return;
        
        const options = categories.map(category => 
            `<option value="${category._id}">${category.categoryName}</option>`
        ).join('');
        
        this.categorySelect.innerHTML = '<option value="">All Categories</option>' + options;
        
        if (this.filters.categoryId) {
            this.categorySelect.value = this.filters.categoryId;
        }
    }

    attachEventListeners() {
        // Search form submission with debounce
        if (this.searchForm) {
            const debouncedSearch = Utils.debounce(() => this.handleSearch(), 500);
            this.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });

            // Add input event listeners only if elements exist
            if (this.searchInput) {
                this.searchInput.addEventListener('input', () => this.handleSearchInput());
                this.searchInput.addEventListener('focus', () => this.showSearchSuggestions());
                document.addEventListener('click', (e) => {
                    if (!this.searchInput.contains(e.target) && !this.searchSuggestions.contains(e.target)) {
                        this.hideSearchSuggestions();
                    }
                });
            }
            if (this.locationInput) {
                this.locationInput.addEventListener('input', () => this.handleLocationInput());
                this.locationInput.addEventListener('focus', () => this.showLocationSuggestions());
                
                // إضافة div للاقتراحات الموقع
                this.locationSuggestions = document.createElement('div');
                this.locationSuggestions.className = 'vr-search-suggestions';
                this.locationInput.parentNode.appendChild(this.locationSuggestions);
            }
        }
        
        // Category selection
        if (this.categorySelect) {
            this.categorySelect.addEventListener('change', () => {
                this.filters.categoryId = this.categorySelect.value;
                this.resetAndReload();
            });
        }

        // Load more button
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMoreListings());
            // Setup infinite scroll
            this.setupInfiniteScroll();
        }

        // إضافة مستمع حدث لزر مسح الفلاتر
        const clearFiltersBtn = document.querySelector('.vr-active-filter--clear');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // إضافة مستمعي أحداث لأزرار إزالة الفلتر
        this.activeFiltersContainer?.querySelectorAll('.vr-active-filter__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.removeFilter(type);
            });
        });

        // Add click handler for listing cards
        document.querySelector('.vr-listings-grid').addEventListener('click', (event) => {
            const card = event.target.closest('.vr-featured__card');
            if (card) {
                const listingId = card.dataset.listingId;
                if (listingId) {
                    window.location.href = `/pages/listing-details.html?id=${listingId}`;
                }
            }
        });
    }

    setupInfiniteScroll() {
        if (!this.loadMoreBtn) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !this.isLoading && this.hasMore) {
                    this.loadMoreListings();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(this.loadMoreBtn);
    }

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('name')) {
            this.searchInput.value = params.get('name');
            this.filters.name = params.get('name');
        }
        
        if (params.has('location')) {
            this.locationInput.value = params.get('location');
            this.filters.location = params.get('location');
        }
        
        if (params.has('categoryId')) {
            this.filters.categoryId = params.get('categoryId');
        }
    }

    updateUrl() {
        const params = new URLSearchParams();
        
        if (this.filters.name) params.set('name', this.filters.name);
        if (this.filters.location) params.set('location', this.filters.location);
        if (this.filters.categoryId) params.set('categoryId', this.filters.categoryId);
        if (this.filters.sort) params.set('sort', this.filters.sort);
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
    }

    async handleSearch() {
        // إظهار حالة التحميل
        this.showSkeletonLoading();
        
        // تحديث الفلاتر
        this.filters = {
            name: this.searchInput.value.trim(),
            location: this.locationInput.value.trim(),
            categoryId: this.categorySelect.value
        };

        // تحديث URL والفلاتر النشطة
        this.updateUrl();
        this.updateActiveFilters();
        
        // إعادة تعيين القيم
        this.page = 1;
        this.hasMore = true;
        this.loadedListings.clear();
        
        // Apply filters and reload
        this.filteredListings = this.filterListings(this.allListings);
        await this.loadMoreListings();
    }

    clearFilters() {
        console.log('Clearing all filters...');
        
        // Reset input values
        if (this.searchInput) this.searchInput.value = '';
        if (this.locationInput) this.locationInput.value = '';
        if (this.categorySelect) this.categorySelect.value = '';
        
        // Reset filters object
        this.filters = {
            name: '',
            location: '',
            categoryId: ''
        };
        
        // Update URL
        this.updateUrl();
        
        // Reset pagination and filtered listings
        this.page = 1;
        this.hasMore = true;
        this.loadedListings.clear();
        this.filteredListings = [...this.allListings];
        
        // Reload listings
        this.loadInitialListings();
        
        // Update active filters display
        this.updateActiveFilters();
        
        // Show success message
        toastService.success('Filters have been reset');
    }

    toggleView(view) {
        this.viewButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.view === view);
        });
        this.listingsGrid.classList.toggle('list-view', view === 'list');
    }

    async loadInitialListings() {
        this.page = 1;
        this.hasMore = true;
        this.listingsGrid.innerHTML = '';
        await this.loadMoreListings();
    }

    async loadMoreListings() {
        if (this.isLoading || !this.hasMore) return;
        
        this.setLoadingState(true);
        
        try {
            // Only fetch from API if we don't have the data yet
            if (this.allListings.length === 0) {
                console.log('Fetching listings from API...');
                const queryParams = new URLSearchParams();
                
                const url = `${this.API_BASE_URL}/listing/active${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                console.log('Fetching URL:', url);
                
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch listings');
                
                const data = await response.json();
                console.log('Received data:', data);
                
                this.allListings = data.listings || [];
            }

            // Apply filters
            this.filteredListings = this.filterListings(this.allListings);

            // Calculate pagination
            const startIndex = (this.page - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedListings = this.filteredListings.slice(startIndex, endIndex);

            // Update hasMore flag
            this.hasMore = endIndex < this.filteredListings.length;

            if (paginatedListings.length > 0) {
                if (this.page === 1) {
                    this.loadedListings.clear();
                    this.listingsGrid.innerHTML = '';
                }

                paginatedListings.forEach(listing => this.loadedListings.add(listing._id));
                this.renderListings(paginatedListings);
                this.page++;

                this.updateResultsCount(this.filteredListings.length);
                this.updateActiveFilters();
            } else {
                if (this.page === 1) {
                    this.showEmptyState();
                }
                this.hasMore = false;
            }
        } catch (error) {
            console.error('Failed to load listings:', error);
            toastService.error('Failed to load listings');
        } finally {
            this.setLoadingState(false);
            this.updateLoadMoreButton();
        }
    }

    filterListings(listings) {
        return listings.filter(listing => {
            const nameMatch = !this.filters.name || 
                listing.listingName.toLowerCase().includes(this.filters.name.toLowerCase());
            
            const locationMatch = !this.filters.location || 
                listing.location?.toLowerCase().includes(this.filters.location.toLowerCase());
            
            const categoryMatch = !this.filters.categoryId || 
                listing.categoryId?._id === this.filters.categoryId;

            return nameMatch && locationMatch && categoryMatch;
        });
    }

    getLoadingCards(count) {
        return Array(count).fill(0).map(() => `
            <div class="vr-featured__card vr-featured__card--loading">
                <div class="vr-featured__image-wrapper loading-shimmer"></div>
                <div class="vr-featured__content">
                    <div class="vr-featured__title loading-shimmer"></div>
                    <div class="vr-featured__meta">
                        <div class="vr-featured__location loading-shimmer"></div>
                        <div class="vr-featured__category loading-shimmer"></div>
                    </div>
                    <div class="vr-featured__stats">
                        <div class="vr-featured__stat loading-shimmer"></div>
                        <div class="vr-featured__stat loading-shimmer"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderListings(listings) {
        const html = listings.map(listing => `
            <article class="vr-featured__card" data-listing-id="${listing._id}">
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
                            <span class="vr-featured__stat vr-featured__stat--email">
                                <i class="fas fa-envelope"></i>
                                ${listing.email}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </article>
        `).join('');
        
        if (this.page === 1) {
            this.listingsGrid.innerHTML = html;
        } else {
            this.listingsGrid.insertAdjacentHTML('beforeend', html);
        }
        
        this.addCardEventListeners();
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

    updateResultsCount(total) {
        this.resultsCount.textContent = total;
    }

    showEmptyState() {
        const instance = this; // Store reference to the class instance
        this.listingsGrid.innerHTML = `
            <div class="vr-listings-empty">
                <i class="fas fa-search"></i>
                <p>No listings found matching your criteria</p>
                <div class="vr-listings-empty__actions">
                    <button class="vr-btn vr-btn--outline" onclick="window.location.href='/pages/listings.html'">
                        View All Listings
                    </button>
                    <button class="vr-btn vr-btn--text" id="clearFiltersBtn">
                        Clear All Filters
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener to the clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        this.loadMoreBtn.style.display = 'none';
        toastService.info('No listings found matching your search criteria');
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        this.loadMoreBtn.classList.toggle('vr-btn--loading', loading);
        
        if (loading && this.page === 1) {
            this.listingsGrid.innerHTML = `
                <div class="vr-listings-loading">
                    <div class="vr-spinner"></div>
                    <p>Loading listings...</p>
                </div>
            `;
        }
    }

    updateLoadMoreButton() {
        this.loadMoreBtn.style.display = this.hasMore ? 'inline-flex' : 'none';
    }

    resetAndReload() {
        this.page = 1;
        this.hasMore = true;
        this.loadInitialListings();
    }

    // تحديث عرض الفلاتر النشطة
    updateActiveFilters() {
        if (!this.activeFiltersContainer) return;

        const activeFilters = Object.entries(this.filters)
            .filter(([_, value]) => value)
            .map(([type, value]) => {
                let label = value;
                if (type === 'categoryId') {
                    const option = this.categorySelect.querySelector(`option[value="${value}"]`);
                    label = option ? option.textContent : value;
                }
                return { type, value, label };
            });

        console.log('Active filters:', activeFilters);

        if (!activeFilters.length) {
            this.activeFiltersContainer.innerHTML = `
                <div class="vr-active-filters__empty">
                    <i class="fas fa-filter"></i>
                    <span>No active filters</span>
                </div>
            `;
            return;
        }

        this.activeFiltersContainer.innerHTML = `
            <div class="vr-active-filters__content">
                ${activeFilters.map(filter => `
                    <span class="vr-active-filter">
                        ${filter.type}: ${filter.label}
                        <button class="vr-active-filter__remove" data-type="${filter.type}">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `).join('')}
                <button class="vr-active-filter vr-active-filter--clear">
                    Clear All Filters
                </button>
            </div>
        `;

        this.addFilterEventListeners();
    }

    addFilterEventListeners() {
        // مستمعي أحداث لأزرار إزالة الفلتر
        this.activeFiltersContainer.querySelectorAll('.vr-active-filter__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.removeFilter(type);
            });
        });

        // مستمع حدث لزر مسح جميع الفلاتر
        const clearAllBtn = this.activeFiltersContainer.querySelector('.vr-active-filter--clear');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    // إزالة فلتر معين
    removeFilter(type) {
        this.filters[type] = '';
        if (type === 'categoryId') {
            this.categorySelect.value = '';
        } else if (type === 'name') {
            this.searchInput.value = '';
        } else if (type === 'location') {
            this.locationInput.value = '';
        }
        this.resetAndReload();
    }

    addCardEventListeners() {
        this.listingsGrid.querySelectorAll('.vr-featured__card').forEach(card => {
            card.addEventListener('click', () => {
                const listingId = card.dataset.listingId;
                if (listingId) {
                    window.location.href = `/pages/listing-details.html?id=${listingId}`;
                }
            });
        });
    }

    async handleSearchInput() {
        const query = this.searchInput.value.trim();
        
        if (query.length < this.minSearchLength) {
            this.hideSearchSuggestions();
            return;
        }

        // إظهار حالة التحميل
        this.showLoadingSuggestions();

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            try {
                // جلب الاقتراحات للاسم والموقع في نفس الوقت
                const [nameResults, locationResults] = await Promise.all([
                    fetch(`${this.API_BASE_URL}/listing/active/?name=${query}`).then(res => res.json()),
                    fetch(`${this.API_BASE_URL}/listing/active/?location=${query}`).then(res => res.json())
                ]);
                
                // تجميع النتائج
                const suggestions = {
                    listings: nameResults.listings || [],
                    locations: [...new Set(locationResults.listings?.map(l => l.location))] || []
                };
                
                if (suggestions.listings.length === 0 && suggestions.locations.length === 0) {
                    this.showEmptySuggestions(query);
                } else {
                    this.showSuggestions(suggestions, query);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                this.showErrorSuggestions();
            }
        }, 300);
    }

    showLoadingSuggestions() {
        this.searchSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--loading">
                <div class="vr-spinner"></div>
                <span>Searching...</span>
            </div>
        `;
        this.searchSuggestions.classList.add('active');
    }

    showEmptySuggestions(query) {
        this.searchSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--empty">
                <i class="fas fa-info-circle"></i>
                <span>No matches found for "${query}"</span>
            </div>
        `;
    }

    showErrorSuggestions() {
        this.searchSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error loading suggestions</span>
            </div>
        `;
    }

    showSuggestions(suggestions, query) {
        const { listings, locations } = suggestions;
        
        let html = '';

        // إضافة اقتراحات القوائم
        if (listings.length > 0) {
            html += `
                <div class="vr-search-suggestion__group">
                    <div class="vr-search-suggestion__group-title">Listings</div>
                    ${listings.slice(0, 4).map(listing => this.createSuggestionHTML(listing, query)).join('')}
                </div>
            `;
        }

        // إضافة اقتراحات المواقع
        if (locations.length > 0) {
            html += `
                <div class="vr-search-suggestion__group">
                    <div class="vr-search-suggestion__group-title">Locations</div>
                    ${locations.slice(0, 4).map(location => `
                        <div class="vr-search-suggestion" data-location="${location}">
                            <div class="vr-search-suggestion__icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="vr-search-suggestion__content">
                                <div class="vr-search-suggestion__title">
                                    ${this.highlightMatch(location, query)}
                                </div>
                                <div class="vr-search-suggestion__subtitle">Location</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');
        
        // تحديث مستمعي الأحداث
        this.addSuggestionEventListeners(listings, locations);
    }

    addSuggestionEventListeners(listings, locations) {
        // التعامل مع اقتراحات القوائم
        this.searchSuggestions.querySelectorAll('.vr-search-suggestion[data-id]').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const id = suggestion.dataset.id;
                const listing = listings.find(l => l._id === id);
                if (listing) {
                    this.searchInput.value = listing.listingName;
                    this.hideSearchSuggestions();
                    this.handleSearch();
                }
            });
        });

        // التعامل مع اقتراحات المواقع
        this.searchSuggestions.querySelectorAll('.vr-search-suggestion[data-location]').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const location = suggestion.dataset.location;
                this.locationInput.value = location;
                this.hideSearchSuggestions();
                this.handleSearch();
            });
        });
    }

    showSearchSuggestions() {
        if (this.searchInput.value.trim().length >= this.minSearchLength) {
            this.searchSuggestions.classList.add('active');
        }
    }

    hideSearchSuggestions() {
        this.searchSuggestions.classList.remove('active');
    }

    createSuggestionHTML(listing, query) {
        const highlightedName = this.highlightMatch(listing.listingName, query);
        const highlightedLocation = this.highlightMatch(listing.location || '', query);
        
        return `
            <div class="vr-search-suggestion" data-id="${listing._id}">
                <div class="vr-search-suggestion__icon">
                    <i class="fas ${this.getCategoryIcon(listing.categoryId?.categoryName)}"></i>
                </div>
                <div class="vr-search-suggestion__content">
                    <div class="vr-search-suggestion__title">${highlightedName}</div>
                    <div class="vr-search-suggestion__subtitle">
                        ${highlightedLocation}
                        ${listing.categoryId ? `<span class="vr-search-suggestion__category">${listing.categoryId.categoryName}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    highlightMatch(text, query) {
        if (!text) return '';
        
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    getCategoryIcon(category) {
        const icons = {
            'Restaurant': 'fa-utensils',
            'Hotel': 'fa-hotel',
            'Shopping': 'fa-shopping-bag',
            'Health': 'fa-hospital',
            'Beauty': 'fa-spa',
            // Add more category icons as needed
            'default': 'fa-store'
        };

        return icons[category] || icons.default;
    }

    // دوال مساعدة جديدة للتحكم في حالات التحميل
    showSkeletonLoading() {
        this.listingsGrid.innerHTML = this.getLoadingCards(6);
    }

    showLoadMoreLoading() {
        this.loadMoreBtn.innerHTML = '<div class="vr-spinner"></div>';
    }

    hideLoading() {
        if (this.page === 1) {
            this.listingsGrid.innerHTML = '';
        }
        this.loadMoreBtn.innerHTML = `
            <span>Load More</span>
            <i class="fas fa-chevron-down"></i>
        `;
    }

    async handleLocationInput() {
        const query = this.locationInput.value.trim().toLowerCase();
        
        if (query.length < this.minSearchLength) {
            this.hideLocationSuggestions();
            return;
        }

        this.showLoadingLocationSuggestions();

        clearTimeout(this.locationTimeout);
        this.locationTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/listing/active`);
                if (!response.ok) throw new Error('Failed to fetch locations');
                
                const data = await response.json();
                
                // استخراج المواقع الفريدة وتطبيق البحث الذكي
                const uniqueLocations = [...new Set(data.listings?.map(l => l.location))]
                    .filter(Boolean)
                    .filter(location => {
                        const normalizedLocation = location.toLowerCase();
                        return normalizedLocation.includes(query) || 
                               this.levenshteinDistance(normalizedLocation, query) <= 2;
                    });
                
                if (uniqueLocations.length === 0) {
                    this.showEmptyLocationSuggestions(query);
                } else {
                    // ترتيب النتائج حسب الأقرب للبحث
                    uniqueLocations.sort((a, b) => {
                        const distA = this.levenshteinDistance(a.toLowerCase(), query);
                        const distB = this.levenshteinDistance(b.toLowerCase(), query);
                        return distA - distB;
                    });
                    
                    this.showLocationSuggestionsList(uniqueLocations, query);
                }
            } catch (error) {
                console.error('Error fetching location suggestions:', error);
                this.showErrorLocationSuggestions();
            }
        }, 300);
    }

    showLoadingLocationSuggestions() {
        this.locationSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--loading">
                <div class="vr-spinner"></div>
                <span>Finding locations...</span>
            </div>
        `;
        this.locationSuggestions.classList.add('active');
    }

    showEmptyLocationSuggestions(query) {
        this.locationSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--empty">
                <i class="fas fa-map-marker-alt"></i>
                <span>No locations found for "${query}"</span>
            </div>
        `;
    }

    showErrorLocationSuggestions() {
        this.locationSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error loading suggestions</span>
            </div>
        `;
    }

    // إضافة دالة لحساب المسافة بين الكلمات
    levenshteinDistance(str1, str2) {
        const track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i += 1) {
            track[0][i] = i;
        }
        for (let j = 0; j <= str2.length; j += 1) {
            track[j][0] = j;
        }
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator,
                );
            }
        }
        return track[str2.length][str1.length];
    }

    showLocationSuggestionsList(locations, query) {
        if (!this.locationSuggestions) return;

        const html = `
            <div class="vr-search-suggestion__group">
                <div class="vr-search-suggestion__group-title">Locations</div>
                ${locations.slice(0, 5).map(location => `
                    <div class="vr-search-suggestion" data-location="${location}">
                        <div class="vr-search-suggestion__icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="vr-search-suggestion__content">
                            <div class="vr-search-suggestion__title">
                                ${this.highlightMatch(location, query)}
                            </div>
                            <div class="vr-search-suggestion__subtitle">Location</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.locationSuggestions.innerHTML = html;
        this.locationSuggestions.classList.add('active');
        this.addLocationSuggestionEventListeners(locations);
    }

    addLocationSuggestionEventListeners(locations) {
        if (!this.locationSuggestions) return;

        this.locationSuggestions.querySelectorAll('.vr-search-suggestion[data-location]').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const location = suggestion.dataset.location;
                if (this.locationInput) {
                    this.locationInput.value = location;
                    this.hideLocationSuggestions();
                    this.handleSearch();
                }
            });
        });

        // إضافة مستمع لإخفاء الاقتراحات عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!this.locationInput.contains(e.target) && !this.locationSuggestions.contains(e.target)) {
                this.hideLocationSuggestions();
            }
        });
    }

    showLocationSuggestions() {
        if (this.locationInput.value.trim().length >= this.minSearchLength) {
            this.locationSuggestions.classList.add('active');
        }
    }

    hideLocationSuggestions() {
        if (this.locationSuggestions) {
            this.locationSuggestions.classList.remove('active');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.listingsPage = new ListingsPage();
});