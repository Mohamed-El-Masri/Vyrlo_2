import { authService } from '../services/auth.service.js';
import { toastService } from '../services/toast.service.js';
import { listingService } from '../services/listing.service.js';
import { apiService } from '../services/api.service.js';

class ProfilePage {
    constructor() {
        this.API_BASE_URL = 'https://www.vyrlo.com:8080';
        this.userData = null;
        this.currentSection = 'profile';
        
        // التحقق من تسجيل الدخول وuser ID
        if (!this.checkAuth()) {
            return;
        }

        this.listingsData = {
            all: [],
            active: [],
            featured: [],
            inactive: []
        };
        
        // تهيئة الصفحة
        this.init();
    }

    async deleteListing(id) {
        try {
            const confirmed = await this.showConfirmationModal(
                'Confirm Deletion', 
                'Are you sure you want to delete this listing? This action cannot be undone.'
            );
            
            if (!confirmed) return;
                
            // تغيير حالة الزر إلى وضع التحميل
            const button = document.querySelector(`[data-action="delete-listing"][data-id="${id}"]`);
            if (button) {
                button.innerHTML = '<div class="vr-spinner vr-spinner--sm"></div> Deleting...';
                button.disabled = true;
            }
            
            // استدعاء خدمة حذف القائمة
            await listingService.deleteListing(id);
            
            // تحديث واجهة المستخدم بعد الحذف
            this.updateUIAfterListingDeletion(id, button);
            
        } catch (error) {
            console.error('Error deleting listing:', error);
            toastService.error('Failed to delete listing');
            
            const button = document.querySelector(`[data-action="delete-listing"][data-id="${id}"]`);
            if (button) {
                button.innerHTML = '<i class="fas fa-trash"></i> Delete';
                button.disabled = false;
            }
        }
    }

    // Add new method for showing confirmation modal
    showConfirmationModal(title, message) {
        return new Promise((resolve) => {
            // Create modal container if it doesn't exist
            let modalContainer = document.getElementById('vr-confirmation-modal-container');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'vr-confirmation-modal-container';
                document.body.appendChild(modalContainer);
            }
            
            // Create modal HTML
            const modalId = 'confirmation-modal-' + Date.now();
            const modalHTML = `
                <div id="${modalId}" class="vr-modal">
                    <div class="vr-modal__overlay"></div>
                    <div class="vr-modal__container">
                        <div class="vr-modal__header">
                            <h3 class="vr-modal__title">${title}</h3>
                            <button class="vr-modal__close" data-action="cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="vr-modal__body">
                            <p>${message}</p>
                        </div>
                        <div class="vr-modal__footer">
                            <button class="vr-btn vr-btn--secondary" data-action="cancel">
                                Cancel
                            </button>
                            <button class="vr-btn vr-btn--danger" data-action="confirm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to container
            modalContainer.innerHTML = modalHTML;
            
            // Get modal element
            const modal = document.getElementById(modalId);
            
            // Show modal with animation
            setTimeout(() => {
                modal.classList.add('vr-modal--active');
            }, 10);
            
            // Setup event listeners
            modal.querySelectorAll('[data-action]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.target.closest('[data-action]').getAttribute('data-action');
                    
                    // Hide modal with animation
                    modal.classList.remove('vr-modal--active');
                    
                    // Remove modal after animation
                    setTimeout(() => {
                        modal.remove();
                        resolve(action === 'confirm');
                    }, 300);
                });
            });
        });
    }

    async editListing(id) {
        try {
            // تغيير حالة الزر إلى وضع التحميل
            const button = document.querySelector(`.vr-btn--primary[onclick="profilePage.editListing('${id}')"]`);
            if (button) {
                button.innerHTML = '<div class="vr-spinner vr-spinner--sm"></div> Loading...';
                button.disabled = true;
            }
            
            // الانتقال إلى قسم إضافة الإعلان
            this.loadSection('addListing');
            
            // تأخير للتأكد من تحميل القسم
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // استدعاء دالة تحميل بيانات الإعلان للتعديل
            const addListingContainer = document.getElementById('addListingContainer');
            if (!addListingContainer) {
                throw new Error('Add listing container not found');
            }
            
            try {
                // تحميل القالب إذا لم يكن مُحملاً بعد
                if (!addListingContainer.querySelector('form')) {
                    await this.loadAddListingComponent();
                }
                
                // تأخير للتأكد من تحميل المكونات
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // البحث عن كلاس AddListingPage
                if (window.addListingPage) {
                    // إذا كان لديه دالة loadListingForEdit
                    if (typeof window.addListingPage.loadListingForEdit === 'function') {
                        await window.addListingPage.loadListingForEdit(id);
                    } else {
                        // استدعاء الدالة المعرفة في add-listing.js
                        const { default: AddListingPage } = await import('/js/pages/profile/add-listing.js');
                        window.addListingPage = new AddListingPage();
                        await window.addListingPage.loadListingForEdit(id);
                    }
                } else {
                    // إذا لم يتم تعريف addListingPage
                    const { default: AddListingPage } = await import('/js/pages/profile/add-listing.js');
                    window.addListingPage = new AddListingPage();
                    
                    // فحص إذا كانت الدالة متوفرة
                    if (typeof window.addListingPage.loadListingForEdit === 'function') {
                        await window.addListingPage.loadListingForEdit(id);
                    } else {
                        console.error('loadListingForEdit method not available');
                        toastService.error('Editing functionality not available');
                    }
                }
            } catch (importError) {
                console.error('Error importing AddListingPage:', importError);
                toastService.error('Failed to load listing editor');
            }
            
        } catch (error) {
            console.error('Error editing listing:', error);
            toastService.error('Failed to edit listing');
        } finally {
            // إعادة زر التعديل إلى حالته الأصلية
            const button = document.querySelector(`.vr-btn--primary[onclick="profilePage.editListing('${id}')"]`);
            if (button) {
                button.innerHTML = '<i class="fas fa-edit"></i> Edit';
                button.disabled = false;
            }
        }
    }
    checkAuth() {
            if (!authService.isAuthenticated()) {
            window.location.href = '/pages/login.html';
            return false;
        }

        const userId = authService.getUserId();
        if (!userId) {
            console.error('No user ID found');
            toastService.error('Authentication error');
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
            return false;
        }

        return true;
    }

    /**
 * إضافة طريقة لتحميل القوالب التي تم استدعاؤها في دالة init
 */
async loadTemplates() {
    try {
        // استخدام خدمة تحميل الـCSS المشتركة
        await Promise.all([
            this.loadCSS('/css/components/profile-listings.css'),
            this.loadCSS('/css/components/listing-cards.css')
        ]);
        
        // استخدام خدمة تحميل المكونات المركزية
        const componentsToLoad = [
            { id: 'profileContainer', path: '/components/profile/profile-info.html' },
            { id: 'addListingContainer', path: '/components/profile/addListing.html' },
            { id: 'listingsContainer', path: '/components/profile/listings-grid.html' }
        ];
        
        // تحميل جميع المكونات بالتوازي
        await Promise.all(componentsToLoad.map(component => 
            fetch(component.path)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to load ${component.path}`);
                    return response.text();
                })
                .then(html => {
                    const container = document.getElementById(component.id);
                    if (container) container.innerHTML = html;
                })
        ));
        
        console.log('All templates loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading templates:', error);
        toastService.error('Failed to load page components. Please try again.');
        throw error;
    }
}

