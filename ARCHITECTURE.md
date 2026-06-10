# ReviewLens Architecture & Workflow Analysis

## 🏗️ Project Structure

```
reviewlens/
├── frontend/                 # Next.js React app (Port 3000)
│   ├── pages/
│   │   ├── index.js         # Main entry - orchestrator
│   │   └── _app.js          # Next.js config
│   ├── components/
│   │   ├── Form.js          # User input (company name + reviews)
│   │   └── Dashboard.js     # Results visualization
│   ├── lib/
│   │   ├── reviewAnalysis.js    # Core sentiment analysis logic
│   │   └── reviewInput.js       # CSV/text parsing
│   ├── public/
│   │   └── sentiment-worker.js  # Web Worker for ML model
│   ├── styles/
│   │   └── globals.css      # UI + new iris-inspired palette
│   └── package.json
├── backend/                  # FastAPI Python app (Port 8000)
│   ├── app/
│   │   ├── main.py          # API endpoints & CORS
│   │   ├── analyzer.py      # Sentiment analysis (RoBERTa)
│   │   ├── scraper.py       # Trustpilot scraper
│   │   ├── schemas.py       # Request/response models
│   │   └── requirements.txt
│   └── Dockerfile
└── start-dev.ps1           # PowerShell startup script
```

---

## 📊 How ReviewLens Works (Default Mode: Browser-Based)

### **1. User Input Flow**

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Form.js (React Component)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ 1. User enters business/restaurant name                 │
│    └─> stored in `restaurant` state                     │
│                                                           │
│ 2. Choose input method: PASTE or CSV                    │
│    ├─ PASTE: User types reviews (1 per line)            │
│    │  └─> parsePastedReviews() splits by newline        │
│    │                                                     │
│    └─ CSV: User uploads file                            │
│       └─> parseReviewCsv() extracts from columns:       │
│           ["review", "review_text", "text", "comment"]  │
│                                                           │
│ 3. Validation & Submit                                  │
│    ├─ Check restaurant name not empty                   │
│    ├─ Check reviews list not empty (max 500)            │
│    └─ Call onAnalyze(restaurant, reviews)               │
│                                                           │
└─────────────────────────────────────────────────────────┘
         │
         ▼
   pages/index.js
   (handleAnalyze function)
```

### **2. Sentiment Analysis (Browser-Based)**

```
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: reviewAnalysis.js                              │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ analyzeReviews(reviews, restaurant, setProgress)          │
│ │                                                         │
│ ├─ 1. Load ML Model (First Run Only)                      │
│ │      └─ Create Web Worker: sentiment-worker.js          │
│ │         • Downloads Transformers.js library            │
│ │         • Downloads DistilBERT model (110MB)           │
│ │         • Browser caches model locally                 │
│ │         • setProgress("Downloading model: 45%")        │
│ │                                                         │
│ ├─ 2. Run Sentiment Analysis                              │
│ │      └─ For EACH review:                                │
│ │         • Web Worker runs classifier                   │
│ │         • Model output: {label: "POSITIVE|NEGATIVE",   │
│ │                          score: 0.95}                  │
│ │         • Score < 0.7 = "NEUTRAL"                      │
│ │         • setProgress("Analyzing: 45/500")             │
│ │                                                         │
│ ├─ 3. Extract Keywords (Client-side)                      │
│ │      └─ For NEGATIVE reviews:                           │
│ │         • Join all negative reviews                    │
│ │         • Extract words (length > 3)                   │
│ │         • Remove stopwords ("the", "and", etc)         │
│ │         • Count frequency, sort, get top 10            │
│ │         └─ pain_points: [["slow", 45], ["cold", 32]]  │
│ │                                                         │
│ │      └─ For POSITIVE reviews: (same process)           │
│ │         └─ positives: [["excellent", 28], ...]         │
│ │                                                         │
│ ├─ 4. Generate Summary                                    │
│ │      └─ "${restaurant} has {total} reviews,            │
│ │         {positive}% positive. Main issue: {pain}.     │
│ │         Strength: {positive}."                         │
│ │                                                         │
│ └─ 5. Return Dashboard Data                               │
│       {                                                  │
│         company: "Marina Beach Cafe",                    │
│         reviews: ["Great food!", ...],                   │
│         analyzed: [{text, label, score}, ...],           │
│         counts: {POSITIVE: 142, NEGATIVE: 58, ...},      │
│         pain_points: [["slow", 45], ...],                │
│         positives: [["delicious", 67], ...],             │
│         summary: "..."                                   │
│       }                                                  │
│                                                            │
└──────────────────────────────────────────────────────────┘
         │
         ▼
   pages/index.js (setDashboardData)
