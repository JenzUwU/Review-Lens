from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scraper import scrape_trustpilot, get_sample_reviews
from analyzer import analyze_sentiment, get_sentiment_counts, extract_keywords, generate_summary
from schemas import AnalyzeRequest, AnalyzeResponse
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ReviewLens API",
    description="AI-powered sentiment analysis for customer reviews",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "message": "ReviewLens API is running"}

@app.post("/analyze_and_scrape", response_model=AnalyzeResponse)
async def analyze_and_scrape(request: AnalyzeRequest):
    """
    Main endpoint: scrape reviews and analyze sentiment
    """
    try:
        # Validate input
        if not request.company or not request.company.strip():
            raise HTTPException(status_code=400, detail="Company name is required")
        
        # Fetch reviews
        if request.use_sample:
            logger.info(f"Using sample reviews for {request.company}")
            reviews = get_sample_reviews(request.company)
        else:
            logger.info(f"Scraping Trustpilot for {request.company}")
            reviews = scrape_trustpilot(request.company)
        
        if not reviews:
            raise HTTPException(status_code=400, detail="No reviews found")
        
        # Analyze sentiment
        logger.info(f"Analyzing sentiment for {len(reviews)} reviews")
        analyzed = analyze_sentiment(reviews)
        
        # Get sentiment counts
        counts = get_sentiment_counts(analyzed)
        
        # Extract keywords by sentiment
        positive_reviews = [r['text'] for r in analyzed if r['label'] == 'POSITIVE']
        negative_reviews = [r['text'] for r in analyzed if r['label'] == 'NEGATIVE']
        
        pain_points = extract_keywords(negative_reviews, sentiment="NEGATIVE", top_n=10)
        positives = extract_keywords(positive_reviews, sentiment="POSITIVE", top_n=10)
        
        # Generate summary
        summary = generate_summary(counts, pain_points, positives, request.company)
        
        # Return response
        return AnalyzeResponse(
            company=request.company,
            reviews=reviews,
            analyzed=analyzed,
            counts=counts,
            pain_points=pain_points,
            positives=positives,
            summary=summary
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in analyze_and_scrape: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ReviewLens API",
        "docs": "/docs",
        "health": "/health",
        "analyze": "/analyze_and_scrape"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
