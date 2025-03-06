/**
 * Add Listing Page
 * 
 * Initializes and manages the add listing page.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Add listing page loaded');
    
    // Check if auth service is available
    if (!window.authService) {
        console.error('Auth service not found! Creating temporary instance...');
        window.authService = {
            isAuthenticated: () => {
                const token = localStorage.getItem('vr_token');
                return !!token;
            },
            getCurrentUser: () => {
                try {
                    const userData = localStorage.getItem('vr_user');
                    return userData ? JSON.parse(userData) : null;
                } catch (e) {
                    console.error('Error parsing user data:', e);
                    return null;
                }
            }
        };
    }
    
    // Check if user is logged in
    const isAuthenticated = window.authService.isAuthenticated();
    console.log('Is user authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
        window.toastService?.error('Please login to create a listing');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/pages/login.html?redirect=/pages/profile/add-listing.html';
        }, 1000);
        
        return;
    }
    
    // Get current user
    let currentUser = null;
    try {
        currentUser = window.authService.getCurrentUser();
        console.log("Current user:", currentUser);
    } catch (error) {
        console.error("Error getting current user:", error);
    }
    
    if (currentUser) {
        // Pre-fill email and contact details
        const emailField = document.getElementById('email');
        if (emailField && currentUser.email) {
            emailField.value = currentUser.email;
        }

        const mobileField = document.getElementById('mobile');
        if (mobileField && currentUser.mobile) {
            mobileField.value = currentUser.mobile;
        }
    } else {
        console.warn("User data not found in local storage");
    }
});
