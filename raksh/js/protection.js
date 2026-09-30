const API = window.API;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('protectionPage')) return;
  showProtectionSkeletons();
  try {
    await initProtection();
  } catch (e) {
    console.error('Protection init failed:', e);
  }
  hideProtectionSkeletons();
});

function showProtectionSkeletons() {
  const metricsContainer = document.querySelector('.prot-metric-grid');
  if (metricsContainer) {
    metricsContainer.innerHTML = Array(4).fill(`
      <div class="glass-card metric-card"><div class="skeleton skeleton-block" style="height:48px;width:48px;margin:0 auto 8px;border-radius:50%;"></div><div class="skeleton skeleton-line" style="width:40%;height:24px;margin:0 auto;"></div><div class="skeleton skeleton-line" style="width:60%;height:12px;margin:4px auto 0;"></div></div>
    `).join('');
  }
  const activityFeed = document.getElementById('protActivityFeed');
  if (activityFeed) {
    activityFeed.innerHTML = Array(5).fill(`
      <div class="skeleton-card"><div class="skeleton-row"><div class="skeleton skeleton-block" style="width:32px;height:32px;border-radius:50%;"></div><div class="skeleton skeleton-line" style="width:70%;height:12px;"></div></div></div>
    `).join('');
  }
  const chartContainers = document.querySelectorAll('.prot-chart-canvas canvas');
  chartContainers.forEach(c => {
    if (c.parentNode) {
      c.style.display = 'none';
      const skel = document.createElement('div');
      skel.className = 'skeleton-block';
      skel.style.height = '200px';
      skel.style.width = '100%';
      c.parentNode.insertBefore(skel, c);
      skel.id = 'skel_' + c.id;
    }
  });
  const knowledgeGrid = document.getElementById('protKnowledgeGrid');
  if (knowledgeGrid) {
    knowledgeGrid.innerHTML = Array(3).fill(`
      <div class="skeleton-card"><div class="skeleton skeleton-line" style="width:30%;height:12px;margin-bottom:8px;"></div><div class="skeleton skeleton-line" style="width:80%;height:16px;margin-bottom:6px;"></div><div class="skeleton skeleton-line" style="width:60%;height:12px;"></div></div>
    `).join('');
  }
}

function hideProtectionSkeletons() {
  document.querySelectorAll('.prot-metric-grid .skeleton-block').forEach(s => {
    if (s.closest('.metric-card')) s.closest('.metric-card').innerHTML = '';
  });
  document.querySelectorAll('[id^="skel_"]').forEach(s => s.remove());
  document.querySelectorAll('.prot-chart-canvas canvas').forEach(c => { c.style.display = ''; });
}

async function initProtection() {
  initTabs();
  await initStatusBar();
  await initOverview();
  await initReports();
  initKnowledge();
}

function initTabs() {
  const tabs = document.querySelectorAll('.prot-tab');
  const panels = document.querySelectorAll('.prot-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => {
        p.classList.remove('active');
        if (p.id === tab.getAttribute('data-panel')) p.classList.add('active');
      });
    });
  });
}

/* ===================== STATUS BAR ===================== */
async function initStatusBar() {
  let stats = { health_score: 85, active_campaigns: 7 };
  try {
    stats = await API.getDashboardStats();
  } catch (e) {
    console.error('Failed to load dashboard stats:', e);
  }
  let scans = [];
  try {
    const data = await API.getScanHistory({limit: 10}).then(d => d.scans);
    scans = (data || []).map(s => ({
      timestamp: new Date(s.created_at).getTime(),
      severity: s.severity
    }));
  } catch (e) {
    console.error('Failed to load scans:', e);
  }
  const todayScans = scans.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayThreats = todayScans.filter(s => s.severity !== 'Safe').length;
  const todayCritical = todayScans.filter(s => s.severity === 'Critical').length;
  const health = stats.health_score || 85;
  const active = stats.active_campaigns || 7;

  setText('protProtectionStatus', 'Active');
  setText('protAIStatus', 'Online (98.2%)');
  setText('protHealthScore', health + '%');
  setText('protTodaySummary', `${formatNumber(todayScans.length)} scans, ${todayThreats} threats, ${todayCritical} critical`);
  setText('protActiveThreats', active);
}

