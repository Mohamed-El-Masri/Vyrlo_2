import { authService } from '../services/auth.service.js';

/**
 * Component Loader
 * مكتبة لتحميل وإدراج المكونات HTML في الصفحة
 */

class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.preloadQueue = new Set();
        this.initializeComponents();
    }

    initializeComponents() {
        // Initialize immediately if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Update on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateHeaderAuth();
            }
        });
    }

    async init() {
        try {
            await this.loadHeader();
            await this.loadFooter();
            
            // Initialize auth state
            this.updateHeaderAuth();
            authService.onAuthStateChange(() => {
                this.updateHeaderAuth();
            });
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    async loadHeader() {
        try {
            const headerContainer = document.getElementById('headerContainer');
            if (!headerContainer) return;

            // Show skeleton loader
            headerContainer.innerHTML = this.getSkeletonLoader('headerContainer');

            // Get from cache or load
            let html = this.cache.get('header');
            if (!html) {
                const response = await fetch('/components/header.html');
                if (!response.ok) throw new Error('Failed to load header');
                html = await response.text();
                this.cache.set('header', html);
            }

            // Render header
            headerContainer.innerHTML = html;

            // Initialize header
            this.setupHeaderInteractions();
            this.updateHeaderAuth();
        } catch (error) {
            console.error('Error loading header:', error);
            this.handleError('headerContainer');
        }
    }

    async loadFooter() {
        try {
            const footerContainer = document.getElementById('footerContainer');
            if (!footerContainer) return;

            let html = this.cache.get('footer');
            if (!html) {
                const response = await fetch('/components/footer.html');
                if (!response.ok) throw new Error('Failed to load footer');
                html = await response.text();
                this.cache.set('footer', html);
            }

            footerContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    setupHeaderInteractions() {
        // Mobile menu toggle
        const menuTrigger = document.getElementById('menuTrigger');
        const mainNav = document.getElementById('mainNav');
        
        if (menuTrigger && mainNav) {
            menuTrigger.addEventListener('click', () => {
                menuTrigger.classList.toggle('active');
                mainNav.classList.toggle('active');
            });
        }

        // Notification dropdown
        const notificationTrigger = document.getElementById('notificationTrigger');
        const notificationDropdown = document.getElementById('notificationDropdown');
        
        if (notificationTrigger && notificationDropdown) {
            this.setupDropdown(notificationTrigger, notificationDropdown);
        }

        // Profile dropdown
        const profileTrigger = document.getElementById('profileTrigger');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileTrigger && profileDropdown) {
            this.setupDropdown(profileTrigger, profileDropdown);
        }

        // Set active navigation link
        this.setActiveNavLink();
    }

    updateHeaderAuth() {
        const guestView = document.getElementById('guestView');
        const userView = document.getElementById('userView');
        const profileName = document.getElementById('profileName');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const headerAvatar = document.getElementById('headerAvatar');
        const dropdownAvatar = document.getElementById('dropdownAvatar');

        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getUser();
        const profile = authService.getProfile();

        if (isAuthenticated && user) {
            if (guestView) guestView.style.display = 'none';
            if (userView) userView.style.display = 'flex';
            
            if (profileName) profileName.textContent = `Hello, ${user.name}`;
            if (dropdownName) dropdownName.textContent = user.name;
            if (dropdownEmail) dropdownEmail.textContent = user.email;
            
            if (profile?.avatar) {
                const avatarUrl = profile.avatar;
                if (headerAvatar) headerAvatar.src = avatarUrl;
                if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
            }

            this.setupUserDropdown();
        } else {
            if (guestView) guestView.style.display = 'flex';
            if (userView) userView.style.display = 'none';
        }
    }

    setupUserDropdown() {
        const profileTrigger = document.getElementById('profileTrigger');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (!profileTrigger || !profileDropdown) return;

        // Remove existing listeners
        const newTrigger = profileTrigger.cloneNode(true);
        const newDropdown = profileDropdown.cloneNode(true);
        profileTrigger.parentNode.replaceChild(newTrigger, profileTrigger);
        profileDropdown.parentNode.replaceChild(newDropdown, profileDropdown);

        // Setup dropdown toggle
        newTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            newDropdown.classList.toggle('active');
            newTrigger.setAttribute('aria-expanded', 
                newDropdown.classList.contains('active').toString());
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!newDropdown.contains(e.target) && !newTrigger.contains(e.target)) {
                newDropdown.classList.remove('active');
                newTrigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Setup logout
        const logoutBtn = newDropdown.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authService.logout());
        }
    }

    setupDropdown(trigger, dropdown) {
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
            }
        };

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdown.classList.contains('active');
            
            // Close all other dropdowns
            document.querySelectorAll('.vr-header__dropdown').forEach(el => {
                el.classList.remove('active');
            });

            if (!isActive) {
                dropdown.classList.add('active');
                document.addEventListener('click', closeDropdown);
            }
        });
    }

    setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.vr-header__link');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            const page = link.getAttribute('data-page');
            
            if (currentPath === linkPath || 
                (page && currentPath.includes(page)) ||
                (currentPath === '/' && page === 'home')) {
                link.setAttribute('data-active', 'true');
            }
        });
    }

    getSkeletonLoader(containerId) {
        if (containerId === 'headerContainer') {
            return `
                <div class="vr-header vr-header--skeleton">
                    <div class="vr-header__container">
                        <div class="vr-skeleton vr-skeleton--logo"></div>
                        <div class="vr-skeleton vr-skeleton--nav"></div>
                        <div class="vr-skeleton vr-skeleton--auth"></div>
                    </div>
                </div>
            `;
        }
        return `<div class="vr-skeleton"></div>`;
    }

    handleError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="vr-error-component">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load component. Please refresh the page.</p>
                </div>
            `;
        }
    }

    /**
     * تحميل مكون HTML وإدراجه في حاوية محددة
     * 
     * @param {string} url - مسار ملف HTML المكون
     * @param {HTMLElement|string} container - العنصر أو معرّف العنصر الذي سيحتوي المكون
     * @param {object} data - بيانات لتمرير للمكون (اختياري)
     * @returns {Promise<HTMLElement>} وعد بالحاوية بعد إدراج المكون
     */
    async loadComponent(url, container, data = {}) {
        try {
            // تحويل المعرّف إلى عنصر DOM إذا كان نصيًا
            if (typeof container === 'string') {
                container = document.getElementById(container);
                if (!container) {
                    throw new Error(`Container element with ID '${container}' not found`);
                }
            }

            // الحصول على محتوى المكون
            const html = await this.fetchComponent(url);
            
            // تحضير المحتوى وإدراجه
            container.innerHTML = this.processTemplate(html, data);
            
            // تنفيذ أي كود JavaScript في المكون
            this.executeScripts(container);
            
            return container;
        } catch (error) {
            console.error(`Error loading component from ${url}:`, error);
            throw error;
        }
    }

    /**
     * جلب محتوى مكون HTML مع التخزين المؤقت
     * 
     * @param {string} url - مسار ملف HTML المكون
     * @returns {Promise<string>} وعد بمحتوى HTML للمكون
     */
    async fetchComponent(url) {
        // التحقق من وجود المكون في التخزين المؤقت
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        // تجنب تكرار نفس الطلب للمكون
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        // جلب المكون
        const promise = fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch component: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(html => {
                // تخزين المكون مؤقتًا
                this.cache.set(url, html);
                this.loadingPromises.delete(url);
                return html;
            })
            .catch(error => {
                this.loadingPromises.delete(url);
                throw error;
            });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    /**
     * معالجة قالب HTML واستبدال المتغيرات بالبيانات
     * 
     * @param {string} template - قالب HTML
     * @param {object} data - بيانات لإدخالها في القالب
     * @returns {string} HTML مع استبدال المتغيرات
     */
    processTemplate(template, data) {
        if (!data || Object.keys(data).length === 0) {
            return template;
        }
        
        // استبدال المتغيرات في القالب بتنسيق {{variableName}}
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return data.hasOwnProperty(key) ? data[key] : match;
        });
    }

    /**
     * تنفيذ أي عنصر script موجود في المكون
     * 
     * @param {HTMLElement} container - حاوية المكون
     */
    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // نسخ كل خاصية من السكريبت القديم إلى الجديد
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // نسخ محتوى السكريبت
            newScript.textContent = oldScript.textContent;
            
            // استبدال السكريبت القديم بالجديد لتنفيذه
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    /**
     * مسح التخزين المؤقت للمكونات
     */
    clearCache() {
        this.cache.clear();
    }
}

// تصدير نسخة واحدة من الفئة للاستخدام في جميع أنحاء التطبيق
export const componentLoader = new ComponentLoader();