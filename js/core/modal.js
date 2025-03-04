/**
 * Modal System
 * A reusable modal system with animations and accessibility features
 */
class Modal {
    constructor() {
        this.activeModal = null;
        this.modalStack = [];
        this.init();
    }

    init() {
        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });

        // Handle click outside
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('vr-modal')) {
                this.close(this.activeModal);
            }
        });
    }

    create({ id, title = '', content = '', size = 'md', onClose = null }) {
        // Remove existing modal if it exists
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <div id="${id}" class="vr-modal vr-modal--${size}">
                <div class="vr-modal__container">
                    ${title ? `
                        <div class="vr-modal__header">
                            <h3 class="vr-modal__title">${title}</h3>
                            <button class="vr-modal__close" aria-label="Close modal">×</button>
                        </div>
                    ` : ''}
                    <div class="vr-modal__content">${content}</div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal element
        const modal = document.getElementById(id);

        // Add close button event
        const closeBtn = modal.querySelector('.vr-modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close(modal));
        }

        // Store onClose callback
        if (onClose) {
            modal.onClose = onClose;
        }

        return modal;
    }

    open(modalId) {
        const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        if (!modal) return;

        // Add to stack
        this.modalStack.push(modal);
        this.activeModal = modal;

        // Show modal
        document.body.style.overflow = 'hidden';
        modal.classList.add('vr-modal--opening');
        modal.classList.add('active');

        // Focus first focusable element
        setTimeout(() => {
            const focusable = modal.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable) {
                focusable.focus();
            }
            modal.classList.remove('vr-modal--opening');
        }, 10);
    }

    close(modalId) {
        const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        if (!modal) return;

        // Remove from stack
        this.modalStack = this.modalStack.filter(m => m !== modal);
        this.activeModal = this.modalStack[this.modalStack.length - 1] || null;

        // Hide modal with animation
        modal.classList.add('vr-modal--closing');
        
        setTimeout(() => {
            modal.classList.remove('active');
            modal.classList.remove('vr-modal--closing');
            
            // Only reset body overflow if no other modals are open
            if (this.modalStack.length === 0) {
                document.body.style.overflow = '';
            }

            // Call onClose callback if exists
            if (modal.onClose) {
                modal.onClose();
            }

            // Remove modal from DOM
            modal.remove();
        }, 300);
    }

    closeAll() {
        [...this.modalStack].forEach(modal => this.close(modal));
    }

    setContent(modalId, content) {
        const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        if (!modal) return;

        const contentContainer = modal.querySelector('.vr-modal__content');
        if (contentContainer) {
            contentContainer.innerHTML = content;
        }
    }

    setTitle(modalId, title) {
        const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        if (!modal) return;

        const titleElement = modal.querySelector('.vr-modal__title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
}

// Export singleton instance
export default new Modal(); 