/* ===================== OVERVIEW ===================== */
async function initOverview() {
  await loadMetrics();
  loadConnectedApps();
  loadActivity();
  await loadHealthRing();
  loadDailyTip();
  await loadAlerts();
  loadRecommendations();
  await loadTrendingThreats();
}

async function loadMetrics() {
  let activeCampaigns = Utils.randomBetween(4, 10);
  try {
    const stats = await API.getDashboardStats();
    activeCampaigns = stats.active_campaigns || activeCampaigns;
  } catch (e) { /* ignore */ }
  let scans = [];
  try {
    const data = await API.getScanHistory({limit: 10}).then(d => d.scans);
    scans = (data || []).map(s => ({
      timestamp: new Date(s.created_at).getTime(),
      severity: s.severity
    }));
  } catch (e) { /* ignore */ }
  const todayScans = scans.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const threats = scans.filter(s => s.severity !== 'Safe');
  const safe = scans.filter(s => s.severity === 'Safe');

  setText('protMetricThreats', activeCampaigns);
  setText('protMetricScans', formatNumber(todayScans.length || Utils.randomBetween(50, 200)));
  setText('protMetricBlocked', formatNumber(threats.length || Utils.randomBetween(20, 100)));
  setText('protMetricSafe', formatNumber(safe.length || Utils.randomBetween(100, 500)));
}

