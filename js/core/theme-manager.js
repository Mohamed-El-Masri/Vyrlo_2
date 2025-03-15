/**
 * مدير الموضوعات - يدير تحميل وتفعيل الموضوعات المختلفة
 */

import { themeLoader } from './theme-loader.js';

/**
 * مدير الموضوعات - يدير التبديل بين الموضوعات ويحفظ التفضيلات
 */
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('vyrlo-theme') || 'light';
        this.themeLoader = themeLoader;
        this.themeConfig = {
            light: {
                cssFiles: [],
                cssVars: {
                    '--vr-bg-primary': '#ffffff',
                    '--vr-text-primary': '#333333'
                }
            },
            dark: {
                cssFiles: ['themes/dark-theme.css'],
                cssVars: {
                    '--vr-bg-primary': '#1f1f1f',
                    '--vr-text-primary': '#f1f1f1'
                }
            }
        };
        
        this.init();
    }

    /**
     * تهيئة مدير الموضوعات
     */
    init() {
        // تحميل الموضوع الحالي
        this.setTheme(this.currentTheme, false);
        
        // التحقق من تفضيل النظام
        this.setupSystemPreferenceListener();
        
        // إضافة مستمعي الأحداث إلى أزرار تبديل الموضوع
        this.setupThemeToggleListeners();
    }

    /**
     * تعيين موضوع معين
     * @param {string} theme - اسم الموضوع ('light' أو 'dark')
     * @param {boolean} save - هل يتم حفظ التفضيل؟
     */
    async setTheme(theme = 'light', save = true) {
        if (!this.themeConfig[theme]) {
            console.error(`Theme "${theme}" not found`);
            return;
        }

        const config = this.themeConfig[theme];
        
        // تحميل ملفات CSS المطلوبة
        if (config.cssFiles && config.cssFiles.length) {
            await this.themeLoader.loadThemes(config.cssFiles);
        }
        
        // تطبيق متغيرات CSS
        if (config.cssVars) {
            Object.entries(config.cssVars).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
        }
        
        // إضافة كلاس الموضوع إلى العنصر الجذر
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${theme}`);
        
        // حفظ التفضيل
        if (save) {
            localStorage.setItem('vyrlo-theme', theme);
        }
        
        this.currentTheme = theme;
        
        // تنفيذ الحدث
        this.dispatchThemeChangeEvent(theme);
    }

    /**
     * تبديل بين موضوعات الضوء والظلام
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * إعداد مستمع لتفضيل النظام (الوضع الداكن/الفاتح)
     */
    setupSystemPreferenceListener() {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // التحقق من تفضيل النظام عند التحميل (إذا لم يكن المستخدم قد اختار تفضيلًا)
        if (!localStorage.getItem('vyrlo-theme')) {
            this.setTheme(darkModeMediaQuery.matches ? 'dark' : 'light', false);
        }
        
        // الاستماع للتغييرات في تفضيل النظام
        darkModeMediaQuery.addEventListener('change', (e) => {
            // تغيير الموضوع فقط إذا لم يكن المستخدم قد اختار تفضيلًا
            if (!localStorage.getItem('vyrlo-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    }

    /**
     * إعداد مستمعي الأحداث لأزرار تبديل الموضوع
     */
    setupThemeToggleListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // البحث عن جميع أزرار تبديل الموضوع
            const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
            toggleButtons.forEach(button => {
                button.addEventListener('click', () => this.toggleTheme());
            });
        });
    }

    /**
     * إرسال حدث تغيير الموضوع
     * @param {string} theme - اسم الموضوع الجديد
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('vyrlo-theme-changed', {
            detail: { theme }
        });
        document.dispatchEvent(event);
    }
}

// إنشاء نسخة واحدة من مدير الموضوعات
const themeManager = new ThemeManager();
export default themeManager;

// إتاحة مدير الموضوعات في الكائن العالمي window
window.themeManager = themeManager;
