# -*- coding: utf-8 -*-
"""
Intelligent Typing Application
A simplified Flask-based intelligent keyboard with text prediction
"""
import logging
import time
import hashlib
from typing import List, Tuple, Optional
from collections import defaultdict

from flask import Flask, render_template, jsonify, request
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change in production


# Simple cache for predictions
prediction_cache = {}
CACHE_SIZE = 100
CACHE_TTL = 300  # 5 minutes

def cache_key(text: str) -> str:
    """Generate cache key for prediction."""
    return hashlib.md5(text.encode()).hexdigest()

def get_cached_prediction(text: str) -> Optional[List[Tuple]]:
    """Get cached prediction if available and not expired."""
    key = cache_key(text)
    if key in prediction_cache:
        cached_data, timestamp = prediction_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return cached_data
        else:
            del prediction_cache[key]
    return None

def cache_prediction(text: str, predictions: List[Tuple]) -> None:
    """Cache prediction with timestamp."""
    if len(prediction_cache) >= CACHE_SIZE:
        # Remove oldest entries
        oldest_key = min(prediction_cache.keys(), 
                        key=lambda k: prediction_cache[k][1])
        del prediction_cache[oldest_key]
    
    key = cache_key(text)
    prediction_cache[key] = (predictions, time.time())


class TextPredictor:
    """Advanced text prediction engine using transformers."""
    
    def __init__(self):
        """Initialize the text predictor with a pre-trained model."""
        self.model = None
        self.tokenizer = None
        self._load_model()
    
    def _load_model(self):
        """Load a pre-trained language model for text prediction."""
        try:
            from transformers import GPT2LMHeadModel, GPT2Tokenizer
            import torch
            
            # Use a smaller, faster model for better performance
            model_name = "gpt2"  # Small, fast model
            logger.info(f"Loading model: {model_name}")
            
            self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
            self.model = GPT2LMHeadModel.from_pretrained(model_name)
            
            # Set pad token
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Set model to evaluation mode
            self.model.eval()
            
            logger.info("Model loaded successfully")
            
        except ImportError:
            logger.warning("Transformers library not available, no predictions will be provided")
            self.model = None
            self.tokenizer = None
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None
            self.tokenizer = None
            # Provide fallback predictions
            self._fallback_predictions = True
    
    def get_predictions(self, text: str) -> List[Tuple]:
        """Get text predictions using the advanced model."""
        if not text or not text.strip():
            return []
        
        # Check cache first
        cached = get_cached_prediction(text)
        if cached:
            return cached
        
        words = text.strip().split()
        if not words:
            return []
        
        predictions = []
        
        try:
            if self.model is not None and self.tokenizer is not None:
                # Use the advanced model for predictions
                predictions = self._get_transformer_predictions(text)
            else:
                # No model available, use fallback predictions
                predictions = self._get_fallback_predictions(text)
                
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            predictions = []
        
        # Cache the results
        cache_prediction(text, predictions)
        return predictions
    
    def _get_transformer_predictions(self, text: str) -> List[Tuple]:
        """Get predictions using the transformer model."""
        try:
            import torch
            
            # Tokenize input
            inputs = self.tokenizer.encode(text, return_tensors="pt")
            
            # Generate predictions
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 5,  # Generate more tokens
                    num_return_sequences=3,
                    num_beams=3,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    early_stopping=True
                )
            
            # Decode predictions
            predictions = []
            for output in outputs:
                # Get the new tokens (excluding the input)
                new_tokens = output[inputs.shape[1]:]
                if len(new_tokens) > 0:
                    # Decode the new tokens
                    new_text = self.tokenizer.decode(new_tokens, skip_special_tokens=True)
                    # Split into words and take the first word
                    words = new_text.strip().split()
                    if words:
                        word = words[0].strip()
                        if word and len(word) > 0:
                            predictions.append((word, 1))
            
            # Remove duplicates while preserving order
            seen = set()
            unique_predictions = []
            for pred in predictions:
                if pred[0] not in seen and pred[0]:
                    seen.add(pred[0])
                    unique_predictions.append(pred)
            
            return unique_predictions[:3]
            
        except Exception as e:
            logger.error(f"Error in transformer predictions: {e}")
            return []
    
    def _get_fallback_predictions(self, text: str) -> List[Tuple]:
        """Get simple fallback predictions when model is not available."""
        words = text.strip().split()
        if not words:
            return []
        
        last_word = words[-1].lower()
        
        # Simple word completion based on common patterns
        common_words = {
            'th': ['the', 'that', 'this'],
            'he': ['hello', 'help', 'here'],
            'an': ['and', 'any', 'answer'],
            'in': ['into', 'information', 'include'],
            'on': ['only', 'once', 'online'],
            'at': ['about', 'after', 'around'],
            'be': ['because', 'before', 'between'],
            'ha': ['have', 'has', 'had'],
            'wi': ['with', 'will', 'would'],
            'yo': ['you', 'your', 'young']
        }
        
        predictions = []
        for prefix, completions in common_words.items():
            if last_word.startswith(prefix):
                for completion in completions:
                    if completion.startswith(last_word):
                        predictions.append((completion, 1))
        
        # If no matches, return some generic suggestions
        if not predictions:
            predictions = [('the', 1), ('and', 1), ('for', 1)]
        
        return predictions[:3]


# Initialize text predictor
predictor = TextPredictor()

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS and other attacks."""
    if not text:
        return ""
    # Remove HTML tags and normalize whitespace
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text.strip())
    # Limit length to prevent DoS
    return text[:500]

def validate_text_input(text: str) -> bool:
    """Validate text input for security and format."""
    if not text or len(text.strip()) == 0:
        return False
    if len(text) > 500:  # Prevent very long inputs
        return False
    # Check for suspicious patterns
    suspicious_patterns = [
        r'<script',
        r'javascript:',
        r'data:',
        r'vbscript:'
    ]
    for pattern in suspicious_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False
    return True


@app.route("/")
def index():
    """Render the main page."""
    return render_template("index.html")


@app.route('/output', methods=['GET'])
def get_predictions():
    """Get text predictions for the given input."""
    try:
        # Get and validate input parameters
        text = request.args.get('string', '').strip()
        
        # Validate input
        if not validate_text_input(text):
            return jsonify([])
        
        # Sanitize input
        text = sanitize_input(text)
        
        if not text:
            return jsonify([])
        
        # Get predictions
        predictions = predictor.get_predictions(text)
        
        # Ensure we return at least 3 predictions with fallback values
        while len(predictions) < 3:
            predictions.append(('', 0))
        
        # Filter out empty predictions and ensure we have valid data
        valid_predictions = [pred for pred in predictions[:3] if pred[0] and pred[0].strip()]
        
        # If no valid predictions, return empty strings
        if not valid_predictions:
            return jsonify([('', 0), ('', 0), ('', 0)])
        
        # Pad with empty predictions if needed
        while len(valid_predictions) < 3:
            valid_predictions.append(('', 0))
        
        return jsonify(valid_predictions[:3])
    
    except Exception as e:
        logger.error(f"Error in get_predictions: {e}")
        return jsonify([])


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
