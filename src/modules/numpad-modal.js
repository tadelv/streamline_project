let numpadModalInitialized = false;
let currentInputElement = null;
let currentValue = '0';
let originalValue = '0';
let previousValues = [];
let onConfirmCallback = null;

// Mobile/tablet detection - can be overridden for testing
function isMobile() {
    // Check for explicit override (useful for testing)
    if (window._forceNumpadMobile !== undefined) {
        return window._forceNumpadMobile;
    }
    
    // Check OS from user agent
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(userAgent);
    
    // Check if it's a touch device
    const isTouchDevice = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 ||
                          window.matchMedia('(pointer: coarse)').matches;
    
    // Check viewport dimensions - include tablets up to 1920x1200
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTabletSize = width <= 1920 && height >= 800;
    const isSmallScreen = window.matchMedia('(max-width: 1024px)').matches;
    
    // Return true if:
    // 1. iOS/Android device OR
    // 2. Touch device with tablet size OR
    // 3. Touch device with small screen
    return (isIOS || isAndroid) || (isTouchDevice && (isSmallScreen || isTabletSize));
}

// Debug function to test the modal - call this in browser console
window.testNumpadModal = function(force = true) {
    window._forceNumpadMobile = force;
    if (force) {
        initializeNumpadModal();
        
        const valueElements = [
            { id: 'dose-in-value', type: 'dose-in' },
            { id: 'drink-out-value', type: 'drink-out' },
            { id: 'temp-value', type: 'temperature' },
            { id: 'grind-value', type: 'grind' }
        ];
        
        valueElements.forEach(({ id, type }) => {
            const el = document.getElementById(id);
            if (!el) return;
            
            el.style.cursor = 'pointer';
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentValue = el.textContent.replace(/[^0-9.]/g, '') || '0';
                
                const mockInput = {
                    value: currentValue,
                    dispatchEvent: (event) => {
                        if (event.type === 'change' || event.type === 'input') {
                            const newVal = mockInput.value;
                            el.textContent = type === 'temperature' ? `${newVal}°c` : 
                                            type === 'grind' ? newVal : `${newVal}g`;
                        }
                    }
                };
                
                openModal(mockInput, { previousValues: [], fieldType: type });
            });
        });
    }
};