function loadConnectedApps() {
  const container = document.getElementById('protConnectedApps');
  if (!container) return;
  const apps = [
    { icon: '💬', name: 'WhatsApp', status: 'Connected', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    { icon: '✈️', name: 'Telegram', status: 'Connected', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { icon: '🔵', name: 'Discord', status: 'Not Connected', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
    { icon: '⚡', name: 'Slack', status: 'Not Connected', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
    { icon: '📱', name: 'SMS', status: 'Connected', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { icon: '💠', name: 'Signal', status: 'Not Connected', color: '#64748b', bg: 'rgba(100,116,139,0.15)' }
  ];
  container.innerHTML = apps.map(a => `
    <div class="prot-connected-app">
      <div class="prot-app-icon" style="background:${a.bg};color:${a.color}">${a.icon}</div>
      <div class="prot-app-info">
        <div class="prot-app-name">${a.name}</div>
        <div class="prot-app-status">${a.status}</div>
      </div>
      <span class="badge ${a.status === 'Connected' ? 'badge-safe' : 'badge-info'}">${a.status === 'Connected' ? '🟢 Active' : '⚪ Setup'}</span>
    </div>
  `).join('');
}

function loadActivity() {
  const container = document.getElementById('protActivityFeed');
  if (!container) return;
  const activities = [
    { time: '2m', dot: '#22c55e', text: 'Message scanned — Safe', badge: 'Safe', cls: 'badge-safe' },
    { time: '5m', dot: '#eab308', text: 'Suspicious link detected in email', badge: 'Warning', cls: 'badge-warning' },
    { time: '12m', dot: '#6366f1', text: 'AI engine updated detection patterns', badge: 'Info', cls: 'badge-info' },
    { time: '18m', dot: '#ef4444', text: 'Phishing attempt blocked — "Bank OTP" campaign', badge: 'Critical', cls: 'badge-danger' },
    { time: '25m', dot: '#22c55e', text: 'QR code scanned — Safe', badge: 'Safe', cls: 'badge-safe' },
    { time: '32m', dot: '#f97316', text: 'New scam trend detected in community', badge: 'Alert', cls: 'badge-orange' },
    { time: '45m', dot: '#06b6d4', text: 'Connected WhatsApp for message protection', badge: 'Info', cls: 'badge-info' },
    { time: '1h', dot: '#ef4444', text: 'Fake KYC SMS targeting SBI customers blocked', badge: 'Critical', cls: 'badge-danger' },
    { time: '1.5h', dot: '#22c55e', text: 'Weekly security report generated', badge: 'Safe', cls: 'badge-safe' },
    { time: '2h', dot: '#eab308', text: 'Suspicious file download prevented', badge: 'Warning', cls: 'badge-warning' }
  ];
  container.innerHTML = activities.map(a => `
    <div class="prot-activity-item">
      <span class="prot-activity-time">${a.time}</span>
      <span class="prot-activity-dot" style="background:${a.dot}"></span>
      <span class="prot-activity-text">${a.text}</span>
      <span class="badge ${a.cls} prot-activity-badge">${a.badge}</span>
    </div>
  `).join('');
}

async function loadHealthRing() {
  let health = 85;
  try {
    const stats = await API.getDashboardStats();
    health = stats.health_score || 85;
  } catch (e) { /* ignore */ }
  const circumference = 2 * Math.PI * 65;
  const offset = circumference - (health / 100) * circumference;
  const color = health > 70 ? '#22c55e' : health > 40 ? '#eab308' : '#ef4444';

  const svg = document.querySelector('#protHealthRing svg');
  if (svg) {
    const circle = svg.querySelector('.prot-health-circle');
    if (circle) {
      circle.setAttribute('stroke-dasharray', circumference);
      circle.setAttribute('stroke-dashoffset', offset);
      circle.setAttribute('stroke', color);
    }
  }
  const text = document.getElementById('protHealthRingText');
  if (text) {
    text.textContent = health;
    text.style.color = color;
  }
  const sub = document.getElementById('protHealthSub');
  if (sub) {
    if (health > 70) sub.textContent = 'Good — ' + Utils.randomBetween(1, 5) + ' recommendations pending';
    else if (health > 40) sub.textContent = 'Fair — ' + Utils.randomBetween(3, 8) + ' improvements needed';
    else sub.textContent = 'Needs attention — immediate action required';
  }
}

function loadDailyTip() {
  const container = document.getElementById('protDailyTip');
  if (!container) return;
  const tip = CyberTips[Utils.randomBetween(0, CyberTips.length - 1)];
  container.textContent = tip;
}

async function loadAlerts() {
  const container = document.getElementById('protAlerts');
  if (!container) return;
  let alerts = [];
  try {
    const history = await API.getScanHistory({ limit: 6, severity: 'critical' });
    const scans = history.scans || history || [];
    alerts = scans.filter(s => s.severity === 'critical' || s.risk_score >= 70).map(s => ({
      severity: 'critical',
      text: s.explanation || (s.message ? s.message.message_content : 'Threat detected'),
      time: Utils.formatRelativeTime(s.created_at)
    }));
  } catch {}
  if (!alerts.length) {
    container.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:12px;">No alerts</div>';
    return;
  }
  const colors = { critical: '#ef4444', warning: '#eab308', info: '#06b6d4' };
  container.innerHTML = alerts.slice(0, 6).map(a => `
    <div class="prot-alert-item">
      <span class="prot-alert-dot" style="background:${colors[a.severity] || '#64748b'}"></span>
      <span>${a.text}</span>
      <span class="prot-alert-time">${a.time}</span>
    </div>
  `).join('');
}

function loadRecommendations() {
  const container = document.getElementById('protRecommendations');
  if (!container) return;
  const recs = [
    { icon: '🛡️', text: 'Enable WhatsApp message scanning for real-time protection' },
    { icon: '🔐', text: 'Your password for "example@gmail.com" was found in a data breach' },
    { icon: '📱', text: 'Update your device OS to patch 3 security vulnerabilities' },
    { icon: '👁️', text: 'Review app permissions — 5 apps have unnecessary access' },
    { icon: '📋', text: 'Complete the "AI Scam Awareness" learning module' }
  ];
  container.innerHTML = recs.map(r => `
    <div class="prot-rec-item" onclick="UI.showToast('${r.text.replace(/'/g, "\\'")}','info')">
      <span class="prot-rec-icon">${r.icon}</span>
      <span class="prot-rec-text">${r.text}</span>
    </div>
  `).join('');
}

async function loadTrendingThreats() {
  const container = document.getElementById('protTrendingThreats');
  if (!container) return;
  let threats = DATA.trendingThreats || [];
  try {
    const stats = await API.getDashboardStats();
    threats = stats.trending_threats || threats;
  } catch (e) { /* ignore */ }
  container.innerHTML = threats.slice(0, 7).map(t => `
    <div class="prot-trend-item">
      <span class="prot-trend-dot" style="background:${t.direction === 'up' ? '#ef4444' : '#22c55e'}"></span>
      <span class="prot-trend-name">${t.name}</span>
      <span class="prot-trend-count">${formatNumber(t.count)}</span>
      <span class="prot-trend-change ${t.direction}">${t.trend}</span>
    </div>
  `).join('');
}

/* ===================== ANALYTICS CHARTS ===================== */
function initCharts() {
  if (typeof Charts === 'undefined') return;
  // Row 1: Threat Trend
  const threatCtx = Charts.getCtx('protChartThreatTrend');
  if (threatCtx) {
    Charts.drawLineChart(threatCtx, {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      values: [12, 19, 8, 15, 22, 17, 24]
    }, { lineColor: '#6366f1', showPoints: true, showGrid: true });
  }

  // Row 1: Daily Scans
  const dailyCtx = Charts.getCtx('protChartDailyScans');
  if (dailyCtx) {
    const days = [];
    const vals = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      vals.push(Utils.randomBetween(10, 60));
    }
    Charts.drawLineChart(dailyCtx, { labels: days, values: vals }, { lineColor: '#06b6d4', showPoints: false });
  }

  // Row 2: Threat Categories (doughnut)
  const catCtx = Charts.getCtx('protChartCategories');
  if (catCtx) {
    Charts.drawDoughnut(catCtx, {
      labels: ['Phishing','Banking','Investment','QR','Fake Job','Delivery'],
      values: [35, 25, 15, 10, 8, 7],
      colors: ['#6366f1','#ef4444','#eab308','#06b6d4','#f97316','#22c55e']
    }, { centerText: '156' });
  }

  // Row 2: Risk Distribution
  const riskCtx = Charts.getCtx('protChartRisk');
  if (riskCtx) {
    Charts.drawRiskBars(riskCtx, {
      labels: ['Safe','Low','Medium','High','Critical'],
      values: [423, 289, 156, 89, 59],
      colors: ['#22c55e','#3b82f6','#eab308','#f97316','#ef4444']
    });
  }

  // Row 3: Detection Accuracy
  const accCtx = Charts.getCtx('protChartAccuracy');
  if (accCtx) {
    Charts.drawBarChart(accCtx, {
      labels: ['Phish','Malware','Social','URL','QR'],
      values: [98, 96, 95, 99, 94]
    }, { colors: ['#6366f1','#06b6d4','#22c55e','#f97316','#ef4444'] });
  }

  // Row 3: Monthly Scans (bar chart)
  const monthlyCtx = Charts.getCtx('protChartMonthly');
  if (monthlyCtx) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const vals = months.map(() => Utils.randomBetween(200, 1800));
    Charts.drawBarChart(monthlyCtx, { labels: months, values: vals }, {
      colors: ['#6366f1','#6366f1','#6366f1','#6366f1','#6366f1','#6366f1','#06b6d4','#06b6d4','#06b6d4','#06b6d4','#06b6d4','#06b6d4']
    });
  }

  // Score History chart
  const scoreCtx = Charts.getCtx('protChartScoreHistory');
  if (scoreCtx) {
    const labels = [];
    const vals = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
      vals.push(Utils.randomBetween(72, 98));
    }
    Charts.drawLineChart(scoreCtx, { labels, values: vals }, { lineColor: '#22c55e', showPoints: true, showGrid: true });
  }

  // Toggle buttons for score history
  document.querySelectorAll('.prot-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.prot-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.getAttribute('data-range');
      const ctx = Charts.getCtx('protChartScoreHistory');
      if (!ctx) return;
      if (range === 'week') {
        const labels = [];
        const vals = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          vals.push(Utils.randomBetween(72, 98));
        }
        Charts.drawLineChart(ctx, { labels, values: vals }, { lineColor: '#22c55e', showPoints: true, showGrid: true });
      } else {
        const labels = [];
        const vals = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          vals.push(Utils.randomBetween(70, 98));
        }
        Charts.drawLineChart(ctx, { labels, values: vals }, { lineColor: '#22c55e', showPoints: false, showGrid: true });
      }
    });
  });
}

