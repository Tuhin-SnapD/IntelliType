
// Global variables
let theTextBox = document.getElementById('enteredText'); 
let allTheKeys = document.getElementById('keyboard'); 
let changeKeys = document.getElementsByClassName('shifter'); 
let capsLockKey = document.getElementById('20');
let shiftKey = document.getElementById('16');
let pred1 = document.getElementById("pred1");
let pred2 = document.getElementById("pred2");
let pred3 = document.getElementById("pred3");


// CAPS lock state tracking
let capsLockActive = false;

// Function to simulate key press for virtual keyboard clicks
function simulateKeyPress(keyCode, key, char) {
	// Create a synthetic keydown event
	const syntheticEvent = {
		keyCode: keyCode,
		key: key,
		preventDefault: function() {},
		stopPropagation: function() {}
	};
	
	// Call the existing keydown handler
	highlightAndType(syntheticEvent);
	
	// For keyup, we need to handle it differently for different key types
	setTimeout(() => {
		const syntheticKeyupEvent = {
			keyCode: keyCode,
			key: key,
			preventDefault: function() {},
			stopPropagation: function() {}
		};
		removeKeypress(syntheticKeyupEvent);
	}, 100); // Small delay to simulate key press duration
}

// Function to get key information from element ID
function getKeyInfo(elementId) {
	// Map of key IDs to their key codes and characters
	const keyMap = {
		// Numbers row
		'49': { keyCode: 49, key: '1', char: '1' },
		'50': { keyCode: 50, key: '2', char: '2' },
		'51': { keyCode: 51, key: '3', char: '3' },
		'52': { keyCode: 52, key: '4', char: '4' },
		'53': { keyCode: 53, key: '5', char: '5' },
		'54': { keyCode: 54, key: '6', char: '6' },
		'55': { keyCode: 55, key: '7', char: '7' },
		'56': { keyCode: 56, key: '8', char: '8' },
		'57': { keyCode: 57, key: '9', char: '9' },
		'48': { keyCode: 48, key: '0', char: '0' },
		'189': { keyCode: 189, key: '-', char: '-' },
		'187': { keyCode: 187, key: '=', char: '=' },
		
		// Letters row
		'81': { keyCode: 81, key: 'q', char: 'q' },
		'87': { keyCode: 87, key: 'w', char: 'w' },
		'69': { keyCode: 69, key: 'e', char: 'e' },
		'82': { keyCode: 82, key: 'r', char: 'r' },
		'84': { keyCode: 84, key: 't', char: 't' },
		'89': { keyCode: 89, key: 'y', char: 'y' },
		'85': { keyCode: 85, key: 'u', char: 'u' },
		'73': { keyCode: 73, key: 'i', char: 'i' },
		'79': { keyCode: 79, key: 'o', char: 'o' },
		'80': { keyCode: 80, key: 'p', char: 'p' },
		'219': { keyCode: 219, key: '[', char: '[' },
		'221': { keyCode: 221, key: ']', char: ']' },
		
		// Third row
	'65': { keyCode: 65, key: 'a', char: 'a' },
		'83': { keyCode: 83, key: 's', char: 's' },
		'68': { keyCode: 68, key: 'd', char: 'd' },
		'70': { keyCode: 70, key: 'f', char: 'f' },
		'71': { keyCode: 71, key: 'g', char: 'g' },
		'72': { keyCode: 72, key: 'h', char: 'h' },
		'74': { keyCode: 74, key: 'j', char: 'j' },
		'75': { keyCode: 75, key: 'k', char: 'k' },
		'76': { keyCode: 76, key: 'l', char: 'l' },
		'186': { keyCode: 186, key: ';', char: ';' },
		'222': { keyCode: 222, key: "'", char: "'" },
		
		// Fourth row
		'90': { keyCode: 90, key: 'z', char: 'z' },
		'88': { keyCode: 88, key: 'x', char: 'x' },
		'67': { keyCode: 67, key: 'c', char: 'c' },
		'86': { keyCode: 86, key: 'v', char: 'v' },
		'66': { keyCode: 66, key: 'b', char: 'b' },
		'78': { keyCode: 78, key: 'n', char: 'n' },
		'77': { keyCode: 77, key: 'm', char: 'm' },
		'188': { keyCode: 188, key: ',', char: ',' },
		'190': { keyCode: 190, key: '.', char: '.' },
		'191': { keyCode: 191, key: '/', char: '/' },
		
		// Special keys
		'8': { keyCode: 8, key: 'Backspace', char: null },
		'9': { keyCode: 9, key: 'Tab', char: null },
		'13': { keyCode: 13, key: 'Enter', char: null },
		'16': { keyCode: 16, key: 'Shift', char: null },
		'16r': { keyCode: 16, key: 'Shift', char: null },
		'20': { keyCode: 20, key: 'CapsLock', char: null },
		'32': { keyCode: 32, key: ' ', char: ' ' },
		'46': { keyCode: 46, key: 'Delete', char: null }
	};
	
	return keyMap[elementId] || null;
}

