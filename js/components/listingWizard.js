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
            // Wait a bit for the DOM to be ready
            setTimeout(() => {
                if (!this.map) {
                    this.map = L.map(mapContainer).setView([30.0444, 31.2357], 13);
                    
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(this.map);

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
                }
            }, 100);

        } catch (error) {
            console.error('Error initializing map:', error);
            this.cleanupMap();
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
        if (!this.validateAllSteps()) return;

        try {
            // ... existing submit logic ...
        } catch (error) {
            console.error('Submit error:', error);
            window.toastService?.error('Failed to create listing');
        }
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

        // Store category data
        this.formData.categoryId = category._id;
        this.formData.categoryName = category.categoryName;
        this.formData.category = category; // Store full category object
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
        if (!container || !category?.amenities?.length) {
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
            addFeatureBtn.onclick = () => this.showFeatureDialog(category._id);
        }
    }

    showFeatureDialog(categoryId) {
        const dialog = document.getElementById('featureDialog');
        const input = dialog.querySelector('#newFeature');
        
        dialog.style.display = 'block';
        input.value = '';
        input.focus();

        const handleDialog = async (e) => {
            const action = e.target.dataset.action;
            if (action === 'confirm') {
                const feature = input.value.trim();
                if (feature) {
                    await this.addCustomFeature(categoryId, feature);
                }
            }
            dialog.style.display = 'none';
        };

        dialog.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', handleDialog, { once: true });
        });
    }

    async addCustomFeature(categoryId, feature) {
        try {
            const category = this.categories.find(c => c._id === categoryId);
            if (!category) throw new Error('Category not found');

            const token = localStorage.getItem('vr_token');
            if (!token) throw new Error('Authentication required');

            // Get current amenities
            const updatedAmenities = category.amenities ? [...category.amenities] : [];
            
            // Add new feature if it doesn't exist
            if (!updatedAmenities.includes(feature)) {
                updatedAmenities.push(feature);
            }

            const response = await fetch(`${this.API_BASE_URL}/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amenities: updatedAmenities
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update category');
            }

            // Update local data
            const updatedCategory = await response.json();
            const index = this.categories.findIndex(c => c._id === categoryId);
            if (index !== -1) {
                this.categories[index] = updatedCategory;
            }

            // Update formData with latest category
            this.formData.category = updatedCategory;
            this.saveState();

            // Re-render features
            this.renderFeatures(updatedCategory);
            
            // Auto-select the new feature
            this.selectedFeatures.add(feature);
            this.updateFormData();
            
            window.toastService?.success('Feature added successfully');
            
        } catch (error) {
            console.error('Error adding feature:', error);
            window.toastService?.error(error.message || 'Failed to add feature. Please check your permissions.');
        }
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
                location: { required: true },
                latitude: { required: true },
                longitude: { required: true }
            },
            3: {
                // Features validation (optional)
            },
            4: {
                // Business hours validation (optional)
            },
            5: {
                // Final step validation
                email: { required: true, email: true },
                mobile: { required: true }
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

        // Обработчики перетаскивания
        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dropZone.classList.add('vr-media-dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) this.handleMainImage(file);
        });

        // Клик по зоне загрузки
        dropZone.addEventListener('click', () => input.click());

        // Выбор файла через input
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleMainImage(file);
        });

        // Удаление изображения
        removeBtn.addEventListener('click', () => {
            input.value = '';
            preview.style.display = 'none';
            previewImg.src = '';
            this.formData.mainImage = null;
            this.updateFormData();
        });
    }

    handleMainImage(file) {
        if (!file.type.startsWith('image/')) {
            window.toastService?.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            window.toastService?.error('Image size should not exceed 5MB');
            return;
        }

        const preview = document.querySelector('.vr-media-preview');
        const previewImg = document.getElementById('mainImagePreview');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
            this.formData.mainImage = file;
            this.updateFormData();
        };

        reader.readAsDataURL(file);
    }

    setupGalleryUpload() {
        const dropZone = document.getElementById('galleryUpload');
        const input = document.getElementById('galleryImages');
        const preview = document.getElementById('galleryPreview');

        if (!dropZone || !input || !preview) return;

        // Drag and drop handlers
        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dropZone.classList.add('vr-media-dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('vr-media-dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleGalleryImages(files);
        });

        // Click to upload
        dropZone.addEventListener('click', () => input.click());

        // File input change
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleGalleryImages(files);
        });
    }

    handleGalleryImages(files) {
        const preview = document.getElementById('galleryPreview');
        const currentImages = preview.querySelectorAll('.vr-media-preview-item').length;
        
        if (currentImages + files.length > 10) {
            window.toastService?.error('Maximum 10 gallery images allowed');
            return;
        }

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                window.toastService?.error(`${file.name} is not an image file`);
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                window.toastService?.error(`${file.name} exceeds 5MB size limit`);
                return;
            }

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
                    this.updateFormData();
                });

                preview.appendChild(item);
                if (!this.formData.gallery) this.formData.gallery = [];
                this.formData.gallery.push(file);
                this.updateFormData();
            };

            reader.readAsDataURL(file);
        });
    }

    setupVideoPreview() {
        const input = document.getElementById('videoUrl');
        const previewBtn = document.getElementById('previewVideoBtn');
        const preview = document.getElementById('videoPreview');

        if (!input || !previewBtn || !preview) return;

        previewBtn.addEventListener('click', () => {
            const url = input.value.trim();
            if (!url) {
                window.toastService?.error('Please enter a video URL');
                return;
            }
            this.handleVideoUrl(url);
        });
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

        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        preview.innerHTML = `
            <iframe 
                src="${embedUrl}" 
                frameborder="0" 
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
