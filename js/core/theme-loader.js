/**
 * نظام تحميل ملفات CSS للموضوعات
 */
class ThemeLoader {
    constructor() {
        this.loadedThemes = new Set();
    }

    /**
     * تحميل ملف CSS موضوع
     * @param {string} themePath - مسار ملف الموضوع، مثال: themes/dark-theme.css
     * @returns {Promise<boolean>} - وعد يشير إلى نجاح التحميل
     */
    loadTheme(themePath) {
        return new Promise((resolve, reject) => {
            if (this.loadedThemes.has(themePath)) {
                resolve(true); // الملف محمل بالفعل
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = `/css/${themePath}`;
            
            link.onload = () => {
                this.loadedThemes.add(themePath);
                console.log(`Theme loaded: ${themePath}`);
                resolve(true);
            };
            
            link.onerror = (err) => {
                console.error(`Failed to load theme: ${themePath}`, err);
                reject(false);
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * تحميل مجموعة من ملفات الموضوعات
     * @param {Array<string>} themePaths - مسارات ملفات الموضوعات
     * @returns {Promise<boolean[]>} - وعود تشير إلى نتائج التحميل
     */
    loadThemes(themePaths) {
        return Promise.all(themePaths.map(path => this.loadTheme(path)));
    }

    /**
     * إزالة ملف موضوع
     * @param {string} themePath - مسار ملف الموضوع للإزالة
     */
    removeTheme(themePath) {
        if (!this.loadedThemes.has(themePath)) {
            return; // الملف غير محمل
        }

        const links = document.querySelectorAll('link[rel="stylesheet"]');
        for (const link of links) {
            if (link.href.endsWith(themePath)) {
                link.remove();
                this.loadedThemes.delete(themePath);
                console.log(`Theme removed: ${themePath}`);
                break;
            }
        }
    }
}

export const themeLoader = new ThemeLoader();
