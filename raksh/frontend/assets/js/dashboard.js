document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('mainContent')) return;
  initDashboard();
});

async function initDashboard() {
  let stats = { totalScans: 0, criticalThreats: 0, highRiskMessages: 0, messagesScanned: 0, safeMessages: 0, suspiciousMessages: 0 };
  let scanHistory = [];
  try {
    const dashboardData = await API.getDashboardStats();
    const historyData = await API.getScanHistory({ limit: 5 }).catch(() => []);
    stats = {
      totalScans: dashboardData.total_scans || 0,
      criticalThreats: dashboardData.critical_alerts || 0,
      highRiskMessages: dashboardData.threats_detected || 0,
      messagesScanned: dashboardData.total_scans || 0,
      safeMessages: dashboardData.safe_messages || 0,
      suspiciousMessages: 0
    };
    scanHistory = (historyData.scans || historyData || []).map(function(h) {
      return {
        id: h.id,
        riskScore: h.risk_score,
        severity: h.severity,
        category: h.threat_category,
        timestamp: h.created_at,
        content: h.message ? h.message.message_content : '',
        source: h.message ? h.message.source : '',
        type: h.source || 'text',
        details: { reasons: h.explanation ? [h.explanation] : [], recommendation: h.recommendation },
        confidence: h.confidence,
      };
    });
  } catch (e) {
    console.warn('Dashboard API failed, using defaults', e);
  }
  updateStats(stats);
  renderScanHistory(scanHistory);
  renderRecentActivity(scanHistory);
  renderTodayActivity(stats);
  renderLastScan(scanHistory);
  await renderRecentAlerts();
  if (typeof Charts !== 'undefined') {
    Charts.initDashboardBarCharts();
    Charts.initCategoryChart();
  }
}

