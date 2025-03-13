/**
 * Toast types for different message styles
 */
const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

/**
 * Default toast options
 */
const DEFAULT_OPTIONS = {
    duration: 3000,
    position: 'top-right',
    showProgress: true,
    pauseOnHover: true
};

class ToastService {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = new Map();
        this.defaultOptions = {
            duration: 3000,
            type: 'info',
            position: 'top-right',
            showProgress: true,
            pauseOnHover: true
        };
    }

    show(message, options = {}) {
        const settings = { ...this.defaultOptions, ...options };
        const toastId = this.generateId();
        
        const toast = this.createToast(message, settings);
        this.toasts.set(toastId, { element: toast, timer: null });
        
        this.container.appendChild(toast);
        
        // Trigger animation in next frame
        requestAnimationFrame(() => {
            toast.classList.add('vr-toast--visible');
            if (settings.showProgress) {
                this.startProgress(toastId, settings.duration);
            }
        });

        if (settings.duration > 0) {
            const timer = setTimeout(() => this.remove(toastId), settings.duration);
            this.toasts.get(toastId).timer = timer;
        }

        if (settings.pauseOnHover) {
            toast.addEventListener('mouseenter', () => this.pause(toastId));
            toast.addEventListener('mouseleave', () => this.resume(toastId));
        }

        toast.querySelector('.vr-toast__close').addEventListener('click', () => {
            this.remove(toastId);
        });

        return toastId;
    }

    createToast(message, settings) {
        const toast = document.createElement('div');
        toast.className = `vr-toast vr-toast--${settings.type}`;
        
        toast.innerHTML = `
            <div class="vr-toast__icon">
                ${this.getIconForType(settings.type)}
            </div>
            <div class="vr-toast__content">
                ${settings.title ? `<div class="vr-toast__title">${settings.title}</div>` : ''}
                <div class="vr-toast__message">${message}</div>
            </div>
            <button class="vr-toast__close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
            ${settings.showProgress ? '<div class="vr-toast__progress"></div>' : ''}
        `;

        return toast;
    }

    getIconForType(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    error(message, options = {}) {
        return this.show(message, { ...options, type: 'error', duration: 5000 });
    }

    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning', duration: 4000 });
    }

    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }

    remove(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        clearTimeout(toast.timer);
        toast.element.classList.add('vr-toast--hiding');
        
        setTimeout(() => {
            if (toast.element.parentNode === this.container) {
                this.container.removeChild(toast.element);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    pause(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        clearTimeout(toast.timer);
        
        const progress = toast.element.querySelector('.vr-toast__progress');
        if (progress) {
            progress.style.animationPlayState = 'paused';
        }
    }

    resume(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const progress = toast.element.querySelector('.vr-toast__progress');
        if (progress) {
            progress.style.animationPlayState = 'running';
            
            const remaining = parseFloat(progress.style.getPropertyValue('--progress')) * 
                            this.defaultOptions.duration;
            
            toast.timer = setTimeout(() => {
                this.remove(toastId);
            }, remaining);
        }
    }

    startProgress(toastId, duration) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const progress = toast.element.querySelector('.vr-toast__progress');
        if (progress) {
            progress.style.setProperty('--duration', `${duration}ms`);
            progress.style.animation = `toast-progress ${duration}ms linear`;
        }
    }

    generateId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    clear() {
        this.toasts.forEach((toast, id) => this.remove(id));
    }
}

// Export singleton instance
export const toastService = new ToastService(); 