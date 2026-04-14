import TIMELINE_DESIGN_SYSTEM from '../lib/designSystemEnforcer.js';

export function SettingsModal(onClose) {
    // Use design system enforced modal creation
    const overlay = TIMELINE_DESIGN_SYSTEM.utils.createModal({
        title: 'Settings',
        onClose: onClose
    });

    // Get references to the created modal elements
    const modalContent = overlay.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.content}`);
    const modalBody = overlay.querySelector(`.${TIMELINE_DESIGN_SYSTEM.styles.modal.body}`);

    const removeModal = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (onClose) onClose();
    };

    // Create modal content using design system
    const label = document.createElement('label');
    label.textContent = 'Muapi API Key';
    label.style.cssText = `
        display: block;
        font-size: 10px;
        font-weight: bold;
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--muted']};
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 8px;
        margin-left: 4px;
    `;

    const input = document.createElement('input');
    input.type = 'password';
    input.style.cssText = `
        width: 100%;
        margin-bottom: 24px;
        background: rgba(0,0,0,0.4);
        border: 1px solid ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
        border-radius: 12px;
        padding: 12px 16px;
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--text']};
        outline: none;
        transition: border-color 0.15s ease;
    `;
    input.value = localStorage.getItem('muapi_key') || '';
    input.placeholder = 'sk-...';

    // Focus styles
    input.addEventListener('focus', () => {
        input.style.borderColor = TIMELINE_DESIGN_SYSTEM.variables['--cyan'];
    });
    input.addEventListener('blur', () => {
        input.style.borderColor = TIMELINE_DESIGN_SYSTEM.variables['--border'];
    });

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px;';

    // Use design system button creation
    const cancelBtn = TIMELINE_DESIGN_SYSTEM.utils.createButton({
        text: 'Cancel',
        onClick: removeModal
    });
    cancelBtn.style.cssText += `
        background: ${TIMELINE_DESIGN_SYSTEM.variables['--panel']};
        color: ${TIMELINE_DESIGN_SYSTEM.variables['--muted']};
        border-color: ${TIMELINE_DESIGN_SYSTEM.variables['--border']};
    `;

    const saveBtn = TIMELINE_DESIGN_SYSTEM.utils.createButton({
        type: 'primary',
        text: 'Save',
        onClick: () => {
            const key = input.value.trim();
            if (key) {
                localStorage.setItem('muapi_key', key);
                removeModal();
            }
        }
    });

    // Add content to modal body
    modalBody.appendChild(label);
    modalBody.appendChild(input);
    modalBody.appendChild(btnContainer);
    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(saveBtn);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) removeModal();
    });

    return overlay;
}
