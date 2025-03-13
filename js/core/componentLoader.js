import { authService } from '../services/auth.service.js';

export class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.preloadQueue = new Set();
        this.initializeComponents();
    }

    initializeComponents() {
        // Initialize immediately if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Update on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateHeaderAuth();
            }
        });
    }

    async init() {
        try {
            await this.loadHeader();
            await this.loadFooter();
            
            // Initialize auth state
            this.updateHeaderAuth();
            authService.onAuthStateChange(() => {
                this.updateHeaderAuth();
            });
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    async loadHeader() {
        try {
            const headerContainer = document.getElementById('headerContainer');
            if (!headerContainer) return;

            // Show skeleton loader
            headerContainer.innerHTML = this.getSkeletonLoader('headerContainer');

            // Get from cache or load
            let html = this.cache.get('header');
            if (!html) {
                const response = await fetch('/components/header.html');
                if (!response.ok) throw new Error('Failed to load header');
                html = await response.text();
                this.cache.set('header', html);
            }

            // Render header
            headerContainer.innerHTML = html;

            // Initialize header
            this.setupHeaderInteractions();
            this.updateHeaderAuth();
        } catch (error) {
            console.error('Error loading header:', error);
            this.handleError('headerContainer');
        }
    }

    async loadFooter() {
        try {
            const footerContainer = document.getElementById('footerContainer');
            if (!footerContainer) return;

            let html = this.cache.get('footer');
            if (!html) {
                const response = await fetch('/components/footer.html');
                if (!response.ok) throw new Error('Failed to load footer');
                html = await response.text();
                this.cache.set('footer', html);
            }

            footerContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    setupHeaderInteractions() {
        // Mobile menu toggle
        const menuTrigger = document.getElementById('menuTrigger');
        const mainNav = document.getElementById('mainNav');
        
        if (menuTrigger && mainNav) {
            menuTrigger.addEventListener('click', () => {
                menuTrigger.classList.toggle('active');
                mainNav.classList.toggle('active');
            });
        }

        // Notification dropdown
        const notificationTrigger = document.getElementById('notificationTrigger');
        const notificationDropdown = document.getElementById('notificationDropdown');
        
        if (notificationTrigger && notificationDropdown) {
            this.setupDropdown(notificationTrigger, notificationDropdown);
        }

        // Profile dropdown
        const profileTrigger = document.getElementById('profileTrigger');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileTrigger && profileDropdown) {
            this.setupDropdown(profileTrigger, profileDropdown);
        }

        // Set active navigation link
        this.setActiveNavLink();
    }

    updateHeaderAuth() {
        const guestView = document.getElementById('guestView');
        const userView = document.getElementById('userView');
        const profileName = document.getElementById('profileName');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const headerAvatar = document.getElementById('headerAvatar');
        const dropdownAvatar = document.getElementById('dropdownAvatar');

        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getUser();
        const profile = authService.getProfile();

        if (isAuthenticated && user) {
            if (guestView) guestView.style.display = 'none';
            if (userView) userView.style.display = 'flex';
            
            if (profileName) profileName.textContent = `Hello, ${user.name}`;
            if (dropdownName) dropdownName.textContent = user.name;
            if (dropdownEmail) dropdownEmail.textContent = user.email;
            
            if (profile?.avatar) {
                const avatarUrl = profile.avatar;
                if (headerAvatar) headerAvatar.src = avatarUrl;
                if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
            }

            this.setupUserDropdown();
        } else {
            if (guestView) guestView.style.display = 'flex';
            if (userView) userView.style.display = 'none';
        }
    }

    setupUserDropdown() {
        const profileTrigger = document.getElementById('profileTrigger');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (!profileTrigger || !profileDropdown) return;

        // Remove existing listeners
        const newTrigger = profileTrigger.cloneNode(true);
        const newDropdown = profileDropdown.cloneNode(true);
        profileTrigger.parentNode.replaceChild(newTrigger, profileTrigger);
        profileDropdown.parentNode.replaceChild(newDropdown, profileDropdown);

        // Setup dropdown toggle
        newTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            newDropdown.classList.toggle('active');
            newTrigger.setAttribute('aria-expanded', 
                newDropdown.classList.contains('active').toString());
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!newDropdown.contains(e.target) && !newTrigger.contains(e.target)) {
                newDropdown.classList.remove('active');
                newTrigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Setup logout
        const logoutBtn = newDropdown.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authService.logout());
        }
    }

    setupDropdown(trigger, dropdown) {
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
            }
        };

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdown.classList.contains('active');
            
            // Close all other dropdowns
            document.querySelectorAll('.vr-header__dropdown').forEach(el => {
                el.classList.remove('active');
            });

            if (!isActive) {
                dropdown.classList.add('active');
                document.addEventListener('click', closeDropdown);
            }
        });
    }

    setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.vr-header__link');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            const page = link.getAttribute('data-page');
            
            if (currentPath === linkPath || 
                (page && currentPath.includes(page)) ||
                (currentPath === '/' && page === 'home')) {
                link.setAttribute('data-active', 'true');
            }
        });
    }

    getSkeletonLoader(containerId) {
        if (containerId === 'headerContainer') {
            return `
                <div class="vr-header vr-header--skeleton">
                    <div class="vr-header__container">
                        <div class="vr-skeleton vr-skeleton--logo"></div>
                        <div class="vr-skeleton vr-skeleton--nav"></div>
                        <div class="vr-skeleton vr-skeleton--auth"></div>
                    </div>
                </div>
            `;
        }
        return `<div class="vr-skeleton"></div>`;
    }

    handleError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="vr-error-component">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load component. Please refresh the page.</p>
                </div>
            `;
        }
    }
}

// Create a singleton instance
export const componentLoader = new ComponentLoader();