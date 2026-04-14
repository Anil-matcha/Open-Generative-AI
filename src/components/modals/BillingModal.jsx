import { BaseModal } from './BaseModal';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    period: 'month',
    features: ['5 projects', '720p export', 'Basic templates', 'Email support']
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29.99,
    period: 'month',
    popular: true,
    features: ['Unlimited projects', '4K export', 'Premium templates', 'Priority support', 'Custom branding']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    period: 'month',
    features: ['Everything in Pro', 'Team collaboration', 'API access', 'Dedicated account manager', 'SSO']
  }
];

const INVOICES = [
  { id: 'INV-001', date: '2026-03-01', amount: 29.99, status: 'paid' },
  { id: 'INV-002', date: '2026-02-01', amount: 29.99, status: 'paid' },
  { id: 'INV-003', date: '2026-01-01', amount: 29.99, status: 'paid' }
];

export class BillingModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Billing & Subscription',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.currentPlan = options.currentPlan || 'pro';
    this.currentTab = 'plans';
    this.paymentMethods = options.paymentMethods || [
      { id: 'card1', type: 'visa', last4: '4242', expiry: '12/25', isDefault: true }
    ];
    this.invoices = options.invoices || INVOICES;
  }

  renderBody() {
    return `
      <div class="billing-container">
        <div class="billing-tabs">
          <button class="billing-tab ${this.currentTab === 'plans' ? 'active' : ''}" data-tab="plans">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Plans
          </button>
          <button class="billing-tab ${this.currentTab === 'payment' ? 'active' : ''}" data-tab="payment">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Payment
          </button>
          <button class="billing-tab ${this.currentTab === 'invoices' ? 'active' : ''}" data-tab="invoices">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Invoices
          </button>
        </div>

        <div class="billing-content">
          ${this.currentTab === 'plans' ? this.renderPlansTab() : ''}
          ${this.currentTab === 'payment' ? this.renderPaymentTab() : ''}
          ${this.currentTab === 'invoices' ? this.renderInvoicesTab() : ''}
        </div>
      </div>
    `;
  }

  renderPlansTab() {
    return `
      <div class="plans-grid">
        ${PLANS.map(plan => `
          <div class="plan-card ${plan.popular ? 'popular' : ''} ${this.currentPlan === plan.id ? 'current' : ''}">
            ${plan.popular ? '<div class="plan-badge">Most Popular</div>' : ''}
            ${this.currentPlan === plan.id ? '<div class="plan-badge current-badge">Current Plan</div>' : ''}
            <h3 class="plan-name">${plan.name}</h3>
            <div class="plan-price">
              <span class="price-amount">$${plan.price}</span>
              <span class="price-period">/${plan.period}</span>
            </div>
            <ul class="plan-features">
              ${plan.features.map(feature => `
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  ${feature}
                </li>
              `).join('')}
            </ul>
            <button class="modal-btn ${this.currentPlan === plan.id ? 'modal-btn-secondary' : 'modal-btn-primary'} plan-action-btn" 
                    data-plan="${plan.id}" 
                    ${this.currentPlan === plan.id ? 'disabled' : ''}>
              ${this.currentPlan === plan.id ? 'Current Plan' : plan.price > PLANS.find(p => p.id === this.currentPlan).price ? 'Upgrade' : 'Downgrade'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderPaymentTab() {
    return `
      <div class="payment-section">
        <div class="payment-methods">
          <h4 class="section-title">Payment Methods</h4>
          ${this.paymentMethods.map(method => `
            <div class="payment-method ${method.isDefault ? 'default' : ''}">
              <div class="card-icon ${method.type}">
                ${method.type === 'visa' ? '<span>VISA</span>' : `<span>${method.type.toUpperCase()}</span>`}
              </div>
              <div class="card-details">
                <span class="card-number">•••• •••• •••• ${method.last4}</span>
                <span class="card-expiry">Expires ${method.expiry}</span>
              </div>
              ${method.isDefault ? '<span class="default-badge">Default</span>' : ''}
              <div class="card-actions">
                <button class="icon-btn set-default-btn" data-id="${method.id}" ${method.isDefault ? 'disabled' : ''} aria-label="Set as default">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
                <button class="icon-btn remove-card-btn" data-id="${method.id}" aria-label="Remove card">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
          <button class="modal-btn modal-btn-secondary add-payment-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Payment Method
          </button>
        </div>

        <div class="billing-address">
          <h4 class="section-title">Billing Address</h4>
          <div class="address-form">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-input" value="John Doe" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Address</label>
                <input type="text" class="form-input" value="123 Main Street" />
              </div>
            </div>
            <div class="form-row-group">
              <div class="form-group">
                <label>City</label>
                <input type="text" class="form-input" value="San Francisco" />
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" class="form-input" value="CA" />
              </div>
              <div class="form-group">
                <label>ZIP</label>
                <input type="text" class="form-input" value="94102" />
              </div>
            </div>
            <button class="modal-btn modal-btn-primary save-address-btn">Save Address</button>
          </div>
        </div>
      </div>
    `;
  }

  renderInvoicesTab() {
    return `
      <div class="invoices-section">
        <h4 class="section-title">Invoice History</h4>
        <div class="invoices-table">
          <div class="invoice-header">
            <span>Invoice</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          ${this.invoices.map(invoice => `
            <div class="invoice-row">
              <span class="invoice-id">${invoice.id}</span>
              <span class="invoice-date">${invoice.date}</span>
              <span class="invoice-amount">$${invoice.amount.toFixed(2)}</span>
              <span class="invoice-status ${invoice.status}">${invoice.status}</span>
              <div class="invoice-actions">
                <button class="icon-btn download-invoice-btn" data-id="${invoice.id}" aria-label="Download">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="invoices-summary">
          <div class="summary-row">
            <span>Total Billed</span>
            <span>$${this.invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    this.overlay.querySelectorAll('.billing-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.currentTab = e.currentTarget.dataset.tab;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.plan-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planId = e.currentTarget.dataset.plan;
        this.upgradeToPlan(planId);
      });
    });

    this.overlay.querySelectorAll('.set-default-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const methodId = e.currentTarget.dataset.id;
        this.setDefaultPayment(methodId);
      });
    });

    this.overlay.querySelectorAll('.download-invoice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const invoiceId = e.currentTarget.dataset.id;
        this.downloadInvoice(invoiceId);
      });
    });
  }

  upgradeToPlan(planId) {
    this.currentPlan = planId;
    this.setLoading(true);
    setTimeout(() => {
      this.setLoading(false);
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }, 1000);
  }

  setDefaultPayment(methodId) {
    this.paymentMethods = this.paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === methodId
    }));
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }

  downloadInvoice(invoiceId) {
    const invoice = this.invoices.find(i => i.id === invoiceId);
    if (invoice) {
      this.onConfirm({ action: 'downloadInvoice', invoice });
    }
  }
}

export default BillingModal;
