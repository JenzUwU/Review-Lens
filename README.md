# ReviewLens

ReviewLens analyzes restaurant and customer reviews directly in the browser. Users
can paste reviews or upload a CSV file, then view sentiment counts, recurring pain
points, positive highlights, confidence scores, and a short summary.

No Google API, billing account, Python server, or sample review data is required.
Review text stays on the user's device.

## How it works

1. Enter a restaurant or business name.
2. Paste one review per line, or upload a CSV with a `review`, `review_text`,
   `text`, or `comment` column.
3. The browser downloads and caches a quantized DistilBERT sentiment model.
4. ReviewLens analyzes up to 500 reviews and renders the dashboard.

## Technology

- Next.js 16 and React 18
- Transformers.js and ONNX Runtime Web
- `Xenova/distilbert-base-uncased-finetuned-sst-2-english`
- Papa Parse for CSV input
- Chart.js for dashboard visualizations

## Local development

### Quick Start (Frontend Only - Recommended)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The first analysis requires internet access to download Transformers.js from
jsDelivr and the model from Hugging Face. Browser caching makes later analyses
faster.

### Full Stack Development (Frontend + Backend API)

**Option 1: PowerShell Script (Windows)**
```powershell
# Run from project root
.\start-dev.ps1
```
This automatically:
- Installs dependencies (frontend + backend)
- Creates Python virtual environment
- Starts backend on `http://localhost:8000`
- Starts frontend on `http://localhost:3000`

**Option 2: npm Scripts**
```powershell
# Install all dependencies (one time)
npm install:all

# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend    # Frontend on port 3000
npm run dev:backend     # Backend on port 8000
```

**Option 3: Manual Start**
```powershell
# Terminal 1: Backend
cd backend/app
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Backend API docs available at `http://localhost:8000/docs`

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Set the project Root Directory to `frontend`.
4. Deploy using the detected Next.js settings.

No environment variables or backend deployment are required.

## CSV format

```csv
review,rating,date
"Friendly staff and excellent breakfast",5,2026-06-01
"Our order was cold and very late",2,2026-06-02
```

## Current limitations

- The model is English-focused.
- Neutral sentiment is assigned when model confidence is below 70%.
- Keyword extraction uses word frequency, not aspect-based sentiment.
- Performance depends on the user's device and review count.

## Backend API

The `backend` directory contains an optional FastAPI server for review scraping
and analysis. It's not required for the browser-based frontend to work, but can
be used as an alternative backend service if needed.
