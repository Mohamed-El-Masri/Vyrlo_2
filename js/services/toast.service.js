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
        this.toasts = [];
        this.defaultDuration = 3000; // 3 seconds
    }

    show(message, type = 'info', duration = this.defaultDuration) {
        const toast = this.createToast(message, type);
        this.toasts.push(toast);
        this.container.appendChild(toast);

        // Trigger reflow to enable animation
        toast.offsetHeight;
        toast.classList.add('vr-toast--visible');

        // Auto remove after duration
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        return toast;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    remove(toast) {
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
            this.toasts.splice(index, 1);
            toast.classList.remove('vr-toast--visible');
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (toast.parentNode === this.container) {
                    this.container.removeChild(toast);
                }
            }, 300); // Match CSS transition duration
        }
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `vr-toast vr-toast--${type}`;
        
        const icon = this.getIconForType(type);
        
        toast.innerHTML = `
            <div class="vr-toast__icon">
                <i class="${icon}"></i>
            </div>
            <div class="vr-toast__content">
                ${message}
            </div>
            <button class="vr-toast__close">&times;</button>
        `;

        // Add close button handler
        toast.querySelector('.vr-toast__close').addEventListener('click', () => {
            this.remove(toast);
        });

        return toast;
    }

    getIconForType(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-times-circle';
            case 'warning':
                return 'fas fa-exclamation-circle';
            case 'info':
            default:
                return 'fas fa-info-circle';
        }
    }

    clear() {
        while (this.toasts.length) {
            this.remove(this.toasts[0]);
        }
    }
}

// Initialize the service and make it globally available
window.ToastService = new ToastService(); 