/* ===================== REPORTS ===================== */
let reportData = [];
let reportFiltered = [];
let reportPage = 1;
const PER_PAGE = 10;
let reportView = 'table';

async function initReports() {
  try {
    const data = await API.getScanHistory({limit: 100}).then(d => d.scans);
    reportData = (data || []).map(s => ({
      id: s.id,
      timestamp: new Date(s.created_at).getTime(),
      type: s.type || 'Text',
      category: s.threat_category || 'Unknown',
      riskScore: s.risk_score,
      severity: s.severity,
      content: (s.message && s.message.message_content) || '',
      confidence: s.confidence,
      details: s.details || {}
    }));
  } catch (e) {
    console.error('Failed to load reports:', e);
    reportData = [];
  }
  reportFiltered = [...reportData];
  reportPage = 1;
  reportView = 'table';

  loadReportSummaries();
  renderReports();

  // Search
  const searchInput = document.getElementById('protReportSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      applyReportFilters();
    }, 300));
  }

  // Filter chips
  document.querySelectorAll('#protReportFilters .prot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#protReportFilters .prot-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyReportFilters();
    });
  });

  // Date inputs
  ['protReportDateFrom', 'protReportDateTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => applyReportFilters());
  });

  document.getElementById('protExportPDF')?.addEventListener('click', () => {
    const items = reportFiltered.map(r => `Date: ${Utils.formatDate(r.timestamp)}\nType: ${r.type}\nCategory: ${r.category}\nRisk: ${r.riskScore}%\nSeverity: ${r.severity}\nContent: ${r.content}\n---`).join('\n');
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:20px;background:#f5f5f5;}h1{font-size:18px;color:#333;}hr{border:1px solid #ccc;}.entry{padding:6px 0;border-bottom:1px solid #eee;font-size:13px;white-space:pre-wrap;}</style></head><body><h1>Protection Report</h1><p>Exported: ${new Date().toLocaleString()}</p><hr><div class="entry">${items.replace(/\n/g, '<br>')}</div></body></html>`;
    Utils.downloadFile(html, 'protection_report.pdf', 'text/html');
    UI.showToast('Exported as PDF Document', 'success');
  });
  document.getElementById('protExportTXT')?.addEventListener('click', () => {
    const text = reportFiltered.map(r => `Date: ${Utils.formatDate(r.timestamp)}\nType: ${r.type}\nCategory: ${r.category}\nRisk: ${r.riskScore}%\nSeverity: ${r.severity}\nContent: ${r.content}\n---`).join('\n');
    Utils.downloadFile(text, 'protection_report.txt', 'text/plain');
    UI.showToast('Exported as Text Document', 'success');
  });

  // Timeline toggle
  document.getElementById('protToggleView')?.addEventListener('click', () => {
    reportView = reportView === 'table' ? 'timeline' : 'table';
    document.getElementById('protReportTableView').style.display = reportView === 'table' ? '' : 'none';
    document.getElementById('protReportTimeline').style.display = reportView === 'timeline' ? '' : 'none';
    document.getElementById('protToggleView').textContent = reportView === 'table' ? '📅 Timeline' : '📋 Table';
    if (reportView === 'timeline') renderTimeline();
  });
}

