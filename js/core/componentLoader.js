class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.preloadQueue = new Set();
        this.initializeComponents();
    }

    initializeComponents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadHeader();
            this.loadFooter();
        });
    }

    async loadHeader() {
        try {
            await this.loadComponent('headerContainer', '/components/header.html');
            if (window.AuthService) {
                await window.AuthService.updateUI();
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }

    async loadFooter() {
        try {
            await this.loadComponent('footerContainer', '/components/footer.html');
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    async loadComponent(containerId, componentPath) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        try {
            // Show skeleton loader
            container.innerHTML = this.getSkeletonLoader(containerId);

            // Get from cache or load
            let html = this.cache.get(componentPath);
            if (!html) {
                html = await this.fetchComponent(componentPath);
                this.cache.set(componentPath, html);
            }

            // Render component
            container.innerHTML = html;

            // Initialize component
            await this.initializeComponent(containerId);
        } catch (error) {
            console.error(`Error loading component ${componentPath}:`, error);
            this.handleError(containerId);
        }
    }

    async fetchComponent(componentPath) {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    getSkeletonLoader(containerId) {
        return `<div class="vr-skeleton-${containerId.replace('Container', '').toLowerCase()}"></div>`;
    }

    async initializeComponent(containerId) {
        switch(containerId) {
            case 'headerContainer':
                this.initializeHeader();
                break;
            case 'footerContainer':
                // Initialize footer if needed
                break;
        }
    }

    initializeHeader() {
        // Set active navigation link
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.vr-header__link');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.setAttribute('data-active', 'true');
            }
        });
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

// Create global instance
window.componentLoader = new ComponentLoader();