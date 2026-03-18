// State
let currentValue = '20';

// DOM Elements
const displayValue = document.getElementById('displayValue');
const numpadButtons = document.querySelectorAll('.numpad-btn[data-number]');
const decimalButton = document.querySelector('.numpad-btn[data-action="decimal"]');
const deleteButton = document.querySelector('.numpad-btn[data-action="delete"]');
const previousValueButtons = document.querySelectorAll('.previous-value-btn');
const cancelButton = document.querySelector('.cancel-btn');
const confirmButton = document.querySelector('.confirm-btn');

// Update display
function updateDisplay() {
    displayValue.textContent = currentValue + 'g';
}

// Handle number click
function handleNumberClick(num) {
    if (currentValue === '0' || currentValue === '') {
        currentValue = num;
    } else if (currentValue.length < 5) {
        currentValue = currentValue + num;
    }
    updateDisplay();
}

// Handle decimal click
function handleDecimalClick() {
    if (!currentValue.includes('.') && currentValue.length < 5) {
        currentValue = currentValue + '.';
        updateDisplay();
    }
}

// Handle backspace
function handleBackspace() {
    if (currentValue.length > 0) {
        currentValue = currentValue.slice(0, -1);
        if (currentValue === '') {
            currentValue = '0';
        }
        updateDisplay();
    }
}

// Handle previous value click
function handlePreviousValue(value) {
    currentValue = value;
    updateDisplay();
}

// Handle cancel
function handleCancel() {
    console.log('Cancel clicked');
    // Reset to default value
    currentValue = '20';
    updateDisplay();
}

// Handle confirm
function handleConfirm() {
    console.log('Confirmed value:', currentValue);
    // You can add your confirm logic here
    alert('Confirmed: ' + currentValue + 'g');
}

// Event Listeners
numpadButtons.forEach(button => {
    button.addEventListener('click', () => {
        const number = button.getAttribute('data-number');
        handleNumberClick(number);
    });
});

decimalButton.addEventListener('click', handleDecimalClick);
deleteButton.addEventListener('click', handleBackspace);

previousValueButtons.forEach(button => {
    button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');
        handlePreviousValue(value);
    });
});

cancelButton.addEventListener('click', handleCancel);
confirmButton.addEventListener('click', handleConfirm);

// Initialize display
updateDisplay();
