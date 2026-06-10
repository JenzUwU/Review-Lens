import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend);

export default function Dashboard({ data }) {
  if (!data) return null;

  const { counts, pain_points, positives, analyzed, summary } = data;

  // Sentiment pie chart
  const sentimentLabels = Object.keys(counts).filter(k => k !== 'total');
  const sentimentData = {
    labels: sentimentLabels,
    datasets: [
      {
        data: sentimentLabels.map(label => counts[label] || 0),
        backgroundColor: [
          'rgba(15, 95, 110, 0.8)',   // positive teal
          'rgba(220, 38, 38, 0.8)',   // negative crimson
          'rgba(100, 116, 139, 0.8)',  // neutral slate
        ],
        borderColor: [
          'rgb(15, 95, 110)',
          'rgb(220, 38, 38)',
          'rgb(100, 116, 139)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Pain points bar chart
  const painPointsLabels = pain_points.slice(0, 10).map(p => p[0]);
  const painPointsValues = pain_points.slice(0, 10).map(p => p[1]);
  const painPointsData = {
    labels: painPointsLabels,
    datasets: [
      {
        label: 'Mentions',
        data: painPointsValues,
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 1,
      },
    ],
  };

  // Positives bar chart
  const positivesLabels = positives.slice(0, 10).map(p => p[0]);
  const positivesValues = positives.slice(0, 10).map(p => p[1]);
  const positivesData = {
    labels: positivesLabels,
    datasets: [
      {
        label: 'Mentions',
        data: positivesValues,
        backgroundColor: 'rgba(15, 95, 110, 0.8)',
        borderColor: 'rgb(15, 95, 110)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  const getSentimentBadge = (label) => {
    const classes = `sentiment-badge sentiment-${label.toLowerCase()}`;
    return classes;
  };

  return (
    <div className="dashboard-section">
      <div className="dashboard-heading">
        <p className="eyebrow">Local analysis complete</p>
        <h2>Results for {data.company}</h2>
      </div>

      {summary && (
        <div className="success" style={{ marginBottom: '30px' }}>
          <strong>Summary:</strong> {summary}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Reviews</h3>
          <div className="value">{counts.total || 0}</div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #0f5f6e 0%, #064e61 100%)' }}>
          <h3>Positive</h3>
          <div className="value">{counts.POSITIVE || 0}</div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
          <h3>Negative</h3>
          <div className="value">{counts.NEGATIVE || 0}</div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }}>
          <h3>Neutral</h3>
          <div className="value">{counts.NEUTRAL || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Sentiment Distribution</h3>
          <Pie data={sentimentData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        <div className="chart-container">
          <h3>Top Pain Points</h3>
          {pain_points.length ? (
            <Bar data={painPointsData} options={chartOptions} />
          ) : (
            <p className="empty-state">No repeated negative keywords were found.</p>
          )}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>What Users Love</h3>
          {positives.length ? (
            <Bar data={positivesData} options={chartOptions} />
          ) : (
            <p className="empty-state">No repeated positive keywords were found.</p>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div style={{ marginTop: '40px' }}>
        <h3>All Reviews</h3>
        <table className="reviews-table">
          <thead>
            <tr>
              <th>Review Text</th>
              <th>Sentiment</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {analyzed && analyzed.length > 0 ? (
              analyzed.map((review, idx) => (
                <tr key={idx}>
                  <td className="review-text">
                    {review.text.length > 140
                      ? `${review.text.substring(0, 140)}...`
                      : review.text}
                  </td>
                  <td>
                    <span className={getSentimentBadge(review.label)}>
                      {review.label}
                    </span>
                  </td>
                  <td>{(review.score * 100).toFixed(1)}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>
                  No reviews available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