/**
 * تصحيح دالة init لتستخدم async/await بشكل صحيح
 */
async init() {
    try {
        const userId = authService.getUserId();
        console.log('تهيئة البروفايل للمستخدم:', userId);

        // تحميل القوالب بشكل متزامن
        await this.loadTemplates();
        
        // إعداد أحداث النقر بعد تحميل القوالب
        this.setupEventListeners();
        
        // تحميل الصفحة من الهاش URL إذا كان موجود
        this.loadPageFromHash();

        // تحميل بيانات المستخدم
        await this.loadUserData();
        
        console.log('تم تهيئة الصفحة بنجاح');
    } catch (error) {
        console.error('خطأ في تهيئة البروفايل:', error);
        toastService.error('فشل في تحميل البروفايل');
    }
}

    async loadUserProfile(userId) {
        try {
            this.showProfileSkeleton();
            
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const response = await apiService.get(`/profile/${userId}`);
            
            // تأكد من تنسيق البيانات
            this.userData = Array.isArray(response) ? response[0] : response;
            
            // تخزين البيانات المحدثة
            authService.setUserProfile(this.userData);
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.hideProfileSkeleton();
            this.updateProfileUI();
            
        } catch (error) {
            console.error('Error loading profile:', error);
            toastService.error('Failed to load profile data');
            this.hideProfileSkeleton();
        }
    }

    /**
 * إضافة دالة showProfileSkeleton و hideProfileSkeleton الناقصة
 */
showProfileSkeleton() {
    const skeletonContainer = document.querySelector('.vr-profile-skeleton');
    const profileContent = document.querySelector('.vr-profile-content');
    
    if (skeletonContainer) {
        skeletonContainer.style.display = 'block';
    }
    
    if (profileContent) {
        profileContent.style.opacity = '0';
    }
}

hideProfileSkeleton() {
    const skeletonContainer = document.querySelector('.vr-profile-skeleton');
    const profileContent = document.querySelector('.vr-profile-content');
    
    if (skeletonContainer) {
        skeletonContainer.style.display = 'none';
    }
    
    if (profileContent) {
        profileContent.style.opacity = '1';
    }
}

/**
 * إضافة دالة updateProfileUI الناقصة
 */
