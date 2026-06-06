# ReviewLens - AI-Powered Review Sentiment Analyzer

A fullstack web application that scrapes customer reviews and performs sentiment analysis using HuggingFace's RoBERTa model.

## Features

- **Sentiment Analysis**: Automatically classify reviews as Positive, Negative, or Neutral
- **Keyword Extraction**: Identify top pain points and highlighted strengths
- **Interactive Dashboard**: Beautiful charts and metrics with Chart.js
- **Sample & Live Data**: Use sample data for quick demos or scrape from Trustpilot
- **Fully Dockerized**: Easy deployment with Docker Compose

## Tech Stack

**Frontend:**
- Next.js 14 (React)
- Chart.js for visualizations
- CSS Grid for responsive design
- Axios for API calls

**Backend:**
- FastAPI (Python)
- Hugging Face Transformers (RoBERTa sentiment model)
- BeautifulSoup4 for web scraping
- Pydantic for validation

## Project Structure

```
reviewlens/
├── frontend/                 # Next.js React app
│   ├── pages/
│   │   ├── _app.js
│   │   └── index.js
│   ├── components/
│   │   ├── Form.js
│   │   └── Dashboard.js
│   ├── styles/
│   │   └── globals.css
│   ├── package.json
│   ├── next.config.js
│   ├── .env.local.example
│   └── Dockerfile
│
├── backend/                  # FastAPI Python app
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── scraper.py       # Trustpilot scraper & sample data
│   │   ├── analyzer.py      # Sentiment analysis & keyword extraction
│   │   ├── schemas.py       # Pydantic models
│   │   ├── requirements.txt
│   │   └── Dockerfile
│
└── docker-compose.yml        # Local dev environment
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)

### Local Development

#### Backend Setup

```powershell
# Navigate to backend
cd backend\app

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

#### Frontend Setup

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
Copy-Item .env.local.example .env.local

# Run the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Using Docker Compose

```powershell
# From the project root
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## API Endpoint

### POST /analyze_and_scrape

**Request:**
```json
{
  "company": "notion.so",
  "use_sample": true
}
```

**Response:**
```json
{
  "company": "notion.so",
  "reviews": ["Review text 1", "Review text 2", ...],
  "analyzed": [
    {"text": "...", "label": "POSITIVE", "score": 0.95},
    {"text": "...", "label": "NEGATIVE", "score": 0.87}
  ],
  "counts": {
    "POSITIVE": 10,
    "NEGATIVE": 3,
    "NEUTRAL": 2,
    "total": 15
  },
  "pain_points": [["pricing", 5], ["performance", 3]],
  "positives": [["ui", 7], ["support", 4]],
  "summary": "..."
}
```

## Performance Notes

- RoBERTa model loads once at startup (not per-request)
- Typical analysis: 15 reviews in ~3-5 seconds
- For production: Consider caching, batch processing, or GPU acceleration
- Trustpilot scraping requires JavaScript rendering (Selenium/Playwright recommended)

## Future Enhancements

- [ ] Database storage (PostgreSQL)
- [ ] User authentication
- [ ] Review export (PDF, CSV)
- [ ] Real-time scraping with Selenium
- [ ] Multi-language sentiment analysis
- [ ] Trend analysis over time
- [ ] Email notifications

## License

MIT