function applyReportFilters() {
  const search = (document.getElementById('protReportSearch')?.value || '').toLowerCase();
  const activeChip = document.querySelector('#protReportFilters .prot-chip.active');
  const filter = activeChip ? activeChip.getAttribute('data-filter') : 'all';
  const dateFrom = document.getElementById('protReportDateFrom')?.value;
  const dateTo = document.getElementById('protReportDateTo')?.value;

  reportFiltered = reportData.filter(s => {
    // Search
    if (search && !s.content?.toLowerCase().includes(search) && !s.category?.toLowerCase().includes(search)) return false;
    // Category filter
    if (filter !== 'all') {
      if (filter === 'Safe' && s.severity !== 'Safe') return false;
      if (filter === 'Safe') return s.severity === 'Safe';
      if (!s.category?.toLowerCase().includes(filter.toLowerCase())) return false;
    }
    // Date filter
    if (dateFrom || dateTo) {
      const sd = new Date(s.timestamp || Date.now()).toISOString().split('T')[0];
      if (dateFrom && sd < dateFrom) return false;
      if (dateTo && sd > dateTo) return false;
    }
    return true;
  });

  reportPage = 1;
  loadReportSummaries();
  if (reportView === 'table') renderReports();
  else renderTimeline();
}

function loadReportSummaries() {
  const total = reportFiltered.length;
  const critical = reportFiltered.filter(s => s.severity === 'Critical').length;
  const safe = reportFiltered.filter(s => s.severity === 'Safe').length;

  setText('protSumTotal', total);
  setText('protSumCritical', critical);
  setText('protSumSafe', safe);
}

