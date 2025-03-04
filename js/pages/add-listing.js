class AddListingPage {
    constructor() {
        this.API_BASE_URL = 'https://virlo.vercel.app';
        this.form = document.getElementById('addListingForm');
        this.mainImageUpload = document.getElementById('mainImageUpload');
        this.galleryUpload = document.getElementById('galleryUpload');
        this.galleryPreview = document.getElementById('galleryPreview');
        this.map = null;
        this.marker = null;
        this.toastService = window.ToastService;
        this.selectedFiles = {
            mainImage: null,
            gallery: []
        };

        this.initializeEventListeners();
        this.initializeMap();
        this.loadCategories();
        this.initializeBusinessHours();
    }

    initializeEventListeners() {
        // Check authentication
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.AuthService || !window.AuthService.isAuthenticated()) {
                window.location.href = '/pages/login.html';
                return;
            }
        });

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // File uploads
        this.mainImageUpload.addEventListener('click', () => this.mainImageUpload.querySelector('input').click());
        this.mainImageUpload.querySelector('input').addEventListener('change', (e) => this.handleMainImageSelect(e));

        this.galleryUpload.addEventListener('click', () => this.galleryUpload.querySelector('input').click());
        this.galleryUpload.querySelector('input').addEventListener('change', (e) => this.handleGallerySelect(e));

        // Address input for map
        document.getElementById('address').addEventListener('change', (e) => this.geocodeAddress(e.target.value));
    }

    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add click handler for setting marker
        this.map.on('click', (e) => {
            this.setMarker(e.latlng);
            this.updateCoordinateInputs(e.latlng);
        });

        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latlng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.map.setView(latlng, 13);
                    this.setMarker(latlng);
                    this.updateCoordinateInputs(latlng);
                },
                () => {
                    this.toastService.error('Could not get your location. Please set it manually.');
                }
            );
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');

            const categories = await response.json();
            const select = document.getElementById('category');

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
            this.toastService.error('Failed to load categories');
        }
    }

    initializeBusinessHours() {
        const container = document.getElementById('businessHours');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'vr-business-hours__day';
            dayElement.innerHTML = `
                <span class="vr-business-hours__label">${day}</span>
                <input type="time" class="vr-input" name="hours[${day.toLowerCase()}][open]">
                <input type="time" class="vr-input" name="hours[${day.toLowerCase()}][close]">
            `;
            container.appendChild(dayElement);
        });
    }

    handleMainImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.validateImage(file)) {
            event.target.value = '';
            return;
        }

        this.selectedFiles.mainImage = file;
        this.updateMainImagePreview(file);
    }

    handleGallerySelect(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (this.selectedFiles.gallery.length + files.length > 5) {
            this.toastService.error('Maximum 5 gallery images allowed');
            event.target.value = '';
            return;
        }

        files.forEach(file => {
            if (this.validateImage(file)) {
                this.selectedFiles.gallery.push(file);
                this.addGalleryPreview(file);
            }
        });
    }

    validateImage(file) {
        if (!file.type.startsWith('image/')) {
            this.toastService.error('Please upload only image files');
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.toastService.error('Image size should not exceed 5MB');
            return false;
        }

        return true;
    }

    updateMainImagePreview(file) {
        const preview = this.mainImageUpload.querySelector('.vr-file-upload__preview');
        const reader = new FileReader();

        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Main image preview" style="max-width: 100%; max-height: 200px;">
            `;
        };

        reader.readAsDataURL(file);
    }

    addGalleryPreview(file) {
        const preview = document.createElement('div');
        preview.className = 'vr-gallery-preview__item';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Gallery preview">
                <button type="button" class="vr-gallery-preview__remove">&times;</button>
            `;
        };

        reader.readAsDataURL(file);
        this.galleryPreview.appendChild(preview);

        // Add remove button handler
        preview.querySelector('.vr-gallery-preview__remove').addEventListener('click', () => {
            const index = Array.from(this.galleryPreview.children).indexOf(preview);
            this.selectedFiles.gallery.splice(index, 1);
            preview.remove();
        });
    }

    async geocodeAddress(address) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await response.json();

            if (data.length > 0) {
                const location = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                this.map.setView(location, 16);
                this.setMarker(location);
                this.updateCoordinateInputs(location);
            } else {
                this.toastService.error('Address not found');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            this.toastService.error('Failed to geocode address');
        }
    }

    setMarker(latlng) {
        if (this.marker) {
            this.marker.setLatLng(latlng);
        } else {
            this.marker = L.marker(latlng).addTo(this.map);
        }
    }

    updateCoordinateInputs(latlng) {
        document.getElementById('latitude').value = latlng.lat;
        document.getElementById('longitude').value = latlng.lng;
    }

    async handleSubmit(event) {
        event.preventDefault();

        try {
            const submitButton = this.form.querySelector('.vr-add-listing__submit');
            submitButton.classList.add('vr-btn--loading');
            submitButton.disabled = true;

            // Create FormData
            const formData = new FormData(this.form);
            
            // Add files
            if (this.selectedFiles.mainImage) {
                formData.set('mainImage', this.selectedFiles.mainImage);
            }
            
            this.selectedFiles.gallery.forEach((file, index) => {
                formData.append(`gallery[${index}]`, file);
            });

            // Send request
            const response = await fetch(`${this.API_BASE_URL}/api/listings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.AuthService.getToken()}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to create listing');

            this.toastService.success('Listing created successfully');
            window.location.href = '/pages/my-listings.html';

        } catch (error) {
            console.error('Error creating listing:', error);
            this.toastService.error('Failed to create listing. Please try again.');
        } finally {
            const submitButton = this.form.querySelector('.vr-add-listing__submit');
            submitButton.classList.remove('vr-btn--loading');
            submitButton.disabled = false;
        }
    }
}

// Initialize the page
const addListingPage = new AddListingPage(); 