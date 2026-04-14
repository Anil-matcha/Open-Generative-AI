import { apiKeyManager } from '../lib/apiKeyManager.js';
import TIMELINE_DESIGN_SYSTEM from '../lib/designSystemEnforcer.js';

export function AuthModal(onSuccess) {
    const existing = document.querySelector('[data-auth-modal]');
    if (existing) existing.remove();

    // Use design system enforced modal creation
    const overlay = TIMELINE_DESIGN_SYSTEM.utils.createModal({
        title: 'Muapi API Key Required',
        onClose: () => {}
    });
    overlay.setAttribute('data-auth-modal', '');

    const removeModal = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    // Get references to modal elements
    const modalContent = overlay.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.content}`);
    const modalBody = overlay.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.body}`);
    const modalHeader = overlay.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.header}`);

    // Remove default title and add custom header content
    modalHeader.innerHTML = `
        <button class="auth-close-btn absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1" style="position: absolute; top: 16px; right: 20px; color: ${TIMELINE_DESIGN_SYSTEM.variables['--muted']}; background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="flex flex-col items-center text-center mb-8">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow mb-6" style="
                width: 64px;
                height: 64px;
                background: rgba(217, 255, 0, 0.1);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(217, 255, 0, 0.2);
                box-shadow: 0 0 16px rgba(217, 255, 0, 0.4);
                margin-bottom: 24px;
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${TIMELINE_DESIGN_SYSTEM.variables['--color-primary']}" stroke-width="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/>
                </svg>
            </div>
            <p class="text-secondary text-sm" style="
                color: ${TIMELINE_DESIGN_SYSTEM.variables['--text-secondary']};
                font-size: 14px;
                margin-top: 8px;
            ">Please provide your Muapi.ai API key to start creating high-aesthetic images.</p>
        </div>
    `;

    // Create modal body content using design system
    const formContainer = document.createElement('div');
    formContainer.style.cssText = 'display: flex; flex-direction: column; gap: 24px;';

    // API Key input section
    const inputSection = document.createElement('div');
    inputSection.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    const label = document.createElement('label');
    label.textContent = 'Your API Key';
    label.style.cssText = `
        font-size: 10px;
        font-weight: bold;
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--muted']};
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-left: 4px;
    `;

    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.id = 'muapi-key-input';
    apiKeyInput.placeholder = 'sk-...';
    apiKeyInput.autocomplete = 'off';
    apiKeyInput.style.cssText = `
        width: 100%;
        background: rgba(0,0,0,0.4);
        border: 1px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
        border-radius: 12px;
        padding: 12px 16px;
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--text']};
        outline: none;
        transition: border-color 0.15s ease;
    `;

    // Focus styles
    apiKeyInput.addEventListener('focus', () => {
        apiKeyInput.style.borderColor = TIMELINE_DESIGN_SYSTEM.variables['--cyan'];
    });
    apiKeyInput.addEventListener('blur', () => {
        apiKeyInput.style.borderColor = TIMELINE_DESIGN_SYSTEM.variables['--border'];
    });

    inputSection.appendChild(label);
    inputSection.appendChild(apiKeyInput);

    // Buttons section
    const buttonSection = document.createElement('div');
    buttonSection.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const saveBtn = TIMELINE_DESIGN_SYSTEM.utils.createButton({
        type: 'primary',
        text: 'Initialize Studio'
    });
    saveBtn.id = 'save-key-btn';
    saveBtn.style.cssText += 'width: 100%; padding: 16px;';

    const link = document.createElement('a');
    link.href = 'https://muapi.ai';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Get an API Key at Muapi.ai →';
    link.style.cssText = `
        text-align: center;
        font-size: 11px;
        font-weight: bold;
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--muted']};
        text-decoration: none;
        padding: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: color 0.15s ease;
    `;
    link.addEventListener('mouseenter', () => {
        link.style.color = TIMELINE_DESIGN_SYSTEM.variables['--text'];
    });
    link.addEventListener('mouseleave', () => {
        link.style.color = TIMELINE_DESIGN_SYSTEM.variables['--muted'];
    });

    buttonSection.appendChild(saveBtn);
    buttonSection.appendChild(link);

    // Footer text
    const footer = document.createElement('p');
    footer.textContent = 'Your API key is stored securely and never shared.';
    footer.style.cssText = `
        font-size: 10px;
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--dim']};
        text-align: center;
        margin-top: 16px;
    `;

    formContainer.appendChild(inputSection);
    formContainer.appendChild(buttonSection);
    modalBody.appendChild(formContainer);
    modalBody.appendChild(footer);
    document.body.appendChild(overlay);

    overlay.querySelector('.auth-close-btn').onclick = removeModal;

    const input = overlay.querySelector('#muapi-key-input');
    const btn = overlay.querySelector('#save-key-btn');

    // Focus input on open
    setTimeout(() => input.focus(), 100);

    // Handle Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            btn.click();
        }
    });

    btn.onclick = async () => {
        const key = input.value.trim();
        if (key) {
            if (key.length < 10) {
                input.classList.add('border-red-500/50');
                setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
                return;
            }

            try {
                btn.disabled = true;
                btn.textContent = 'Saving...';

                // Use the secure ApiKeyManager
                await apiKeyManager.setKey(key, true);

                removeModal();
                if (onSuccess) onSuccess();

                console.log('[AuthModal] API key saved securely');
            } catch (error) {
                console.error('[AuthModal] Failed to save key:', error);
                btn.disabled = false;
                btn.textContent = 'Initialize Studio';
                input.classList.add('border-red-500/50');
                setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
            }
        } else {
            input.classList.add('border-red-500/50');
            setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
        }
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) removeModal();
    });

    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            removeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    return overlay;
}