function renderReports() {
  const tbody = document.getElementById('protReportBody');
  const pagination = document.getElementById('protPagination');
  if (!tbody) return;

  const start = (reportPage - 1) * PER_PAGE;
  const pageItems = reportFiltered.slice(start, start + PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(reportFiltered.length / PER_PAGE));

  if (pageItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">No reports found</td></tr>';
  } else {
    tbody.innerHTML = pageItems.map(s => {
      const d = new Date(s.timestamp || Date.now());
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const sevLower = (s.severity || 'info').toLowerCase();
      const sevMap = { safe: 'safe', low: 'info', medium: 'warning', high: 'orange', critical: 'danger' };
      const badgeCls = sevMap[sevLower] || 'info';
      return `<tr>
        <td>${dateStr}</td>
        <td>${s.type || 'Text'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.truncate(s.content || '', 40)}</td>
        <td><span style="color:${Utils.getScoreColor(s.riskScore)};font-weight:600;">${s.riskScore}%</span></td>
        <td><span class="badge badge-${badgeCls}">${s.severity}</span></td>
        <td><button class="prot-report-action-btn" onclick="viewReportDetail('${s.id}')">View</button></td>
      </tr>`;
    }).join('');
  }

  // Pagination
  if (pagination) {
    let html = '';
    html += `<button class="prot-page-btn" onclick="goReportPage(${reportPage - 1})" ${reportPage <= 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= reportPage - 1 && i <= reportPage + 1)) {
        html += `<button class="prot-page-btn ${i === reportPage ? 'active' : ''}" onclick="goReportPage(${i})">${i}</button>`;
      } else if (i === reportPage - 2 || i === reportPage + 2) {
        html += `<span class="prot-page-btn" style="cursor:default;">…</span>`;
      }
    }
    html += `<button class="prot-page-btn" onclick="goReportPage(${reportPage + 1})" ${reportPage >= totalPages ? 'disabled' : ''}>›</button>`;
    pagination.innerHTML = html;
  }
}

function goReportPage(page) {
  const totalPages = Math.max(1, Math.ceil(reportFiltered.length / PER_PAGE));
  reportPage = Math.max(1, Math.min(page, totalPages));
  if (reportView === 'table') renderReports();
  else renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('protTimelineList');
  const pagination = document.getElementById('protTimelinePagination');
  if (!container) return;

  const start = (reportPage - 1) * PER_PAGE;
  const pageItems = reportFiltered.slice(start, start + PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(reportFiltered.length / PER_PAGE));

  if (pageItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:24px;">No reports found</div>';
  } else {
    container.innerHTML = pageItems.map(s => {
      const d = new Date(s.timestamp || Date.now());
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const sevLower = (s.severity || 'info').toLowerCase();
      const icon = sevLower === 'safe' ? '✅' : sevLower === 'critical' ? '🚨' : sevLower === 'high' ? '⚠️' : sevLower === 'medium' ? '⚡' : 'ℹ️';
      const iconBg = sevLower === 'safe' ? 'rgba(34,197,94,0.15)' : sevLower === 'critical' ? 'rgba(239,68,68,0.15)' : sevLower === 'high' ? 'rgba(249,115,22,0.15)' : sevLower === 'medium' ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.15)';
      return `<div class="prot-timeline-item">
        <div class="prot-timeline-icon" style="background:${iconBg}">${icon}</div>
        <div class="prot-timeline-content">
          <div class="prot-timeline-title">${Utils.truncate(s.content || 'No content', 60)}</div>
          <div class="prot-timeline-meta">${s.category || 'Unknown'} — ${dateStr} — Risk: ${s.riskScore}%</div>
        </div>
      </div>`;
    }).join('');
  }

  if (pagination) {
    let html = '';
    html += `<button class="prot-page-btn" onclick="goReportPage(${reportPage - 1})" ${reportPage <= 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= reportPage - 1 && i <= reportPage + 1)) {
        html += `<button class="prot-page-btn ${i === reportPage ? 'active' : ''}" onclick="goReportPage(${i})">${i}</button>`;
      } else if (i === reportPage - 2 || i === reportPage + 2) {
        html += `<span class="prot-page-btn" style="cursor:default;">…</span>`;
      }
    }
    html += `<button class="prot-page-btn" onclick="goReportPage(${reportPage + 1})" ${reportPage >= totalPages ? 'disabled' : ''}>›</button>`;
    pagination.innerHTML = html;
  }
}

