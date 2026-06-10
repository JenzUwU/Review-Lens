import { useState } from 'react';
import Form from '../components/Form';
import Dashboard from '../components/Dashboard';
import { analyzeReviews } from '../lib/reviewAnalysis';

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const handleAnalyze = async (restaurant, reviews) => {
    setLoading(true);
    setError(null);
    setDashboardData(null);

    try {
      const data = await analyzeReviews(reviews, restaurant, setProgress);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing reviews');
      console.error(err);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="container">
      <header className="hero">
        <p className="hero-kicker">No API key. No cloud ML bill.</p>
        <h1>ReviewLens</h1>
        <p>
          Turn pasted or CSV restaurant reviews into sentiment, recurring
          complaints, and customer highlights directly in your browser.
        </p>
      </header>

      <Form onAnalyze={handleAnalyze} loading={loading} />

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading-card" aria-live="polite">
          <div className="spinner" />
          <div>
            <strong>{progress?.message || 'Preparing local analysis...'}</strong>
            <p>
              Keep this tab open. Your review text is processed on this device.
            </p>
          </div>
          {progress?.total > 0 && progress.stage === 'analysis' && (
            <progress value={progress.current} max={progress.total} />
          )}
        </div>
      )}

      {dashboardData && !loading && (
        <Dashboard data={dashboardData} />
      )}

      <footer className="site-footer">
        ReviewLens analyzes only the reviews you provide. It does not retrieve
        reviews from Google or other platforms.
      </footer>
    </div>
  );
}
