class ListingWizard {
    constructor() {
        // Initialize properties
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {};
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.map = null;
        this.marker = null;
        this.selectedFeatures = new Set();
        this.businessHours = {
            monday: { isOpen: true, open: '09:00', close: '17:00', closedReason: '' },
            tuesday: { isOpen: true, open: '09:00', close: '17:00', closedReason: '' },
            wednesday: { isOpen: true, open: '09:00', close: '17:00', closedReason: '' },
            thursday: { isOpen: true, open: '09:00', close: '17:00', closedReason: '' },
            friday: { isOpen: true, open: '09:00', close: '17:00', closedReason: '' },
            saturday: { isOpen: false, open: '09:00', close: '17:00', closedReason: '' },
            sunday: { isOpen: false, open: '09:00', close: '17:00', closedReason: '' }
        };
        this.is24Hours = false;
        this.categories = [];
        this.initialized = false;
        this.form = null;
        this.nextButton = null;
        this.prevButton = null;
        this.submitButton = null;
        this.progressBar = null;
        this.steps = [
            {
                icon: 'fa-info-circle',
                title: 'Basic Info',
                desc: 'Business details'
            },
            {
                icon: 'fa-location-dot',
                title: 'Location',
                desc: 'Address & Map'
            },
            {
                icon: 'fa-list-check',
                title: 'Features',
                desc: 'Business features'
            },
            {
                icon: 'fa-clock',
                title: 'Hours',
                desc: 'Business hours'
            },
            {
                icon: 'fa-images',
                title: 'Media',
                desc: 'Photos & videos'
            }
        ];

        // Initialize when DOM is ready
        this.init();
    }

    async init() {
        try {
            // Show loading indicator
            this.showLoadingIndicator(true);

            await this.waitForElements();
            this.setupEventListeners();
            await this.loadCategories();
            await this.restoreState();
            this.showStep(1);

            // Hide loading indicator
            this.showLoadingIndicator(false);
            
            this.initialized = true;
            console.log('Listing wizard initialized');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showLoadingIndicator(false);
        }
    }

