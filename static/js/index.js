
// Global variables
let theTextBox = document.getElementById('enteredText'); 
let allTheKeys = document.getElementById('keyboard'); 
let changeKeys = document.getElementsByClassName('shifter'); 
let capsLockKey = document.getElementById('20');
let shiftKey = document.getElementById('16');
let pred1 = document.getElementById("pred1");
let pred2 = document.getElementById("pred2");
let pred3 = document.getElementById("pred3");

// Store all the original values of the non-alphabetical keys
let originalShifterArray = []; 
for (let i = 0; i < changeKeys.length; i++){
	originalShifterArray.push(changeKeys[i].innerHTML);
}

// Set up an array for the replacement values of the non-alphabetical keys that get subbed in when Shift is pressed
const shifterArray = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'];


// Function that clears the text box
function clearText(){
	theTextBox.innerHTML = 'Click here, then start typing!';
	theTextBox.style.color = '#999';
}


// Function that detects keypresses and does the appropriate things
function highlightAndType(e){
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
	} else {
		keys = document.getElementById(keyPressed);
	}
	
	if (!keys) return; // Safety check
	
	keys.classList.add('pressed');
	
	if(!charPressed){
		theTextBox.innerHTML = "Sorry, this pen doesn't work in your browser. :( <br> Try Chrome, Firefox or Opera.";
		return;
	}
	
	//If the user presses CapsLock or Shift, make the alphabetical keys uppercase
	if (charPressed == 'CapsLock' || charPressed == 'Shift') {
		allTheKeys.classList.add('uppercase');
	} 
	// If the user presses Shift, also replace all non-alphabetical keys with their shifted values
	if (charPressed == 'Shift') {
		for(let i = 0; i < changeKeys.length; i++){
			changeKeys[i].innerHTML = shifterArray[i];
		}
	}
	
	
	// Make sure the key that was typed was a character
	if (e.key.length <= 1){
		// Clear placeholder text if it's still there
		if(theTextBox.innerHTML === 'Click here, then start typing!' || theTextBox.innerHTML === '<br>'){
			theTextBox.innerHTML = '';
			theTextBox.style.color = '#333';
		}
		
		if(theTextBox.innerHTML.endsWith('<br>')){
			const newText = theTextBox.innerHTML.slice(0, -4);
			theTextBox.innerHTML = newText;
		}
		theTextBox.innerHTML += e.key;
	// If a backspace was typed, delete the last character in the text box. If shift was also held, delete all text.
	} else if (e.key == 'Backspace'){
		if(shiftKey.classList.contains('pressed')){
			clearText();
		} else {
			const newText = theTextBox.innerHTML.slice(0, -1);
			theTextBox.innerHTML = newText;
			
			// If text is empty, show placeholder
			if(theTextBox.innerHTML === ''){
				theTextBox.innerHTML = 'Click here, then start typing!';
				theTextBox.style.color = '#999';
			}
		}
	// If the Enter key was typed, add a new line
	} else if (e.key == 'Enter'){
		theTextBox.innerHTML += '<br>';
	}
	// If Tab is pressed, don't tab out of the window. Add extra space to the text box instead
	if(keyPressed == 9){
		e.preventDefault();
		theTextBox.innerHTML += '&emsp;&emsp;';
	}
	if(keyPressed == 32){
		doWork(theTextBox.innerHTML.slice(0, -1));
	}
	else doWork(theTextBox.innerHTML);
}


function doWork(str) {
	// Sanitize input
	const sanitizedStr = str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(); // Remove HTML tags and normalize spaces
	
	// Don't make requests for empty strings or placeholder text
	if (!sanitizedStr || sanitizedStr === 'Click here, then start typing!') {
		pred1.innerHTML = 'Pred 1';
		pred2.innerHTML = 'Pred 2';
		pred3.innerHTML = 'Pred 3';
		return;
	}
	
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
	} else {
		keys = document.getElementById(keyDepressed);
	}
	
	if (!keys) return; // Safety check
	
	keys.classList.remove('pressed');
	
	// If CapsLock or Shift was just let off, and if the other isn't still on, return keys to lowercase
	if((keyDepressed == 20 && !shiftKey.classList.contains('pressed')) || 
	   (keyDepressed == 16 && !capsLockKey.classList.contains('pressed'))) {
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
			theTextBox.style.color = '#333';
		}
		
		// Get current text content (strip HTML tags for processing)
		const currentText = theTextBox.innerHTML.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '').trim();
		
		// If there's existing text, replace the last word with the prediction
		if (currentText && currentText !== '') {
			const words = currentText.split(/\s+/);
			if (words.length > 1) {
				// Replace the last word with the prediction
				words[words.length - 1] = predictionText;
				theTextBox.innerHTML = words.join(' ') + ' ';
			} else {
				// If only one word, replace it entirely
				theTextBox.innerHTML = predictionText + ' ';
			}
		} else {
			// If no text, just add the prediction
			theTextBox.innerHTML = predictionText + ' ';
		}
		
		// Focus back to the text area
		theTextBox.focus();
	}
}

// Initialize the app
function initializeApp() {
	// Set initial placeholder text color
	theTextBox.style.color = '#999';
	
	// Add focus event to text area
	theTextBox.addEventListener('focus', function() {
		if(this.innerHTML === 'Click here, then start typing!'){
			this.innerHTML = '';
			this.style.color = '#333';
		}
	});
	
	// Add blur event to text area
	theTextBox.addEventListener('blur', function() {
		if(this.innerHTML.trim() === ''){
			this.innerHTML = 'Click here, then start typing!';
			this.style.color = '#999';
		}
	});
}

// Event listeners
window.addEventListener('keydown', highlightAndType);
window.addEventListener('keyup', removeKeypress);
// Remove the global click listener that was clearing text on any click
// window.addEventListener('click', clearText); // This was causing the bug!

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
	if (e.detail === 2 || this.innerHTML === 'Click here, then start typing!') {
		clearText();
	}
});



// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
	initializeApp();
});