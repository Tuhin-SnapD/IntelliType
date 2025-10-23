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

import nltk
from flask import Flask, render_template, jsonify, request
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change in production

# Download required NLTK data
try:
    nltk.download('brown', quiet=True)
    nltk.download('punkt', quiet=True)
    logger.info("NLTK data downloaded successfully")
except Exception as e:
    logger.error(f"Failed to download NLTK data: {e}")
    logger.warning("Application will continue with limited functionality")


def get_bigram_freq(tokens: List[str]) -> nltk.ConditionalFreqDist:
    """Calculate bigram frequency distribution from tokens."""
    bgs = list(nltk.bigrams(tokens))
    return nltk.ConditionalFreqDist(bgs)


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
    """Simple text prediction engine using NLTK."""
    
    def __init__(self):
        """Initialize the text predictor with corpus data."""
        self.bgs_freq = None
        self._load_corpus()
    
    def _load_corpus(self):
        """Load and process corpus data."""
        try:
            from nltk.corpus import brown
            tokens = brown.words()
            logger.info(f"Loaded {len(tokens)} tokens from Brown corpus")
            self.bgs_freq = get_bigram_freq(tokens)
            logger.info("Frequency distributions computed successfully")
        except Exception as e:
            logger.error(f"Failed to load corpus: {e}")
            self.bgs_freq = nltk.ConditionalFreqDist()
            logger.warning("Using empty frequency distributions - predictions may be limited")
    
    def get_predictions(self, text: str) -> List[Tuple]:
        """Get text predictions."""
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
        last_word = words[-1].lower()
        
        # Get bigram predictions
        try:
            if self.bgs_freq and last_word in self.bgs_freq:
                predictions = self.bgs_freq[last_word].most_common(3)
            else:
                # Fallback: return common words if no predictions found
                predictions = [('the', 1), ('and', 1), ('for', 1)]
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            predictions = [('the', 1), ('and', 1), ('for', 1)]
        
        # Cache the results
        cache_prediction(text, predictions)
        return predictions


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
        
        # Ensure we return at least 3 predictions
        while len(predictions) < 3:
            predictions.append(('', 0))
        
        return jsonify(predictions[:3])
    
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
