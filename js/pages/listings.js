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
        this.API_BASE_URL = 'https://www.vyrlo.com:8080';
        
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
            // Load required themes
            if (window.themeManager) {
                try {
                    await window.themeManager.themeLoader.loadThemes([
                        'components/featured-ribbon.css',
                        'themes/featured-themes.css'
                    ]);
                    console.log('Themes loaded successfully');
                } catch (themeError) {
                    console.warn('Failed to load themes:', themeError);
                }
            }
            
            await this.setupElements();
            await this.loadCategories();
            this.setupFilterButtons();
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
            const response = await fetch('https://www.vyrlo.com:8080/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const categories = await response.json();
            
            // تمرير كل الفئات بدون فلترة
            this.renderCategories(categories);
            console.log(`Categories loaded successfully, total: ${categories.length}`);
        } catch (error) {
            console.error('Failed to load categories:', error);
            toastService.error('Failed to load categories');
        }
    }

    renderCategories(categories) {
        if (!this.categorySelect) {
            console.warn('Category select element not found');
            return;
        }
        
        // تحقق من وجود الفئات
        if (!Array.isArray(categories) || categories.length === 0) {
            console.warn('No categories provided or invalid categories array');
            this.categorySelect.innerHTML = '<option value="">No Categories Available</option>';
            return;
        }
        
        // مسح المحتوى الحالي للـ select
        this.categorySelect.innerHTML = '';
        
        // إضافة خيار لجميع الفئات
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All Categories';
        this.categorySelect.appendChild(allOption);
        
        // ترتيب الفئات أبجدياً بعد فلترة الفئات التجريبية
        const validCategories = [...categories].filter(cat => 
            cat && cat.categoryName && !cat.categoryName.toLowerCase().includes('test')
        ).sort((a, b) => {
            const nameA = a.categoryName || '';
            const nameB = b.categoryName || '';
            return nameA.localeCompare(nameB);
        });
        
        // حفظ جميع الفئات لاستخدامها في الفلترة ومعالجة البيانات
        this.categoriesData = new Map();
        
        // إضافة الفئات إلى القائمة المنسدلة
        validCategories.forEach(category => {
            // تخزين بيانات الفئة للرجوع إليها لاحقاً
            this.categoriesData.set(category._id, category);
            
            // إنشاء عنصر option للفئة
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.categoryName || 'Unnamed Category';
            
            // إضافة البيانات الإضافية كسمات
            if (category.iconOne) option.dataset.iconOne = category.iconOne;
            if (category.iconTwo) option.dataset.iconTwo = category.iconTwo;
            if (category.amenities && category.amenities.length) {
                option.dataset.hasAmenities = 'true';
                option.dataset.amenitiesCount = category.amenities.length;
            }
            
            // إضافة Option إلى قائمة الاختيارات
            this.categorySelect.appendChild(option);
        });
        
        // تحديد الخيار الحالي استنادًا إلى الفلتر إذا تم تحديده مسبقًا
        if (this.filters.categoryId) {
            this.categorySelect.value = this.filters.categoryId;
            
            // إذا لم نعثر على الفئة في القائمة، نحاول تحميلها
            if (this.categorySelect.value !== this.filters.categoryId) {
                this.tryLoadSingleCategory(this.filters.categoryId);
            }
        }
        
        console.log(`Rendered ${validCategories.length} categories`);
        
        // تطبيق التنسيق المخصص على القائمة المنسدلة
        this.enhanceCategoryDropdown();
    }

    async tryLoadSingleCategory(categoryId) {
        if (!categoryId) return;
        
        try {
            // التحقق مما إذا كانت الفئة موجودة بالفعل في الـ cache
            if (this.categoriesData && this.categoriesData.has(categoryId)) {
                const cachedCategory = this.categoriesData.get(categoryId);
                this.addCategoryOption(cachedCategory);
                return;
            }
            
            // جلب الفئة من API
            const response = await fetch(`${this.API_BASE_URL}/categories/${categoryId}`);
            if (!response.ok) {
                console.warn(`Category with ID ${categoryId} not found`);
                return;
            }
            
            const category = await response.json();
            if (category && category._id) {
                // تخزين الفئة في الـ cache
                if (!this.categoriesData) this.categoriesData = new Map();
                this.categoriesData.set(category._id, category);
                
                // إضافة الفئة كخيار في القائمة المنسدلة
                this.addCategoryOption(category);
                
                console.log(`Added missing category: ${category.categoryName} (${category._id})`);
            }
        } catch (error) {
            console.error(`Failed to load single category ${categoryId}:`, error);
        }
    }

    addCategoryOption(category) {
        // التأكد من وجود القائمة المنسدلة
        if (!this.categorySelect || !category || !category._id) return;
        
        // التحقق ما إذا كان الخيار موجودًا بالفعل
        const existingOption = this.categorySelect.querySelector(`option[value="${category._id}"]`);
        if (existingOption) {
            // تحديث الخيار الموجود إذا لزم الأمر
            existingOption.textContent = category.categoryName || 'Unnamed Category';
            if (category.iconOne) existingOption.dataset.iconOne = category.iconOne;
            if (category.iconTwo) existingOption.dataset.iconTwo = category.iconTwo;
            if (category.amenities && category.amenities.length) {
                existingOption.dataset.hasAmenities = 'true';
                existingOption.dataset.amenitiesCount = category.amenities.length;
            }
            return;
        }
        
        // إنشاء خيار جديد
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.categoryName || 'Unnamed Category';
        
        // إضافة البيانات الإضافية
        if (category.iconOne) option.dataset.iconOne = category.iconOne;
        if (category.iconTwo) option.dataset.iconTwo = category.iconTwo;
        if (category.amenities && category.amenities.length) {
            option.dataset.hasAmenities = 'true';
            option.dataset.amenitiesCount = category.amenities.length;
        }
        
        // إضافة الخيار إلى القائمة
        this.categorySelect.appendChild(option);
        
        // تحديد الخيار إذا كان هذا هو الفلتر الحالي
        if (this.filters.categoryId === category._id) {
            this.categorySelect.value = category._id;
        }
    }

    enhanceCategoryDropdown() {
        if (!this.categorySelect) return;
        
        // تخصيص شكل القائمة المنسدلة
        this.categorySelect.classList.add('vr-select', 'vr-category-select');
        
        // استخدام Choices.js إذا كان متاحًا لتحسين تجربة المستخدم
        if (window.Choices) {
            try {
                // تدمير أي نسخة قديمة إذا وجدت
                if (this.categorySelectInstance) {
                    this.categorySelectInstance.destroy();
                }
                
                // تخصيص قائمة الخيارات لتعرض المزيد من البيانات
                const renderOption = (item) => {
                    const option = this.categorySelect.querySelector(`option[value="${item.value}"]`);
                    let html = `<div class="vr-choices-option">${item.label}</div>`;
                    
                    // إضافة عرض مميزات الفئة إذا كانت متوفرة
                    if (option && option.dataset.hasAmenities === 'true') {
                        const amenitiesCount = option.dataset.amenitiesCount || 0;
                        html = `
                            <div class="vr-choices-option">
                                <span>${item.label}</span>
                                <span class="vr-choices-option__amenities">
                                    <i class="fas fa-check-circle"></i> ${amenitiesCount} features
                                </span>
                            </div>
                        `;
                    }
                    
                    return html;
                };
                
                // إنشاء نسخة جديدة محسنة من القائمة المنسدلة
                this.categorySelectInstance = new window.Choices(this.categorySelect, {
                    searchEnabled: true,
                    searchPlaceholderValue: 'Search categories...',
                    placeholder: true,
                    placeholderValue: 'Select Category',
                    itemSelectText: '',
                    callbackOnCreateTemplates: function(template) {
                        return {
                            item: (classNames, data) => {
                                return template(`
                                    <div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : ''}" data-item data-id="${data.id}" data-value="${data.value}" ${data.active ? 'aria-selected="true"' : ''} ${data.disabled ? 'aria-disabled="true"' : ''}>
                                        ${data.label}
                                    </div>
                                `);
                            },
                            choice: (classNames, data) => {
                                return template(`
                                    <div class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}" data-select-text="${this.config.itemSelectText}" data-choice ${data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'} data-id="${data.id}" data-value="${data.value}" ${data.groupId > 0 ? 'role="treeitem"' : 'role="option"'}>
                                        ${renderOption(data)}
                                    </div>
                                `);
                            }
                        };
                    },
                    classNames: {
                        containerOuter: 'vr-choices vr-category-select',
                    }
                });
            } catch (e) {
                console.warn('Choices.js initialization failed:', e);
                // استخدام النسخة العادية إذا فشل تهيئة المكتبة
                this.setupBasicCategorySelect();
            }
        } else {
            // استخدام النسخة العادية إذا كانت المكتبة غير متوفرة
            this.setupBasicCategorySelect();
        }
    }

    setupBasicCategorySelect() {
        // تطبيق التنسيق الأساسي
        this.categorySelect.classList.add('vr-select--enhanced');
        
        // إضافة سهم للقائمة المنسدلة
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'vr-select-wrapper';
        const parent = this.categorySelect.parentNode;
        
        // وضع العنصر الأصلي داخل الغلاف
        parent.insertBefore(selectWrapper, this.categorySelect);
        selectWrapper.appendChild(this.categorySelect);
        
       
        // تحسين خيارات الـ select لتعرض معلومات إضافية
        Array.from(this.categorySelect.options).forEach(option => {
            if (option.dataset.hasAmenities === 'true') {
                // محاولة إضافة سمات مرئية للخيارات ذات الميزات
                option.style.fontWeight = 'bold';
            }
        });
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

    async checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        
        // فحص وجود معامل الفئة أولًا للتأكد من تحميل الفئات قبل البدء
        if (params.has('categoryId')) {
            this.filters.categoryId = params.get('categoryId');
            
            // تأكد من تحميل الفئات أولًا
            if (this.categorySelect && this.categorySelect.options.length <= 1) {
                await this.loadCategories();
            }
        }
        
        // تحديد بقية المعاملات
        if (params.has('name')) {
            this.searchInput.value = params.get('name');
            this.filters.name = params.get('name');
        }
        
        if (params.has('location')) {
            this.locationInput.value = params.get('location');
            this.filters.location = params.get('location');
        }
        
        // الآن بعد تحميل الفئات، تأكد من تحديد الخيار الصحيح
        if (params.has('categoryId') && this.categorySelect) {
            this.categorySelect.value = params.get('categoryId');
            
            // إذا كان المعرف غير موجود في القائمة، حاول تحميله من API
            if (this.categorySelect.value !== params.get('categoryId')) {
                await this.tryLoadSingleCategory(params.get('categoryId'));
            }
        }
        
        // تحديث الفلاتر النشطة
        if (Object.values(this.filters).some(v => v)) {
            this.updateActiveFilters();
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
        
        // تحقق من وجود الفئات قبل التحميل
        if (this.categorySelect && this.categorySelect.options.length <= 1) {
            try {
                await this.loadCategories();
            } catch (error) {
                console.error('Error loading categories before listings', error);
            }
        }
        
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
        // أدخل تحسينًا للتأكد من وجود القيم قبل المقارنة
        const filteredBySearch = listings.filter(listing => {
            // نتأكد من وجود قيمة listingName قبل استخدام includes
            const nameMatch = !this.filters.name || 
                (listing.listingName && listing.listingName.toLowerCase().includes(this.filters.name.toLowerCase()));
            
            // نتأكد من وجود قيمة location قبل استخدام includes
            const locationMatch = !this.filters.location || 
                (listing.location && listing.location.toLowerCase().includes(this.filters.location.toLowerCase()));
            
            // تحسين طريقة مطابقة الفئة
            let categoryMatch = !this.filters.categoryId;
            if (this.filters.categoryId) {
                if (typeof listing.categoryId === 'object') {
                    categoryMatch = listing.categoryId?._id === this.filters.categoryId;
                } else {
                    categoryMatch = listing.categoryId === this.filters.categoryId;
                }
            }

            return nameMatch && locationMatch && categoryMatch;
        });
            
        // فلترة إضافية بناء على نوع الفلتر السريع
        let finalResults;
        switch (this.currentQuickFilter) {
            case 'featured':
                // عرض المميزة فقط
                finalResults = filteredBySearch.filter(listing => listing.isPosted === true);
                break;
            case 'newest':
                // ترتيب حسب الأحدث (بافتراض أن هناك خاصية createdAt)
                finalResults = [...filteredBySearch].sort((a, b) => 
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                );
                break;
            case 'rating':
                // ترتيب حسب التقييم
                finalResults = [...filteredBySearch].sort((a, b) => 
                    (b.rating || 0) - (a.rating || 0)
                );
                break;
            default: // 'all' وغيرها
                finalResults = [...filteredBySearch].sort((a, b) => {
                    // المميزة دائماً في المقدمة
                    if (a.isPosted && !b.isPosted) return -1;
                    if (!a.isPosted && b.isPosted) return 1;
                    
                    // إذا كانت كلاهما مميزة أو كلاهما غير مميزة، رتب حسب التقييم
                    return (b.rating || 0) - (a.rating || 0);
                });
        }
        
        // إذا كانت النتيجة فارغة والفلتر هو المميزة، يمكن العودة لجميع القوائم مع إظهار رسالة
        if (finalResults.length === 0 && this.currentQuickFilter === 'featured' && filteredBySearch.length > 0) {
            toastService.info('No featured listings found. Showing all listings instead.');
            
            // تحديث حالة النشاط للأزرار
            if (this.autoFilterContainer) {
                this.autoFilterContainer.querySelectorAll('.vr-auto-filter__btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filter === 'all');
                });
            }
            
            this.currentQuickFilter = 'all';
            return this.filterListings(listings); // تطبيق الفلتر من جديد
        }
        
        return finalResults;
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
        // فصل القوائم المميزة والعادية ثم ترتيبها
        const featuredListings = listings.filter(listing => listing.isPosted === true);
        const regularListings = listings.filter(listing => listing.isPosted !== true);
        
        // إنشاء HTML لكل مجموعة
        const featuredHTML = featuredListings.map(listing => this.createListingCard(listing, true)).join('');
        const regularHTML = regularListings.map(listing => this.createListingCard(listing, false)).join('');
        
        // تجميع المحتوى النهائي - بدون فاصل
        const html = featuredHTML + regularHTML;
        
        // عرض النتائج في الصفحة
        if (this.page === 1) {
            this.listingsGrid.innerHTML = html;
        } else {
            // في حالة تحميل المزيد، نضيف القوائم الجديدة إلى النهاية
            this.listingsGrid.insertAdjacentHTML('beforeend', html);
        }
        
        // تحديث عدد النتائج وإضافة الأحداث للبطاقات
        this.updateResultsCount(this.filteredListings.length);
        this.addCardEventListeners();
    }

    createListingCard(listing, isPremium = false) {
        const premiumClass = isPremium ? 'vr-featured__card--premium' : '';
        const premiumEffect = isPremium ? `<div class="vr-featured__glow"></div>` : '';
        
        // تحسين عرض حالة المكان (مفتوح/مغلق)
        const openingStatus = this.renderOpenStatus(listing.openingTimes);
        
        // الحصول على اسم الفئة بطريقة أكثر أماناً
        let categoryName = '';
        let categoryIcon = '';
        
        if (listing.categoryId) {
            // حالة إذا كانت البيانات كاملة في الاستجابة
            if (typeof listing.categoryId === 'object' && listing.categoryId.categoryName) {
                categoryName = listing.categoryId.categoryName;
                categoryIcon = this.getCategoryIcon(listing.categoryId);
            } 
            // حالة إذا كان لدينا فقط معرف الفئة
            else {
                const categoryId = typeof listing.categoryId === 'object' ? listing.categoryId._id : listing.categoryId;
                
                // البحث عن الفئة في البيانات المخزنة
                if (this.categoriesData && this.categoriesData.has(categoryId)) {
                    const category = this.categoriesData.get(categoryId);
                    categoryName = category.categoryName;
                    categoryIcon = this.getCategoryIcon(category);
                } else {
                    // البحث في القائمة المنسدلة
                    const option = this.categorySelect?.querySelector(`option[value="${categoryId}"]`);
                    categoryName = option ? option.textContent : '';
                    categoryIcon = this.getCategoryIcon(categoryId);
                }
            }
        }
        
        // لا نعرض شارة الميزات في الكروت، نكتفي باسم الفئة فقط
        
        return `
            <article class="vr-featured__card ${premiumClass}" data-listing-id="${listing._id}">
                ${premiumEffect}
                <div class="vr-featured__image-wrapper">
                    <img src="${listing.mainImage || '/images/defaults/default-listing.jpg'}" 
                         alt="${listing.listingName}"
                         class="vr-featured__image"
                         loading="lazy"
                         onerror="this.src='/images/defaults/default-listing.jpg'">
                    ${isPremium ? `
                    <div class="vr-featured__badge-premium">
                        <i class="fas fa-star"></i> Featured
                    </div>` : ''}
                    ${openingStatus}
                </div>
                <div class="vr-featured__content">
                    ${isPremium ? '<div class="vr-featured__premium-marker"></div>' : ''}
                    <div class="vr-featured__rating">
                        ${this.generateRatingStars(listing.rating || 0)}
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
                        ${categoryName ? `
                            <span class="vr-featured__category">
                                <i class="fas fa-tag"></i>
                                ${categoryName}
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
        `;
    }

    showEmptyState() {
        try {
            // استخدام طريقة بديلة لعرض حالة "لا توجد نتائج"
            // بدلاً من استخدام componentLoader.loadComponent
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
            
            // إضافة معالج النقر لزر مسح الفلاتر
            const clearFiltersBtn = document.getElementById('clearFiltersBtn');
            if (clearFiltersBtn) {
                clearFiltersBtn.addEventListener('click', () => this.clearFilters());
            }
            
            this.loadMoreBtn.style.display = 'none';
            this.toastService.info('No listings found matching your search criteria');
        } catch (error) {
            console.error('Error displaying empty state:', error);
            // حالة بديلة مبسطة في حال حدوث خطأ
            this.listingsGrid.innerHTML = '<div class="vr-listings-empty"><p>No listings found</p></div>';
        }
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

    updateActiveFilters() {
        if (!this.activeFiltersContainer) return;
 
        const activeFilters = Object.entries(this.filters)
            .filter(([_, value]) => value)
            .map(([type, value]) => {
                let label = value;
                let displayType = type;
                
                // تجميل نوع الفلتر للعرض
                switch(type) {
                    case 'name':
                        displayType = 'Name';
                        break;
                    case 'location':
                        displayType = 'Location';
                        break;
                    case 'categoryId':
                        displayType = 'Category';
                        // الحصول على اسم الفئة من الخيار المحدد
                        if (this.categorySelect) {
                            const option = this.categorySelect.querySelector(`option[value="${value}"]`);
                            label = option ? option.textContent : 'Unknown Category';
                        }
                        break;
                }
                
                return { 
                    type, 
                    displayType, 
                    value, 
                    label 
                };
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
                        ${filter.displayType}: ${filter.label}
                        <button class="vr-active-filter__remove" data-type="${filter.type}">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `).join('')}
                <button class="vr-active-filter vr-active-filter--clear">
                    <i class="fas fa-filter-circle-xmark"></i>
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
        const query = this.searchInput.value.trim().toLowerCase();
        
        if (query.length < this.minSearchLength) {
            this.hideSearchSuggestions();
            return;
        }
        
        this.showLoadingSuggestions();
        
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            try {
                const [nameResults, locationResults] = await Promise.all([
                    fetch(`${this.API_BASE_URL}/listing/active/?name=${query}`).then(res => res.json()),
                    fetch(`${this.API_BASE_URL}/listing/active/?location=${query}`).then(res => res.json())
                ]);
                
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
                <span>Loading...</span>
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
        this.searchSuggestions.classList.add('active');
    }

    showErrorSuggestions() {
        this.searchSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error loading suggestions</span>
            </div>
        `;
        this.searchSuggestions.classList.add('active');
    }

    showSuggestions(suggestions, query) {
        const { listings, locations } = suggestions;
        
        let html = '';
        
        // اقتراحات القوائم
        if (listings.length > 0) {
            html += `
                <div class="vr-search-suggestion__group">
                    <div class="vr-search-suggestion__group-title">Listings</div>
                    ${listings.slice(0, 4).map(listing => this.createSuggestionHTML(listing, query)).join('')}
                </div>
            `;
        }

        // اقتراحات المواقع
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
                                <div class="vr-search-suggestion__title">${this.highlightMatch(location, query)}</div>
                                <div class="vr-search-suggestion__subtitle">Location</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');
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
        
        // الحصول على اسم الفئة بنفس طريقة دالة createListingCard
        let categoryName = '';
        
        if (listing.categoryId) {
            if (typeof listing.categoryId === 'object' && listing.categoryId.categoryName) {
                categoryName = listing.categoryId.categoryName;
            } else {
                const categoryId = typeof listing.categoryId === 'object' ? listing.categoryId._id : listing.categoryId;
                
                if (this.categoriesData && this.categoriesData.has(categoryId)) {
                    categoryName = this.categoriesData.get(categoryId).categoryName;
                } else {
                    const option = this.categorySelect?.querySelector(`option[value="${categoryId}"]`);
                    categoryName = option ? option.textContent : '';
                }
            }
        }
        
        const categoryIcon = this.getCategoryIcon(listing.categoryId);
        
        return `
            <div class="vr-search-suggestion" data-id="${listing._id}">
                <div class="vr-search-suggestion__icon">
                    <i class="fas ${categoryIcon}"></i>
                </div>
                <div class="vr-search-suggestion__content">
                    <div class="vr-search-suggestion__title">${highlightedName}</div>
                    <div class="vr-search-suggestion__subtitle">
                        ${highlightedLocation}
                        ${categoryName ? `<span class="vr-search-suggestion__category">${categoryName}</span>` : ''}
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
        // خريطة الأيقونات الافتراضية للفئات
        const icons = {
            'Restaurant': 'fa-utensils',
            'Hotel': 'fa-hotel',
            'Shopping': 'fa-shopping-bag',
            'Health': 'fa-hospital',
            'Beauty': 'fa-spa',
            'Cafe': 'fa-coffee',
            'Education': 'fa-graduation-cap',
            'Entertainment': 'fa-film',
            'Automotive': 'fa-car',
            'Professional': 'fa-briefcase',
            'Sports': 'fa-futbol',
            'default': 'fa-store'
        };

        // محاولة العثور على أيقونة مخصصة للفئة
        if (category) {
            // إذا كان لدينا الفئة كاملة وليس فقط الاسم
            if (typeof category === 'object' && category.iconOne) {
                return category.iconOne; // استخدام الأيقونة من البيانات
            }
            
            // البحث في القائمة المنسدلة للعثور على أيقونة
            if (this.categorySelect && typeof category === 'string') {
                const option = this.categorySelect.querySelector(`option[value="${category}"]`) || 
                             Array.from(this.categorySelect.options).find(opt => opt.textContent === category);
                
                if (option && option.dataset.iconOne) {
                    return option.dataset.iconOne;
                }
            }
            
            // استخدام الأيقونة الافتراضية بناءً على اسم الفئة
            if (typeof category === 'string' && icons[category]) {
                return icons[category];
            } else if (typeof category === 'object' && category.categoryName && icons[category.categoryName]) {
                return icons[category.categoryName];
            }
        }

        return icons.default;
    }

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
        this.locationSuggestions.classList.add('active');
    }

    showErrorLocationSuggestions() {
        this.locationSuggestions.innerHTML = `
            <div class="vr-search-suggestion vr-search-suggestion--error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error loading suggestions</span>
            </div>
        `;
        this.locationSuggestions.classList.add('active');
    }

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
                            <div class="vr-search-suggestion__title">${this.highlightMatch(location, query)}</div>
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

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    setupFilterButtons() {
        // إنشاء حاوية للفلاتر السريعة
        this.autoFilterContainer = document.createElement('div');
        this.autoFilterContainer.className = 'vr-auto-filter';
        
        // إنشاء أزرار الفلترة
        this.autoFilterContainer.innerHTML = `
            <button class="vr-auto-filter__btn vr-auto-filter__btn--featured active" data-filter="featured">
                <i class="fas fa-star"></i> Featured Listings
            </button>
            <button class="vr-auto-filter__btn" data-filter="all">
                <i class="fas fa-list"></i> All Listings
            </button>
            <button class="vr-auto-filter__btn" data-filter="newest">
                <i class="fas fa-clock"></i> Newest First
            </button>
            <button class="vr-auto-filter__btn" data-filter="rating">
                <i class="fas fa-star-half-alt"></i> Highest Rated
            </button>
        `;
        
        // إضافة الحاوية قبل شبكة القوائم
        const parent = this.listingsGrid.parentNode;
        parent.insertBefore(this.autoFilterContainer, this.listingsGrid);
        
        // إضافة مستمعي الأحداث
        this.autoFilterContainer.querySelectorAll('.vr-auto-filter__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // تحديث حالة النشاط للأزرار
                this.autoFilterContainer.querySelectorAll('.vr-auto-filter__btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                // تطبيق الفلتر المناسب
                const filterType = btn.dataset.filter;
                this.applyQuickFilter(filterType);
            });
        });
        
        // الفلتر الافتراضي هو Featured
        this.currentQuickFilter = 'featured';
    }

    applyQuickFilter(filterType) {
        this.currentQuickFilter = filterType;
        this.page = 1;
        this.loadedListings.clear();
        this.loadInitialListings();
    }

    renderOpenStatus(openingTimes) {
        // إذا لم تكن هناك بيانات لأوقات العمل، لا يتم عرض أي شيء
        if (!openingTimes) return '';
        
        // الحصول على اليوم الحالي بالإنجليزية (مثل "Monday")
        const today = new Date().toLocaleString('en-us', {weekday: 'long'});
        
        // الحصول على حالة العمل لهذا اليوم
        const status = openingTimes[today];
        
        // إذا لم تكن هناك معلومات عن الحالة لهذا اليوم، لا يتم عرض أي شيء
        if (!status) return '';
        
        // تحديد ما إذا كان المكان مفتوحًا أم مغلقًا
        const isOpen = status.status === 'open';
        
        // تحديد نص حالة العمل، مع أوقات العمل إذا كان المكان مفتوحًا
        const statusText = isOpen 
            ? `Open: ${status.from} - ${status.to}` 
            : 'Closed';
        
        // إنشاء علامة HTML لعرض الحالة
        return `
            <span class="vr-featured__status ${isOpen ? 'vr-featured__status--open' : 'vr-featured__status--closed'}">
                <i class="fas fa-clock"></i>
                ${statusText}
            </span>
        `;
    }

    updateResultsCount(total) {
        if (this.resultsCount) {
            this.resultsCount.textContent = total;
        }
        
        const resultsHeading = document.querySelector('.vr-listings-content__info h2');
        if (resultsHeading) {
            const suffix = total === 1 ? 'Result' : 'Results';
            resultsHeading.textContent = `${total} ${suffix} Found`;
        }
        
        const noResultsMessage = document.querySelector('.vr-no-results');
        if (noResultsMessage) {
            noResultsMessage.style.display = total > 0 ? 'none' : 'block';
        }
        
        if (this.currentQuickFilter) {
            const tabs = document.querySelectorAll('.vr-auto-filter__btn');
            tabs.forEach(tab => {
                const filter = tab.dataset.filter;
                if (filter === this.currentQuickFilter) {
                    const countSpan = tab.querySelector('.vr-count');
                    if (countSpan) {
                        countSpan.textContent = total;
                    } else {
                        const newSpan = document.createElement('span');
                        newSpan.className = 'vr-count';
                        newSpan.textContent = total;
                        tab.appendChild(newSpan);
                    }
                }
            });
        }
    }

    checkAndUpdateFeaturedStatus() {
        // حساب عدد القوائم المميزة والعادية
        const featuredListings = this.filteredListings.filter(listing => listing.isPosted === true);
        const regularListings = this.filteredListings.filter(listing => listing.isPosted !== true);
        
        // تحديث أعداد القوائم في أزرار الفلترة
        const featuredBtn = this.autoFilterContainer?.querySelector('.vr-auto-filter__btn--featured');
        if (featuredBtn) {
            let countSpan = featuredBtn.querySelector('.vr-count');
            if (!countSpan) {
                countSpan = document.createElement('span');
                countSpan.className = 'vr-count';
                featuredBtn.appendChild(countSpan);
            }
            countSpan.textContent = featuredListings.length;
        }
        
        // التحقق مما إذا كانت هناك قوائم مميزة وإظهار رسالة مناسبة
        if (featuredListings.length === 0 && this.currentQuickFilter === 'featured') {
            if (regularListings.length > 0) {
                toastService.info('No featured listings available. Showing all listings instead.');
                this.currentQuickFilter = 'all';
            }
        }
    }

    async loadEmptyStateComponent() {
        return new Promise((resolve, reject) => {
            fetch('/components/listings/no-results.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load no-results component');
                    }
                    return response.text();
                })
                .then(html => {
                    resolve(html);
                })
                .catch(error => {
                    console.error('Error loading empty state component:', error);
                    reject(error);
                });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.listingsPage = new ListingsPage();
});