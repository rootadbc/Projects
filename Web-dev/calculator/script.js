// Get reference to the display input element
const display = document.getElementById('display');

/**
 * Append a value (digit/operator) to the calculator display
 * Example: appendToDisplay('7') → "7"
 */
function appendToDisplay(value) {
    display.value += value;
}

/**
 * Clear the entire display
 * Example: "123+4" → ""
 */
function clearDisplay() {
    display.value = '';
}

/**
 * Delete the last character
 * Example: "123" → "12"
 */
function deleteLast() {
    display.value = display.value.slice(0, -1);
}

/**
 * Evaluate the expression in the display
 * Uses JavaScript's eval() to compute result
 */
function calculate() {
    try {
        // In case we ever show × in the display, we would replace it with *
        // (Right now we already use * internally, but this keeps it safe)
        const expression = display.value.replace(/×/g, '*');
        
        // eval() will compute string expressions like "2+3*4"
        display.value = eval(expression);
    } catch (error) {
        // If expression is invalid, show "Error" briefly
        display.value = 'Error';
        setTimeout(clearDisplay, 1500); // clear after 1.5 seconds
    }
}

/**
 * Add basic keyboard support
 * - Numbers, dot, operators: append to display
 * - Enter or = : calculate
 * - Escape: clear display
 * - Backspace: delete last character
 */
document.addEventListener('keydown', function(event) {
    const key = event.key;

    // If key is a number 0–9 or a dot, add it
    if ((key >= '0' && key <= '9') || key === '.') {
        appendToDisplay(key);

    // Basic operators + and -
    } else if (key === '+' || key === '-') {
        appendToDisplay(key);

    // * and / operators
    } else if (key === '*' || key === '/') {
        appendToDisplay(key);

    // Enter or = should trigger calculation
    } else if (key === 'Enter' || key === '=') {
        // prevent form submit / default behavior when pressing Enter
        event.preventDefault();
        calculate();

    // Escape clears the display
    } else if (key === 'Escape') {
        clearDisplay();

    // Backspace deletes last character
    } else if (key === 'Backspace') {
        deleteLast();
    }
});
