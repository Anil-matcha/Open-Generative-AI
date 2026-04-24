import { BaseModal } from './BaseModal.jsx';

/**
 * VideoAnalytics Modal
 * Video performance analytics and insights
 */
export class VideoAnalytics extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Video Analytics',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.analytics = {
      views: 0,
      engagement: 0,
      retention: 0,
      shares: 0,
      comments: 0
    };
    this.selectedPeriod = '7d';
    this.metrics = [];
  }

  renderBody() {
    return `
      <div class="video-analytics">
        <div class="analytics-header">
          <div class="period-selector">
            <button class="period-btn ${this.selectedPeriod === '24h' ? 'active' : ''}" data-period="24h">24h</button>
            <button class="period-btn ${this.selectedPeriod === '7d' ? 'active' : ''}" data-period="7d">7 days</button>
            <button class="period-btn ${this.selectedPeriod === '30d' ? 'active' : ''}" data-period="30d">30 days</button>
            <button class="period-btn ${this.selectedPeriod === 'all' ? 'active' : ''}" data-period="all">All time</button>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">👁️</div>
            <div class="metric-content">
              <div class="metric-value">${this.formatNumber(this.analytics.views)}</div>
              <div class="metric-label">Total Views</div>
              <div class="metric-change positive">+12.5%</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">❤️</div>
            <div class="metric-content">
              <div class="metric-value">${this.formatNumber(this.analytics.engagement)}%</div>
              <div class="metric-label">Engagement</div>
              <div class="metric-change positive">+8.3%</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📊</div>
            <div class="metric-content">
              <div class="metric-value">${this.formatNumber(this.analytics.retention)}%</div>
              <div class="metric-label">Retention</div>
              <div class="metric-change negative">-2.1%</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">🔗</div>
            <div class="metric-content">
              <div class="metric-value">${this.formatNumber(this.analytics.shares)}</div>
              <div class="metric-label">Shares</div>
              <div class="metric-change positive">+15.7%</div>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <h3 class="section-title">Performance Over Time</h3>
          <div class="chart-placeholder">
            <div class="chart-bars">
              ${[40, 65, 45, 80, 55, 90, 70].map((h, i) => `
                <div class="chart-bar" style="height: ${h}%">
                  <span class="bar-label">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="insights-section">
          <h3 class="section-title">AI Insights</h3>
          <div class="insights-list">
            <div class="insight-card">
              <span class="insight-icon">💡</span>
              <div class="insight-text">
                <strong>Best time to post:</strong> Tuesday and Thursday between 2-4 PM
              </div>
            </div>
            <div class="insight-card">
              <span class="insight-icon">📈</span>
              <div class="insight-text">
                <strong>Audience retention:</strong> Peak at 0:15-0:30 mark, consider adding hooks
              </div>
            </div>
            <div class="insight-card">
              <span class="insight-icon">🎯</span>
              <div class="insight-text">
                <strong>Topic analysis:</strong> "How-to" content performs 34% better than promotional
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Period selector
    this.content.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectedPeriod = e.currentTarget.dataset.period;
        this.loadAnalytics();
        this.render();
      });
    });
  }

  loadAnalytics() {
    // Simulate loading different analytics data based on period
    const analyticsData = {
      '24h': { views: 1247, engagement: 78, retention: 85, shares: 42, comments: 18 },
      '7d': { views: 8934, engagement: 72, retention: 82, shares: 234, comments: 89 },
      '30d': { views: 38456, engagement: 68, retention: 79, shares: 1203, comments: 445 },
      'all': { views: 156789, engagement: 65, retention: 76, shares: 8934, comments: 2345 }
    };
    
    this.analytics = analyticsData[this.selectedPeriod] || analyticsData['7d'];
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}