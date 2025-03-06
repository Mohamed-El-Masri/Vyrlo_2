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
        
        // Create toast element
        const toast = this.createToast(message, settings, toastId);
        this.toasts.set(toastId, { element: toast, timer: null });
        
        // Add to container
        this.container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('vr-toast--visible');
            
            if (settings.showProgress) {
                this.startProgress(toastId, settings.duration);
            }
        });

        // Setup auto remove
        if (settings.duration > 0) {
            const timer = setTimeout(() => {
                this.remove(toastId);
            }, settings.duration);
            
            this.toasts.get(toastId).timer = timer;
        }

        // Setup pause on hover
        if (settings.pauseOnHover) {
            toast.addEventListener('mouseenter', () => this.pause(toastId));
            toast.addEventListener('mouseleave', () => this.resume(toastId));
        }

        return toastId;
    }

    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    error(message, options = {}) {
        return this.show(message, { ...options, type: 'error' });
    }

    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning' });
    }

    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }

    remove(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        clearTimeout(toast.timer);
        toast.element.classList.remove('vr-toast--visible');
        
        // Remove after animation
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

    createToast(message, settings, toastId) {
        const toast = document.createElement('div');
        toast.className = `vr-toast vr-toast--${settings.type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        const icon = this.getIconForType(settings.type);
        
        toast.innerHTML = `
            <div class="vr-toast__icon">
                <i class="${icon}"></i>
            </div>
            <div class="vr-toast__content">
                <div class="vr-toast__message">${message}</div>
                ${settings.showProgress ? '<div class="vr-toast__progress"></div>' : ''}
            </div>
            <button class="vr-toast__close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close button handler
        toast.querySelector('.vr-toast__close').addEventListener('click', () => {
            this.remove(toastId);
        });

        return toast;
    }

    getIconForType(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-times-circle';
            case 'warning': return 'fas fa-exclamation-circle';
            case 'info':
            default: return 'fas fa-info-circle';
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

// Initialize the service and make it globally available
window.toastService = new ToastService(); 