    showLoadingIndicator(show) {
        const loader = document.getElementById('formLoadingIndicator');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    waitForElement(selector) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, 5000);
        });
    }

    async waitForElements() {
        // Wait for all required elements
        const elements = await Promise.all([
            this.waitForElement('#listingWizardForm'),
            this.waitForElement('#nextStep'),
            this.waitForElement('#prevStep'),
            this.waitForElement('#submitListing'),
            this.waitForElement('.vr-progress-fill')
        ]);

        // Assign elements
        [this.form, this.nextButton, this.prevButton, this.submitButton, this.progressBar] = elements;

        if (!this.form || !this.nextButton || !this.prevButton || !this.submitButton) {
            throw new Error('Required elements not found');
        }
    }

    setupEventListeners() {
        // Navigation
        this.nextButton.addEventListener('click', () => this.nextStep());
        this.prevButton.addEventListener('click', () => this.previousStep());
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Input changes
        this.form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => this.updateFormData());
        });

        // Add location search functionality
        const locationInput = document.getElementById('location');
        if (locationInput) {
            let typingTimer;
            const doneTypingInterval = 500;

            locationInput.addEventListener('input', () => {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    this.searchLocation(locationInput.value);
                }, doneTypingInterval);
            });
        }

        // Business hours listeners
        const is24HoursToggle = document.getElementById('is24Hours');
        if (is24HoursToggle) {
            is24HoursToggle.addEventListener('change', this.handle24HoursToggle.bind(this));
        }

        const copyHoursBtn = document.getElementById('copyHours');
        if (copyHoursBtn) {
            copyHoursBtn.addEventListener('click', this.copyHoursToAllDays.bind(this));
        }
    }

    showStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.totalSteps) return;

        const steps = document.querySelectorAll('.vr-wizard-step');
        const direction = stepNumber > this.currentStep ? 'next' : 'prev';

        steps.forEach(step => {
            step.style.display = 'none';
            step.classList.remove('active', 'prev');
        });

        const currentStep = document.querySelector(`.vr-wizard-step[data-step="${stepNumber}"]`);
        if (!currentStep) {
            console.error(`Step ${stepNumber} not found`);
            return;
        }

        // Show step with animation
        currentStep.style.display = 'block';
        requestAnimationFrame(() => {
            currentStep.classList.add('active');
        });

        // Update progress indicators
        document.querySelectorAll('.vr-step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.toggle('active', stepNum === stepNumber);
            step.classList.toggle('completed', stepNum < stepNumber);
        });

        this.currentStep = stepNumber;

        // Initialize map only on location step
        if (stepNumber === 2) {
            setTimeout(() => this.initializeMap(), 100);
        }

        // Initialize business hours on step 4
        if (stepNumber === 4) {
            this.renderBusinessHours();
        }

        this.updateProgress();
        this.updateButtons();
        console.log(`Showing step ${stepNumber}`);

        // Update step UI with animation
        this.updateStepUI(stepNumber, direction);

        // Initialize media handlers on step 5
        if (stepNumber === 5) {
            this.setupMediaHandlers();
        }
    }

    initializeMap() {
        const mapContainer = document.getElementById('listingMap');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // First, clean up any existing map
        this.cleanupMap();

        // Reset the container
        mapContainer.innerHTML = '';

        try {
            // Create a fallback UI in case map tiles fail to load
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'vr-map-fallback';
            fallbackDiv.innerHTML = `
                <div class="vr-map-fallback__content">
                    <i class="fas fa-map-marked-alt"></i>
                    <h4>Map service unavailable</h4>
                    <p>You can still manually enter your location information below.</p>
                </div>
            `;
            mapContainer.appendChild(fallbackDiv);
            
            // Wait a bit for the DOM to be ready
            setTimeout(() => {
                if (!this.map) {
                    try {
                        this.map = L.map(mapContainer, {
                            // Added error handlers
                            attributionControl: false,
                        }).setView([30.0444, 31.2357], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors',
                            // Error handling for tiles
                            errorTileUrl: '../../images/map-fallback-tile.png'
                        }).addTo(this.map);

                        // Show offline warning if tiles fail to load
                        this.map.on('tileerror', () => {
                            if (!document.querySelector('.vr-map-offline-warning')) {
                                const warning = document.createElement('div');
                                warning.className = 'vr-map-offline-warning';
                                warning.innerHTML = `
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Map data couldn't be loaded. You can still manually enter location.</span>
                                `;
                                mapContainer.appendChild(warning);
                            }
                        });

                        // Bind the click handler with the correct context
                        this.map.on('click', (e) => this.handleMapClick(e));

                        // Restore marker if coordinates exist
                        if (this.formData?.latitude && this.formData?.longitude) {
                            const latlng = {
                                lat: parseFloat(this.formData.latitude),
                                lng: parseFloat(this.formData.longitude)
                            };
                            this.marker = L.marker(latlng).addTo(this.map);
                            this.map.setView(latlng, 13);
                        }

                        // Fix map display
                        this.map.invalidateSize();
                    } catch (mapError) {
                        console.error('Map initialization error:', mapError);
                        fallbackDiv.style.display = 'flex';
                    }
                }
            }, 100);

        } catch (error) {
            console.error('Error initializing map:', error);
            this.cleanupMap();
            // Show fallback UI
            const fallbackUI = document.querySelector('.vr-map-fallback');
            if (fallbackUI) fallbackUI.style.display = 'flex';
        }
    }

    handleMapClick = (e) => {
        try {
            // Remove existing marker
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }

            // Add new marker
            this.marker = L.marker(e.latlng).addTo(this.map);

            // Update form fields
            const latInput = document.getElementById('latitude');
            const lngInput = document.getElementById('longitude');
            
            if (latInput && lngInput) {
                latInput.value = e.latlng.lat.toFixed(6);
                lngInput.value = e.latlng.lng.toFixed(6);
            }

            // Get address using reverse geocoding
            this.reverseGeocode(e.latlng);

            // Update form data
            this.updateFormData();

        } catch (error) {
            console.error('Error handling map click:', error);
        }
    }

    async reverseGeocode(latlng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
            );
            
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            const locationInput = document.getElementById('location');
            
            if (locationInput && data.display_name) {
                locationInput.value = data.display_name;
                this.updateFormData();
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            window.toastService?.error('Failed to get address');
        }
    }

    async searchLocation(query) {
        if (!query || query.length < 3) return;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
            );
            
            const results = await response.json();
            this.showLocationSuggestions(results);
        } catch (error) {
            console.error('Location search error:', error);
            // Show graceful fallback for search
            let suggestionsContainer = document.getElementById('locationSuggestions');
            
            if (!suggestionsContainer) {
                suggestionsContainer = document.createElement('div');
                suggestionsContainer.id = 'locationSuggestions';
                suggestionsContainer.className = 'vr-location-suggestions';
                document.getElementById('location').parentNode.appendChild(suggestionsContainer);
            }
            
            suggestionsContainer.innerHTML = `
                <div class="vr-location-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Location search is unavailable. Please enter location manually.</span>
                </div>
            `;
            suggestionsContainer.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                suggestionsContainer.style.display = 'none';
            }, 5000);
        }
    }

    showLocationSuggestions(results) {
        let suggestionsContainer = document.getElementById('locationSuggestions');
        
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'locationSuggestions';
            suggestionsContainer.className = 'vr-location-suggestions';
            document.getElementById('location').parentNode.appendChild(suggestionsContainer);
        }

        if (!results.length) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = results.slice(0, 5).map(result => `
            <div class="vr-location-suggestion" 
                 data-lat="${result.lat}" 
                 data-lon="${result.lon}"
                 data-name="${result.display_name}">
                <i class="fas fa-map-marker-alt"></i>
                ${result.display_name}
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        // Add click handlers
        suggestionsContainer.querySelectorAll('.vr-location-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const lat = suggestion.dataset.lat;
                const lon = suggestion.dataset.lon;
                const name = suggestion.dataset.name;

                document.getElementById('location').value = name;
                document.getElementById('latitude').value = lat;
                document.getElementById('longitude').value = lon;

                // Update map
                const latlng = { lat: parseFloat(lat), lng: parseFloat(lon) };
                if (this.map) {
                    if (this.marker) {
                        this.map.removeLayer(this.marker);
                    }
                    this.marker = L.marker(latlng).addTo(this.map);
                    this.map.setView(latlng, 15);
                }

                // Hide suggestions
                suggestionsContainer.style.display = 'none';
                
                // Update form data
                this.updateFormData();
            });
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#locationSuggestions') && 
                !e.target.closest('#location')) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    nextStep = () => {
        if (this.validateStep(this.currentStep)) {
            this.updateFormData();
            this.showStep(this.currentStep + 1);
        }
    }

    previousStep = () => {
        if (this.currentStep > 1) {
            // Clean up map if leaving location step
            if (this.currentStep === 2) {
                this.cleanupMap();
            }
            this.showStep(this.currentStep - 1);
        }
    }

    cleanupMap() {
        try {
            if (this.marker) {
                this.marker.remove();
                this.marker = null;
            }
            if (this.map) {
                this.map.off();
                this.map.remove();
                this.map = null;
            }
        } catch (error) {
            console.error('Error cleaning up map:', error);
        }
    }

    cleanup() {
        this.cleanupMap();
        if (this.initialized) {
            // Remove event listeners
            this.nextButton?.removeEventListener('click', this.nextStep);
            this.prevButton?.removeEventListener('click', this.previousStep);
            this.form?.removeEventListener('submit', this.handleSubmit);
        }
    }

    updateButtons() {
        if (!this.prevButton || !this.nextButton || !this.submitButton) {
            console.error('Navigation buttons not found');
            return;
        }

        this.prevButton.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
        this.nextButton.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-flex';
        this.submitButton.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
    }

    updateProgress() {
        if (!this.progressBar) return;
        
        const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        
        // Animate progress bar
        requestAnimationFrame(() => {
            this.progressBar.style.width = `${progress}%`;
        });

        // Update step indicators with delay for smooth animation
        const steps = document.querySelectorAll('.vr-step');
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            setTimeout(() => {
                step.classList.toggle('active', stepNum === this.currentStep);
                step.classList.toggle('completed', stepNum < this.currentStep);
            }, index * 100);
        });
    }

    destroy() {
        this.cleanup();
        localStorage.removeItem('listingWizardState');
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        
        try {
            // Show loading state
            this.showLoadingIndicator(true);
            this.submitButton.disabled = true;

            // Get raw token from localStorage
            const token = localStorage.getItem('vr_token');
            console.log('Token from localStorage:', token ? 'Found' : 'Not found');
            
            if (!token) {
                window.toastService?.error('Please login to create a listing');
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 1500);
                return;
            }

            // Get user data directly from localStorage
            let userId = "default_user_id";
            let userEmail = "info@example.com";
            let userMobile = "123456789";
            
            try {
                // Try both possible user data storage keys
                const userData = localStorage.getItem('vr_user') || localStorage.getItem('vr_profile');
                if (userData) {
                    const user = JSON.parse(userData);
                    userId = user.userId || user.id || userId;
                    userEmail = user.email || userEmail;
                    userMobile = user.phoneNumber || user.mobile || userMobile;
                    console.log("User data retrieved:", user);
                } else {
                    console.warn("No user data found in localStorage");
                }
            } catch (userError) {
                console.error("Failed to parse user data:", userError);
            }

            if (!this.validateAllSteps()) {
                return;
            }

            // Include all selected amenities in the listing data
            const amenitiesList = Array.from(this.selectedFeatures);

            // Prepare listing data according to API structure
            let listingData = {
                userId: userId,
                listingName: this.formData.listingName,
                categoryId: this.formData.categoryId,
                location: this.formData.location || 'Sample Location',
                longitude: this.formData.longitude || "-122.4194",
                latitude: this.formData.latitude || "37.7749",
                reviewIds: [],
                description: this.formData.description,
                amenitielsList: amenitiesList,
                itemsIds: [],
                isActive: true,
                gallery: ["https://placehold.co/600x400?text=Gallery+1", "https://placehold.co/600x400?text=Gallery+2"],
                mainImage: "https://placehold.co/600x400?text=Main+Image", 
                email: this.formData.email || userEmail,
                mobile: this.formData.mobile || userMobile,
                taxNumber: this.formData.taxNumber || "12345",
                isPosted: true,
                openingTimes: this.convertBusinessHours(),
                socialMediaAccounts: []
            };

            console.log("Sending listing data:", listingData);
            
            // IMPORTANT: Use 'token' as key (not 'Authorization')
            // The API expects the raw token without 'Bearer ' prefix
            const headers = {
                'Content-Type': 'application/json',
                'token': token // Direct use of raw token
            };
            
            console.log("Request headers:", headers);
            
            // Added retry mechanism
            const maxRetries = 3;
            let retryCount = 0;
            let success = false;
            
            while (!success && retryCount < maxRetries) {
                try {
                    const response = await fetch(`${this.API_BASE_URL}/listing`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(listingData)
                    });
                    
                    console.log("Response status:", response.status);
                    
                    if (response.ok) {
                        success = true;
                        const result = await response.json();
                        console.log("Listing created successfully:", result);
                        
                        // Success handling
                        window.toastService?.success('Listing created successfully');
                        
                        // Clear form data from localStorage
                        localStorage.removeItem('listingWizardState');
                        
                        // Redirect to listings page
                        setTimeout(() => {
                            window.location.href = '/pages/profile/myListings.html';
                        }, 1500);
                        
                        break;
                    } else {
                        // Try to get detailed error message
                        let errorMessage = 'Failed to create listing';
                        try {
                            const errorData = await response.json();
                            console.error("Server error response:", errorData);
                            errorMessage = errorData.message || errorMessage;
                            
                            // Special handling for token errors - try to refresh token
                            if (
                                errorMessage.includes('token') || 
                                errorMessage.toLowerCase().includes('auth') || 
                                response.status === 401 || 
                                response.status === 403
                            ) {
                                console.warn("Auth error detected, refreshing token...");
                                if (window.AuthHelper && retryCount < maxRetries - 1) {
                                    token = window.AuthHelper.getRefreshedToken();
                                    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                                }
                            }
                        } catch (jsonError) {
                            console.error("Error parsing error response:", jsonError);
                            errorMessage = response.statusText || errorMessage;
                        }
                        
                        if (retryCount === maxRetries - 1) {
                            throw new Error(errorMessage);
                        }
                    }
                } catch (fetchError) {
                    console.error("Fetch error:", fetchError);
                    if (retryCount === maxRetries - 1) {
                        throw fetchError;
                    }
                }
                
                // Increment retry counter
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`Retrying... (${retryCount}/${maxRetries})`);
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }

        } catch (error) {
            console.error('Submit error:', error);
            window.toastService?.error(error.message || 'Failed to create listing');
        } finally {
            this.showLoadingIndicator(false);
            this.submitButton.disabled = false;
        }
    }

    // Add a convenience method to check token validity
    checkToken() {
        const token = localStorage.getItem('vr_token');
        if (!token) {
            return false;
        }
        
        try {
            // Simple check - JWT tokens have three parts separated by dots
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    }

    // async uploadImage(formData) {
    //     try {
    //         const token = localStorage.getItem('vr_token');
    //         if (!token) {
    //             throw new Error('Authentication required');
    //         }

    //         // Change to correct upload endpoint
    //         const response = await fetch(`${this.API_BASE_URL}/files/upload`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             },
    //             body: formData
    //         });

    //         if (!response.ok) {
    //             const error = await response.json();
    //             throw new Error(error.message || 'Failed to upload image');
    //         }

    //         const data = await response.json();
    //         return { url: data.url }; // Make sure to return the correct image URL format
    //     } catch (error) {
    //         console.error('Image upload error:', error);
    //         window.toastService?.error('Failed to upload image: ' + error.message);
    //         return { url: null };
    //     }
    // }

    convertBusinessHours() {
        const converted = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
            const hours = this.businessHours[day];
            const dayName = day.charAt(0).toUpperCase() + day.slice(1);
            
            converted[dayName] = {
                status: hours.isOpen ? 'open' : 'closed',
                ...(hours.isOpen ? {
                    from: hours.open,
                    to: hours.close
                } : {
                    closedReason: hours.closedReason || 'Closed'
                })
            };
        });

        return converted;
    }

    async loadCategories() {
        try {
            if (this.categories.length === 0) {
                const response = await fetch(`${this.API_BASE_URL}/categories`);
                if (!response.ok) throw new Error('Failed to fetch categories');
                
                this.categories = await response.json();
                console.log('Categories loaded:', this.categories);
            }
            
            this.renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            window.toastService?.error('Failed to load categories');
        }
    }

    async restoreState() {
        const savedState = localStorage.getItem('listingWizardState');
        if (!savedState) return;

        try {
            const state = JSON.parse(savedState);
            this.formData = state.formData || {};
            this.currentStep = state.currentStep || 1;
            this.selectedFeatures = new Set(state.selectedFeatures || []);

            // If we have a stored category, make sure it's in our categories array
            if (this.formData.category) {
                const categoryExists = this.categories.some(c => c._id === this.formData.categoryId);
                if (!categoryExists) {
                    this.categories.push(this.formData.category);
                }
            }

            // Restore form values
            Object.entries(this.formData).forEach(([key, value]) => {
                const field = this.form.elements[key];
                if (field && typeof value !== 'object') {
                    field.value = value;
                }
            });

            // Update category name display if we're on step 3
            if (this.currentStep === 3 && this.formData.categoryName) {
                const categoryNameDisplay = document.getElementById('selectedCategoryName');
                if (categoryNameDisplay) {
                    categoryNameDisplay.textContent = this.formData.categoryName;
                }
            }

            console.log('Form state restored:', this.formData);
        } catch (error) {
            console.error('Error restoring state:', error);
            localStorage.removeItem('listingWizardState');
        }
    }

    saveState() {
        const state = {
            currentStep: this.currentStep,
            formData: this.formData,
            selectedFeatures: Array.from(this.selectedFeatures)
        };
        localStorage.setItem('listingWizardState', JSON.stringify(state));
    }

    updateFormData() {
        const formData = new FormData(this.form);
        this.formData = Object.fromEntries(formData.entries());
        
        // Make sure to save the selectedFeatures in formData
        this.formData.amenitiesList = Array.from(this.selectedFeatures);
        
        this.formData.businessHours = this.businessHours;
        this.formData.is24Hours = this.is24Hours;
        this.saveState();
    }

    renderCategories() {
        const select = document.getElementById('categoryId');
        if (!select) {
            console.error('Category select element not found');
            return;
        }

        select.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.categoryName;
            select.appendChild(option);
        });

        // Restore selected category if exists
        if (this.formData.categoryId) {
            select.value = this.formData.categoryId;
            this.handleCategoryChange(this.formData.categoryId);
        }

        // Add change handler
        select.addEventListener('change', (e) => this.handleCategoryChange(e.target.value));
    }

    async handleCategoryChange(categoryId) {
        if (!categoryId) return;
        
        // Find selected category
        const category = this.categories.find(c => c._id === categoryId);
        if (!category) return;
        
        console.log('Selected category:', category);

        // Store category data - use just the ID for the API
        this.formData.categoryId = category._id;
        this.formData.categoryName = category.categoryName;
        this.formData.category = category; // Store full category object for UI
        this.saveState(); // Save to localStorage

        // Update UI
        const categoryNameDisplay = document.getElementById('selectedCategoryName');
        if (categoryNameDisplay) {
            categoryNameDisplay.textContent = category.categoryName;
        }

        // Reset features
        this.selectedFeatures.clear();
        this.renderFeatures(category);
        
        console.log('Updated form data:', this.formData);
    }

    renderFeatures(category) {
        const container = document.getElementById('featuresContainer');
        if (!container) return;
        
        if (!category?.amenities?.length) {
            container.innerHTML = '<p class="vr-empty-state">No features available for this category</p>';
            return;
        }

        container.innerHTML = category.amenities.map(feature => `
            <div class="vr-feature-item ${this.selectedFeatures.has(feature) ? 'active' : ''}">
                <label class="vr-feature-label">
                    <input type="checkbox" 
                           name="amenitiesList" 
                           value="${feature}"
                           ${this.selectedFeatures.has(feature) ? 'checked' : ''}>
                    <span class="vr-feature-text">${feature}</span>
                </label>
            </div>
        `).join('');

        // Setup feature event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const feature = e.target.value;
                if (e.target.checked) {
                    this.selectedFeatures.add(feature);
                    e.target.closest('.vr-feature-item').classList.add('active');
                } else {
                    this.selectedFeatures.delete(feature);
                    e.target.closest('.vr-feature-item').classList.remove('active');
                }
                this.updateFormData();
            });
        });

        // Setup add feature button
        const addFeatureBtn = document.getElementById('addCustomFeature');
        if (addFeatureBtn) {
            addFeatureBtn.onclick = () => this.showFeatureDialog();
        }
    }

    showFeatureDialog() {
        const dialog = document.getElementById('featureDialog');
        const input = dialog.querySelector('#newFeature');
        
        dialog.style.display = 'block';
        input.value = '';
        input.focus();

        const handleDialog = (e) => {
            const action = e.target.dataset.action;
            if (action === 'confirm') {
                const feature = input.value.trim();
                if (feature) {
                    this.addCustomFeature(feature);
                }
            }
            dialog.style.display = 'none';
        };

        // Remove any existing event listeners
        const buttons = dialog.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        // Add new event listeners
        dialog.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', handleDialog);
        });
    }

    addCustomFeature(featureName) {
        // No need to update API, just add to local list
        if (!featureName || this.selectedFeatures.has(featureName)) return;
        
        // Add to selectedFeatures
        this.selectedFeatures.add(featureName);
        
        // Update UI
        const container = document.getElementById('featuresContainer');
        if (!container) return;
        
        const featureItem = document.createElement('div');
        featureItem.className = 'vr-feature-item active vr-feature-item--custom';
        featureItem.innerHTML = `
            <label class="vr-feature-label">
                <input type="checkbox" 
                       name="amenitiesList" 
                       value="${featureName}"
                       checked>
                <span class="vr-feature-text">${featureName}</span>
            </label>
            <span class="vr-feature-badge">Custom</span>
        `;
        
        container.appendChild(featureItem);
        
        // Add event listener for the new checkbox
        const checkbox = featureItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            if (!e.target.checked) {
                this.selectedFeatures.delete(featureName);
                featureItem.classList.remove('active');
            } else {
                this.selectedFeatures.add(featureName);
                featureItem.classList.add('active');
            }
            this.updateFormData();
        });
        
        // Update form data
        this.updateFormData();
        window.toastService?.success('Custom feature added');
    }

    renderBusinessHours() {
        try {
            const container = document.getElementById('businessHoursContainer');
            if (!container) return;
            
            console.log('Current business hours:', this.businessHours);
            
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const hoursHTML = days.map(day => {
                const hours = this.businessHours[day];
                const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                
                return `
                    <div class="vr-hours-row ${!hours.isOpen ? 'closed' : ''}" data-day="${day}">
                        <div class="vr-hours-label">
                            <span class="vr-hours-day">${dayName}</span>
                            <span class="vr-hours-status ${hours.isOpen ? 'open' : 'closed'}">
                                ${hours.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>
                        <div class="vr-hours-inputs ${!hours.isOpen ? 'disabled' : ''}">
                            <div class="vr-time-input">
                                <label>Open</label>
                                <input type="time" 
                                       class="vr-input" 
                                       name="${day}_open" 
                                       value="${hours.open}"
                                       ${!hours.isOpen ? 'disabled' : ''}>
                            </div>
                            <span class="vr-hours-divider">to</span>
                            <div class="vr-time-input">
                                <label>Close</label>
                                <input type="time" 
                                       class="vr-input" 
                                       name="${day}_close" 
                                       value="${hours.close}"
                                       ${!hours.isOpen ? 'disabled' : ''}>
                            </div>
                        </div>
                        <div class="vr-hours-actions">
                            <label class="vr-toggle">
                                <input type="checkbox" 
                                       name="${day}_isOpen"
                                       ${hours.isOpen ? 'checked' : ''}>
                                <span class="vr-toggle-slider"></span>
                            </label>
                        </div>
                        <div class="vr-hours-closed-reason ${!hours.isOpen ? 'show' : ''}">
                            <input type="text" 
                                   class="vr-input"
                                   name="${day}_closedReason"
                                   placeholder="Reason for closing (optional)"
                                   value="${hours.closedReason || ''}"
                                   ${hours.isOpen ? 'disabled' : ''}>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="vr-hours-grid">
                    ${hoursHTML}
                </div>
            `;

            this.setupBusinessHoursListeners();

            // Restore 24/7 state
            const is24HoursToggle = document.getElementById('is24Hours');
            if (is24HoursToggle) {
                is24HoursToggle.checked = this.is24Hours;
                if (this.is24Hours) {
                    container.classList.add('disabled');
                }
            }

        } catch (error) {
            console.error('Error rendering business hours:', error);
        }
    }

    setupBusinessHoursListeners() {
        const container = document.getElementById('businessHoursContainer');
        if (!container) return;

        // Handle day toggles
        container.querySelectorAll('.vr-toggle input[type="checkbox"]').forEach(toggle => {
            const day = toggle.closest('.vr-hours-row').dataset.day;
            toggle.addEventListener('change', (e) => {
                this.handleDayToggle(day, e.target.checked);
            });
        });

        // Handle time inputs
        container.querySelectorAll('input[type="time"]').forEach(input => {
            const day = input.closest('.vr-hours-row').dataset.day;
            const type = input.name.includes('open') ? 'open' : 'close';
            input.addEventListener('change', (e) => {
                this.updateHours(day, type, e.target.value);
            });
        });

        // Handle 24/7 toggle
        const is24HoursToggle = document.getElementById('is24Hours');
        if (is24HoursToggle) {
            is24HoursToggle.addEventListener('change', (e) => {
                this.handle24HoursToggle(e);
            });
        }

        // Handle copy hours
        const copyHoursBtn = document.getElementById('copyHours');
        if (copyHoursBtn) {
            copyHoursBtn.addEventListener('click', () => {
                this.copyHoursToAllDays();
            });
        }
    }

    handleDayToggle(day, isOpen) {
        try {
            // Update business hours state
            this.businessHours[day].isOpen = isOpen;
            
            // Find the row element
            const row = document.querySelector(`.vr-hours-row[data-day="${day}"]`);
            if (!row) return;

            // Update row state
            row.classList.toggle('closed', !isOpen);

            // Update inputs
            const timeInputs = row.querySelectorAll('input[type="time"]');
            timeInputs.forEach(input => {
                input.disabled = !isOpen;
            });

            // Update reason input
            const reasonInput = row.querySelector('input[name$="_closedReason"]');
            if (reasonInput) {
                reasonInput.disabled = isOpen;
                if (isOpen) {
                    reasonInput.value = '';
                    this.businessHours[day].closedReason = '';
                }
                row.querySelector('.vr-hours-closed-reason').classList.toggle('show', !isOpen);
            }

            // Update status text
            const statusEl = row.querySelector('.vr-hours-status');
            if (statusEl) {
                statusEl.textContent = isOpen ? 'Open' : 'Closed';
                statusEl.className = `vr-hours-status ${isOpen ? 'open' : 'closed'}`;
            }

            this.updateFormData();
            
        } catch (error) {
            console.error('Error handling day toggle:', error);
        }
    }

    updateHours(day, type, value) {
        try {
            if (!this.businessHours[day]) return;

            this.businessHours[day][type] = value;
            const row = document.querySelector(`.vr-hours-row[data-day="${day}"]`);
            
            // Validate time range
            if (type === 'close' && value <= this.businessHours[day].open) {
                window.toastService?.warning('Closing time must be after opening time');
                return;
            }

            this.updateFormData();
            
        } catch (error) {
            console.error('Error updating hours:', error);
        }
    }

    handle24HoursToggle(event) {
        try {
            this.is24Hours = event.target.checked;
            const container = document.getElementById('businessHoursContainer');
            
            if (this.is24Hours) {
                Object.keys(this.businessHours).forEach(day => {
                    this.businessHours[day] = {
                        isOpen: true,
                        open: '00:00',
                        close: '23:59',
                        closedReason: ''
                    };
                });
                container?.classList.add('disabled');
            } else {
                container?.classList.remove('disabled');
            }
            
            this.renderBusinessHours();
            this.updateFormData();
            
            window.toastService?.success(
                this.is24Hours ? 'Set to 24/7 operation' : 'Restored custom hours'
            );
            
        } catch (error) {
            console.error('Error handling 24/7 toggle:', error);
        }
    }

    copyHoursToAllDays() {
        try {
            const mondayHours = { ...this.businessHours.monday };
            Object.keys(this.businessHours).forEach(day => {
                if (day !== 'monday') {
                    this.businessHours[day] = { 
                        ...mondayHours,
                        closedReason: mondayHours.isOpen ? '' : mondayHours.closedReason 
                    };
                }
            });
            
            this.renderBusinessHours();
            this.updateFormData();
            window.toastService?.success('Hours copied to all days');
            
        } catch (error) {
            console.error('Error copying hours:', error);
            window.toastService?.error('Failed to copy hours');
        }
    }

    validateStep(stepNumber) {
        const rules = {
            1: {
                listingName: { required: true, minLength: 3 },
                categoryId: { required: true },
                description: { required: true, minLength: 5 }
            },
            2: {
                // Make location fields optional for now
                // location: { required: true },
                // latitude: { required: true },
                // longitude: { required: true }
            },
            3: {
                // Features validation (optional)
            },
            4: {
                // Business hours validation (optional)
            },
            5: {
                // Make media fields optional
                // email: { required: true, email: true },
                // mobile: { required: true }
            }
        };

        const stepRules = rules[stepNumber];
        if (!stepRules) return true; // If no rules defined for this step

        let isValid = true;
        const errors = [];

        // Clear previous validation messages
        document.querySelectorAll('.vr-validation-message').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        // Validate each field in the step
        Object.entries(stepRules).forEach(([fieldName, validations]) => {
            const field = document.getElementById(fieldName);
            if (!field) return;

            let fieldValue = field.value.trim();
            let fieldIsValid = true;
            let errorMessage = '';

            // Required validation
            if (validations.required && !fieldValue) {
                fieldIsValid = false;
                errorMessage = `${this.formatFieldName(fieldName)} is required`;
            }

            // Minimum length validation
            if (fieldIsValid && validations.minLength && fieldValue.length < validations.minLength) {
                fieldIsValid = false;
                errorMessage = `${this.formatFieldName(fieldName)} must be at least ${validations.minLength} characters`;
            }

            // Email validation
            if (fieldIsValid && validations.email && !this.isValidEmail(fieldValue)) {
                fieldIsValid = false;
                errorMessage = 'Please enter a valid email address';
            }

            if (!fieldIsValid) {
                isValid = false;
                field.classList.add('is-invalid');
                this.showFieldError(field, errorMessage);
                errors.push(errorMessage);
            }
        });

        // Show step validation summary if there are errors
        if (!isValid) {
            this.showStepErrors(errors, stepNumber);
            window.toastService?.error('Please fix the validation errors');
        }

        return isValid;
    }

    validateAllSteps() {
        for (let step = 1; step <= this.totalSteps; step++) {
            const isValid = this.validateStep(step);
            if (!isValid) {
                this.showStep(step);
                return false;
            }
        }
        return true;
    }

    formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/Id$/, '');
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'vr-validation-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    showStepErrors(errors, stepNumber) {
        const step = document.querySelector(`.vr-wizard-step[data-step="${stepNumber}"]`);
        if (!step) return;

        const errorSummary = document.createElement('div');
        errorSummary.className = 'vr-step-validation';
        errorSummary.innerHTML = `
            <div class="vr-validation-summary">
                <i class="fas fa-exclamation-circle"></i>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;

        // Remove any existing error summary
        const existingSummary = step.querySelector('.vr-step-validation');
        if (existingSummary) {
            existingSummary.remove();
        }

        step.appendChild(errorSummary);
    }

    updateStepUI(stepNumber, direction = 'next') {
        const step = this.steps[stepNumber - 1];
        if (!step) return;

        // Update step icon and title
        const stepElement = document.querySelector(`.vr-step[data-step="${stepNumber}"]`);
        if (stepElement) {
            const iconElement = stepElement.querySelector('.vr-step-icon i');
            const titleElement = stepElement.querySelector('.vr-step-title');
            const descElement = stepElement.querySelector('.vr-step-desc');

            if (iconElement) {
                iconElement.className = `fas ${step.icon}`;
            }
            if (titleElement) {
                titleElement.textContent = step.title;
            }
            if (descElement) {
                descElement.textContent = step.desc;
            }

            // Add animation classes
            stepElement.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
            setTimeout(() => {
                stepElement.classList.remove('slide-in-right', 'slide-in-left');
            }, 500);
        }
    }

    setupMediaHandlers() {
        if (this.currentStep !== 5) return;

        this.setupMainImageUpload();
        this.setupGalleryUpload();
        this.setupVideoPreview();
    }

    setupMainImageUpload() {
        const dropZone = document.getElementById('mainImageUpload');
        const input = document.getElementById('mainImage');
        const preview = document.querySelector('.vr-media-preview');
        const previewImg = document.getElementById('mainImagePreview');
        const removeBtn = document.getElementById('removeMainImage');

        if (!dropZone || !input || !preview || !previewImg || !removeBtn) return;

        const handleDragOver = (e) => {
            e.preventDefault();
            dropZone.classList.add('vr-media-dragover');
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
        };

        const handleDrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) this.handleMainImage(file);
        };

        // Setup event listeners
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        dropZone.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleMainImage(file);
        });

        removeBtn.addEventListener('click', () => {
            input.value = '';
            preview.style.display = 'none';
            previewImg.src = '';
            this.formData.mainImage = null;
            this.updateFormData();
        });
    }

    async handleMainImage(file) {
        try {
            if (!this.validateImageFile(file)) return;

            const preview = document.querySelector('.vr-media-preview');
            const previewImg = document.getElementById('mainImagePreview');
            
            // Show loading state
            preview.classList.add('vr-media-loading');
            
            // Process image
            const processedImage = await this.processImage(file);
            
            // Update preview
            preview.style.display = 'block';
            previewImg.src = URL.createObjectURL(processedImage);
            this.formData.mainImage = processedImage;
            
            // Update form
            this.updateFormData();
            window.toastService?.success('Main image updated successfully');
            
        } catch (error) {
            console.error('Error handling main image:', error);
            window.toastService?.error('Failed to process image');
        } finally {
            document.querySelector('.vr-media-preview')?.classList.remove('vr-media-loading');
        }
    }

    validateImageFile(file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            window.toastService?.error('Please upload an image file');
            return false;
        }

        // Check file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            window.toastService?.error('Image size should not exceed 5MB');
            return false;
        }

        // Check dimensions
        return true;
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions
                    let { width, height } = img;
                    const maxSize = 1920;
                    
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height *= maxSize / width;
                            width = maxSize;
                        } else {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to file
                    canvas.toBlob(
                        (blob) => {
                            const processedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(processedFile);
                        },
                        'image/jpeg',
                        0.8
                    );
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    setupGalleryUpload() {
        const dropZone = document.getElementById('galleryUpload');
        const input = document.getElementById('galleryImages');
        const preview = document.getElementById('galleryPreview');

        if (!dropZone || !input || !preview) return;

        const handleFiles = (files) => {
            const allowedFiles = Array.from(files).slice(0, 10);
            this.handleGalleryImages(allowedFiles);
        };

        // Setup event listeners
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('vr-media-dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
            handleFiles(e.dataTransfer.files);
        });

        dropZone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    async handleGalleryImages(files) {
        const preview = document.getElementById('galleryPreview');
        const currentImages = preview.querySelectorAll('.vr-media-preview-item').length;
        
        if (currentImages + files.length > 10) {
            window.toastService?.error('Maximum 10 gallery images allowed');
            return;
        }

        for (const file of files) {
            try {
                if (!this.validateImageFile(file)) continue;

                const processedImage = await this.processImage(file);
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const item = document.createElement('div');
                    item.className = 'vr-media-preview-item';
                    item.innerHTML = `
                        <img src="${e.target.result}" alt="Gallery image">
                        <button type="button" class="vr-media-remove">
                            <i class="fas fa-times"></i>
                        </button>
                    `;

                    item.querySelector('.vr-media-remove').addEventListener('click', () => {
                        item.remove();
                        this.updateGalleryData();
                    });

                    preview.appendChild(item);
                    this.updateGalleryData();
                };

                reader.readAsDataURL(processedImage);

            } catch (error) {
                console.error(`Error processing image ${file.name}:`, error);
                window.toastService?.error(`Failed to process ${file.name}`);
            }
        }
    }

    updateGalleryData() {
        const preview = document.getElementById('galleryPreview');
        const images = preview.querySelectorAll('img');
        this.formData.gallery = Array.from(images).map(img => img.src);
        this.updateFormData();
    }

    setupVideoPreview() {
        const input = document.getElementById('videoUrl');
        const previewBtn = document.getElementById('previewVideoBtn');
        const preview = document.getElementById('videoPreview');

        if (!input || !previewBtn || !preview) return;

        let debounceTimer;

        const handlePreview = () => {
            const url = input.value.trim();
            if (!url) {
                preview.innerHTML = '';
                return;
            }
            this.handleVideoUrl(url);
        };

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(handlePreview, 500);
        });

        previewBtn.addEventListener('click', handlePreview);
    }

    handleVideoUrl(url) {
        const preview = document.getElementById('videoPreview');
        if (!preview) return;

        const videoId = this.getYouTubeId(url);
        if (!videoId) {
            window.toastService?.error('Please enter a valid YouTube URL');
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        `;
        
        this.formData.videoUrl = url;
        this.updateFormData();
    }

    getYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }
}

// Initialize only after DOM is fully loaded
window.addEventListener('load', () => {
    try {
        // Cleanup existing instance
        if (window.listingWizard) {
            window.listingWizard.cleanup();
            delete window.listingWizard;
        }

        // Clean up any existing map containers
        document.querySelectorAll('.leaflet-container').forEach(container => {
            container.remove();
        });

        // Create new instance
        window.listingWizard = new ListingWizard();

    } catch (error) {
        console.error('Failed to create listing wizard:', error);
    }
});