function updateStats(stats) {
  const threats = (stats.criticalThreats || 0) + (stats.highRiskMessages || 0);
  const total = stats.totalScans || 1;

  const protVal = document.getElementById('protStatusValue');
  if (protVal) {
    const active = threats === 0;
    protVal.textContent = active ? 'Active' : 'At Risk';
    protVal.style.color = active ? 'var(--accent-success)' : 'var(--accent-danger)';
  }
  const protLabel = document.getElementById('protStatusLabel');
  if (protLabel) {
    if (threats === 0) {
      protLabel.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:var(--accent-success);display:inline-block;"></span> All Safe';
      protLabel.style.color = 'var(--accent-success)';
    } else {
      protLabel.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:var(--accent-danger);display:inline-block;"></span> ' + threats + ' threat(s)';
      protLabel.style.color = 'var(--accent-danger)';
    }
  }

  const ratio = total > 0 ? (threats / total) : 0;
  let riskLevel, riskColor;
  if (ratio > 0.3) { riskLevel = 'Critical'; riskColor = 'var(--accent-danger)'; }
  else if (ratio > 0.1) { riskLevel = 'High'; riskColor = 'var(--accent-warning)'; }
  else if (ratio > 0.05) { riskLevel = 'Medium'; riskColor = '#eab308'; }
  else { riskLevel = 'Low'; riskColor = 'var(--accent-success)'; }
  const riskVal = document.getElementById('riskLevelValue');
  if (riskVal) {
    riskVal.textContent = riskLevel;
    riskVal.style.color = riskColor;
  }

  setText('messagesReceivedValue', formatNumber(stats.messagesScanned || 0));
  setText('threatsDetectedValue', formatNumber(threats));
  setText('safeMessagesValue', formatNumber(stats.safeMessages || 0));
  setText('criticalAlertsValue', formatNumber(stats.criticalThreats || 0));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderTodayActivity(stats) {
  const el = document.getElementById('todayActivityValue');
  if (!el) return;
  const total = stats.totalScans || 0;
  const threats = (stats.criticalThreats || 0) + (stats.highRiskMessages || 0) + (stats.suspiciousMessages || 0);
  const safe = stats.safeMessages || 0;
  el.textContent = total > 0
    ? total + ' scans today \u00B7 ' + threats + ' threats blocked \u00B7 ' + safe + ' safe messages'
    : 'No scans yet today';
}

function renderScanHistory(history) {
  const container = document.getElementById('recentScanHistoryList');
  if (!container) return;
  if (!history.length) {
    container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="empty-state-icon" style="font-size:24px;">\uD83D\uDD0D</div><div class="empty-state-text" style="font-size:13px;">No scans yet. Go to Scanner to analyze your first message.</div><a href="scan.html" class="btn btn-sm btn-primary empty-state-action" style="font-size:11px;">Start Scanning</a></div>';
    return;
  }
  const icons = { text: '\uD83D\uDCAC', link: '\uD83D\uDD17', qr: '\uD83D\uDCF7', image: '\uD83D\uDDBC\uFE0F', voice: '\uD83C\uDFA4', video: '\uD83C\uDFAC', file: '\uD83D\uDCC1' };
  container.innerHTML = history.slice(0, 5).map(function(h) {
    return '<div class="history-item">' +
      '<div class="history-icon" style="background:' + Utils.getScoreColor(h.riskScore || 0) + '20;color:' + Utils.getScoreColor(h.riskScore || 0) + ';">' + (icons[h.type] || '\uD83D\uDCDD') + '</div>' +
      '<div class="history-info">' +
        '<div class="h-type">' + (h.category || 'Scan') + '</div>' +
        '<div class="h-time">' + Utils.formatRelativeTime(h.timestamp) + '</div>' +
      '</div>' +
      '<span class="badge badge-' + (h.severity || 'info').toLowerCase() + '">' + (h.severity || '-') + '</span>' +
    '</div>';
  }).join('');
}

function renderRecentActivity(history) {
  const container = document.getElementById('recentActivityTimeline');
  if (!container) return;
  history = (history || []).slice(0, 6);
  if (!history.length) {
    container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="empty-state-icon" style="font-size:20px;margin-bottom:8px;">\uD83D\uDCED</div><div class="empty-state-text" style="font-size:13px;">No recent activity</div></div>';
    return;
  }
  container.innerHTML = '<div class="timeline">' + history.map(function(h) {
    return '<div class="timeline-item">' +
      '<div class="timeline-time">' + Utils.formatRelativeTime(h.timestamp) + '</div>' +
      '<div class="timeline-content">' + (h.type || 'Scan') + ': ' + (h.category || 'Unknown') + ' (' + (h.severity || '-') + ')</div>' +
    '</div>';
  }).join('') + '</div>';
}

function renderLastScan(scans) {
  const container = document.getElementById('lastScanContent');
  if (!container) return;
  scans = scans || [];
  if (!scans || !scans.length) {
    container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="empty-state-icon" style="font-size:24px;">🔍</div><div class="empty-state-text" style="font-size:13px;">No scans yet</div></div>';
    return;
  }
  const last = scans[0];
  container.innerHTML = `
    <div style="padding:12px 0;">
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;line-height:1.4;">${Utils.truncate(last.content || last.category, 80)}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="badge badge-${(last.severity||'info').toLowerCase()}">${last.severity} · ${last.riskScore}%</span>
        <span style="font-size:12px;color:var(--text-muted);">${Utils.formatRelativeTime(last.timestamp)}</span>
      </div>
      <a href="scanned-messages.html" style="font-size:12px;color:var(--accent-primary);">View All →</a>
    </div>
  `;
}

async function renderRecentAlerts() {
  const container = document.getElementById('recentAlertsContent');
  if (!container) return;
  let alerts = [];
  try {
    const history = await API.getScanHistory({ limit: 3, severity: 'critical' });
    const scans = history.scans || history || [];
    alerts = scans.filter(s => s.severity === 'critical' || s.risk_score >= 70).map(s => ({
      severity: s.severity === 'critical' ? 'critical' : 'warning',
      text: s.explanation || (s.message ? s.message.message_content : 'Threat detected') || 'Suspicious activity detected',
      time: Utils.formatRelativeTime(s.created_at)
    }));
  } catch {}
  if (!alerts.length) {
    container.innerHTML = '<div class="empty-state" style="padding:16px;"><div class="empty-state-icon" style="font-size:24px;">✅</div><div class="empty-state-text" style="font-size:13px;">No alerts</div></div>';
    return;
  }
  container.innerHTML = alerts.slice(0, 3).map(a => `
    <div style="padding:8px 0;border-bottom:1px solid var(--border-glass);">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <span style="font-size:14px;flex-shrink:0;margin-top:2px;">${a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : '🔵'}</span>
        <div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.4;">${Utils.escapeHtml(a.text)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${a.time}</div>
        </div>
      </div>
    </div>
  `).join('');
}