```

### **3. Dashboard Visualization**

```
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: Dashboard.js (React Component)                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ Receives: dashboardData = {                               │
│   company, reviews, analyzed, counts, pain_points,       │
│   positives, summary                                     │
│ }                                                         │
│                                                            │
│ RENDERS:                                                  │
│                                                            │
│ ┌─ Summary Banner ──────────────────────────────┐         │
│ │ "Marina Beach Cafe has 200 reviews analyzed,  │         │
│ │  71% positive. Main concern: slow service.    │         │
│ │  Strength: delicious food."                   │         │
│ └───────────────────────────────────────────────┘         │
│                                                            │
│ ┌─ Metrics Cards (Row of 4) ────────────────────┐         │
│ │ [Total: 200] [Positive: 142] [Negative: 58] │         │
│ │                [Neutral: 0]                  │         │
│ └───────────────────────────────────────────────┘         │
│                                                            │
│ ┌─ Sentiment Distribution (Pie Chart) ───────┐            │
│ │   71% POSITIVE (teal)                       │            │
│ │   29% NEGATIVE (crimson)                    │            │
│ │   0% NEUTRAL (gray)                         │            │
│ └───────────────────────────────────────────┘            │
│                                                            │
│ ┌─ Top Pain Points (Bar Chart) ──────────────┐            │
│ │  slow          |████████████████ (45)      │            │
│ │  cold          |████████████ (32)          │            │
│ │  expensive     |██████ (18)                │            │
│ │  no parking    |████ (12)                  │            │
│ └───────────────────────────────────────────┘            │
│                                                            │
│ ┌─ What Users Love (Bar Chart) ──────────────┐            │
│ │  delicious     |███████████████ (67)       │            │
│ │  friendly      |████████████ (55)          │            │
│ │  fresh         |████████ (38)              │            │
│ │  good value    |███████ (32)               │            │
│ └───────────────────────────────────────────┘            │
│                                                            │
│ ┌─ All Reviews Table ───────────────────────┐             │
│ │ Review Text        │ Sentiment │ Confidence│             │
│ │ "Great staff..."   │ POSITIVE  │ 92.4%    │             │
│ │ "Cold food..."     │ NEGATIVE  │ 87.1%    │             │
│ │ "Amazing place"    │ POSITIVE  │ 95.6%    │             │
│ └───────────────────────────────────────────┘             │
│                                                            │
│ STYLING (New Iris Palette):                               │
│ • Background: Dark gradient (pupil #0a0e27)               │
│ • Accent: Teal (#0f5f6e) - positive, buttons             │
│ • Warning: Crimson (#dc2626) - negative                  │
│ • Highlight: Amber (#f59e0b) - accents                   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Processing Flow (Single Review)

```
INPUT: "The staff was friendly but food arrived cold"

1. WEB WORKER (sentiment-worker.js)
   └─ DistilBERT Model (via Transformers.js)
      └─ Output: {label: "NEGATIVE", score: 0.89}

2. NORMALIZATION (reviewAnalysis.js)
   └─ score (0.89) >= 0.7 threshold?
   └─ YES → Keep label: "NEGATIVE"
   └─ Output: {text: "...", label: "NEGATIVE", score: 0.89}

3. KEYWORD EXTRACTION
   └─ Split text → ["the", "staff", "was", "friendly", ...]
   └─ Remove stopwords → ["staff", "friendly", "food", "cold"]
   └─ Extract (length > 3) → ["staff", "friendly", "food", "cold"]
   └─ Since NEGATIVE: → Count "cold", "food" toward pain_points

4. AGGREGATION (across 500 reviews)
   └─ pain_points.get("cold") += 1
   └─ pain_points.get("food") += 1
   └─ Sort by frequency → [["cold", 45], ["food", 32], ...]
```

---

## 🔌 Optional: Backend API Mode

The backend can be used as an **alternative** analysis source:

### Backend Architecture (Not Used by Default)

```
┌──────────────────────────────────────────────────────────┐
│ BACKEND: main.py (FastAPI)                               │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ POST /analyze_and_scrape                                 │
│ ├─ Input: {company: "Marina Beach", use_sample: true}   │
│ │                                                         │
│ ├─ 1. SCRAPE REVIEWS                                      │
│ │      ├─ If use_sample=true: get_sample_reviews()       │
│ │      └─ If false: scrape_trustpilot()                  │
│ │         (Note: Currently returns samples due to JS)    │
│ │                                                         │
│ ├─ 2. ANALYZE SENTIMENT (analyzer.py)                     │
│ │      ├─ Model: cardiffnlp/twitter-roberta              │
│ │      ├─ For each review: sentiment_pipeline()          │
│ │      └─ Returns: [{text, label, score}, ...]           │
│ │                                                         │
│ ├─ 3. EXTRACT KEYWORDS                                    │
│ │      ├─ extract_keywords(negative_reviews)             │
│ │      └─ extract_keywords(positive_reviews)             │
│ │                                                         │
│ ├─ 4. GENERATE SUMMARY                                    │
│ │      └─ generate_summary(counts, pain_points, ...)     │
│ │                                                         │
│ └─ 5. RETURN AnalyzeResponse                              │
│       └─ {company, reviews, analyzed, counts, ...}       │
│                                                            │
│ GET /health                                              │
│ └─ {status: "ok"}                                        │
│                                                            │
│ GET /                                                    │
│ └─ API info                                              │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**To use backend instead of browser ML:**
1. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`
2. Frontend would call `/analyze_and_scrape` instead of running local Web Worker
3. Backend RoBERTa model: More robust but requires GPU, slower cold start

---

## 🎯 Key Features

| Feature | Implementation | Runs On |
|---------|-----------------|---------|
| **Sentiment Analysis** | DistilBERT (browser) OR RoBERTa (backend) | Client-side (default) |
| **Keyword Extraction** | Word frequency + stopword filtering | Client-side |
| **Data Privacy** | ✅ Reviews never leave browser | Client-side |
| **Model Caching** | ✅ Browser localStorage after first download | Client-side |
| **CSV Parsing** | PapaParse library | Client-side |
| **Review Scraping** | BeautifulSoup (backend) - currently disabled | Server-side (optional) |
| **Visualization** | Chart.js (pie, bar charts) | Client-side |
| **UI/UX** | Next.js 16 + React 18 | Client-side |

---

## 🚀 Performance Characteristics

| Stage | Time | Notes |
|-------|------|-------|
| **First Load** | ~2-5 minutes | Downloads 110MB model (cached) |
| **Subsequent Loads** | ~30-60 seconds | Reuses cached model |
| **Per Review** | ~200ms | DistilBERT inference time |
| **500 Reviews** | ~1.5-2 minutes | On typical modern device |
| **Keyword Extraction** | ~100ms | Client-side, very fast |
| **Dashboard Render** | ~500ms | Chart.js rendering |

---

## 🎨 UI/UX Flow

```
START
  ↓
┌─────────────────────────────────────┐
│ 1. LANDING PAGE (Hero + Form)      │
│    • Company name input             │
│    • Choose: Paste or CSV           │
│    • Submit button                  │
└─────────────────────────────────────┘
  ↓
  User enters data & clicks "Analyze"
  ↓
┌─────────────────────────────────────┐
│ 2. LOADING STATE                    │
│    • Spinner animation              │
│    • Progress: "Model 45%"          │
│    • Progress: "Analyzing 234/500"  │
│    • Privacy reminder               │
└─────────────────────────────────────┘
  ↓
  Analysis complete
  ↓
┌─────────────────────────────────────┐
│ 3. DASHBOARD                        │
│    • Summary banner (new iris style)│
│    • 4 metric cards (dark gradient) │
│    • Pie chart (sentiment split)    │
│    • Bar chart (pain points)        │
│    • Bar chart (positives)          │
│    • Full reviews table             │
└─────────────────────────────────────┘
  ↓
  User can paste new reviews & analyze again
  ↓
END
```

---

## 🔐 Security & Privacy

- ✅ **No server tracking** - Frontend-only ML
- ✅ **No API calls** for sentiment (unless backend enabled)
- ✅ **No data storage** - Results exist only in browser memory
- ✅ **No cookies** - No user tracking
- ✅ **No authentication** - Public app
- ⚠️ **CSV upload** - Files are processed locally, never uploaded
- ⚠️ **Model download** - First load connects to Hugging Face CDN

---

## 📋 Dependencies

**Frontend:**
- next@16.2.7 (framework)
- react@18 (UI)
- chart.js (visualizations)
- papaparse (CSV parsing)

**Backend (optional):**
- fastapi@0.104 (API)
- transformers@4.35 (ML)
- torch@2.1 (deep learning)
- beautifulsoup4 (web scraping)
- pandas (data handling)