function viewReportDetail(id) {
  const scan = reportData.find(s => s.id === id);
  if (!scan) { UI.showToast('Report not found', 'danger'); return; }
  const sevLower = (scan.severity || 'info').toLowerCase();
  const sevMap = { safe: 'safe', low: 'info', medium: 'warning', high: 'orange', critical: 'danger' };
  const badgeCls = sevMap[sevLower] || 'info';
  const d = new Date(scan.timestamp || Date.now());
  const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  UI.showModal(`
    <div class="modal-header"><h2>Report Details</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
    <div style="font-size:13px;color:var(--text-secondary);">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
        <div><strong>Date:</strong> ${dateStr}</div>
        <div><strong>Type:</strong> ${scan.type || 'Text'}</div>
        <div><strong>Category:</strong> ${scan.category || 'Unknown'}</div>
        <div><strong>Severity:</strong> <span class="badge badge-${badgeCls}">${scan.severity}</span></div>
        <div><strong>Risk Score:</strong> <span style="color:${Utils.getScoreColor(scan.riskScore)};font-weight:600;">${scan.riskScore}%</span></div>
        <div><strong>Confidence:</strong> ${scan.confidence || '—'}%</div>
      </div>
      <div style="margin-top:10px;"><strong>Content:</strong></div>
      <div style="padding:10px;background:var(--bg-frost);border-radius:var(--radius-sm);margin-top:4px;line-height:1.6;">${scan.content || 'N/A'}</div>
      <div style="margin-top:10px;"><strong>Recommendation:</strong></div>
      <div style="padding:10px;background:rgba(6,182,212,0.08);border-left:3px solid var(--accent-secondary);border-radius:var(--radius-sm);margin-top:4px;">${scan.details?.recommendation || 'Review the content for safety'}</div>
    </div>
  `);
}

/* ===================== KNOWLEDGE CENTER ===================== */
let knowledgeArticles = [];
let knowledgeFiltered = [];
let knowledgeBookmarks = [];

