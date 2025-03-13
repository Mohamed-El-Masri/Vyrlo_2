import { listingService } from '../services/listing.service.js';
import { toastService } from '../services/toast.service.js';
import { apiService } from '../services/api.service.js';

class ListingWizard {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = null;
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {};
        this.options = {
            onSubmit: options.onSubmit || (() => {}),
            onCancel: options.onCancel || (() => {}),
            onStepChange: options.onStepChange || (() => {})
        };

        // Initialize only if container exists
        if (document.getElementById(containerId)) {
        this.init();
        } else {
            console.error(`Container with ID "${containerId}" not found`);
        }
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`Container with ID "${this.containerId}" not found`);
        }

        this.initializeElements();
        this.bindEvents();
        this.loadCategories();
        this.initMap();
        this.updateProgress();
    }

    initializeElements() {
        // Steps
        this.steps = this.container.querySelectorAll('.lw-step');
        this.stepContents = this.container.querySelectorAll('.lw-step-content');
        
        // Navigation
        this.prevBtn = this.container.querySelector('#prevStep');
        this.nextBtn = this.container.querySelector('#nextStep');
        
        // Progress
        this.progressBar = this.container.querySelector('.lw-progress-fill');
        
        // Form Elements
        this.businessNameInput = this.container.querySelector('#businessName');
        this.categorySelect = this.container.querySelector('#category');
        this.descriptionInput = this.container.querySelector('#description');
        this.tagsInput = this.container.querySelector('#tags');
        this.addressInput = this.container.querySelector('#address');
        this.latitudeInput = this.container.querySelector('#latitude');
        this.longitudeInput = this.container.querySelector('#longitude');
        
        // Media Upload
        this.mainImageUpload = this.container.querySelector('#mainImageUpload');
        this.mainImagePreview = this.container.querySelector('#mainImagePreview');
        this.galleryGrid = this.container.querySelector('#galleryGrid');
        
        // Features and Hours
        this.featuresGrid = this.container.querySelector('#featuresGrid');
        this.hoursGrid = this.container.querySelector('#hoursGrid');
        
        // Loading State
        this.loadingElement = this.container.querySelector('.lw-loading');
    }

    bindEvents() {
        // Navigation Events
        this.prevBtn.addEventListener('click', () => this.prevStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        
        // Form Input Events
        this.businessNameInput.addEventListener('input', (e) => this.updateFormData('businessName', e.target.value));
        this.categorySelect.addEventListener('change', (e) => this.updateFormData('category', e.target.value));
        this.descriptionInput.addEventListener('input', (e) => {
            this.updateFormData('description', e.target.value);
            this.updateCharCounter(e.target);
        });
        
        // Tags Input
        this.tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(e.target.value);
                e.target.value = '';
            }
        });
        
        // Media Upload Events
        this.mainImageUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.mainImageUpload.classList.add('dragover');
        });
        
        this.mainImageUpload.addEventListener('dragleave', () => {
            this.mainImageUpload.classList.remove('dragover');
        });
        
        this.mainImageUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            this.mainImageUpload.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleMainImageUpload(file);
        });
        
        this.mainImageUpload.querySelector('input[type="file"]').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleMainImageUpload(file);
        });
    }

    updateProgress() {
        const progress = (this.currentStep - 1) / (this.totalSteps - 1) * 100;
            this.progressBar.style.width = `${progress}%`;
        
        this.steps.forEach((step, index) => {
            if (index + 1 < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
                } else {
                step.classList.remove('completed', 'active');
            }
        });
    }

    showStep(step) {
        this.stepContents.forEach(content => {
            content.classList.remove('active');
            if (parseInt(content.dataset.step) === step) {
                content.classList.add('active');
            }
        });
        
        this.currentStep = step;
        this.updateProgress();
        this.updateNavigationButtons();
        this.options.onStepChange(step);
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.showStep(this.currentStep + 1);
                } else {
                this.submit();
            }
        }
    }

    validateCurrentStep() {
        let isValid = true;
        const currentStepContent = this.container.querySelector(`.lw-step-content[data-step="${this.currentStep}"]`);
        
        // Remove existing validation messages
        currentStepContent.querySelectorAll('.lw-validation-message').forEach(el => el.remove());
        currentStepContent.querySelectorAll('.lw-input').forEach(input => input.classList.remove('is-invalid'));
        
        switch (this.currentStep) {
            case 1:
                if (!this.formData.businessName) {
                    this.showValidationError(this.businessNameInput, 'Business name is required');
                    isValid = false;
                }
                if (!this.formData.category) {
                    this.showValidationError(this.categorySelect, 'Please select a category');
                    isValid = false;
                }
                if (!this.formData.description) {
                    this.showValidationError(this.descriptionInput, 'Description is required');
                    isValid = false;
                }
                break;
            case 2:
                if (!this.formData.address) {
                    this.showValidationError(this.addressInput, 'Address is required');
                isValid = false;
                }
                if (!this.formData.latitude || !this.formData.longitude) {
                    this.showValidationError(this.addressInput, 'Please select a valid location on the map');
                    isValid = false;
                }
                break;
            // Add validation for other steps as needed
        }

        return isValid;
    }

    showValidationError(element, message) {
        element.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'lw-validation-message';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
    }

    updateFormData(field, value) {
        this.formData[field] = value;
    }

    updateCharCounter(textarea) {
        const counter = textarea.parentNode.querySelector('.lw-char-counter');
        if (counter) {
            const maxLength = 500;
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${textarea.value.length}/${maxLength}`;
            counter.style.color = remaining < 0 ? 'var(--vr-error)' : '';
        }
    }

    addTag(tag) {
        if (!tag) return;
        
        const tagsContainer = this.container.querySelector('.lw-tags-container');
        const tagElement = document.createElement('div');
        tagElement.className = 'lw-tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="lw-tag-remove">&times;</span>
        `;
        
        tagElement.querySelector('.lw-tag-remove').addEventListener('click', () => {
            tagElement.remove();
            this.updateFormData('tags', this.getTags());
        });
        
        tagsContainer.appendChild(tagElement);
        this.updateFormData('tags', this.getTags());
    }

    getTags() {
        return Array.from(this.container.querySelectorAll('.lw-tag'))
            .map(tag => tag.textContent.trim().slice(0, -1)); // Remove the × symbol
    }

    async loadCategories() {
        try {
            this.showLoading();
            const categories = await listingService.getCategories();
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                this.categorySelect.appendChild(option);
            });
                } catch (error) {
            console.error('Error loading categories:', error);
            toastService.error('Failed to load categories');
        } finally {
            this.hideLoading();
        }
    }

    initMap() {
        // Initialize map functionality
        // This will be implemented based on the mapping service being used
    }

    handleMainImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            // Show error message
            return;
        }

                const reader = new FileReader();
                reader.onload = (e) => {
            this.mainImagePreview.querySelector('img').src = e.target.result;
            this.mainImagePreview.style.display = 'block';
            this.mainImageUpload.style.display = 'none';
            this.updateFormData('mainImage', file);
        };
        reader.readAsDataURL(file);
    }

    updateNavigationButtons() {
        this.prevBtn.style.display = this.currentStep === 1 ? 'none' : 'block';
        this.nextBtn.textContent = this.currentStep === this.totalSteps ? 'Submit' : 'Next';
    }

    showLoading() {
        this.loadingElement.style.display = 'flex';
    }

    hideLoading() {
        this.loadingElement.style.display = 'none';
    }

    async submit() {
        try {
            this.showLoading();
            await this.options.onSubmit(this.formData);
            // Handle successful submission
        } catch (error) {
            console.error('Error submitting form:', error);
            // Show error message to user
        } finally {
            this.hideLoading();
        }
    }
}

// Remove automatic initialization
// Instead, export the class for use in profile.js
export default ListingWizard;