updateProfileUI() {
    if (!this.userData) return;
    
    console.log('Updating Profile UI with data:', this.userData);
    
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    
    // تأكد من وجود البيانات قبل التحديث
    const userInfo = this.userData.userId || {};
    
    // تحديث اسم المستخدم
    if (userName) {
        const displayName = userInfo.username || 'User';
        this.fadeElementContent(userName, displayName);
    }
    
    // تحديث البريد الإلكتروني
    if (userEmail) {
        const email = userInfo.email || 'No email available';
        this.fadeElementContent(userEmail, email);
    }
    
    // تحديث الصورة الشخصية
    if (userAvatar) {
        const profilePicUrl = this.userData.profilePic?.[0] || '/images/defaults/default-avatar.png';
        this.loadImageWithFade(userAvatar, profilePicUrl);
        
        // تحديث صورة القائمة المنسدلة أيضاً
        if (dropdownAvatar) {
            this.loadImageWithFade(dropdownAvatar, profilePicUrl);
        }
    }
    
    // تحديث حقول النموذج
    this.updateProfileForm();
    
    // تحديث عدد القوائم في البادج
    const listingsBadge = document.querySelector('.profile-item[data-section="listings"] .vr-badge');
    if (listingsBadge) {
        listingsBadge.textContent = this.listingsData.all?.length || '0';
    }
}

    /**
     * Fade element content for smooth transitions
     */
    fadeElementContent(element, newContent) {
        if (!element) return;
        
        // تطبيق تأثير التلاشي
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        
        // تحديث المحتوى بعد التلاشي
        setTimeout(() => {
            element.textContent = newContent;
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
        }, 300);
    }

    /**
     * Load image with fade effect
     */
    loadImageWithFade(imgElement, src) {
        if (!imgElement || !src) return;
        
        const tempImg = new Image();
        
        tempImg.onload = () => {
            imgElement.style.transition = 'opacity 0.3s ease';
            imgElement.style.opacity = '0';
            
            setTimeout(() => {
                imgElement.src = src;
                imgElement.style.opacity = '1';
            }, 300);
        };
        
        tempImg.onerror = () => {
            console.error('Failed to load image:', src);
            imgElement.src = '/images/defaults/default-avatar.png';
        };
        
        // بدء تحميل الصورة
        tempImg.src = src;
    }

    /**
     * Enhanced profile form update
     */
    updateProfileForm() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        // Fields mapping for form update
        const fields = {
            'title': this.userData.title || '',
            'phoneNumber': this.userData.phoneNumber || '',
            'address': this.userData.address || '',
            'city': this.userData.city || '',
            'state': this.userData.state || '',
            'zipCode': this.userData.zipCode || '',
            'about': this.userData.about || ''
        };
        
        // Update each form field with animation
        for (const [name, value] of Object.entries(fields)) {
            const input = form.elements[name];
            if (input) {
                this.updateInputValueWithAnimation(input, value);
            }
        }
        
        // Populate social media accounts
        this.populateSocialMediaAccounts();
    }

    /**
     * Animate input value changes
     */
    updateInputValueWithAnimation(input, value) {
        // Only animate if value is different
        if (input.value !== value) {
            const isTextarea = input.tagName.toLowerCase() === 'textarea';
            
            // Highlight effect for change
            input.style.transition = 'all 0.3s ease';
            input.style.backgroundColor = 'var(--vr-primary-bg)';
            input.style.borderColor = 'var(--vr-primary)';
            
            // Update value
            input.value = value;
            
            // Return to normal state
            setTimeout(() => {
                input.style.backgroundColor = '';
                input.style.borderColor = '';
            }, 1000);
        }
    }

    /**
     * تحسين استعراض بيانات الحسابات الاجتماعية
     */
    populateSocialMediaAccounts() {
        const container = document.getElementById('profileSocialMediaContainer');
        if (!container) return;
        
        // مسح الحسابات الموجودة
        container.innerHTML = '';
        
        // التحقق من وجود حسابات اجتماعية
        if (this.userData.socialAccounts && Array.isArray(this.userData.socialAccounts)) {
            this.userData.socialAccounts.forEach(account => {
                const accountDiv = document.createElement('div');
                accountDiv.className = 'vr-social-account';
                accountDiv.dataset.id = account._id || '';
                
                accountDiv.innerHTML = `
                    <select class="vr-input vr-social-platform" name="socialPlatform[]">
                        <option value="">Select Platform</option>
                        <option value="facebook" ${account.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                        <option value="instagram" ${account.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                        <option value="twitter" ${account.platform === 'twitter' ? 'selected' : ''}>Twitter</option>
                        <option value="linkedin" ${account.platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                        <option value="youtube" ${account.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
                    </select>
                    <input type="url" class="vr-input" name="socialUrl[]" placeholder="Profile URL" value="${account.url || ''}">
                    <button type="button" class="vr-btn vr-btn--icon vr-remove-social">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // إضافة مستمع حدث لزر الإزالة
                accountDiv.querySelector('.vr-remove-social').addEventListener('click', () => {
                    accountDiv.remove();
                });
                
                container.appendChild(accountDiv);
                
                // إضافة تأثير الظهور
                accountDiv.style.animation = 'fadeIn 0.5s ease forwards';
            });
        }
    }

    /**
     * تجميع إعداد مستمعي الأحداث في مكان واحد
     */
    setupEventListeners() {
        // استخدام التفويض لمعالجة أحداث النقر (event delegation)
        document.addEventListener('click', (event) => this.handleEvents(event));
        
        // مستمع لتغييرات الهاش في URL
        window.addEventListener('hashchange', () => this.loadPageFromHash());
        
        // إعداد مستمع خاص لزر تحميل الصورة
        this.setupAvatarUpload();
        
        // مستمع نموذج الملف الشخصي
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
        
        // مستمعات التنقل بين الأقسام
        document.querySelectorAll('.profile-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.loadSection(section);
            });
        });
        
        // مستمعات علامات التبويب للقوائم
        document.querySelectorAll('.vr-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.dataset.type;
                if (type) this.filterListings(type);
            });
        });
        
        // مستمع إضافة حساب اجتماعي
        const addProfileSocialBtn = document.getElementById('addProfileSocialBtn');
        if (addProfileSocialBtn) {
            addProfileSocialBtn.addEventListener('click', () => this.addSocialMediaField('profileSocialMediaContainer'));
        }
    }

    /**
     * استخدام معالج واحد للأحداث
     */
    handleEvents(event) {
        const target = event.target;
        const action = target.dataset.action;
        const id = target.dataset.id;
        
        if (!action) return;
        
        switch (action) {
            case 'edit-listing':
                this.editListing(id);
                break;
            case 'delete-listing':
                this.deleteListing(id);
                break;
            case 'activate-listing':
                this.activateListing(id);
                break;
            case 'upgrade-listing':
                this.upgradeListing(id);
                break;
            case 'load-section':
                this.loadSection(target.dataset.section);
                break;
            case 'logout':
                this.handleLogout();
                break;
        }
    }

    loadSection(sectionName) {
        console.log(`Loading section: ${sectionName}`);
        
        // إخفاء جميع الأقسام
        const sections = ['profile', 'listings', 'addListing', 'settings'];
        sections.forEach(section => {
            const container = document.getElementById(`${section}Container`);
            if (container) {
                container.style.display = 'none';
            }
            
            // إزالة الفئة النشطة من عناصر القائمة
            const menuItem = document.querySelector(`.profile-item[data-section="${section}"]`);
            if (menuItem) {
                menuItem.classList.remove('active');
            }
        });
        
        // عرض القسم المحدد
        const selectedSection = document.getElementById(`${sectionName}Container`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
            
            // إضافة الفئة النشطة لعنصر القائمة
            const menuItem = document.querySelector(`.profile-item[data-section="${sectionName}"]`);
            if (menuItem) {
                menuItem.classList.add('active');
            }
            
            // تحديث هاش URL
            window.location.hash = sectionName;
            
            // معالجة خاصة للأقسام المحددة
            if (sectionName === 'listings') {
                this.loadListings();
            } else if (sectionName === 'addListing') {
                this.loadAddListingComponent();
            }
        }
    }

    /**
     * تحسين معالجة تحميل الصورة الشخصية
     */
    setupAvatarUpload() {
        const avatarUpload = document.getElementById('avatarUpload');
        const avatarContainer = document.querySelector('.vr-profile-avatar');
        
        if (!avatarUpload || !avatarContainer) return;
        
        // إضافة مؤشر التحميل
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'vr-avatar-loading';
        loadingOverlay.style.display = 'none';
        loadingOverlay.innerHTML = '<div class="vr-spinner"></div>';
        avatarContainer.appendChild(loadingOverlay);
        
        avatarUpload.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            // التحقق من نوع وحجم الملف
            if (!/^image\/(jpeg|png|jpg|webp)$/i.test(file.type)) {
                toastService.error('Please select a valid image file (JPEG, PNG, or WebP)');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB max
                toastService.error('Image size must be less than 5MB');
                return;
            }
            
            try {
                // إظهار حالة التحميل
                loadingOverlay.style.display = 'flex';
                
                // تحضير FormData
                const formData = new FormData();
                formData.append('profilePic', file);
                
                const userId = authService.getUserId();
                const response = await fetch(`${this.API_BASE_URL}/profile/${userId}`, {
                    method: 'POST',
                    headers: {
                        'token': authService.getToken()
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }
                
                const data = await response.json();
                
                // تحديث الصورة في واجهة المستخدم
                if (data.profilePic && data.profilePic.length > 0) {
                    const userAvatar = document.getElementById('userAvatar');
                    const dropdownAvatar = document.getElementById('dropdownAvatar');
                    
                    if (userAvatar) {
                        this.loadImageWithFade(userAvatar, data.profilePic[0]);
                    }
                    if (dropdownAvatar) {
                        this.loadImageWithFade(dropdownAvatar, data.profilePic[0]);
                    }
                }
                
                // تحديث بيانات المستخدم
                this.userData = data;
                authService.setUserProfile(data);
                
                toastService.success('Profile picture updated successfully');
            } catch (error) {
                console.error('Error uploading avatar:', error);
                toastService.error('Failed to upload profile picture');
            } finally {
                // إخفاء حالة التحميل
                loadingOverlay.style.display = 'none';
            }
        });
    }

    /**
     * تحسين معالجة تحديث البروفايل
     */
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        try {
            // تغيير حالة الزر إلى وضع التحميل
            const submitButton = event.target.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<div class="vr-spinner vr-spinner--sm"></div> Saving...';
            submitButton.disabled = true;
            
            // تجميع بيانات النموذج
            const formData = new FormData(event.target);
            const profileData = Object.fromEntries(formData.entries());
            
            // التحقق من الحقول المطلوبة
            if (!profileData.phoneNumber || !profileData.title) {
                toastService.error('Please fill in all required fields');
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                return;
            }
            
            // استخدام apiService لتحديث البروفايل
            const userId = authService.getUserId();
            const response = await apiService.post(`/profile/${userId}`, profileData);
            
            // تحديث البيانات المحلية وحفظها
            this.userData = response;
            authService.setUserProfile(response);
            
            // تحديث الواجهة
            toastService.success('Profile updated successfully');
            await this.loadUserProfile(userId);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            toastService.error('Failed to update profile: ' + (error.message || 'Unknown error'));
        } finally {
            // إعادة حالة الزر
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                submitButton.disabled = false;
            }
        }
    }

    async loadUserListings() {
        try {
            console.log('Loading user listings...');
            
            // استخدام خدمة listingService
            const result = await listingService.getUserListings();
            console.log('Listings result:', result);
            
            const listings = Array.isArray(result.listings) ? result.listings : [];
            
            // تصنيف القوائم
            this.listingsData = {
                all: listings,
                active: listings.filter(l => l.isActive === true && l.isPosted !== true),
                featured: listings.filter(l => l.isPosted === true),
                inactive: listings.filter(l => l.isActive === false)
            };

            // تحديث العدادات
            this.updateListingCounts();
            
            // التحقق من وجود عنصر العرض قبل استدعاء filterListings
            const container = document.querySelector('.vr-listings-grid');
            if (!container) {
                console.error('Listings container (.vr-listings-grid) not found in DOM');
                return;
            }
            
            // عرض الجميع
            this.filterListings('all');
        } catch (error) {
            console.error('Error loading listings:', error);
            toastService.error('Failed to load listings');
            
            // العرض في حالة الخطأ
            const container = document.querySelector('.vr-listings-grid');
            if (container) {
                container.innerHTML = this.getEmptyListingsTemplate();
            }
        }
    }

    /**
 * تحديث عدادات القوائم - نسخة محسنة تتعامل مع معرفات محددة
 */
updateListingCounts() {
    const counts = {
        all: this.listingsData.all.length,
        active: this.listingsData.active.length,
        featured: this.listingsData.featured.length,
        inactive: this.listingsData.inactive.length
    };
    
    console.log('Updating listing counts:', counts);
    
    // قائمة بجميع العناصر التي تحتاج إلى تحديث
    const elementsToUpdate = {
        // العدد الإجمالي للقوائم
        'totalListings': counts.all,
        
        // أعداد علامات التبويب
        'allCount': counts.all,
        'activeCount': counts.active,
        'featuredCount': counts.featured,
        'inactiveCount': counts.inactive,
        
        // أعداد الإحصائيات السريعة
        'activeQuickCount': counts.active,
        'featuredQuickCount': counts.featured,
        'inactiveQuickCount': counts.inactive
    };
    
    // تحديث كافة العناصر مع تأثير بصري
    for (const [id, value] of Object.entries(elementsToUpdate)) {
        const element = document.getElementById(id);
        
        if (element) {
            // التحقق إذا كان العنصر يحتوي على قيمة مختلفة
            if (element.textContent !== String(value)) {
                // إضافة تأثير التحديث
                element.classList.add('vr-count-update');
                
                // تحديث القيمة بعد فترة قصيرة
                setTimeout(() => {
                    element.textContent = value;
                    
                    // إزالة تأثير التحديث بعد اكتمال التحديث
                    setTimeout(() => {
                        element.classList.remove('vr-count-update');
                    }, 500);
                }, 100);
            } else {
                // تحديث القيمة بدون تأثير إذا كانت نفس القيمة
                element.textContent = value;
            }
        } else {
            console.warn(`Element with ID '${id}' not found in the DOM`);
        }
    }
    
    // تحديث شارة القوائم في القائمة الجانبية
    const listingsBadge = document.querySelector('.profile-item[data-section="listings"] .vr-badge');
    if (listingsBadge) {
        if (listingsBadge.textContent !== String(counts.all)) {
            listingsBadge.classList.add('vr-count-update');
            setTimeout(() => {
                listingsBadge.textContent = counts.all;
                setTimeout(() => {
                    listingsBadge.classList.remove('vr-count-update');
                }, 500);
            }, 100);
        }
    }
}

    /**
 * تحسين في تحميل القوائم للتأكد من تحديث العدادات بشكل صحيح
 */
async loadListings(status = 'all') {
    try {
        // عرض skeleton مباشرة
        this.showListingsSkeleton();
        
        // تأخير صغير لضمان ظهور skeleton
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // جلب البيانات
        const data = await listingService.getUserListings();
        console.log('Listings data received:', data);
        
        // تأخير صغير قبل إخفاء skeleton
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // تصحيح: تحديث البيانات بشكل صحيح
        this.listingsData = {
            all: data.listings || [],
            active: (data.listings || []).filter(item => item.isActive && !item.isPosted),
            featured: (data.listings || []).filter(item => item.isPosted),
            inactive: (data.listings || []).filter(item => !item.isActive)
        };

        // تحميل البانر الترويجي بشكل مستقل (قبل إخفاء skeleton)
        await this.loadPromoComponent();
        
        // إخفاء skeleton وعرض البيانات
        this.hideListingsSkeleton();
        
        // تحديث عدادات القوائم
        this.updateListingCounts();
        
        // إعادة إعداد أحداث التصفية للفلاتر
        this.setupFilterEvents();
        
        // تطبيق الفلتر المحدد
        this.filterListings(status);
        
        console.log('Listings loaded successfully');
        
    } catch (error) {
        console.error('Error loading listings:', error);
        toastService.error('Failed to load listings');
        this.hideListingsSkeleton();
    }
}

    filterListings(status = 'all') {
        const grid = document.querySelector('.vr-listings-grid');
        const emptyState = document.querySelector('.vr-listings-empty');
        
        if (!grid || !emptyState) return;
        
        const listings = this.listingsData[status] || [];
        
        // تأثير التلاشي عند تغيير المحتوى
        grid.style.opacity = '0';
        
        setTimeout(() => {
            if (listings.length === 0) {
                grid.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                grid.style.display = 'block'; // تغيير من grid إلى block
                emptyState.style.display = 'none';
                
                // إضافة عناوين الأعمدة قبل القوائم - بدون أعمدة الموقع والتاريخ والفئة
                let html = `
                    <div class="vr-listing-table-header">
                        <div class="vr-listing-table-header__image">Image</div>
                        <div class="vr-listing-table-header__title">Title</div>
                        <div class="vr-listing-table-header__actions">Actions</div>
                    </div>
                `;
                
                // إضافة كروت القوائم
                html += listings.map(listing => this.createListingCard(listing)).join('');
                
                grid.innerHTML = html;
                
                // إضافة أحداث على الكروت
                this.attachListingCardEvents();
            }
            
            // إظهار المحتوى الجديد
            requestAnimationFrame(() => {
                grid.style.opacity = '1';
            });
        }, 300);
    }

    handleLogout() {
        authService.logout();
        window.location.href = '/pages/login.html';
    }

    async loadAddListingComponent(editMode = false, editId = null) {
        try {
            const container = document.getElementById('addListingContainer');
            if (!container) return;
    
            // تحميل القالب
            const response = await fetch('/components/profile/addListing.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
    
            // تهيئة الصفحة
            const { default: AddListingPage } = await import('/js/pages/profile/add-listing.js');
            window.addListingPage = new AddListingPage();
            
            // إذا كنا في وضع التعديل وهناك معرف إعلان
            if (editMode && editId) {
                // التأكد من أن هناك دالة لتحميل بيانات الإعلان
                if (typeof window.addListingPage.loadListingForEdit === 'function') {
                    await window.addListingPage.loadListingForEdit(editId);
                } else {
                    toastService.error('Editing functionality not available');
                    console.error('loadListingForEdit method not available');
                }
            }
    
        } catch (error) {
            console.error('Error loading add listing component:', error);
            toastService.error('Failed to load listing form');
        }
    }

    getEmptyListingsTemplate() {
        return `
            <div class="vr-empty-state">
                <i class="fas fa-list"></i>
                <h3>No Listings Yet</h3>
                <p>Create your first listing to start growing your business</p>
                <button class="vr-btn vr-btn--primary" onclick="profilePage.loadSection('addListing')">
                    <i class="fas fa-plus"></i>
                    Create Listing
                </button>
            </div>
        `;
    }

    /**
 * إنشاء كرت القائمة بتصميم محسن وإضافة بادج مجاني للزر التنشيط
 */
createListingCard(listing) {
    const status = listing.isPosted ? 'featured' : (listing.isActive ? 'active' : 'inactive');
    const statusText = {
        featured: 'Featured',
        active: 'Active',
        inactive: 'Inactive'
    }[status];
    
    // تحديد أزرار الإجراءات بناءً على حالة القائمة
    let statusActionButton = '';
    
    if (status === 'inactive') {
        // للقوائم غير النشطة: إظهار زر التفعيل
        statusActionButton = `
            <button class="vr-btn vr-btn--success" 
                    data-action="activate-listing" 
                    data-id="${listing._id}">
                <i class="fas fa-check-circle"></i> Activate
                <span class="vr-btn__badge">Free</span>
            </button>`;
    } else if (status === 'active') {
        // للقوائم النشطة وغير المميزة: إظهار زر الترقية مع السعر السنوي الجديد
        statusActionButton = `
            <button class="vr-btn vr-btn--upgrade" 
                    data-action="upgrade-listing" 
                    data-id="${listing._id}">
                <i class="fas fa-star"></i> Upgrade
                <span class="vr-btn__badge">$14.99/yr</span>
            </button>`;
    }
    
    // إنشاء تاريخ منسق
    const formattedDate = listing.createdAt 
        ? new Date(listing.createdAt).toLocaleDateString('ar-SA', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        })
        : '';
    
    // تنسيق النص بناءً على حالة القائمة
    let statusClass = '';
    if (status === 'featured') {
        statusClass = 'data-featured="true"';
    }
    
    return `
        <div class="vr-listing-card vr-listing-card--${status}" data-id="${listing._id}">
            <div class="vr-listing-card__image">
                <img src="${listing.mainImage || listing.images?.[0] || '/images/defaults/default-listing.jpg'}" 
                     alt="${listing.listingName}">
                <span class="vr-listing-card__status">${statusText}</span>
            </div>
            
            <div class="vr-listing-card__title-col">
                <h3 class="vr-listing-card__title">${listing.listingName}</h3>
            </div>
            
            <div class="vr-listing-card__actions">
                ${statusActionButton}
                <button class="vr-btn vr-btn--primary" 
                        data-action="edit-listing" 
                        data-id="${listing._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="vr-btn vr-btn--danger" 
                        data-action="delete-listing" 
                        data-id="${listing._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

    // Add methods to handle listing activation and upgrade
    activateListing(id) {
        this.redirectToCheckout(id, 'activate');
    }

    upgradeListing(id) {
        this.redirectToCheckout(id, 'upgrade');
    }

    // Method to handle checkout redirection
    redirectToCheckout(listingId, action) {
        try {
            // إذا كان العمل هو "تنشيط" فعندها نستخدم التنشيط المجاني
            if (action === 'activate') {
                this.handleFreeActivation(listingId);
                return;
            }
            
            // للترقية، نستمر إلى صفحة الدفع
            const loadingModal = this.showLoadingModal('Preparing Checkout');
            
            const listingData = this.listingsData.all.find(listing => listing._id === listingId);
            if (listingData) {
                const checkoutData = {
                    listingId: listingId,
                    listingName: listingData.listingName,
                    action: action,
                    timestamp: new Date().getTime(),
                    price: 14.99, // تم تعديل سعر الترقية إلى 14.99 دولار
                    billingInterval: 'yearly', // تم إضافة فترة الدفع (سنوياً)
                    returnUrl: window.location.href
                };
                
                sessionStorage.setItem('checkout_data', JSON.stringify(checkoutData));
            }
            
            // إغلاق شاشة التحميل والانتقال إلى صفحة الدفع
            setTimeout(() => {
                loadingModal.remove();
                window.location.href = `/pages/checkout.html?action=${action}&listing=${listingId}`;
            }, 800);
        } catch (error) {
            console.error('Error redirecting to checkout:', error);
            toastService.error('Failed to process request');
        }
    }

    // Method to show loading modal when redirecting
    showLoadingModal(message) {
        // Create modal container if it doesn't exist
        let modalContainer = document.createElement('div');
        modalContainer.id = 'vr-loading-modal-container';
        modalContainer.className = 'vr-modal vr-modal--active';
        
        modalContainer.innerHTML = `
            <div class="vr-modal__overlay"></div>
            <div class="vr-modal__container vr-modal__container--sm">
                <div class="vr-modal__body text-center">
                    <div class="vr-spinner vr-spinner--lg mb-3"></div>
                    <h4>${message}</h4>
                    <p class="text-muted">You will be redirected to the payment page...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
        return modalContainer;
    }

    // تحميل الصفحة من هاش URL
    loadPageFromHash() {
        let hash = window.location.hash.substring(1);
        if (!hash) {
            hash = 'profile'; // الصفحة الافتراضية
        }
        this.loadSection(hash);
    }

    /**
     * تحسين تحميل القوائم وإصلاح مشكلة الفلاتر
     */
    async loadListings(status = 'all') {
        try {
            // عرض skeleton مباشرة
            this.showListingsSkeleton();
            
            // تأخير صغير لضمان ظهور skeleton
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // جلب البيانات
            const data = await listingService.getUserListings();
            
            // تأخير صغير قبل إخفاء skeleton
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // تحديث البيانات
            this.listingsData = {
                all: data.listings || [],
                active: (data.listings || []).filter(item => item.isActive && !item.isPosted),
                featured: (data.listings || []).filter(item => item.isPosted),
                inactive: (data.listings || []).filter(item => !item.isActive)
            };
            
            // إخفاء skeleton وعرض البيانات
            this.hideListingsSkeleton();
            
            // تحميل البانر الترويجي بعد التحقق من البيانات
            await this.loadPromoComponent();
            
            // تحديث عدادات القوائم
            this.updateListingCounts();
            
            // إعادة إعداد أحداث التصفية للفلاتر
            this.setupFilterEvents();
            
            // تطبيق الفلتر المحدد
            this.filterListings(status);
            
        } catch (error) {
            console.error('Error loading listings:', error);
            toastService.error('Failed to load listings');
            this.hideListingsSkeleton();
        }
    }

    /**
     * تحميل مكون البانر الترويجي مع التحقق من وجود قوائم - تحسين لضمان الظهور
     */
    async loadPromoComponent() {
        try {
            const promoContainer = document.getElementById('profilePromoContainer');
            if (!promoContainer) {
                console.warn('Promo container not found');
                return;
            }
            
            // تجنب إعادة التحميل إذا كان المكون محملاً بالفعل
            if (promoContainer.children.length > 0) {
                // التأكد من أنه مرئي
                const promoBanner = promoContainer.querySelector('.vr-profile-promo');
                if (promoBanner) {
                    promoBanner.classList.add('visible');
                    promoBanner.style.opacity = '1';
                    promoBanner.style.transform = 'translateY(0)';
                }
                return;
            }
            
            console.log('Loading promo component...');
            
            // تحميل CSS الخاص بالبانر
            await this.loadCSS('/css/components/profile-promo.css');
            
            // تحميل قالب البانر
            const response = await fetch('/components/profile/promo-banner.html');
            if (!response.ok) {
                throw new Error(`Failed to load promo banner: ${response.status}`);
            }
            
            const html = await response.text();
            if (!html.trim()) {
                throw new Error('Promo banner template is empty');
            }
            
            // إضافة المحتوى للحاوية
            promoContainer.innerHTML = html;
            
            // تطبيق تأثير انتقالي لإظهار البانر بعد تحميله
            const promoBanner = promoContainer.querySelector('.vr-profile-promo');
            if (promoBanner) {
                // تأكد من عرض البانر بشكل صحيح
                promoBanner.style.display = 'block';
                promoBanner.style.opacity = '0';
                promoBanner.style.transform = 'translateY(-10px)';
                
                // إضافة تأخير بسيط لإظهار التأثير البصري
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        promoBanner.classList.add('visible');
                        promoBanner.style.opacity = '1';
                        promoBanner.style.transform = 'translateY(0)';
                    }, 100);
                });
                
                // إضافة تأثيرات مرور المؤشر على الخيارات
                const options = promoBanner.querySelectorAll('.vr-profile-promo__option');
                options.forEach(option => {
                    option.addEventListener('mouseenter', () => {
                        option.style.transform = 'translateY(-5px)';
                        option.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                    });
                    
                    option.addEventListener('mouseleave', () => {
                        option.style.transform = '';
                        option.style.boxShadow = '';
                    });
                });
                
                console.log('Promo banner loaded and visible');
            } else {
                console.warn('Promo banner element not found in loaded HTML');
            }
            
        } catch (error) {
            console.error('Error loading promo component:', error);
        }
    }

    /**
 * إضافة دالة لمعالجة التنشيط المجاني
 */
async handleFreeActivation(listingId) {
    try {
        // عرض شاشة تحميل
        const loadingModal = this.showLoadingModal('Activating Your Listing');
        
        // الحصول على بيانات القائمة
        const listing = this.listingsData.all.find(item => item._id === listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }
        
        // تحديث حالة القائمة في API
        await listingService.updateListingStatus(listingId, { 
            isActive: true,
            freeTrialStart: new Date().toISOString(),
            freeTrialEnd: this.calculateFreeTrialEndDate()
        });
        
        // إغلاق شاشة التحميل
        setTimeout(() => {
            loadingModal.remove();
            
            // عرض رسالة نجاح
            toastService.success('Your listing has been activated for free for 1 month!');
            
            // إعادة تحميل القوائم للتحديث
            this.loadListings();
        }, 1200);
        
    } catch (error) {
        console.error('Error during free activation:', error);
        toastService.error('Failed to activate your listing. Please try again.');
    }
}

// دالة لحساب تاريخ انتهاء الفترة المجانية (شهر واحد من الآن)
calculateFreeTrialEndDate() {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 1); // إضافة شهر واحد للتاريخ الحالي
    return endDate.toISOString();
}

    /**
 * تحسين إنشاء كرت القائمة بتصميم محسن
 */
createListingCard(listing) {
    const status = listing.isPosted ? 'featured' : (listing.isActive ? 'active' : 'inactive');
    const statusText = {
        featured: 'Featured',
        active: 'Active',
        inactive: 'Inactive'
    }[status];
    
    // تحديد أزرار الإجراءات بناءً على حالة القائمة
    let statusActionButton = '';
    
    if (status === 'inactive') {
        // للقوائم غير النشطة: إظهار زر التفعيل
        statusActionButton = `
            <button class="vr-btn vr-btn--success" 
                    data-action="activate-listing" 
                    data-id="${listing._id}">
                <i class="fas fa-check-circle"></i> Activate
                <span class="vr-btn__badge">Free</span>
            </button>`;
    } else if (status === 'active') {
        // للقوائم النشطة وغير المميزة: إظهار زر الترقية مع السعر السنوي الجديد
        statusActionButton = `
            <button class="vr-btn vr-btn--upgrade" 
                    data-action="upgrade-listing" 
                    data-id="${listing._id}">
                <i class="fas fa-star"></i> Upgrade
                <span class="vr-btn__badge">$14.99/yr</span>
            </button>`;
    }
    
    // إنشاء تاريخ منسق
    const formattedDate = listing.createdAt 
        ? new Date(listing.createdAt).toLocaleDateString('ar-SA', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        })
        : '';
    
    // تنسيق النص بناءً على حالة القائمة
    let statusClass = '';
    if (status === 'featured') {
        statusClass = 'data-featured="true"';
    }
    
    return `
        <div class="vr-listing-card vr-listing-card--${status}" data-id="${listing._id}">
            <div class="vr-listing-card__image">
                <img src="${listing.mainImage || listing.images?.[0] || '/images/defaults/default-listing.jpg'}" 
                     alt="${listing.listingName}">
                <span class="vr-listing-card__status">${statusText}</span>
            </div>
            
            <div class="vr-listing-card__title-col">
                <h3 class="vr-listing-card__title">${listing.listingName}</h3>
            </div>
            
            <div class="vr-listing-card__actions">
                ${statusActionButton}
                <button class="vr-btn vr-btn--primary" 
                        data-action="edit-listing" 
                        data-id="${listing._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="vr-btn vr-btn--danger" 
                        data-action="delete-listing" 
                        data-id="${listing._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

/**
 * تحديث دالة filterListings لعرض عناوين الأعمدة المناسبة
 */
filterListings(status = 'all') {
    const grid = document.querySelector('.vr-listings-grid');
    const emptyState = document.querySelector('.vr-listings-empty');
    
    if (!grid || !emptyState) return;
    
    const listings = this.listingsData[status] || [];
    
    // تأثير التلاشي عند تغيير المحتوى
    grid.style.opacity = '0';
    
    setTimeout(() => {
        if (listings.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            grid.style.display = 'block'; // تغيير من grid إلى block
            emptyState.style.display = 'none';
            
            // إضافة عناوين الأعمدة المحسّنة قبل القوائم
            let html = `
                <div class="vr-listing-table-header">
                    <div class="vr-listing-table-header__image">Image</div>
                    <div class="vr-listing-table-header__title">Title</div>
                    <div class="vr-listing-table-header__actions">Actions</div>
                </div>
            `;
            
            // إضافة كروت القوائم
            html += listings.map(listing => this.createListingCard(listing)).join('');
            
            grid.innerHTML = html;
            
            // إضافة أحداث على الكروت مع التحسينات الجديدة
            this.attachListingCardEvents();
            
            // تطبيق تأثيرات الظهور المتتابعة للكروت
            const cards = grid.querySelectorAll('.vr-listing-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50 * index); // تأخير تصاعدي لكل كرت
            });
        }
        
        // إظهار المحتوى الجديد
        requestAnimationFrame(() => {
            grid.style.opacity = '1';
        });
    }, 300);
}

/**
 * تحميل البانر الترويجي المحسّن مع تأثيرات
 */
async loadPromoComponent() {
    try {
        const promoContainer = document.getElementById('profilePromoContainer');
        if (!promoContainer) return;
        
        // التحقق من وجود قوائم قبل عرض البانر
        if (!this.listingsData.all || this.listingsData.all.length === 0) {
            // لا تعرض البانر عندما لا توجد قوائم
            promoContainer.innerHTML = '';
            return;
        }
        
        // تجنب إعادة التحميل إذا كان المكون محملاً بالفعل
        if (promoContainer.children.length > 0) return;
        
        // تحميل CSS الخاص بالبانر إذا لم يكن محملاً بالفعل
        this.loadCSS('/css/components/profile-promo.css');
        
        // تحميل قالب البانر
        const response = await fetch('/components/profile/promo-banner.html');
        if (!response.ok) throw new Error('Failed to load promo banner');
        
        const html = await response.text();
        promoContainer.innerHTML = html;
        
        // تطبيق تأثير انتقالي لإظهار البانر بعد تحميله
        const promoBanner = promoContainer.querySelector('.vr-profile-promo');
        if (promoBanner) {
            // تحضير البانر للتأثير
            promoBanner.style.opacity = '0';
            promoBanner.style.transform = 'translateY(-10px)';
            
            // إضافة تأخير بسيط لإظهار التأثير البصري
            requestAnimationFrame(() => {
                setTimeout(() => {
                    promoBanner.classList.add('visible');
                    promoBanner.style.opacity = '1';
                    promoBanner.style.transform = 'translateY(0)';
                }, 100);
            });
            
            // إضافة تأثيرات مرور المؤشر على الخيارات
            const options = promoBanner.querySelectorAll('.vr-profile-promo__option');
            options.forEach(option => {
                option.addEventListener('mouseenter', () => {
                    option.style.transform = 'translateY(-5px)';
                    option.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                });
                
                option.addEventListener('mouseleave', () => {
                    option.style.transform = '';
                    option.style.boxShadow = '';
                });
            });
        }
        
        console.log('Promo banner loaded successfully with enhanced animations');
    } catch (error) {
        console.error('Error loading promo component:', error);
    }
}

    async loadUserData() {
        try {
            // محاولة استعادة البيانات المخزنة
            const storedProfile = authService.getProfile();
            if (storedProfile) {
                this.userData = storedProfile;
                this.updateProfileUI();
            }
            
            // تحديث البيانات من السيرفر
            const userId = authService.getUserId();
            await this.loadUserProfile(userId);
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم:', error);
        }
    }

    /**
 * مساعد لتحميل ملفات CSS
 */
loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

/**
 * إضافة دالة showListingsSkeleton لعرض شاشة التحميل أثناء جلب القوائم
 */
showListingsSkeleton() {
    // البحث عن حاوية القوائم وشاشة التحميل
    const listingsContainer = document.querySelector('.vr-listings-grid');
    const skeleton = document.querySelector('.vr-listings-skeleton');
    
    if (!skeleton) {
        // إنشاء شاشة تحميل إذا لم تكن موجودة
        const skeletonHTML = `
            <div class="vr-listings-skeleton">
                ${Array(4).fill().map(() => `
                    <div class="vr-skeleton-card">
                        <div class="vr-skeleton-card__image"></div>
                        <div class="vr-skeleton-card__content">
                            <div class="vr-skeleton-card__title"></div>
                            <div class="vr-skeleton-card__info">
                                <div class="vr-skeleton-card__info-item"></div>
                                <div class="vr-skeleton-card__info-item"></div>
                            </div>
                            <div class="vr-skeleton-card__actions">
                                <div class="vr-skeleton-card__button"></div>
                                <div class="vr-skeleton-card__button"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // إضافة شاشة التحميل بعد حاوية القوائم
        if (listingsContainer) {
            listingsContainer.insertAdjacentHTML('afterend', skeletonHTML);
        } else {
            // إذا لم توجد حاوية، نبحث عن العنصر الرئيسي للقسم ونضيف فيه
            const parentContainer = document.getElementById('listingsContainer');
            if (parentContainer) {
                parentContainer.insertAdjacentHTML('beforeend', skeletonHTML);
            }
        }
    }
    
    // إخفاء حاوية القوائم وإظهار شاشة التحميل
    if (listingsContainer) {
        listingsContainer.style.display = 'none';
    }
    
    const updatedSkeleton = document.querySelector('.vr-listings-skeleton');
    if (updatedSkeleton) {
        updatedSkeleton.style.display = 'grid';
        
        // إضافة تأثيرات الظهور للهياكل العظمية
        const skeletonItems = updatedSkeleton.querySelectorAll('.vr-skeleton-card');
        skeletonItems.forEach((item, index) => {
            item.style.animation = `fade-in 0.3s ease forwards ${index * 0.1}s`;
        });
    }
    
    console.log('Listings skeleton displayed');
}

/**
 * إضافة دالة hideListingsSkeleton لإخفاء شاشة التحميل بعد اكتمال جلب القوائم
 */
hideListingsSkeleton() {
    // البحث عن حاوية القوائم وشاشة التحميل
    const listingsContainer = document.querySelector('.vr-listings-grid');
    const skeleton = document.querySelector('.vr-listings-skeleton');
    
    // إظهار حاوية القوائم
    if (listingsContainer) {
        listingsContainer.style.display = 'grid';
    }
    
    // إخفاء شاشة التحميل
    if (skeleton) {
        // إضافة تأثير تلاشي قبل الإخفاء
        skeleton.style.opacity = '0';
        skeleton.style.transform = 'translateY(10px)';
        
        // إخفاء العنصر بعد انتهاء التأثير
        setTimeout(() => {
            skeleton.style.display = 'none';
        }, 300);
    }
    
    console.log('Listings skeleton hidden');
}

/**
 * إضافة دالة setupFilterEvents للتعامل مع أحداث تصفية القوائم
 */
setupFilterEvents() {
    const tabs = document.querySelectorAll('.vr-tab');
    if (!tabs.length) {
        console.warn('No filter tabs found');
        return;
    }
    
    // إضافة مستمع للنقر على كل علامة تبويب
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // إزالة الفئة النشطة من جميع علامات التبويب
            tabs.forEach(t => t.classList.remove('active'));
            
            // إضافة الفئة النشطة للعلامة المنقورة
            tab.classList.add('active');
            
            // استخراج نوع التصفية واستدعاء دالة التصفية
            const type = tab.getAttribute('data-type') || 'all';
            this.filterListings(type);
        });
    });
    
    console.log('Filter events setup completed');
}

/**
 * إضافة دالة attachListingCardEvents للتعامل مع أحداث بطاقات القوائم
 */
attachListingCardEvents() {
    // البحث عن جميع بطاقات القوائم
    const cards = document.querySelectorAll('.vr-listing-card');
    
    // إضافة مستمعات للأحداث لكل بطاقة
    cards.forEach(card => {
        // تأثيرات عند المرور بالمؤشر
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-3px)';
            card.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
    
    console.log(`${cards.length} listing card events attached`);
}

}

// Initialize
const profilePage = new ProfilePage();
window.profilePage = profilePage; // جعل المتغير متاحًا عالميًا

export default profilePage;