// Store all the original values of the non-alphabetical keys
let originalShifterArray = []; 
for (let i = 0; i < changeKeys.length; i++){
	originalShifterArray.push(changeKeys[i].innerHTML);
}

// Set up an array for the replacement values of the non-alphabetical keys that get subbed in when Shift is pressed
const shifterArray = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'];


// Function that clears the text box
function clearText(){
	theTextBox.textContent = 'Click here, then start typing!';
	theTextBox.style.color = '#999999';
	// Hide prediction buttons when text is cleared
	pred1.style.display = 'none';
	pred2.style.display = 'none';
	pred3.style.display = 'none';
}


// Function that detects keypresses and does the appropriate things
function highlightAndType(e){
	// Handle keyboard shortcuts for predictions
	if (e.ctrlKey) {
		if (e.key === '1' || e.keyCode === 49) {
			e.preventDefault();
			if (pred1.style.display !== 'none' && pred1.textContent && pred1.textContent !== 'Pred 1' && pred1.textContent !== '...') {
				handlePredictionClick(pred1.textContent);
			}
			return;
		}
		if (e.key === '2' || e.keyCode === 50) {
			e.preventDefault();
			if (pred2.style.display !== 'none' && pred2.textContent && pred2.textContent !== 'Pred 2' && pred2.textContent !== '...') {
				handlePredictionClick(pred2.textContent);
			}
			return;
		}
		if (e.key === '3' || e.keyCode === 51) {
			e.preventDefault();
			if (pred3.style.display !== 'none' && pred3.textContent && pred3.textContent !== 'Pred 3' && pred3.textContent !== '...') {
				handlePredictionClick(pred3.textContent);
			}
			return;
		}
	}
	
	// Prevent default behavior for certain keys to avoid interference
	if (e.key === 'Tab' || e.key === 'Enter') {
		e.preventDefault();
	}
	
	const keyPressed = e.keyCode;
	const charPressed = e.key;
	
	// Handle duplicate IDs for shift and other keys
	let keys;
	if (keyPressed === 16) {
		// For shift key, check both left and right shift
		keys = document.getElementById('16') || document.getElementById('16r');
	} else if (keyPressed === 91) {
		// For command key, check both left and right command
		keys = document.getElementById('91') || document.getElementById('91r');
	} else if (keyPressed === 17) {
		// For ctrl key, check both left and right ctrl
		keys = document.getElementById('17') || document.getElementById('17r');
	} else if (keyPressed === 18) {
		// For alt/opt key, check both left and right alt
		keys = document.getElementById('18') || document.getElementById('18r');
	} else if (keyPressed === 188) {
		// For comma key, use the comma one, not fn
		keys = document.getElementById('188');
	} else if (keyPressed === 8) {
		// For backspace, use the first delete key
		keys = document.getElementById('8');
	} else if (keyPressed === 46) {
		// For delete, use the second delete key
		keys = document.getElementById('46');
	} else {
		keys = document.getElementById(keyPressed);
	}
	
	if (!keys) return; // Safety check
	
	keys.classList.add('pressed');
	
	if(!charPressed){
		theTextBox.innerHTML = "Sorry, this pen doesn't work in your browser. :( <br> Try Chrome, Firefox or Opera.";
		return;
	}
	
	// Handle CAPS Lock toggle functionality
	if (charPressed == 'CapsLock') {
		capsLockActive = !capsLockActive;
		if (capsLockActive) {
			allTheKeys.classList.add('uppercase');
			capsLockKey.classList.add('caps-active');
		} else {
			allTheKeys.classList.remove('uppercase');
			capsLockKey.classList.remove('caps-active');
		}
	}
	
	//If the user presses Shift, make the alphabetical keys uppercase
	if (charPressed == 'Shift') {
		allTheKeys.classList.add('uppercase');
		// If the user presses Shift, also replace all non-alphabetical keys with their shifted values
		for(let i = 0; i < changeKeys.length; i++){
			changeKeys[i].innerHTML = shifterArray[i];
		}
	}
	
	// If CAPS is active, ensure uppercase is applied
	if (capsLockActive) {
		allTheKeys.classList.add('uppercase');
	}
	
	
	// Make sure the key that was typed was a character
	if (e.key.length <= 1){
		// Clear placeholder text if it's still there
		if(theTextBox.textContent === 'Click here, then start typing!' || theTextBox.textContent === ''){
			theTextBox.textContent = '';
			theTextBox.style.color = '#000000';
		}
		
		// Add the character safely - prevent HTML injection
		const char = e.key.replace(/[<>]/g, '');
		// Use textContent for safer text handling and ensure proper text order
		const currentText = theTextBox.textContent || '';
		theTextBox.textContent = currentText + char;
	// If a backspace was typed, delete the last character in the text box. If shift was also held, delete all text.
	} else if (e.key == 'Backspace'){
		if(shiftKey.classList.contains('pressed')){
			clearText();
		} else {
			const currentText = theTextBox.textContent || '';
			const newText = currentText.slice(0, -1);
			theTextBox.textContent = newText;
			
			// If text is empty, show placeholder
			if(newText === ''){
				theTextBox.textContent = 'Click here, then start typing!';
				theTextBox.style.color = '#999';
			}
		}
	// If the Enter key was typed, add a new line
	} else if (e.key == 'Enter'){
		const currentText = theTextBox.textContent || '';
		theTextBox.textContent = currentText + '\n';
	}
	// If Tab is pressed, don't tab out of the window. Add extra space to the text box instead
	if(keyPressed == 9){
		e.preventDefault();
		const currentText = theTextBox.textContent || '';
		theTextBox.textContent = currentText + '    '; // 4 spaces for tab
	}
	// Only call doWork for space key to get predictions
	if(keyPressed == 32){
		// Get the current text without the space that was just added
		const currentText = theTextBox.textContent || '';
		doWork(currentText);
	}
}


