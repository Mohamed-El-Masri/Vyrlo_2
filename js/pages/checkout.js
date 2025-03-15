import { authService } from '../services/auth.service.js';
import { toastService } from '../services/toast.service.js';
import { listingService } from '../services/listing.service.js';

class CheckoutPage {
    constructor() {
        // Load header and footer
        this.loadComponents();
        
        // Check authentication
        if (!authService.isAuthenticated()) {
            toastService.error('You must be logged in to access this page');
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 1500);
            return;
        }
        
        // Get checkout data
        this.checkoutData = this.getCheckoutData();
        if (!this.checkoutData) {
            toastService.error('Invalid checkout session');
            setTimeout(() => {
                window.location.href = '/pages/profile.html#listings';
            }, 1500);
            return;
        }
        
        // Initialize
        this.init();
    }
    
    loadComponents() {
        // Load header
        fetch('/components/header.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('headerContainer').innerHTML = html;
                // Initialize header functionality if needed
                if (window.initHeader && typeof window.initHeader === 'function') {
                    window.initHeader();
                }
            })
            .catch(err => console.error('Error loading header:', err));
            
        // Load footer
        fetch('/components/footer.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('footerContainer').innerHTML = html;
            })
            .catch(err => console.error('Error loading footer:', err));
    }
    
    getCheckoutData() {
        // First try to get data from session storage
        let data = sessionStorage.getItem('checkout_data');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Error parsing checkout data:', e);
            }
        }
        
        // If no data in session storage, try to get from URL
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const listingId = params.get('listing');
        
        if (action && listingId) {
            // تعديل: تحديد سعر الترقية إلى 14.99 دولار سنوياً
            const price = action === 'upgrade' ? 14.99 : 9.99;
            
            return {
                listingId,
                action,
                price,
                timestamp: new Date().getTime(),
                billingInterval: action === 'upgrade' ? 'yearly' : 'monthly' // إضافة فترة الدفع
            };
        }
        
        return null;
    }
    
    init() {
        // Update UI with checkout data
        this.updateCheckoutSummary();
        
        // Set up Cancel button with modal confirmation
        document.getElementById('cancelBtn')?.addEventListener('click', () => this.handleCancel());
        
        // Initialize PayPal
        this.initPayPal();
    }
    
    updateCheckoutSummary() {
        // Set action-specific details
        const actionMap = {
            'upgrade': {
                text: 'Upgrade to Featured',
                detailsId: 'upgradeDetails',
                period: 'year' // تم تغييرها إلى سنة
            },
            'activate': {
                text: 'Activate Listing',
                detailsId: 'activateDetails',
                period: 'month'
            }
        };
        
        const actionInfo = actionMap[this.checkoutData.action];
        const listingName = this.checkoutData.listingName || `Listing #${this.checkoutData.listingId.substring(0, 8)}`;
        
        document.getElementById('checkoutItemName').textContent = `${actionInfo.text}: ${listingName}`;
        document.getElementById('checkoutItemPrice').textContent = `$${this.checkoutData.price.toFixed(2)}`;
        document.getElementById('checkoutTotal').textContent = `$${this.checkoutData.price.toFixed(2)}`;
        
        // إضافة فترة الدفع إلى الوصف (شهرياً/سنوياً)
        const pricePeriod = document.getElementById('checkoutPricePeriod');
        if (pricePeriod) {
            pricePeriod.textContent = `per ${actionInfo.period}`;
        }
        
        // Show relevant details section
        document.getElementById(actionInfo.detailsId).style.display = 'block';
    }
    
    async processUpgrade() {
        try {
            // تعديل: تحديث تاريخ انتهاء الترقية إلى سنة كاملة بدلاً من 30 يوم
            await listingService.updateListingStatus(this.checkoutData.listingId, {
                isPosted: true,
                featuredUntil: this.getFutureDate(365) // سنة كاملة (365 يوم)
            });
            
            // Clear checkout data
            sessionStorage.removeItem('checkout_data');
            
            // إظهار رسالة نجاح مع توضيح أن الترقية سنوية
            toastService.success('Your listing has been upgraded to Featured status for one year!');
            
            // Redirect back to profile page
            setTimeout(() => {
                window.location.href = this.checkoutData.returnUrl || '/pages/profile.html#listings';
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Error processing upgrade:', error);
            toastService.error('Failed to upgrade listing. Please try again.');
            throw error;
        }
    }
    
    async processActivation() {
        try {
            // Call API to activate listing
            await listingService.updateListingStatus(this.checkoutData.listingId, {
                isActive: true,
                activeUntil: this.getFutureDate(30) // 30 days from now
            });
            
            // Clear checkout data
            sessionStorage.removeItem('checkout_data');
            
            // Show success message
            toastService.success('Your listing has been successfully activated!');
            
            // Redirect back to profile page
            setTimeout(() => {
                window.location.href = this.checkoutData.returnUrl || '/pages/profile.html#listings';
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Error processing activation:', error);
            toastService.error('Failed to activate listing. Please try again.');
            throw error;
        }
    }
    
    getFutureDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
    
    handleCancel() {
        // استخدام modal التأكيد بدلاً من confirm العادي
        this.showConfirmationModal(
            'Cancel Payment',
            'Are you sure you want to cancel this transaction? Your listing status will not be changed.'
        ).then(confirmed => {
            if (confirmed) {
                window.location.href = this.checkoutData.returnUrl || '/pages/profile.html#listings';
            }
        });
    }

    // إضافة دالة modal التأكيد (مشابهة للتي في profile.js)
    showConfirmationModal(title, message) {
        return new Promise((resolve) => {
            // إنشاء حاوية modal إذا لم تكن موجودة
            let modalContainer = document.getElementById('vr-confirmation-modal-container');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'vr-confirmation-modal-container';
                document.body.appendChild(modalContainer);
            }
            
            // إنشاء HTML للـ modal
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
                                Continue Payment
                            </button>
                            <button class="vr-btn vr-btn--danger" data-action="confirm">
                                Cancel Payment
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // إضافة modal إلى الحاوية
            modalContainer.innerHTML = modalHTML;
            
            // الحصول على عنصر modal
            const modal = document.getElementById(modalId);
            
            // عرض modal مع تأثير انتقالي
            setTimeout(() => {
                modal.classList.add('vr-modal--active');
            }, 10);
            
            // إعداد مستمعي الأحداث
            modal.querySelectorAll('[data-action]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.target.closest('[data-action]').getAttribute('data-action');
                    
                    // إخفاء modal مع تأثير انتقالي
                    modal.classList.remove('vr-modal--active');
                    
                    // إزالة modal بعد انتهاء التأثير
                    setTimeout(() => {
                        modal.remove();
                        resolve(action === 'confirm');
                    }, 300);
                });
            });
        });
    }
    
    initPayPal() {
        const paypalButtonContainer = document.getElementById('paypal-button-container');
        if (!paypalButtonContainer) {
            console.error('PayPal button container not found');
            toastService.error('Payment system initialization failed');
            return;
        }
        
        // Initialize PayPal button
        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
            },
            
            createOrder: (data, actions) => {
                // Create the order with PayPal
                return actions.order.create({
                    purchase_units: [{
                        description: this.checkoutData.action === 'upgrade' ? 
                            'Vyrlo Listing Upgrade' : 'Vyrlo Listing Activation',
                        amount: {
                            value: this.checkoutData.price.toFixed(2),
                            currency_code: 'USD'
                        }
                    }]
                });
            },
            
            onApprove: async (data, actions) => {
                try {
                    // Show loading state
                    paypalButtonContainer.innerHTML = '<div class="vr-spinner vr-spinner--lg"></div> Processing payment...';
                    
                    // Capture the funds from the transaction
                    const details = await actions.order.capture();
                    console.log('Payment completed successfully', details);
                    
                    // Process based on action type
                    if (this.checkoutData.action === 'upgrade') {
                        await this.processUpgrade();
                    } else {
                        await this.processActivation();
                    }
                } catch (error) {
                    console.error('Payment processing error:', error);
                    toastService.error('Payment processing failed. Please try again.');
                    
                    // Restore PayPal button
                    this.initPayPal();
                }
            },
            
            onCancel: (data) => {
                console.log('Payment cancelled by user', data);
                toastService.info('Payment cancelled. No changes were made to your listing.');
            },
            
            onError: (err) => {
                console.error('PayPal error:', err);
                toastService.error('An error occurred during the payment process. Please try again.');
            }
            
        }).render('#paypal-button-container');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutPage = new CheckoutPage();
});

export default CheckoutPage;
