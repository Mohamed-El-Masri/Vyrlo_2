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
        this.init();
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

    async init() {
        try {
            const userId = authService.getUserId();
            console.log('تهيئة البروفايل للمستخدم:', userId);

            // تحميل القوالب
            this.loadTemplates()
                .then(() => {
                    // إعداد أحداث النقر
            this.setupEventListeners();
            
                    // تحميل الصفحة من الهاش URL إذا كان موجود
                    this.loadPageFromHash();

                    // تحميل بيانات المستخدم
                    this.loadUserData();
                });
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
     * تصحيح تحديث واجهة المستخدم بناءً على هيكل البيانات الصحيح
     */
    updateProfileUI() {
        if (!this.userData) return;
        
        console.log('Updating UI with data:', this.userData);
        
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

    setupEventListeners() {
        // إضافة مستمعات للنقر على عناصر القائمة
        document.querySelectorAll('.profile-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                this.loadSection(section);
            });
        });

        // مستمع لتغييرات الهاش في URL
        window.addEventListener('hashchange', () => {
            this.loadPageFromHash();
        });

        // إضافة مستمع لزر تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Avatar upload
        this.setupAvatarUpload();

        // Profile form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Listing tabs
        document.querySelectorAll('.vr-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.dataset.type;
                this.filterListings(type);
            });
        });

        // معالج لزر إضافة حساب اجتماعي في الملف الشخصي
        const addProfileSocialBtn = document.getElementById('addProfileSocialBtn');
        if (addProfileSocialBtn) {
            addProfileSocialBtn.addEventListener('click', () => this.addSocialMediaField('profileSocialMediaContainer'));
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
            const submitButton = event.target.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<div class="vr-spinner vr-spinner--sm"></div> Saving...';
            submitButton.disabled = true;
            
            const formData = new FormData(event.target);
            const formValues = Object.fromEntries(formData.entries());
            
            if (!formValues.phoneNumber || !formValues.title) {
                toastService.error('Please fill in all required fields');
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                return;
            }
            
            const userId = authService.getUserId();
            const profileData = {
                title: formValues.title,
                phoneNumber: formValues.phoneNumber,
                address: formValues.address,
                city: formValues.city,
                state: formValues.state,
                zipCode: formValues.zipCode,
                about: formValues.about
            };
            
            // إرسال البيانات للتحديث
            const response = await apiService.post(`/profile/${userId}`, profileData);
            
            // تحديث البيانات المحلية
            this.userData = response;
            
            // تحديث البيانات في authService
            authService.setUserProfile(response);
            
            // إعادة تحميل البيانات من السيرفر للتأكد من التحديث
            await this.loadUserProfile(userId);
            
            toastService.success('Profile updated successfully');
            
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        } catch (error) {
            console.error('Error updating profile:', error);
            toastService.error('Failed to update profile: ' + (error.message || 'Unknown error'));
            
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

    updateListingCounts() {
        document.getElementById('totalListings').textContent = this.listingsData.all.length;
        document.getElementById('allCount').textContent = this.listingsData.all.length;
        document.getElementById('activeCount').textContent = this.listingsData.active.length;
        document.getElementById('featuredCount').textContent = this.listingsData.featured.length;
        document.getElementById('inactiveCount').textContent = this.listingsData.inactive.length;
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
                grid.style.display = 'grid';
                emptyState.style.display = 'none';
                
                grid.innerHTML = listings.map(listing => this.createListingCard(listing)).join('');
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

    async loadAddListingComponent() {
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
            new AddListingPage();

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

    createListingCard(listing) {
        const status = listing.isPosted ? 'featured' : (listing.isActive ? 'active' : 'inactive');
        const statusText = {
            featured: 'Featured',
            active: 'Active',
            inactive: 'Inactive'
        }[status];
        
        return `
            <div class="vr-listing-card vr-listing-card--${status}">
                <div class="vr-listing-card__image">
                    <img src="${listing.mainImage || listing.images?.[0] || '/images/defaults/default-listing.jpg'}" 
                         alt="${listing.title}">
                    <span class="vr-listing-card__status">${statusText}</span>
                </div>
                <div class="vr-listing-card__content">
                    <h3 class="vr-listing-card__title">${listing.title}</h3>
                    <p class="vr-listing-card__description">${listing.description || 'No description available'}</p>
                    <div class="vr-listing-card__meta">
                        <span>
                            <i class="fas fa-map-marker-alt"></i>
                            ${listing.location || 'No location'}
                        </span>
                        <span>
                            <i class="fas fa-calendar"></i>
                            ${new Date(listing.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div class="vr-listing-card__actions">
                    <button class="vr-btn vr-btn--primary" onclick="profilePage.editListing('${listing._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="vr-btn vr-btn--danger" onclick="profilePage.deleteListing('${listing._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    // تحميل الصفحة من هاش URL
    loadPageFromHash() {
        let hash = window.location.hash.substring(1);
        if (!hash) {
            hash = 'profile'; // الصفحة الافتراضية
        }
        this.loadSection(hash);
    }

    // تحسين تحميل القوائم
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
            this.filterListings(status);
            
        } catch (error) {
            console.error('Error loading listings:', error);
            toastService.error('Failed to load listings');
            this.hideListingsSkeleton();
        }
    }

    async loadTemplates() {
        try {
            // إنشاء ملف للتحميل المتزامن
            const loadComponentPromises = [
                // تحميل قالب البروفايل
                fetch('/components/profile/profile-info.html')
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to load profile template');
                        return response.text();
                    })
                    .then(html => {
                        const container = document.getElementById('profileContainer');
                        if (container) container.innerHTML = html;
                    }),
                    
                // تحميل قالب إضافة قائمة جديدة
                fetch('/components/profile/addListing.html')
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to load add listing template');
                        return response.text();
                    })
                    .then(html => {
                        const container = document.getElementById('addListingContainer');
                        if (container) container.innerHTML = html;
                    }),
                    
                // تحميل قالب عرض القوائم
                fetch('/components/profile/listings-grid.html')
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to load listings grid template');
                        return response.text();
                    })
                    .then(html => {
                        const container = document.getElementById('listingsContainer');
                        if (container) container.innerHTML = html;
                    })
            ];
            
            // انتظار اكتمال جميع عمليات التحميل
            await Promise.all(loadComponentPromises);
            console.log('All templates loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading templates:', error);
            toastService.error('Failed to load page components. Please try again.');
            throw error;
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

    // دالة موحدة لعرض skeleton
    showProfileSkeleton() {
        // عرض skeleton للمعلومات الجانبية
        const userInfo = document.querySelector('.vr-profile__user-info');
        const avatar = document.querySelector('.vr-profile-avatar img');
        
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="vr-skeleton">
                    <div class="vr-skeleton--text" style="width: 70%; height: 24px; margin-bottom: 8px;"></div>
                    <div class="vr-skeleton--text" style="width: 90%; height: 16px;"></div>
                </div>
            `;
        }
        
        if (avatar) {
            avatar.style.opacity = '0.5';
            avatar.classList.add('vr-skeleton--avatar');
        }

        // عرض skeleton للقوائم
        const listingsGrid = document.querySelector('.vr-listings-grid');
        if (listingsGrid) {
            listingsGrid.innerHTML = Array(4).fill().map(() => `
                <div class="vr-skeleton vr-skeleton--card">
                    <div class="vr-skeleton--image"></div>
                    <div class="vr-skeleton--content">
                        <div class="vr-skeleton--text" style="width: 80%;"></div>
                        <div class="vr-skeleton--text" style="width: 60%;"></div>
                    </div>
                </div>
            `).join('');
        }
    }

    // دالة موحدة لإخفاء skeleton
    hideProfileSkeleton() {
        const userInfo = document.querySelector('.vr-profile__user-info');
        const avatar = document.querySelector('.vr-profile-avatar img');
        
        if (avatar) {
            avatar.style.opacity = '1';
            avatar.classList.remove('vr-skeleton--avatar');
        }
        
        // تحديث المعلومات مباشرة إذا كانت متوفرة
        if (this.userData && userInfo) {
            const userInfoData = this.userData.userId || {};
            userInfo.innerHTML = `
                <h3 id="userName">${userInfoData.username || 'User'}</h3>
                <p id="userEmail">${userInfoData.email || 'No email available'}</p>
            `;
        }
    }

    // إضافة دالة منفصلة لإضافة حقل تواصل اجتماعي للملف الشخصي
    addSocialMediaField(containerId = 'profileSocialMediaContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'vr-social-account';
        
        fieldDiv.innerHTML = `
            <select class="vr-input vr-social-platform" name="socialPlatform[]">
                <option value="">Select Platform</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
            </select>
            <input type="url" class="vr-input" name="socialUrl[]" placeholder="Profile URL">
            <button type="button" class="vr-btn vr-btn--icon vr-remove-social">
                <i class="fas fa-times"></i>
            </button>
        `;

        fieldDiv.querySelector('.vr-remove-social').addEventListener('click', () => {
            fieldDiv.remove();
        });

        container.appendChild(fieldDiv);
    }

    /**
     * إظهار حالة التحميل السكيلتون للقوائم
     */
    showListingsSkeleton() {
        const listingsGrid = document.querySelector('.vr-listings-grid');
        if (!listingsGrid) return;
        
        // حفظ المحتوى الأصلي
        if (!listingsGrid._originalContent) {
            listingsGrid._originalContent = listingsGrid.innerHTML;
        }
        
        // إنشاء 4 بطاقات سكيلتون
        const skeletonHTML = Array(4).fill().map(() => `
            <div class="vr-skeleton vr-skeleton--card">
                <div style="height: 180px; background: var(--vr-gray-200);"></div>
                <div style="padding: 15px;">
                    <div class="vr-skeleton vr-skeleton--text" style="width: 70%;"></div>
                    <div class="vr-skeleton vr-skeleton--text" style="width: 90%;"></div>
                    <div class="vr-skeleton vr-skeleton--text" style="width: 50%;"></div>
                </div>
            </div>
        `).join('');
        
        listingsGrid.innerHTML = skeletonHTML;
    }

    /**
     * استعادة المحتوى الأصلي بعد التحميل
     */
    hideListingsSkeleton() {
        const listingsGrid = document.querySelector('.vr-listings-grid');
        if (listingsGrid && listingsGrid._originalContent) {
            listingsGrid.innerHTML = listingsGrid._originalContent;
            delete listingsGrid._originalContent;
        }
    }

    // إعداد أحداث التصفية
    setupFilterEvents() {
        const filterTabs = document.querySelectorAll('.vr-filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                
                // تحديث الفلتر النشط
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // تمرير التاب إلى منتصف الشاشة
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                
                // تطبيق الفلتر مع تأثير انتقالي
                this.filterListings(filter);
            });
        });
    }
}

// Initialize
const profilePage = new ProfilePage();
export default profilePage;