function doWork(str) {
	// Sanitize input - remove HTML tags and normalize spaces
	const sanitizedStr = str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&emsp;/g, ' ').trim();
	
	// Hide prediction buttons for empty strings or placeholder text
	if (!sanitizedStr || sanitizedStr === 'Click here, then start typing!') {
		pred1.style.display = 'none';
		pred2.style.display = 'none';
		pred3.style.display = 'none';
		return;
	}
	
	// Show prediction buttons when there's text
	pred1.style.display = 'block';
	pred2.style.display = 'block';
	pred3.style.display = 'block';
	
	// Add loading state with animation
	pred1.innerHTML = '<div class="typing-indicator"></div>';
	pred2.innerHTML = '<div class="typing-indicator"></div>';
	pred3.innerHTML = '<div class="typing-indicator"></div>';
	pred1.classList.add('loading');
	pred2.classList.add('loading');
	pred3.classList.add('loading');
	
	// AJAX call to the server
	$.ajax({
		url: "/output",
		type: 'GET',
		data: {
			'string': sanitizedStr
		},
		timeout: 3000, // 3 second timeout
		success: function(response) {
			try {
				// Remove loading state first
				pred1.classList.remove('loading');
				pred2.classList.remove('loading');
				pred3.classList.remove('loading');
				
				// Handle different response types
				let obj;
				if (typeof response === 'string') {
					obj = JSON.parse(response);
				} else {
					obj = response;
				}
				
				// Safety check for array bounds and sanitize output
				if (Array.isArray(obj) && obj.length >= 3) {
					pred1.textContent = (obj[0][0] || 'Pred 1').replace(/[<>]/g, '');
					pred2.textContent = (obj[1][0] || 'Pred 2').replace(/[<>]/g, '');
					pred3.textContent = (obj[2][0] || 'Pred 3').replace(/[<>]/g, '');
				} else if (Array.isArray(obj) && obj.length > 0) {
					// Handle case where we don't get enough predictions
					pred1.textContent = obj[0] ? (obj[0][0] || 'Pred 1').replace(/[<>]/g, '') : 'Pred 1';
					pred2.textContent = obj[1] ? (obj[1][0] || 'Pred 2').replace(/[<>]/g, '') : 'Pred 2';
					pred3.textContent = obj[2] ? (obj[2][0] || 'Pred 3').replace(/[<>]/g, '') : 'Pred 3';
				} else {
					// No predictions available
					pred1.textContent = 'Pred 1';
					pred2.textContent = 'Pred 2';
					pred3.textContent = 'Pred 3';
				}
			} catch (parseError) {
				console.error('Error parsing response:', parseError);
				pred1.textContent = 'Error';
				pred2.textContent = '';
				pred3.textContent = '';
				pred1.classList.add('error');
			}
		},
		error: function(xhr, status, error) {
			console.error('AJAX error:', status, error);
			pred1.textContent = 'Error';
			pred2.textContent = '';
			pred3.textContent = '';
			pred1.classList.add('error');
			pred1.classList.remove('loading');
			pred2.classList.remove('loading');
			pred3.classList.remove('loading');
		}
	});
}