function createModalHTML() {
    const overlay = document.createElement('div');
    overlay.id = 'numpad-modal-overlay';
    overlay.className = 'numpad-modal-overlay';
    
    overlay.innerHTML = `
        <div class="numpad-modal-container">
            <div class="numpad-modal-header">
                <span class="numpad-modal-title">DOSE</span>
                <button class="numpad-modal-close" id="numpad-modal-close">&times;</button>
            </div>
            
            <div class="numpad-modal-input-section">
                <span class="numpad-modal-input-label">Input value between 1–120</span>
                <div class="numpad-modal-input-box">
                    <div class="numpad-modal-input-border"></div>
                    <div class="numpad-modal-input-cursor"></div>
                    <span class="numpad-modal-input-value" id="numpad-display-value">0g</span>
                </div>
            </div>
            
            <div class="numpad-modal-previous-values" id="numpad-previous-values-container" style="display: none;">
                <div class="numpad-modal-previous-title">Previous Values</div>
                <div class="numpad-modal-previous-grid" id="numpad-previous-grid"></div>
            </div>
            
            <div class="numpad-modal-numpad">
                <button class="numpad-modal-numpad-btn" data-number="1">1</button>
                <button class="numpad-modal-numpad-btn" data-number="2">2</button>
                <button class="numpad-modal-numpad-btn" data-number="3">3</button>
                <button class="numpad-modal-numpad-btn" data-number="4">4</button>
                <button class="numpad-modal-numpad-btn" data-number="5">5</button>
                <button class="numpad-modal-numpad-btn" data-number="6">6</button>
                <button class="numpad-modal-numpad-btn" data-number="7">7</button>
                <button class="numpad-modal-numpad-btn" data-number="8">8</button>
                <button class="numpad-modal-numpad-btn" data-number="9">9</button>
                <button class="numpad-modal-numpad-btn numpad-decimal" data-action="decimal">.</button>
                <button class="numpad-modal-numpad-btn" data-number="0">0</button>
                <button class="numpad-modal-numpad-btn numpad-delete" data-action="delete">
                    <svg viewBox="0 0 54.8076 43.5" class="delete-icon-small">
                        <path d="M49.9746 0C52.644 0 54.8076 2.16461 54.8076 4.83398V38.667C54.8074 41.3362 52.6439 43.5 49.9746 43.5H15.6025C14.3529 43.4999 13.1907 42.8565 12.5283 41.7969L0.799805 23.0312L0 21.75L0.799805 20.4697L12.5283 1.7041C13.1907 0.644322 14.3528 0.000123843 15.6025 0H49.9746ZM5.69922 21.75L16.2715 38.667H49.9746V4.83398H16.2715L5.69922 21.75ZM37.3906 12.791C38.3343 11.8474 39.8648 11.8475 40.8086 12.791C41.752 13.7348 41.7522 15.2653 40.8086 16.209L34.6631 22.3535L40.8086 28.499C41.752 29.4428 41.7522 30.9733 40.8086 31.917C39.8649 32.8607 38.3344 32.8604 37.3906 31.917L31.2451 25.7715L25.1006 31.917C24.1569 32.8607 22.6264 32.8604 21.6826 31.917C20.7391 30.9732 20.7389 29.4427 21.6826 28.499L27.8271 22.3535L21.6826 16.209C20.739 15.2652 20.7389 13.7347 21.6826 12.791C22.6264 11.8473 24.1568 11.8474 25.1006 12.791L31.2451 18.9355L37.3906 12.791Z" fill="#121212" />
                    </svg>
                </button>
            </div>
            
            <div class="numpad-modal-actions">
                <button class="numpad-modal-cancel" id="numpad-cancel">CANCEL</button>
                <button class="numpad-modal-confirm" id="numpad-confirm">CONFIRM</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
}

function updateDisplay() {
    const displayElement = document.getElementById('numpad-display-value');
    if (displayElement) {
        const config = fieldConfig[currentFieldType] || fieldConfig['dose-in'];
        displayElement.textContent = currentValue + config.unit;
    }
}

function handleNumberClick(num) {
    if (currentValue === '0' || currentValue === '') {
        currentValue = num;
    } else if (currentValue.length < 5) {
        currentValue = currentValue + num;
    }
    updateDisplay();
}

function handleDecimalClick() {
    if (!currentValue.includes('.') && currentValue.length < 5) {
        currentValue = currentValue + '.';
        updateDisplay();
    }
}

function handleBackspace() {
    if (currentValue.length > 0) {
        currentValue = currentValue.slice(0, -1);
        if (currentValue === '' || currentValue === '-') {
            currentValue = '0';
        }
        updateDisplay();
    }
}

function handlePreviousValue(value) {
    currentValue = value;
    updateDisplay();
}

function renderPreviousValues() {
    const container = document.getElementById('numpad-previous-values-container');
    const grid = document.getElementById('numpad-previous-grid');
    
    if (!previousValues || previousValues.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    grid.innerHTML = '';
    
    previousValues.forEach(value => {
        const btn = document.createElement('button');
        btn.className = 'numpad-modal-previous-btn';
        btn.textContent = value;
        btn.addEventListener('click', () => handlePreviousValue(value));
        grid.appendChild(btn);
    });
}

let currentFieldType = 'dose-in';

const fieldConfig = {
    'dose-in': { title: 'DOSE', unit: 'g', defaultValue: '20', label: 'Input value between 1–120' },
    'drink-out': { title: 'DRINK OUT', unit: 'g', defaultValue: '40', label: 'Input value between 1–200' },
    'temperature': { title: 'TEMPERATURE', unit: '°c', defaultValue: '93', label: 'Input value between 70–110' },
    'grind': { title: 'GRIND', unit: '', defaultValue: '1.0', label: 'Input value between 0.1–10.0' }
};

function getFieldDisplayValue(value, fieldType) {
    const config = fieldConfig[fieldType] || fieldConfig['dose-in'];
    return value + config.unit;
}

function openModal(inputElement, options = {}) {
    if (!numpadModalInitialized) {
        initializeNumpadModal();
    }
    
    currentInputElement = inputElement;
    currentFieldType = options.fieldType || 'dose-in';
    
    const config = fieldConfig[currentFieldType] || fieldConfig['dose-in'];
    const inputValue = inputElement.value || inputElement.getAttribute('data-default') || config.defaultValue;
    // Remove any existing units for editing
    currentValue = inputValue.replace(/[g°c]/g, '').trim() || config.defaultValue;
    originalValue = currentValue;
    
    // Update modal title and label
    const titleEl = document.querySelector('.numpad-modal-title');
    if (titleEl) {
        titleEl.textContent = config.title;
    }
    
    const labelEl = document.querySelector('.numpad-modal-input-label');
    if (labelEl) {
        labelEl.textContent = config.label;
    }
    
    previousValues = options.previousValues || [];
    onConfirmCallback = options.onConfirm || null;
    
    const overlay = document.getElementById('numpad-modal-overlay');
    overlay.classList.add('active');
    
    renderPreviousValues();
    updateDisplay();
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('numpad-modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function handleCancel() {
    currentValue = originalValue;
    closeModal();
}

function handleConfirm() {
    const finalValue = currentValue === '0' ? '' : currentValue;
    
    if (currentInputElement) {
        currentInputElement.value = finalValue;
        currentInputElement.dispatchEvent(new Event('change', { bubbles: true }));
        currentInputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (onConfirmCallback) {
        onConfirmCallback(finalValue);
    }
    
    closeModal();
}

function initializeNumpadModal() {
    if (numpadModalInitialized) return;
    
    createModalHTML();
    
    document.getElementById('numpad-modal-close').addEventListener('click', handleCancel);
    document.getElementById('numpad-cancel').addEventListener('click', handleCancel);
    document.getElementById('numpad-confirm').addEventListener('click', handleConfirm);
    
    document.querySelectorAll('.numpad-modal-numpad-btn[data-number]').forEach(button => {
        button.addEventListener('click', () => {
            const number = button.getAttribute('data-number');
            handleNumberClick(number);
        });
    });
    
    document.querySelector('.numpad-modal-numpad-btn[data-action="decimal"]').addEventListener('click', handleDecimalClick);
    document.querySelector('.numpad-modal-numpad-btn[data-action="delete"]').addEventListener('click', handleBackspace);
    
    const overlay = document.getElementById('numpad-modal-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            handleCancel();
        }
    });
    
    numpadModalInitialized = true;
}

function attachToNumericInputs(selector = 'input[type="number"]', options = {}) {
    if (!isMobile()) return;
    
    const inputs = document.querySelectorAll(selector);
    
    inputs.forEach(input => {
        if (input.hasAttribute('data-numpad-attached')) return;
        
        input.setAttribute('data-numpad-attached', 'true');
        
        input.addEventListener('focus', (e) => {
            e.preventDefault();
            openModal(input, {
                previousValues: options.previousValues || [],
                onConfirm: options.onConfirm || null
            });
        });
        
        input.addEventListener('click', (e) => {
            openModal(input, {
                previousValues: options.previousValues || [],
                onConfirm: options.onConfirm || null
            });
        });
        
        input.readOnly = true;
        input.style.cursor = 'pointer';
    });
}

function initNumpadModal(cssPath = 'src/css/numpad-modal.css') {
    // Try multiple possible CSS paths
    const possiblePaths = [
        cssPath,
        '../css/numpad-modal.css',
        './src/css/numpad-modal.css'
    ];
    
    // Try to load CSS
    possiblePaths.forEach(path => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        link.onerror = () => link.remove(); // Remove if failed
        document.head.appendChild(link);
    });
    
    console.log('[NumpadModal] Initializing, isMobile:', isMobile(), 'viewport:', window.innerWidth);
    
    if (isMobile()) {
        initializeNumpadModal();
    }
}

// Expose for manual testing in browser console
window.initNumpadModal = initNumpadModal;
window.openNumpadModal = openModal;

export { initNumpadModal, attachToNumericInputs, openModal, isMobile, initializeNumpadModal };
