class MyListingsPage {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.toastService = window.ToastService;
        this.listingsGrid = document.getElementById('listingsGrid');
        this.emptyState = document.getElementById('emptyState');
        this.loadMoreBtn = document.getElementById('loadMore');
        this.deleteModal = document.getElementById('deleteModal');
        this.selectedListingId = null;

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Load more button
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreListings());

        // Delete modal events
        document.getElementById('confirmDelete').addEventListener('click', () => this.deleteListing());
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
        this.deleteModal.querySelector('.vr-modal__close').addEventListener('click', () => this.closeDeleteModal());

        // Initialize the page when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        try {
            // Check authentication
            if (!window.AuthService.isAuthenticated()) {
                window.location.href = '/pages/login.html';
                return;
            }

            // Load initial listings
            await this.loadListings();
            
            // Load stats
            await this.loadStats();
        } catch (error) {
            console.error('Error initializing page:', error);
            this.toastService.error('Failed to load listings. Please try again later.');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/listings/stats`, {
                headers: {
                    'Authorization': `Bearer ${window.AuthService.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const stats = await response.json();
            
            // Update stats display
            document.getElementById('totalListings').textContent = stats.totalListings || 0;
            document.getElementById('totalViews').textContent = stats.totalViews || 0;
            document.getElementById('totalReviews').textContent = stats.totalReviews || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
            this.toastService.error('Failed to load statistics');
        }
    }

    async loadListings(page = 1) {
        if (this.isLoading || (!this.hasMore && page > 1)) return;

        try {
            this.isLoading = true;
            this.toggleLoadingState(true);

            const response = await fetch(`${this.API_BASE_URL}/api/listings/my?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${window.AuthService.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch listings');

            const data = await response.json();
            
            if (page === 1) {
                this.listingsGrid.innerHTML = '';
            }

            if (data.listings.length === 0 && page === 1) {
                this.showEmptyState();
                return;
            }

            this.hideEmptyState();
            this.renderListings(data.listings);
            
            // Update pagination state
            this.hasMore = data.hasMore;
            this.currentPage = page;
            this.toggleLoadMoreButton();

        } catch (error) {
            console.error('Error loading listings:', error);
            this.toastService.error('Failed to load listings');
        } finally {
            this.isLoading = false;
            this.toggleLoadingState(false);
        }
    }

    renderListings(listings) {
        listings.forEach(listing => {
            const listingCard = this.createListingCard(listing);
            this.listingsGrid.appendChild(listingCard);
        });
    }

    createListingCard(listing) {
        const card = document.createElement('div');
        card.className = 'vr-listing-card';
        card.innerHTML = `
            <div class="vr-listing-card__image">
                <img src="${listing.image || '/assets/images/placeholder.jpg'}" alt="${listing.name}">
                <div class="vr-listing-card__status ${listing.status === 'active' ? 'vr-listing-card__status--active' : ''}">
                    ${listing.status}
                </div>
            </div>
            <div class="vr-listing-card__content">
                <h3 class="vr-listing-card__title">${listing.name}</h3>
                <p class="vr-listing-card__category">${listing.category}</p>
                <div class="vr-listing-card__stats">
                    <span><i class="fas fa-eye"></i> ${listing.views || 0}</span>
                    <span><i class="fas fa-star"></i> ${listing.rating || 0}</span>
                    <span><i class="fas fa-comment"></i> ${listing.reviews || 0}</span>
                </div>
            </div>
            <div class="vr-listing-card__actions">
                <button class="vr-btn vr-btn--icon" onclick="window.location.href='/pages/edit-listing.html?id=${listing.id}'">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="vr-btn vr-btn--icon vr-btn--danger" data-listing-id="${listing.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add delete event listener
        const deleteBtn = card.querySelector('.vr-btn--danger');
        deleteBtn.addEventListener('click', () => this.showDeleteModal(listing.id));

        return card;
    }

    async loadMoreListings() {
        if (!this.isLoading && this.hasMore) {
            await this.loadListings(this.currentPage + 1);
        }
    }

    showDeleteModal(listingId) {
        this.selectedListingId = listingId;
        this.deleteModal.classList.add('vr-modal--active');
    }

    closeDeleteModal() {
        this.selectedListingId = null;
        this.deleteModal.classList.remove('vr-modal--active');
    }

    async deleteListing() {
        if (!this.selectedListingId) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/listings/${this.selectedListingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.AuthService.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete listing');

            // Remove the listing card from the UI
            const card = this.listingsGrid.querySelector(`[data-listing-id="${this.selectedListingId}"]`).closest('.vr-listing-card');
            card.remove();

            // Show success message
            this.toastService.success('Listing deleted successfully');

            // Refresh stats
            await this.loadStats();

            // Check if we need to show empty state
            if (this.listingsGrid.children.length === 0) {
                this.showEmptyState();
            }

        } catch (error) {
            console.error('Error deleting listing:', error);
            this.toastService.error('Failed to delete listing');
        } finally {
            this.closeDeleteModal();
        }
    }

    showEmptyState() {
        this.listingsGrid.style.display = 'none';
        this.emptyState.style.display = 'block';
        this.loadMoreBtn.style.display = 'none';
    }

    hideEmptyState() {
        this.listingsGrid.style.display = 'grid';
        this.emptyState.style.display = 'none';
        this.loadMoreBtn.style.display = 'block';
    }

    toggleLoadingState(isLoading) {
        this.loadMoreBtn.classList.toggle('vr-btn--loading', isLoading);
        this.loadMoreBtn.disabled = isLoading;
    }

    toggleLoadMoreButton() {
        this.loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
    }
}

// Initialize the page
const myListingsPage = new MyListingsPage(); 