// Function that detects when the user lets off a key and does the appropriate things
function removeKeypress(e){
	const keyDepressed = e.keyCode;
	
	// Handle duplicate IDs for shift and other keys
	let keys;
	if (keyDepressed === 16) {
		// For shift key, check both left and right shift
		keys = document.getElementById('16') || document.getElementById('16r');
	} else if (keyDepressed === 91) {
		// For command key, check both left and right command
		keys = document.getElementById('91') || document.getElementById('91r');
	} else if (keyDepressed === 17) {
		// For ctrl key, check both left and right ctrl
		keys = document.getElementById('17') || document.getElementById('17r');
	} else if (keyDepressed === 18) {
		// For alt/opt key, check both left and right alt
		keys = document.getElementById('18') || document.getElementById('18r');
	} else if (keyDepressed === 188) {
		// For comma key, use the comma one, not fn
		keys = document.getElementById('188');
	} else if (keyDepressed === 8) {
		// For backspace, use the first delete key
		keys = document.getElementById('8');
	} else if (keyDepressed === 46) {
		// For delete, use the second delete key
		keys = document.getElementById('46');
	} else {
		keys = document.getElementById(keyDepressed);
	}
	
	if (!keys) return; // Safety check
	
	keys.classList.remove('pressed');
	
	// If Shift was just let off, and CAPS is not active, return keys to lowercase
	if(keyDepressed == 16 && !capsLockActive) {
		allTheKeys.classList.remove('uppercase');
	}
	
	// If Shift was just let off, replace all non-alphabetical keys with their original values rather than their shifted values
	if(keyDepressed == 16) {
		for(let i = 0; i < changeKeys.length; i++){
			changeKeys[i].innerHTML = originalShifterArray[i];
		}
	}
}

