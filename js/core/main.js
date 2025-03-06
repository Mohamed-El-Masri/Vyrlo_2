// Initialize core services in the correct order
class AppInitializer {
    static async init() {
        try {
            console.log('Initializing application...');
            
            // Initialize core services in correct order
            window.utils = new Utils();
            window.toastService = new ToastService();
            window.apiService = new ApiService();
            window.authService = new AuthService();
            window.modalService = new Modal();
            window.componentLoader = new ComponentLoader();

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
            } else {
                this.onDOMReady();
            }

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            this.handleInitError(error);
        }
    }

    static async onDOMReady() {
        try {
            // Update auth state
            await window.authService.initializeAuthState();
            
            // Load components
            await window.componentLoader.init();

            // Initialize page-specific logic
            this.initializeCurrentPage();
        } catch (error) {
            console.error('Error in DOM ready handler:', error);
            this.handleInitError(error);
        }
    }

    static initializeCurrentPage() {
        // Get current page name from URL
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '');

        // Initialize page-specific class if it exists
        const pageClass = this.getPageClass(pageName);
        if (pageClass) {
            window.currentPage = new pageClass();
        }
    }

    static getPageClass(pageName) {
        const pageClasses = {
            'home': HomePage,
            'login': LoginPage,
            'register': RegisterPage,
            'forgot-password': ForgotPasswordPage,
            'reset-password': ResetPasswordPage,
            'profile': ProfilePage,
            'about': AboutPage,
            'contact': ContactPage
        };

        return pageClasses[pageName];
    }

    static handleInitError(error) {
        // Show error toast if service is available
        if (window.toastService) {
            window.toastService.error('Failed to initialize application. Please refresh the page.');
        }
        
        // Log error details
        console.error('Initialization error details:', error);
    }
}

// Start application initialization
AppInitializer.init(); 