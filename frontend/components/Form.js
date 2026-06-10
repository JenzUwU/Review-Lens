import { useRef, useState } from 'react';
import { MAX_REVIEWS } from '../lib/reviewAnalysis';
import { parsePastedReviews, parseReviewCsv } from '../lib/reviewInput';

export default function Form({ onAnalyze, loading }) {
  const [restaurant, setRestaurant] = useState('');
  const [inputMode, setInputMode] = useState('paste');
  const [pastedReviews, setPastedReviews] = useState('');
  const [csvReviews, setCsvReviews] = useState([]);
  const [csvName, setCsvName] = useState('');
  const [inputError, setInputError] = useState('');
  const fileInputRef = useRef(null);

  const pastedCount = parsePastedReviews(pastedReviews).length;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setInputError('');
    setCsvReviews([]);
    setCsvName(file?.name || '');

    if (!file) return;

    try {
      const reviews = await parseReviewCsv(file);
      setCsvReviews(reviews);
    } catch (error) {
      setCsvName('');
      setInputError(error.message);
      event.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setInputError('');

    if (!restaurant.trim()) {
      setInputError('Enter the restaurant or business name.');
      return;
    }

    const reviews =
      inputMode === 'paste' ? parsePastedReviews(pastedReviews) : csvReviews;

    if (!reviews.length) {
      setInputError(
        inputMode === 'paste'
          ? 'Paste at least one review, with one review on each line.'
          : 'Choose a CSV file containing a review column.',
      );
      return;
    }

    onAnalyze(restaurant.trim(), reviews);
  };

  return (
    <form className="form-section" onSubmit={handleSubmit}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Private, local analysis</p>
          <h2>Analyze your reviews</h2>
        </div>
        <span className="privacy-pill">Reviews stay in this browser</span>
      </div>

      <div className="form-group">
        <label htmlFor="restaurant">Restaurant or business name</label>
        <input
          id="restaurant"
          type="text"
          placeholder="e.g., Marina Beach Cafe"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="input-tabs" role="tablist" aria-label="Review input method">
        <button
          className={inputMode === 'paste' ? 'tab-button active' : 'tab-button'}
          type="button"
          onClick={() => setInputMode('paste')}
          disabled={loading}
        >
          Paste reviews
        </button>
        <button
          className={inputMode === 'csv' ? 'tab-button active' : 'tab-button'}
          type="button"
          onClick={() => setInputMode('csv')}
          disabled={loading}
        >
          Upload CSV
        </button>
      </div>

      {inputMode === 'paste' ? (
        <div className="form-group">
          <label htmlFor="reviews">Reviews, one per line</label>
          <textarea
            id="reviews"
            rows="9"
            placeholder={'The staff were friendly and the dosa was excellent.\nService was slow and our order arrived cold.\nGood value, but the dining area was crowded.'}
            value={pastedReviews}
            onChange={(event) => setPastedReviews(event.target.value)}
            disabled={loading}
          />
          <p className="field-help">
            {pastedCount} review{pastedCount === 1 ? '' : 's'} ready
          </p>
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="csvFile">CSV review file</label>
          <div className="file-drop">
            <input
              ref={fileInputRef}
              id="csvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Choose CSV
            </button>
            <div>
              <strong>{csvName || 'No file selected'}</strong>
              <p>
                {csvReviews.length
                  ? `${csvReviews.length} reviews found`
                  : 'Include a column named review, review_text, text, or comment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {inputError && <div className="error compact-error">{inputError}</div>}

      <p className="limit-note">
        Up to {MAX_REVIEWS} reviews are analyzed per run. The first run downloads
        the sentiment model; later runs reuse the browser cache.
      </p>

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? 'Analyzing locally...' : 'Analyze reviews'}
      </button>
    </form>
  );
}
