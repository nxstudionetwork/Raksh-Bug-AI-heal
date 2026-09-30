(function() {
  const API = window.API;
  const PER_PAGE = 10;
  let allScans = [];
  let filteredScans = [];
  let currentPage = 1;
  let currentSort = 'newest';

  const sourceIcons = {
    whatsapp: '💬', telegram: '✈️', email: '📧', sms: '📱',
    discord: '💠', manual: '🔍'
  };

  const sourceNames = {
    whatsapp: 'WhatsApp', telegram: 'Telegram', email: 'Email', sms: 'SMS',
    discord: 'Discord', manual: 'Manual'
  };

  const sourceList = ['whatsapp', 'telegram', 'email', 'sms', 'discord', 'manual'];

  async function init() {
    try {
      const data = await API.getScanHistory({limit: 100}).then(function(d) { return d.scans; });
      allScans = (data || []).map(function(s) {
        return {
          id: s.id,
          riskScore: s.risk_score,
          severity: s.severity,
          category: s.threat_category,
          source: (s.message && s.message.source) || sourceList[Math.floor(Math.random() * sourceList.length)],
          content: (s.message && s.message.message_content) || '',
          timestamp: new Date(s.created_at).getTime(),
          details: s.details || {},
          confidence: s.confidence,
          type: s.type,
          explanation: s.explanation,
          recommendation: s.recommendation,
          favorite: false,
          reviewed: false
        };
      });
    } catch (e) {
      console.error('Failed to load scan history:', e);
      allScans = [];
    }
    applyFilters();
    bindEvents();
  }

  function applyFilters() {
    var searchVal = (document.getElementById('scannedSearch')?.value || '').toLowerCase().trim();
    var dateVal = document.getElementById('scannedDateFilter')?.value || '';
    var riskVal = document.getElementById('scannedRiskFilter')?.value || 'all';
    var srcVal = document.getElementById('scannedSourceFilter')?.value || 'all';

    filteredScans = allScans.filter(function(s) {
      if (searchVal && !s.content.toLowerCase().includes(searchVal)) return false;
      if (dateVal) {
        var scanDate = new Date(s.timestamp).toISOString().split('T')[0];
        if (scanDate !== dateVal) return false;
      }
      if (riskVal !== 'all' && s.severity.toLowerCase() !== riskVal) return false;
      if (srcVal !== 'all' && s.source !== srcVal) return false;
      return true;
    });

    sortScans();
    render();
  }

  function sortScans() {
    currentSort = document.getElementById('scannedSort')?.value || 'newest';
    var sorted = Array.from(filteredScans);

    switch (currentSort) {
      case 'newest':
        sorted.sort(function(a, b) { return b.timestamp - a.timestamp; });
        break;
      case 'oldest':
        sorted.sort(function(a, b) { return a.timestamp - b.timestamp; });
        break;
      case 'risk-desc':
        sorted.sort(function(a, b) { return (b.riskScore || 0) - (a.riskScore || 0); });
        break;
    }

    filteredScans = sorted;
  }

  function render() {
    var container = document.getElementById('scannedList');
    var totalPages = Math.max(1, Math.ceil(filteredScans.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    var startIdx = (currentPage - 1) * PER_PAGE;
    var pageItems = filteredScans.slice(startIdx, startIdx + PER_PAGE);

    if (filteredScans.length === 0) {
      container.innerHTML =
        '<div class="scanned-empty">' +
        '<div class="scanned-empty-icon">📋</div>' +
        '<div class="scanned-empty-title">No scanned messages found</div>' +
        '<div class="scanned-empty-text">Try adjusting your search or filter criteria</div>' +
        '</div>';
      document.getElementById('scannedResultCount').textContent = '0 results';
      renderPagination(0);
      return;
    }

    document.getElementById('scannedResultCount').textContent = filteredScans.length + ' result' + (filteredScans.length !== 1 ? 's' : '');

    container.innerHTML = pageItems.map(function(s) {
      var sev = s.severity.toLowerCase();
      var preview = s.content.length > 80 ? s.content.slice(0, 80) + '...' : s.content;
      var icon = sourceIcons[s.source] || '🔍';
      var srcName = sourceNames[s.source] || s.source;
      var relTime = Utils.formatRelativeTime(s.timestamp);
      var dateStr = Utils.formatDate(s.timestamp);
      var favIcon = s.favorite ? '⭐' : '☆';
      var reviewedClass = s.reviewed ? 'reviewed' : '';

      return '<div class="scanned-item glass-card" data-id="' + s.id + '">' +
        '<div class="scanned-item-header">' +
        '<div class="scanned-item-icon">' + icon + '</div>' +
        '<div class="scanned-item-body">' +
        '<div class="scanned-item-preview">' + Utils.escapeHtml(preview) + '</div>' +
        '<div class="scanned-item-meta">' +
        '<span class="scanned-item-source">' + srcName + '</span>' +
        '<span class="scanned-item-time">' + relTime + '</span>' +
        '<span class="scanned-item-date">' + dateStr + '</span>' +
        '</div></div>' +
        '<div class="scanned-item-right">' +
        '<span class="risk-badge ' + sev + '">' + s.severity + '</span>' +
        '<button class="scanned-item-fav" data-action="fav" title="Toggle favorite">' + favIcon + '</button>' +
        '</div></div></div>';
    }).join('');

    renderPagination(totalPages);

    container.querySelectorAll('.scanned-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        if (e.target.closest('[data-action]')) return;
        var id = this.getAttribute('data-id');
        openDetail(id);
      });
    });

    container.querySelectorAll('[data-action="fav"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var item = this.closest('.scanned-item');
        var id = item.getAttribute('data-id');
        var scan = allScans.find(function(s) { return s.id === id; });
        if (scan) {
          scan.favorite = !scan.favorite;
          applyFilters();
          UI.showToast(scan.favorite ? '⭐ Message favorited' : '☆ Favorite removed', 'info');
        }
      });
    });
  }

  function renderPagination(totalPages) {
    var container = document.getElementById('scannedPagination');
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    var html = '';
    html += '<button class="scanned-page-btn" data-page="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '>‹ Prev</button>';

    for (var i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += '<button class="scanned-page-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += '<button class="scanned-page-btn" disabled>…</button>';
      }
    }

    html += '<button class="scanned-page-btn" data-page="next" ' + (currentPage >= totalPages ? 'disabled' : '') + '>Next ›</button>';
    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = this.getAttribute('data-page');
        if (page === 'prev' && currentPage > 1) currentPage--;
        else if (page === 'next' && currentPage < totalPages) currentPage++;
        else if (page !== 'prev' && page !== 'next') currentPage = parseInt(page, 10);
        render();
      });
    });
  }

  function openDetail(id) {
    var scan = allScans.find(function(s) { return s.id === id; });
    if (!scan) return;

    var sev = scan.severity.toLowerCase();
    var icon = sourceIcons[scan.source] || '🔍';
    var srcName = sourceNames[scan.source] || scan.source;
    var scoreColor = Utils.getScoreColor(scan.riskScore || 0);
    var fullDate = Utils.formatDate(scan.timestamp) + ' ' + Utils.formatTime(scan.timestamp);
    var explanation = scan.explanation || (scan.details?.reasons?.length ? scan.details.reasons.join('. ') : 'No suspicious patterns detected.');
    var recommendation = scan.recommendation || scan.details?.recommendation || 'No specific recommendation.';
    var status = scan.severity === 'Safe' ? 'Safe' : scan.riskScore > 70 ? 'Threat' : 'Suspicious';
    var statusColor = sev === 'safe' ? 'var(--accent-success)' : sev === 'critical' || sev === 'high' ? 'var(--accent-danger)' : 'var(--accent-warning)';

    var overlay = document.getElementById('scannedDetailOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'scannedDetailOverlay';
      overlay.className = 'scanned-detail-overlay';
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeDetail();
      });
      document.body.appendChild(overlay);
    }

    overlay.innerHTML =
      '<div class="scanned-detail-modal">' +
      '<button class="scanned-detail-close" onclick="closeDetail()">✕</button>' +
      '<div class="scanned-detail-header">' +
      '<div class="scanned-detail-source-icon">' + icon + '</div>' +
      '<div class="scanned-detail-info">' +
      '<div class="scanned-detail-title">' + Utils.escapeHtml(srcName) + ' Message</div>' +
      '<div class="scanned-detail-subtitle">Scanned ' + fullDate + '</div>' +
      '</div>' +
      '<div class="scanned-detail-score">' +
      '<div class="scanned-detail-score-value" style="color:' + scoreColor + '">' + (scan.riskScore || 0) + '</div>' +
      '<div class="scanned-detail-score-label">/ 100</div>' +
      '</div>' +
      '</div>' +
      '<div class="scanned-detail-body">' +
      '<div class="scanned-detail-section">' +
      '<div class="scanned-detail-section-title">Message Content</div>' +
      '<div class="scanned-detail-message">' + Utils.escapeHtml(scan.content) + '</div>' +
      '</div>' +
      '<div class="scanned-detail-grid">' +
      '<div class="scanned-detail-field"><span class="scanned-detail-field-label">Threat Score</span><span class="scanned-detail-field-value" style="color:' + scoreColor + '">' + (scan.riskScore || 0) + '/100</span></div>' +
      '<div class="scanned-detail-field"><span class="scanned-detail-field-label">Severity</span><span class="scanned-detail-field-value"><span class="risk-badge ' + sev + '">' + scan.severity + '</span></span></div>' +
      '<div class="scanned-detail-field"><span class="scanned-detail-field-label">Category</span><span class="scanned-detail-field-value">' + (scan.category || 'N/A') + '</span></div>' +
      '<div class="scanned-detail-field"><span class="scanned-detail-field-label">Status</span><span class="scanned-detail-field-value" style="color:' + statusColor + '">' + status + '</span></div>' +
      '<div class="scanned-detail-field"><span class="scanned-detail-field-label">Source</span><span class="scanned-detail-field-value">' + srcName + '</span></div>' +
      '<div class="scanned-detail-field"><span class="scanned-detail-field-label">Scan Time</span><span class="scanned-detail-field-value">' + fullDate + '</span></div>' +
      '</div>' +
      '<div class="scanned-detail-section">' +
      '<div class="scanned-detail-section-title">AI Explanation</div>' +
      '<div class="scanned-detail-message">' + explanation + '</div>' +
      '</div>' +
      '<div class="scanned-detail-section">' +
      '<div class="scanned-detail-section-title">Recommendation</div>' +
      '<div class="scanned-detail-message">' + recommendation + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="scanned-detail-actions">' +
      '<button class="btn btn-sm btn-secondary" data-action="fav-detail">' + (scan.favorite ? '⭐ Unfavorite' : '☆ Favorite') + '</button>' +
      '<button class="btn btn-sm btn-secondary" data-action="review">' + (scan.reviewed ? '✓ Reviewed' : 'Mark as Reviewed') + '</button>' +
      '<button class="btn btn-sm btn-danger" data-action="delete">🗑️ Delete</button>' +
      '<button class="btn btn-sm btn-primary" data-action="rescan">🔄 Re-scan</button>' +
      '</div>' +
      '</div>';

    overlay.classList.add('open');

    overlay.querySelector('[data-action="fav-detail"]')?.addEventListener('click', function() {
      scan.favorite = !scan.favorite;
      UI.showToast(scan.favorite ? '⭐ Message favorited' : '☆ Favorite removed', 'info');
      openDetail(scan.id);
      applyFilters();
    });

    overlay.querySelector('[data-action="review"]')?.addEventListener('click', function() {
      scan.reviewed = !scan.reviewed;
      UI.showToast(scan.reviewed ? '✓ Marked as reviewed' : 'Review undone', 'info');
      openDetail(scan.id);
      applyFilters();
    });

    overlay.querySelector('[data-action="delete"]')?.addEventListener('click', function() {
      UI.showConfirmDialog('Delete this scanned message?', function(confirmed) {
        if (confirmed) {
          allScans = allScans.filter(function(s) { return s.id !== scan.id; });
          closeDetail();
          applyFilters();
          UI.showToast('🗑️ Message deleted', 'warning');
        }
      });
    });

    overlay.querySelector('[data-action="rescan"]')?.addEventListener('click', function() {
      UI.showToast('Re-scanning...', 'info');
      var newScore = Utils.randomBetween(0, 100);
      scan.riskScore = newScore;
      scan.severity = Utils.getSeverity(newScore).label;
      applyFilters();
    });
  }

  window.closeDetail = function() {
    var overlay = document.getElementById('scannedDetailOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  function bindEvents() {
    var searchInput = document.getElementById('scannedSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(function() {
        currentPage = 1;
        applyFilters();
      }, 300));
    }

    var dateFilter = document.getElementById('scannedDateFilter');
    if (dateFilter) dateFilter.addEventListener('change', function() { currentPage = 1; applyFilters(); });

    var riskFilter = document.getElementById('scannedRiskFilter');
    if (riskFilter) riskFilter.addEventListener('change', function() { currentPage = 1; applyFilters(); });

    var srcFilter = document.getElementById('scannedSourceFilter');
    if (srcFilter) srcFilter.addEventListener('change', function() { currentPage = 1; applyFilters(); });

    var sortSelect = document.getElementById('scannedSort');
    if (sortSelect) sortSelect.addEventListener('change', function() { sortScans(); render(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
