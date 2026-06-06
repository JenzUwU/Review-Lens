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

  const { counts, pain_points, positives, reviews, analyzed, summary } = data;

  // Sentiment pie chart
  const sentimentLabels = Object.keys(counts).filter(k => k !== 'total');
  const sentimentData = {
    labels: sentimentLabels,
    datasets: [
      {
        data: sentimentLabels.map(label => counts[label] || 0),
        backgroundColor: [
          'rgba(75, 192, 75, 0.8)',   // positive green
          'rgba(192, 75, 75, 0.8)',   // negative red
          'rgba(150, 150, 150, 0.8)',  // neutral gray
        ],
        borderColor: [
          'rgb(75, 192, 75)',
          'rgb(192, 75, 75)',
          'rgb(150, 150, 150)',
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
        backgroundColor: 'rgba(192, 75, 75, 0.8)',
        borderColor: 'rgb(192, 75, 75)',
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
        backgroundColor: 'rgba(75, 192, 75, 0.8)',
        borderColor: 'rgb(75, 192, 75)',
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
      <h2 style={{ marginBottom: '30px', color: '#333' }}>Analysis Results for {data.company}</h2>

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
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #75b954 0%, #5a8c3a 100%)' }}>
          <h3>Positive</h3>
          <div className="value">{counts.POSITIVE || 0}</div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #d97e6a 0%, #b83d28 100%)' }}>
          <h3>Negative</h3>
          <div className="value">{counts.NEGATIVE || 0}</div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #999 0%, #666 100%)' }}>
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
          <Bar data={painPointsData} options={chartOptions} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>What Users Love</h3>
          <Bar data={positivesData} options={chartOptions} />
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
                  <td style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
                    {review.text.substring(0, 100)}...
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