function initKnowledge() {
  knowledgeArticles = MockData.articles || [];
  knowledgeBookmarks = Storage.getBookmarks() || [];
  knowledgeFiltered = [...knowledgeArticles];

  renderKnowledge();

  // Search
  const searchInput = document.getElementById('protKnowledgeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      applyKnowledgeFilters();
    }, 300));
  }

  // Category filters
  document.querySelectorAll('#protKnowledgeFilters .prot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#protKnowledgeFilters .prot-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyKnowledgeFilters();
    });
  });
}

function applyKnowledgeFilters() {
  const search = (document.getElementById('protKnowledgeSearch')?.value || '').toLowerCase();
  const activeChip = document.querySelector('#protKnowledgeFilters .prot-chip.active');
  const cat = activeChip ? activeChip.getAttribute('data-cat') : 'all';

  knowledgeFiltered = knowledgeArticles.filter(a => {
    if (search && !a.title?.toLowerCase().includes(search) && !a.excerpt?.toLowerCase().includes(search)) return false;
    if (cat !== 'all') {
      const ac = (a.category || '').toLowerCase();
      if (ac !== cat.toLowerCase() && !ac.includes(cat.toLowerCase())) return false;
    }
    return true;
  });

  renderKnowledge();
}

function renderKnowledge() {
  const grid = document.getElementById('protKnowledgeGrid');
  const empty = document.getElementById('protKnowledgeEmpty');
  if (!grid) return;

  // Bookmarks bar
  renderBookmarksBar();

  if (knowledgeFiltered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">No articles match this category.</div></div>';
    if (empty) empty.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = knowledgeFiltered.map(a => {
    const bookmarked = knowledgeBookmarks.includes(a.id);
    return `<div class="glass-card prot-article-card" data-id="${a.id}">
      <div class="prot-article-category">${a.category}</div>
      <div class="prot-article-title">${a.title}</div>
      <div class="prot-article-excerpt">${Utils.truncate(a.excerpt || '', 100)}</div>
      <div class="prot-article-footer">
        <button class="prot-bookmark-btn ${bookmarked ? 'active' : ''}" onclick="toggleArticleBookmark('${a.id}')" title="Bookmark">${bookmarked ? '★' : '☆'}</button>
        <button class="prot-read-more" onclick="toggleArticleExpand('${a.id}')">Read More →</button>
      </div>
      <div class="prot-article-expanded">
        <p>${(a.content || '').replace(/\n/g, '<br>')}</p>
      </div>
    </div>`;
  }).join('');
}

function renderBookmarksBar() {
  const bar = document.getElementById('protBookmarksBar');
  const list = document.getElementById('protBookmarksList');
  if (!bar || !list) return;

  const bookmarkedArticles = knowledgeArticles.filter(a => knowledgeBookmarks.includes(a.id));
  if (bookmarkedArticles.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  list.innerHTML = bookmarkedArticles.map(a => `
    <span class="prot-bookmark-chip" onclick="scrollToArticle('${a.id}')">
      ${a.title} ★
    </span>
  `).join('');
}

function toggleArticleBookmark(id) {
  knowledgeBookmarks = Storage.toggleBookmark(id) || [];
  renderKnowledge();
  UI.showToast(
    knowledgeBookmarks.includes(id) ? 'Article bookmarked!' : 'Bookmark removed',
    knowledgeBookmarks.includes(id) ? 'success' : 'info'
  );
}

function toggleArticleExpand(id) {
  const card = document.querySelector(`.prot-article-card[data-id="${id}"]`);
  if (!card) return;
  card.classList.toggle('expanded');
  const btn = card.querySelector('.prot-read-more');
  if (btn) btn.textContent = card.classList.contains('expanded') ? 'Show Less' : 'Read More →';
}

function scrollToArticle(id) {
  const card = document.querySelector(`.prot-article-card[data-id="${id}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('expanded');
    const btn = card.querySelector('.prot-read-more');
    if (btn) btn.textContent = 'Show Less';
  }
}

/* ===================== HELPERS ===================== */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
