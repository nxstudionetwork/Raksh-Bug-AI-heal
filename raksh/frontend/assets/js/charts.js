const Charts = {
  charts: {},
  _trendData: null,
  _trendLoaded: false,

  async loadTrendData() {
    if (this._trendLoaded) return;
    try {
      this._trendData = await API.getDashboardTrends(30);
      this._trendLoaded = true;
    } catch {
      this._trendData = null;
    }
  },

  initDashboardCharts() {
    this.initThreatTrendChart();
  },

  initAnalyticsCharts() {
    this.initDailyScanChart();
    this.initMonthlyScanChart();
    this.initCategoryChart();
    this.initRiskDistribution();
    this.initHeatmapPlaceholder();
  },

  createCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const existing = container.querySelector('canvas');
    if (existing) existing.remove();

    const canvas = document.createElement('canvas');
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || container.clientWidth || 400;
    canvas.height = rect.height || container.clientHeight || 280;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    return canvas;
  },

  getCtx(containerId) {
    const canvas = this.createCanvas(containerId);
    return canvas ? canvas.getContext('2d') : null;
  },

  drawLineChart(ctx, data, options = {}) {
    if (!ctx) return;
    const { width, height } = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    ctx.canvas.width = width * dpr;
    ctx.canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.values, 10);
    const minVal = Math.min(...data.values, 0);
    const range = maxVal - minVal || 1;

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, options.lineColor || 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, options.lineColor ? options.lineColor.replace('0.3', '0.02') : 'rgba(99, 102, 241, 0.02)');

    ctx.clearRect(0, 0, width, height);

    if (options.showGrid !== false) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const label = Math.round(maxVal - (range / 4) * i);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(label, padding.left - 8, y + 4);
      }
    }

    const points = data.values.map((v, i) => ({
      x: padding.left + (chartW / (data.values.length - 1 || 1)) * i,
      y: padding.top + chartH - ((v - minVal) / range) * chartH
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = options.lineColor || '#6366f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (options.showPoints !== false) {
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = options.lineColor || '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#0a0e1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    if (data.labels && options.showLabels !== false) {
      const step = Math.max(1, Math.floor(data.labels.length / 8));
      data.labels.forEach((label, i) => {
        if (i % step !== 0 && i !== data.labels.length - 1) return;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, padding.left + (chartW / (data.labels.length - 1 || 1)) * i, height - 8);
      });
    }
  },

  drawBarChart(ctx, data, options = {}) {
    if (!ctx) return;
    const { width, height } = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    ctx.canvas.width = width * dpr;
    ctx.canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.values, 10);
    const barW = chartW / data.values.length * 0.6;

    ctx.clearRect(0, 0, width, height);

    data.values.forEach((v, i) => {
      const x = padding.left + (chartW / data.values.length) * i + (chartW / data.values.length - barW) / 2;
      const barH = (v / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      gradient.addColorStop(0, options.colors?.[i] || '#6366f1');
      gradient.addColorStop(1, (options.colors?.[i] || '#6366f1') + '40');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      if (data.labels) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        const label = data.labels[i];
        ctx.fillText(label.length > 6 ? label.slice(0, 5) + '..' : label, x + barW / 2, height - 8);
      }
    });
  },

  drawDoughnut(ctx, data, options = {}) {
    if (!ctx) return;
    const { width, height } = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    ctx.canvas.width = width * dpr;
    ctx.canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) * 0.7;
    const innerRadius = radius * 0.55;
    const total = data.values.reduce((a, b) => a + b, 0);
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    data.values.forEach((v, i) => {
      const sliceAngle = (v / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = data.colors?.[i] || '#6366f1';
      ctx.fill();
      startAngle += sliceAngle;
    });

    if (data.centerText) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.centerText, cx, cy - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px sans-serif';
      ctx.fillText('Total', cx, cy + 10);
    }
  },

  drawRiskBars(ctx, data) {
    if (!ctx) return;
    const { width, height } = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    ctx.canvas.width = width * dpr;
    ctx.canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barHeight = 24;
    const gap = 8;
    const startX = 70;
    const barWidth = width - startX - 20;
    const maxVal = Math.max(...data.values, 1);

    ctx.clearRect(0, 0, width, height);

    data.values.forEach((v, i) => {
      const y = 10 + i * (barHeight + gap);
      const w = (v / maxVal) * barWidth;

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(startX, y, barWidth, barHeight, 12);
      ctx.fill();

      ctx.fillStyle = data.colors?.[i] || '#6366f1';
      ctx.beginPath();
      ctx.roundRect(startX, y, Math.max(w, 4), barHeight, 12);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(data.labels?.[i] || '', startX - 8, y + 16);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(v.toString(), startX + w + 8, y + 16);
    });
  },

  initThreatTrendChart() {
    const ctx = this.getCtx('threatTrendChart');
    if (!ctx) return;

    let labels, values;
    if (this._trendData && this._trendData.daily_scans) {
      const recent = this._trendData.daily_scans.slice(-7);
      labels = recent.map(d => new Date(d.date).toLocaleDateString('en', { weekday: 'short' }));
      values = recent.map(d => d.count);
    } else {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      values = labels.map(() => Utils.randomBetween(5, 45));
    }

    this.drawLineChart(ctx, {
      labels: labels,
      values: values
    }, {
      lineColor: '#6366f1',
      showPoints: true
    });
  },

  initCategoryChart() {
    const ctx = this.getCtx('categoryChart');
    if (!ctx) return;

    let labels, values, total;
    if (this._trendData && this._trendData.category_breakdown) {
      const entries = Object.entries(this._trendData.category_breakdown).slice(0, 6);
      labels = entries.map(e => e[0].charAt(0).toUpperCase() + e[0].slice(1));
      values = entries.map(e => e[1]);
      total = values.reduce((a, b) => a + b, 0);
    } else {
      labels = ['Phishing', 'Banking', 'Investment', 'QR Scam', 'Fake Job', 'Delivery'];
      values = [35, 25, 18, 12, 8, 6];
      total = values.reduce((a, b) => a + b, 0);
    }

    this.drawDoughnut(ctx, {
      labels, values,
      colors: ['#6366f1', '#ef4444', '#eab308', '#06b6d4', '#f97316', '#22c55e']
    }, { centerText: total.toString() });
  },

  initDailyScanChart() {
    const ctx = this.getCtx('dailyScanChart');
    if (!ctx) return;

    let labels, values;
    if (this._trendData && this._trendData.daily_scans) {
      const data = this._trendData.daily_scans.slice(-30);
      labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values = data.map(d => d.count);
    } else {
      labels = [];
      values = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        values.push(Utils.randomBetween(8, 65));
      }
    }

    this.drawLineChart(ctx, { labels, values }, {
      lineColor: '#06b6d4',
      showPoints: false
    });
  },

  initMonthlyScanChart() {
    const ctx = this.getCtx('monthlyScanChart');
    if (!ctx) return;

    let labels, values;
    if (this._trendData && this._trendData.daily_scans) {
      const monthMap = {};
      this._trendData.daily_scans.forEach(d => {
        const m = new Date(d.date).toLocaleDateString('en-US', { month: 'short' });
        monthMap[m] = (monthMap[m] || 0) + d.count;
      });
      labels = Object.keys(monthMap);
      values = Object.values(monthMap);
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      values = labels.map(() => Utils.randomBetween(200, 1800));
    }

    this.drawBarChart(ctx, { labels, values }, {
      colors: ['#6366f1', '#6366f1', '#6366f1', '#6366f1', '#6366f1', '#6366f1', '#06b6d4', '#06b6d4', '#06b6d4', '#06b6d4', '#06b6d4', '#06b6d4']
    });
  },

  initCategoryChartAnalytics() {
    const ctx = this.getCtx('categoryChartAnalytics');
    if (!ctx) return;

    let labels, values, total;
    if (this._trendData && this._trendData.category_breakdown) {
      const entries = Object.entries(this._trendData.category_breakdown).slice(0, 7);
      labels = entries.map(e => e[0].charAt(0).toUpperCase() + e[0].slice(1));
      values = entries.map(e => e[1]);
      total = values.reduce((a, b) => a + b, 0);
    } else {
      labels = ['Phishing', 'Banking Scam', 'Investment', 'QR Scam', 'Fake Job', 'Delivery', 'Other'];
      values = [312, 245, 189, 98, 76, 54, 42];
      total = values.reduce((a, b) => a + b, 0);
    }

    this.drawDoughnut(ctx, {
      labels, values,
      colors: ['#6366f1', '#ef4444', '#eab308', '#06b6d4', '#f97316', '#22c55e', '#8b5cf6']
    }, { centerText: total.toString() });
  },

  initRiskDistribution() {
    const container = document.getElementById('riskDistribution');
    if (!container) return;

    let labels, values;
    if (this._trendData && this._trendData.risk_distribution) {
      const order = ['safe', 'low', 'medium', 'high', 'critical'];
      labels = order.map(k => k.charAt(0).toUpperCase() + k.slice(1));
      values = order.map(k => this._trendData.risk_distribution[k] || 0);
    } else {
      labels = ['Safe', 'Low', 'Medium', 'High', 'Critical'];
      values = [423, 289, 156, 89, 59];
    }

    const maxVal = Math.max(...values, 1);
    const classMap = ['safe-bg', 'low-bg', 'med-bg', 'high-bg', 'crit-bg'];

    container.innerHTML = labels.map((label, i) => `
      <div class="risk-row">
        <div class="risk-label">${label}</div>
        <div class="risk-track">
          <div class="risk-fill ${classMap[i]}" style="width:${(values[i] / maxVal) * 100}%"></div>
        </div>
        <div class="risk-count">${values[i]}</div>
      </div>
    `).join('');
  },

  initDashboardBarCharts() {
    const dailyCtx = this.getCtx('dailyScansBarChart');
    if (dailyCtx) {
      let labels, vals;
      if (this._trendData && this._trendData.daily_scans) {
        const recent = this._trendData.daily_scans.slice(-7);
        labels = recent.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }));
        vals = recent.map(d => d.count);
      } else {
        labels = [];
        vals = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          vals.push(Utils.randomBetween(8, 55));
        }
      }
      this.drawBarChart(dailyCtx, { labels, values: vals }, { colors: ['#6366f1','#6366f1','#6366f1','#6366f1','#6366f1','#6366f1','#6366f1'] });
    }

    const threatCtx = this.getCtx('threatTrendBarChart');
    if (threatCtx) {
      let labels, vals;
      if (this._trendData && this._trendData.daily_scans) {
        const recent = this._trendData.daily_scans.slice(-7);
        labels = recent.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }));
        vals = recent.map(d => d.count);
      } else {
        labels = [];
        vals = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          vals.push(Utils.randomBetween(2, 30));
        }
      }
      this.drawBarChart(threatCtx, { labels, values: vals }, { colors: ['#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444'] });
    }
  },

  initHeatmapPlaceholder() {
    const container = document.getElementById('geoHeatmap');
    if (!container) return;
    container.innerHTML = '<span>🌍 Geographic heatmap data will appear when AI backend is connected</span>';
  }
};
