# ReviewLens - Project Documentation

## Overview

ReviewLens is a privacy-friendly Next.js 16 review analysis web application. A user supplies
real reviews by pasting text or uploading a CSV file. The application performs
sentiment analysis locally in the browser and presents sentiment distribution,
common complaints, positive highlights, confidence scores, and a summary.

The current version deliberately avoids Google Places billing, unreliable web
scraping, built-in sample reviews, and an always-running ML backend.

## Architecture

```text
User
  |
  +-- Restaurant or business name
  +-- Pasted reviews or CSV upload
  |
  v
Next.js application on Vercel
  |
  +-- Papa Parse reads CSV input
  +-- Transformers.js runs DistilBERT in the browser
  +-- Local utilities calculate keywords and summaries
  |
  v
Chart.js dashboard
```

Review text is not sent to ReviewLens servers. On the first analysis, the browser
downloads the ML library from jsDelivr and model files from Hugging Face, then
caches those resources for later use.

## Project Structure

```text
reviewlens/
|-- frontend/
|   |-- components/
|   |   |-- Form.js              # Paste and CSV review input
|   |   `-- Dashboard.js         # Metrics, charts, and review table
|   |-- lib/
|   |   |-- reviewAnalysis.js    # Browser ML, keywords, and summary
|   |   `-- reviewInput.js       # Paste and CSV parsing
|   |-- pages/
|   |   |-- _app.js
|   |   `-- index.js             # Main application workflow
|   |-- public/
|   |   `-- sentiment-worker.js  # Browser worker and ML runtime
|   |-- styles/globals.css
|   |-- package.json
|   `-- next.config.js
|-- backend/                     # Legacy FastAPI implementation, unused
|-- docker-compose.yml           # Optional frontend-only local container
|-- README.md
`-- PROJECT_DOCUMENTATION.md
```

## Machine Learning

- Library: Transformers.js
- Runtime: ONNX Runtime Web
- Model: `Xenova/distilbert-base-uncased-finetuned-sst-2-english`
- Quantization: 8-bit
- Input limit: 500 non-empty reviews per run
- Output: positive, negative, or neutral with confidence

DistilBERT produces positive or negative labels. ReviewLens maps predictions below
70% confidence to neutral. This is a practical MVP rule, not a trained three-class
neutral model.

## Input

### Pasted reviews

Users enter one review per line.

### CSV upload

The CSV must have a recognized review column:

- `review`
- `reviews`
- `review_text`
- `review text`
- `text`
- `comment`
- `comments`
- `content`

Other columns, such as rating, date, and restaurant name, are allowed but ignored
in the current MVP.

## Output

- Total, positive, negative, and neutral review counts
- Sentiment distribution chart
- Frequent words from negative reviews
- Frequent words from positive reviews
- Per-review label and confidence
- Automatic text summary

## Deployment

Deploy the `frontend` directory as a Next.js project on Vercel. No API key,
environment variable, payment card, Render service, database, or Python runtime is
required.

## Limitations

1. The model is optimized for English.
2. The first model download can take time on slow connections.
3. Analysis speed depends on the user's hardware.
4. Frequency-based keywords do not understand phrases or context.
5. Sarcasm and domain-specific language can reduce accuracy.
6. ReviewLens analyzes supplied reviews; it does not retrieve reviews from Google.

## Future Improvements

- Web Worker inference to keep the interface responsive on large files
- Dedicated three-class sentiment model
- Aspect-based categories such as service, food, price, cleanliness, and ambience
- Multilingual model support
- CSV result export
- Optional date and rating filters

**Last updated:** June 6, 2026
