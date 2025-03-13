export class ProfileNavigation {
    constructor() {
        this.currentSection = 'profile';
        this.sections = {
            profile: document.getElementById('profileContainer'),
            addListing: document.getElementById('addListingContainer'),
            listings: document.getElementById('listingsContainer'),
            changePassword: document.getElementById('changePasswordContainer')
        };
        
        this.menuItems = document.querySelectorAll('.profile-item');
        this.dropdownItems = document.querySelectorAll('.vr-dropdown__item');
        
        this.init();
    }

    init() {
        this.handleInitialNavigation();
        this.setupEventListeners();
        this.setupDropdownNavigation();
        
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.navigateToSection(e.state.section, false);
            }
        });
    }

    setupDropdownNavigation() {
        const dropdownLinks = document.querySelectorAll('.vr-dropdown__item');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    const section = href.replace('#', '');
                    if (this.sections[section]) {
                        // Закрываем дропдаун
                        const dropdown = document.getElementById('profileDropdown');
                        if (dropdown) {
                            dropdown.classList.remove('active');
                        }
                        
                        // Добавляем анимацию перехода
                        this.animateTransition(() => {
                            this.navigateToSection(section);
                        });
                    }
                }
            });
        });
    }

    animateTransition(callback) {
        // Добавляем класс для анимации исчезновения
        Object.values(this.sections).forEach(section => {
            if (section && section.style.display !== 'none') {
                section.classList.add('vr-section-fade-out');
            }
        });

        // Ждем завершения анимации
        setTimeout(() => {
            callback();
            // Удаляем класс анимации и добавляем анимацию появления
            Object.values(this.sections).forEach(section => {
                if (section) {
                    section.classList.remove('vr-section-fade-out');
                    if (section.style.display !== 'none') {
                        section.classList.add('vr-section-fade-in');
                    }
                }
            });
        }, 300);
    }

    navigateToSection(section, updateHistory = true) {
        if (!this.sections[section]) {
            console.error(`Invalid section: ${section}`);
            return;
        }

        if (updateHistory) {
            const url = new URL(window.location);
            url.hash = section;
            window.history.pushState({ section }, '', url);
        }

        // Анимируем переход
        this.animateTransition(() => {
            // Скрываем все секции
            Object.values(this.sections).forEach(container => {
                if (container) {
                    container.style.display = 'none';
                    container.classList.remove('active');
                }
            });

            // Показываем целевую секцию
            if (this.sections[section]) {
                this.sections[section].style.display = 'block';
                this.sections[section].classList.add('active');
            }

            // Обновляем активные состояния
            this.updateActiveStates(section);
            this.handleSectionSpecifics(section);
        });
    }

    updateActiveStates(section) {
        // Обновляем пункты меню
        this.menuItems.forEach(item => {
            if (item.dataset.section === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Обновляем пункты дропдауна
        this.dropdownItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.includes(section)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Обновляем заголовок секции
        this.updateSectionTitle(section);
    }

    updateSectionTitle(section) {
        const titleMap = {
            profile: 'My Profile',
            addListing: 'Add New Listing',
            listings: 'My Listings',
            changePassword: 'Change Password'
        };

        const sectionTitle = document.querySelector('.vr-profile-header h5');
        if (sectionTitle && titleMap[section]) {
            sectionTitle.innerHTML = `<i class="fas ${this.getSectionIcon(section)}"></i> ${titleMap[section]}`;
        }
    }

    getSectionIcon(section) {
        const iconMap = {
            profile: 'fa-user-gear',
            addListing: 'fa-plus-circle',
            listings: 'fa-list',
            changePassword: 'fa-lock'
        };
        return iconMap[section] || 'fa-user-gear';
    }

    handleInitialNavigation() {
        const hash = window.location.hash.slice(1);
        if (hash && this.sections[hash]) {
            this.navigateToSection(hash, false);
        } else {
            // Default to profile if no hash
            this.navigateToSection('profile', false);
        }
    }

    setupEventListeners() {
        // Profile menu items click handlers
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Dropdown items click handlers
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href) {
                    const section = href.split('#')[1];
                    if (section && this.sections[section]) {
                        this.navigateToSection(section);
                        // Close dropdown
                        const dropdown = document.getElementById('profileDropdown');
                        if (dropdown) {
                            dropdown.classList.remove('active');
                        }
                    }
                }
            });
        });
    }

    handleSectionSpecifics(section) {
        switch (section) {
            case 'addListing':
                // Initialize or reset listing wizard if needed
                if (window.listingWizard) {
                    window.listingWizard.reset();
                }
                break;
                
            case 'listings':
                // Load user's listings if needed
                this.loadUserListings();
                break;
                
            case 'profile':
                // Refresh profile data if needed
                this.refreshProfileData();
                break;
        }
    }

    async loadUserListings() {
        const container = this.sections.listings;
        if (!container) return;

        try {
            container.innerHTML = '<div class="vr-loader">Loading your listings...</div>';
            
            // Add loading animation
            const response = await fetch('/api/listings/user');
            const listings = await response.json();
            
            if (listings.length === 0) {
                container.innerHTML = `
                    <div class="vr-empty-state">
                        <i class="fas fa-list"></i>
                        <p>You haven't created any listings yet.</p>
                        <a href="#addListing" class="vr-btn vr-btn--primary">
                            <i class="fas fa-plus"></i> Create Your First Listing
                        </a>
                    </div>
                `;
            } else {
                // Render listings grid
                this.renderListings(listings);
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            container.innerHTML = `
                <div class="vr-error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load your listings. Please try again.</p>
                    <button class="vr-btn vr-btn--primary" onclick="window.location.reload()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    renderListings(listings) {
        const container = this.sections.listings;
        if (!container) return;

        const html = `
            <div class="vr-listings-header">
                <h2>My Listings</h2>
                <a href="#addListing" class="vr-btn vr-btn--primary">
                    <i class="fas fa-plus"></i> Add New Listing
                </a>
            </div>
            <div class="vr-listings-grid">
                ${listings.map(listing => this.renderListingCard(listing)).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    renderListingCard(listing) {
        return `
            <div class="vr-listing-card" data-id="${listing._id}">
                <div class="vr-listing-card__image">
                    <img src="${listing.mainImage || '/images/defaults/default-listing.jpg'}" 
                         alt="${listing.listingName}"
                         onerror="this.src='/images/defaults/default-listing.jpg'">
                    <div class="vr-listing-card__status ${listing.isActive ? 'active' : 'inactive'}">
                        ${listing.isActive ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <div class="vr-listing-card__content">
                    <h3>${listing.listingName}</h3>
                    <div class="vr-listing-card__meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${listing.location || 'No location'}</span>
                        <span><i class="fas fa-eye"></i> ${listing.views || 0} views</span>
                    </div>
                </div>
                <div class="vr-listing-card__actions">
                    <button class="vr-btn vr-btn--icon" onclick="editListing('${listing._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="vr-btn vr-btn--icon" onclick="toggleListingStatus('${listing._id}')">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="vr-btn vr-btn--icon vr-btn--danger" onclick="deleteListing('${listing._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    refreshProfileData() {
        // Implement profile data refresh logic if needed
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .vr-section-fade-out {
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .vr-section-fade-in {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .vr-profile__section {
        opacity: 0;
        transform: translateY(10px);
    }

    .vr-profile__section.active {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.profileNavigation = new ProfileNavigation();
}); 