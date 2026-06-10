const NEUTRAL_THRESHOLD = 0.7;
const MAX_REVIEWS = 500;
let sentimentWorker;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'not', 'no',
  'very', 'really', 'just', 'also', 'there', 'their', 'them', 'our',
  'your', 'my', 'its', 'than', 'then', 'too', 'so', 'as', 'if',
  'restaurant', 'place', 'food',
]);

function normalizeLabel(result) {
  if (result.score < NEUTRAL_THRESHOLD) {
    return 'NEUTRAL';
  }

  return result.label.toUpperCase();
}

function getCounts(analyzed) {
  return analyzed.reduce(
    (counts, review) => {
      counts[review.label] += 1;
      return counts;
    },
    { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, total: analyzed.length },
  );
}

function extractKeywords(reviews, topN = 10) {
  const counts = new Map();

  reviews
    .join(' ')
    .toLowerCase()
    .match(/[a-z]{3,}/g)
    ?.filter((word) => !STOPWORDS.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topN);
}

function generateSummary(restaurant, counts, painPoints, positives) {
  const positivePercentage = counts.total
    ? Math.round((counts.POSITIVE / counts.total) * 100)
    : 0;
  const topPain = painPoints[0]?.[0];
  const topPositive = positives[0]?.[0];
  const details = [];

  if (topPain) details.push(`The most repeated concern is "${topPain}".`);
  if (topPositive) details.push(`The most repeated strength is "${topPositive}".`);

  return `${restaurant} has ${counts.total} supplied reviews analyzed, with ${positivePercentage}% classified as positive. ${details.join(' ')}`.trim();
}

function runSentimentWorker(reviews, onProgress) {
  return new Promise((resolve, reject) => {
    sentimentWorker ||= new Worker('/sentiment-worker.js', { type: 'module' });
    const worker = sentimentWorker;

    const finish = (callback) => (value) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      callback(value);
    };

    const resolveAndClose = finish(resolve);
    const rejectAndClose = finish(reject);

    function handleMessage({ data }) {
      if (data.type === 'model-progress') {
        const event = data.event;

        if (event.status === 'progress' && Number.isFinite(event.progress)) {
          onProgress?.({
            stage: 'model',
            message: `Downloading model files: ${Math.round(event.progress)}%`,
            current: 0,
            total: reviews.length,
          });
        }
      }

      if (data.type === 'analysis-progress') {
        onProgress?.({
          stage: 'analysis',
          message: `Analyzing review ${data.current} of ${data.total}`,
          current: data.current,
          total: data.total,
        });
      }

      if (data.type === 'complete') {
        resolveAndClose(data.results);
      }

      if (data.type === 'error') {
        rejectAndClose(new Error(data.message));
      }
    }

    function handleError(event) {
      worker.terminate();
      if (sentimentWorker === worker) sentimentWorker = null;
      rejectAndClose(
        new Error(event.message || 'The browser sentiment worker failed.'),
      );
    }

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage({ type: 'analyze', reviews });
  });
}

export async function analyzeReviews(reviews, restaurant, onProgress) {
  const cleanedReviews = reviews
    .map((review) => review.trim())
    .filter(Boolean)
    .slice(0, MAX_REVIEWS);

  if (!cleanedReviews.length) {
    throw new Error('Add at least one review before starting the analysis.');
  }

  onProgress?.({
    stage: 'model',
    message: 'Loading the sentiment model for the first analysis...',
    current: 0,
    total: cleanedReviews.length,
  });

  const results = await runSentimentWorker(cleanedReviews, onProgress);
  const analyzed = results.map((result, index) => ({
    text: cleanedReviews[index],
    label: normalizeLabel(result),
    score: Number(result.score.toFixed(3)),
  }));

  const counts = getCounts(analyzed);
  const negativeReviews = analyzed
    .filter((review) => review.label === 'NEGATIVE')
    .map((review) => review.text);
  const positiveReviews = analyzed
    .filter((review) => review.label === 'POSITIVE')
    .map((review) => review.text);
  const painPoints = extractKeywords(negativeReviews);
  const positives = extractKeywords(positiveReviews);

  return {
    company: restaurant,
    reviews: cleanedReviews,
    analyzed,
    counts,
    pain_points: painPoints,
    positives,
    summary: generateSummary(restaurant, counts, painPoints, positives),
  };
}

export { MAX_REVIEWS };