// Function to handle prediction button clicks
function handlePredictionClick(predictionText) {
	if (predictionText && predictionText.trim() !== '' && predictionText !== 'Pred 1' && predictionText !== 'Pred 2' && predictionText !== 'Pred 3' && predictionText !== '...') {
		// Clear placeholder if present
		if(theTextBox.innerHTML === 'Click here, then start typing!'){
			theTextBox.innerHTML = '';
			theTextBox.style.color = '#000000';
		}
		
		// Get current text content (strip HTML tags for processing)
		const currentText = theTextBox.textContent || theTextBox.innerText || '';
		
		// If there's existing text, replace the last word with the prediction
		if (currentText && currentText !== '') {
			const words = currentText.split(/\s+/);
			if (words.length > 1) {
				// Replace the last word with the prediction
				words[words.length - 1] = predictionText;
				theTextBox.textContent = words.join(' ') + ' ';
			} else {
				// If only one word, replace it entirely
				theTextBox.textContent = predictionText + ' ';
			}
		} else {
			// If no text, just add the prediction
			theTextBox.textContent = predictionText + ' ';
		}
		
		// Get predictions for the new text (including the space)
		doWork(theTextBox.textContent);
		
		// Focus back to the text area and position cursor at end
		theTextBox.focus();
		
		// Position cursor at the end of the text
		const range = document.createRange();
		const sel = window.getSelection();
		range.selectNodeContents(theTextBox);
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

// Initialize the app
function initializeApp() {
	// Set initial placeholder text color
	theTextBox.style.color = '#999';
	
	// Hide prediction buttons initially
	pred1.style.display = 'none';
	pred2.style.display = 'none';
	pred3.style.display = 'none';
	
	// Add focus event to text area
	theTextBox.addEventListener('focus', function() {
		if(this.textContent === 'Click here, then start typing!'){
			this.textContent = '';
			this.style.color = '#000000';
		}
	});
	
	// Add blur event to text area
	theTextBox.addEventListener('blur', function() {
		const currentText = this.textContent || '';
		if(currentText.trim() === ''){
			this.textContent = 'Click here, then start typing!';
			this.style.color = '#999999';
			// Hide predictions when text is empty
			pred1.style.display = 'none';
			pred2.style.display = 'none';
			pred3.style.display = 'none';
		}
	});
	
	// Add click event listeners to all keyboard keys
	const allKeys = document.querySelectorAll('#keyboard kbd');
	allKeys.forEach(key => {
		key.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			
			// Get the key information
			const keyInfo = getKeyInfo(this.id);
			if (keyInfo) {
				// Handle special cases for character keys
				let charToUse = keyInfo.char;
				if (charToUse && charToUse.length === 1) {
					// Check if we need to apply shift or caps lock
					const isShiftPressed = shiftKey.classList.contains('pressed');
					const shouldUppercase = capsLockActive || isShiftPressed;
					
					if (shouldUppercase && /[a-z]/.test(charToUse)) {
						charToUse = charToUse.toUpperCase();
					}
				}
				
				// Simulate the key press
				simulateKeyPress(keyInfo.keyCode, keyInfo.key, charToUse);
			}
		});
	});
	
	// Add click handlers for prediction buttons
	pred1.addEventListener('click', (e) => {
		e.stopPropagation(); // Prevent event bubbling
		handlePredictionClick(pred1.textContent);
	});
	pred2.addEventListener('click', (e) => {
		e.stopPropagation(); // Prevent event bubbling
		handlePredictionClick(pred2.textContent);
	});
	pred3.addEventListener('click', (e) => {
		e.stopPropagation(); // Prevent event bubbling
		handlePredictionClick(pred3.textContent);
	});
	
	// Add specific click handler for text area to clear text
	theTextBox.addEventListener('click', function(e) {
		// Only clear if it's a double-click or if text is placeholder
		if (e.detail === 2 || this.textContent === 'Click here, then start typing!') {
			clearText();
		}
	});
}

// Event listeners
window.addEventListener('keydown', highlightAndType);
window.addEventListener('keyup', removeKeypress);
// Remove the global click listener that was clearing text on any click
// window.addEventListener('click', clearText); // This was causing the bug!

// Add click handlers for prediction buttons - moved to initializeApp function



// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
	initializeApp();
});