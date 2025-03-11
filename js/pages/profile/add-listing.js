/**
 * Add Listing Page
 * 
 * Initializes and manages the add listing page.
 */

class AddListingPage {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        const user = window.authService.getUser();
        if (!user) {
            window.location.href = '/pages/login.html';
            return;
        }

        // Initialize listing wizard
        this.listingWizard = new ListingWizard({
            container: '#listingFormContainer',
            onSubmit: this.handleSubmit.bind(this),
            onCancel: this.handleCancel.bind(this)
        });
    }

    handleSubmit(data) {
        // Get current user
        const user = window.authService.getUser();
        if (!user) {
            window.toastService.error('Please login to create a listing');
            return;
        }

        // Add user ID to listing data
        data.userId = user.id;

        // Create listing
        window.listingService.createListing(data)
            .then(() => {
                window.toastService.success('Listing created successfully');
                window.location.href = '/pages/profile.html';
            })
            .catch(error => {
                window.toastService.error(error.message || 'Failed to create listing');
            });
    }

    handleCancel() {
        window.location.href = '/pages/profile.html';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    new AddListingPage();
});
