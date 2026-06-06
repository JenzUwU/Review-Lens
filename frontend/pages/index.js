import { useState } from 'react';
import Form from '../components/Form';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (company, useSample) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/analyze_and_scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company,
          use_sample: useSample,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze reviews');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing reviews');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>ReviewLens</h1>
      <p style={{ color: 'white', textAlign: 'center', marginBottom: '30px', fontSize: '16px' }}>
        AI-powered sentiment analysis for customer reviews
      </p>
      
      <Form onAnalyze={handleAnalyze} loading={loading} />
      
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && (
        <div className="loading">
          Analyzing reviews... This may take a moment.
        </div>
      )}
      
      {dashboardData && !loading && (
        <Dashboard data={dashboardData} />
      )}
    </div>
  );
}
