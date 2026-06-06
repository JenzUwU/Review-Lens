from transformers import pipeline
from typing import List, Dict, Tuple
import re
from collections import Counter

# Initialize sentiment model once at startup
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'not', 'no',
}

def analyze_sentiment(reviews: List[str]) -> List[Dict]:
    """Analyze sentiment of reviews using RoBERTa model"""
    analyzed = []
    for review in reviews:
        try:
            result = sentiment_pipeline(review[:512])  # Truncate to max length
            analyzed.append({
                'text': review,
                'label': result[0]['label'],
                'score': round(result[0]['score'], 3)
            })
        except Exception as e:
            print(f"Error analyzing review: {e}")
            analyzed.append({
                'text': review,
                'label': 'NEUTRAL',
                'score': 0.5
            })
    return analyzed


def get_sentiment_counts(analyzed_reviews: List[Dict]) -> Dict:
    """Count sentiments in analyzed reviews"""
    counts = {'POSITIVE': 0, 'NEGATIVE': 0, 'NEUTRAL': 0, 'total': len(analyzed_reviews)}
    
    for review in analyzed_reviews:
        label = review['label']
        if label in counts:
            counts[label] += 1
    
    return counts


def extract_keywords(reviews_by_sentiment: List[str], sentiment: str = "NEGATIVE", top_n: int = 10) -> List[Tuple[str, int]]:
    """Extract and count keywords from reviews"""
    text = ' '.join(reviews_by_sentiment).lower()
    
    # Simple word extraction
    words = re.findall(r'\b[a-z]{3,}\b', text)
    
    # Filter stopwords
    words = [w for w in words if w not in STOPWORDS]
    
    # Count and return top keywords
    word_counts = Counter(words)
    return word_counts.most_common(top_n)


def generate_summary(counts: Dict, pain_points: List, positives: List, company: str) -> str:
    """Generate a text summary of the analysis"""
    total = counts.get('total', 0)
    positive_count = counts.get('POSITIVE', 0)
    negative_count = counts.get('NEGATIVE', 0)
    
    positive_pct = (positive_count / total * 100) if total > 0 else 0
    
    top_pain = pain_points[0][0] if pain_points else 'N/A'
    top_positive = positives[0][0] if positives else 'N/A'
    
    summary = (
        f"{company} has {total} reviews analyzed. "
        f"{positive_pct:.0f}% are positive. "
        f"Main concern: {top_pain}. "
        f"Highlighted strength: {top_positive}."
    )
    
    return summary
