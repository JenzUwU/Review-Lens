import { useState } from 'react';

export default function Form({ onAnalyze, loading }) {
  const [company, setCompany] = useState('');
  const [useSample, setUseSample] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!company.trim()) {
      alert('Please enter a company domain');
      return;
    }

    onAnalyze(company, useSample);
  };

  return (
    <form className="form-section" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Analyze Reviews</h2>
      
      <div className="form-group">
        <label htmlFor="company">Company Domain or Name</label>
        <input
          id="company"
          type="text"
          placeholder="e.g., notion.so, slack, asana"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            id="useSample"
            type="checkbox"
            checked={useSample}
            onChange={(e) => setUseSample(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="useSample" style={{ margin: 0 }}>Use sample data (faster for demo)</label>
        </div>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Reviews'}
      </button>
    </form>
  );
}
