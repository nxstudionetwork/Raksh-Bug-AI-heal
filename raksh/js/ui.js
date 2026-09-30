const UI = {
  init() {
    this.initSidebar();
    this.initShieldWidget();
    this.initNotificationCenter();
    this.initCommandPalette();
    this.setupKeyboardNav();
    this.initOnboarding();
    this.initGlobalSearch();
    this.updateNotificationBadge();
    this.initMobileBottomNav();
    this.initQuickSettings();
  },

  initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.getElementById('hamburgerBtn');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }
    if (hamburger && sidebar) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        this.toggleSidebarOverlay(true);
      });
    }
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('mobile-open');
        overlay.classList.remove('open');
      });
    }
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', function() {
        const link = this.getAttribute('data-href');
        if (link) navigateTo(link);
      });
      const tooltip = item.querySelector('.tooltip');
      if (tooltip) {
        let timer;
        item.addEventListener('mouseenter', () => {
          timer = setTimeout(() => { tooltip.style.opacity = '1'; }, 200);
        });
        item.addEventListener('mouseleave', () => {
          clearTimeout(timer);
          tooltip.style.opacity = '0';
        });
      }
    });
    this.highlightActiveNav();
  },

  highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('data-href');
      item.classList.toggle('active', href === currentPage);
    });
  },

  toggleSidebarOverlay(show) {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.toggle('open', show);
  },

  initShieldWidget() {
    const shield = document.getElementById('floatingShield');
    if (!shield) return;

    const icon = shield.querySelector('.shield-icon');
    const panel = shield.querySelector('.shield-panel');
    const closeBtn = shield.querySelector('.shield-close');

    if (!panel.querySelector('.shield-status-bar')) {
      const statusBar = document.createElement('div');
      statusBar.className = 'shield-status-bar';
      statusBar.id = 'shieldStatusBar';
      statusBar.textContent = '🟢 Monitoring...';
      panel.insertBefore(statusBar, panel.firstChild);
    }

    if (icon && panel) {
      icon.addEventListener('click', (e) => {
        if (!shield.dragging) {
          panel.classList.toggle('open');
          this.updateShieldPanel();
        }
      });
    }
    if (closeBtn && panel) {
      closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    }
    this.makeDraggable(shield);
    this.updateShieldPanel();
  },

  updateShieldPanel() {
    const stats = Storage.getStats();
    const notifications = Storage.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    const recentAlerts = notifications.slice(0, 3);

    const todayScans = Storage.getScanHistory().filter(h => {
      const today = new Date();
      const hDate = new Date(h.timestamp);
      return hDate.toDateString() === today.toDateString();
    }).length;

    const healthEl = document.getElementById('shieldHealth');
    const scanCountEl = document.getElementById('shieldScanCount');
    const alertsContainer = document.getElementById('shieldAlerts');
    const shield = document.getElementById('floatingShield');
    const icon = shield ? shield.querySelector('.shield-icon') : null;
    const statusBar = document.getElementById('shieldStatusBar');
    const statusDot = shield ? shield.querySelector('.shield-status .status-dot') : null;
    const statusText = document.getElementById('shieldStatus');

    if (healthEl) {
      const health = Storage.getSecurityHealth();
      healthEl.textContent = health + '%';
      healthEl.style.color = health > 70 ? 'var(--accent-success)' : health > 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';
    }
    if (scanCountEl) scanCountEl.textContent = todayScans;

    if (alertsContainer) {
      if (recentAlerts.length) {
        alertsContainer.innerHTML = recentAlerts.map(a =>
          `<div class="recent-item" style="color:${a.type === 'danger' ? 'var(--accent-danger)' : 'var(--text-secondary)'}">${a.type === 'danger' ? '🚨 ' : ''}${Utils.escapeHtml(a.title || a.text || '')}</div>`
        ).join('');
      } else {
        alertsContainer.innerHTML = '<div class="recent-item" style="color:var(--text-muted);">No recent alerts</div>';
      }
    }

    const health = Storage.getSecurityHealth();
    let stateLabel = 'safe';
    let statusDotClass = 'safe';
    let statusIcon = '🟢';
    let statusMsg = 'Monitoring...';

    if (health <= 20) { stateLabel = 'critical'; statusDotClass = 'danger'; statusIcon = '🚨'; statusMsg = 'Critical Alert'; }
    else if (health <= 40) { stateLabel = 'danger'; statusDotClass = 'danger'; statusIcon = '🔴'; statusMsg = 'Warning Detected'; }
    else if (health <= 60) { stateLabel = 'warning'; statusDotClass = 'warning'; statusIcon = '🟡'; statusMsg = 'Warning Detected'; }
    else { stateLabel = 'safe'; statusDotClass = 'safe'; statusIcon = '🟢'; statusMsg = 'Monitoring...'; }

    const aiOnline = '🤖 AI Engine Online';

    if (statusBar && statusText) {
      const stateMsgMap = { safe: '🟢 Monitoring...', scanning: '🔍 Scanning...', warning: '⚠️ Warning Detected', danger: '🚨 Critical Alert', critical: '🚨 Critical Alert' };
      const activeState = icon && icon.classList.contains('scanning') ? 'scanning' : stateLabel;
      statusBar.textContent = stateMsgMap[activeState] || '🟢 Monitoring...';
    }

    const aiStatusEl = document.getElementById('shieldAIStatus') || (() => {
      const el = document.createElement('div');
      el.id = 'shieldAIStatus';
      el.className = 'shield-stat';
      const shieldRecent = document.querySelector('.shield-recent');
      if (shieldRecent && shieldRecent.parentNode) {
        shieldRecent.parentNode.insertBefore(el, shieldRecent);
      }
      return el;
    })();
    if (aiStatusEl) {
      aiStatusEl.innerHTML = `<span class="stat-label">AI Engine</span><span class="stat-value" style="color:var(--accent-success);font-size:12px;">🤖 Online</span>`;
    }
  },

  makeDraggable(element) {
    let isDragging = false;
    let startX, startY, origX, origY;
    const onStart = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      if (e.target.closest('.shield-panel')) return;
      isDragging = true; element.dragging = false;
      startX = touch.clientX; startY = touch.clientY;
      const rect = element.getBoundingClientRect();
      origX = rect.left; origY = rect.top;
      element.style.position = 'fixed';
      element.style.left = origX + 'px'; element.style.top = origY + 'px';
      element.style.bottom = 'auto'; element.style.right = 'auto';
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches ? e.touches[0] : e;
      if (Math.abs(touch.clientX - startX) > 5 || Math.abs(touch.clientY - startY) > 5) element.dragging = true;
      element.style.left = (origX + touch.clientX - startX) + 'px';
      element.style.top = (origY + touch.clientY - startY) + 'px';
    };
    const onEnd = () => { isDragging = false; setTimeout(() => { element.dragging = false; }, 50); };
    element.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    element.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  },

  initNotificationCenter() {
    const notifBtn = document.getElementById('notifBtn');
    const notifCenter = document.getElementById('notificationCenter');
    if (notifBtn && notifCenter) {
      notifBtn.addEventListener('click', () => notifCenter.classList.toggle('open'));
    }
  },

  updateNotificationBadge() {
    const notifications = Storage.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    const criticalCount = notifications.filter(n => !n.read && n.type === 'danger').length;
    document.querySelectorAll('#notifBadge, #shieldMainBadge, .nav-badge').forEach(badge => {
      if (badge.closest('.nav-item') && !badge.closest('.nav-item')?.querySelector('[data-href="notifications.html"]')) return;
      const prevCount = parseInt(badge.getAttribute('data-count') || '0', 10);
      if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = 'flex';
        if (unread !== prevCount) {
          badge.classList.remove('bounce');
          void badge.offsetWidth;
          badge.classList.add('bounce');
        }
      } else {
        badge.style.display = 'none';
      }
      badge.setAttribute('data-count', unread);
    });
    const shieldBadge = document.getElementById('shieldMainBadge');
    if (shieldBadge && criticalCount > 0) {
      shieldBadge.style.background = 'var(--accent-danger)';
    }
  },

  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✓', warning: '⚠', danger: '✕', info: 'ℹ', error: '✕', critical: '🚨' };
    const colors = { success: 'var(--accent-success)', warning: 'var(--accent-warning)', danger: 'var(--accent-danger)', error: 'var(--accent-danger)', info: 'var(--accent-info)', critical: 'var(--accent-danger)' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon" style="color:${colors[type] || 'var(--text-secondary)'}">${icons[type] || 'ℹ'}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;
    container.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
      }, duration);
    }
  },

  showModal(html) {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modalOverlay'; overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="modal animate-scale-in">${html}</div>`;
    overlay.classList.add('open');
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  },

  closeModal() {
    document.getElementById('modalOverlay')?.classList.remove('open');
  },

  showConfirmDialog(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal animate-scale-in">
      <div class="modal-header"><h2>Confirm</h2></div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;line-height:1.5;">${message}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-sm btn-ghost" id="confirmCancelBtn">Cancel</button>
        <button class="btn btn-sm btn-danger" id="confirmOkBtn">Confirm</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.classList.add('open');
    overlay.querySelector('#confirmCancelBtn').addEventListener('click', () => { overlay.remove(); if (callback) callback(false); });
    overlay.querySelector('#confirmOkBtn').addEventListener('click', () => { overlay.remove(); if (callback) callback(true); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); if (callback) callback(false); } });
  },

  showLoading(container, lines = 4) {
    const skeleton = document.createElement('div');
    skeleton.className = 'loading-skeleton';
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton-line';
      line.style.width = (60 + Math.random() * 40) + '%';
      skeleton.appendChild(line);
    }
    container.innerHTML = '';
    container.appendChild(skeleton);
  },

  renderScanResult(result, container) {
    const severityColors = { Safe: '#22c55e', Low: '#3b82f6', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' };
    const color = severityColors[result.severity] || '#6366f1';
    const scorePercent = result.riskScore;
    const circumference = 2 * Math.PI * 30;
    const offset = circumference - (scorePercent / 100) * circumference;

    container.innerHTML = `
      <div class="scan-result-card animate-slide-in">
        <div class="result-header">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;font-weight:700;">${result.category}</span>
              <span class="badge badge-${(result.severity||'info').toLowerCase()}">${result.severity}</span>
            </div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${result.recommendation}</div>
          </div>
          <div class="result-score">
            <div class="progress-ring score-ring">
              <svg width="72" height="72">
                <circle class="ring-bg" cx="36" cy="36" r="30" stroke-width="4"/>
                <circle class="ring-fill" cx="36" cy="36" r="30" stroke-width="4" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
              </svg>
              <span class="ring-text" style="color:${color}">${scorePercent}%</span>
            </div>
          </div>
        </div>
        <div class="risk-indicator"><div class="risk-bar ${result.severityClass || 'safe'}" style="width:${scorePercent}%"></div></div>
        <div class="result-details">
          <div class="detail-item"><div class="detail-label">Threat Score</div><div class="detail-value" style="color:${color}">${result.riskScore}%</div></div>
          <div class="detail-item"><div class="detail-label">Confidence</div><div class="detail-value">${result.confidence}%</div></div>
          <div class="detail-item"><div class="detail-label">Severity</div><div class="detail-value" style="color:${color}">${result.severity}</div></div>
          <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value">${result.category}</div></div>
        </div>
        ${result.detectedKeywords?.length ? `
          <div class="insight-panel" style="margin-top:12px;">
            <div class="insight-title">🔑 Detected Keywords</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${result.detectedKeywords.map(k => `<span class="filter-tab" style="cursor:default;">${k}</span>`).join('')}</div>
          </div>
        ` : ''}
        <div style="margin-top:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Reasons Detected</div>
          <div class="reasons-list">${result.reasons.map(r => `<div class="reason-item">${r}</div>`).join('')}</div>
        </div>
        ${result.psychologicalTactics?.length ? `
          <div class="insight-panel">
            <div class="insight-title">🧠 Psychological Tactics Detected</div>
            <div class="insight-grid">${result.psychologicalTactics.map(t => `
              <div class="insight-item"><div class="insight-label">Tactic</div><div class="insight-value">${t}</div></div>
            `).join('')}</div>
          </div>
        ` : ''}
        ${result.similarScamPattern ? `
          <div class="insight-panel" style="margin-top:8px;">
            <div class="insight-title">🔍 Similar Scam Pattern</div>
            <div style="font-size:13px;color:var(--text-secondary);">${result.similarScamPattern}</div>
          </div>
        ` : ''}
        ${result.learningResource ? `
          <div class="insight-panel" style="margin-top:8px;border-color:rgba(34,197,94,0.2);background:rgba(34,197,94,0.05);">
            <div class="insight-title">📖 Learning Resource</div>
            <a href="${result.learningResource.url}" style="font-size:13px;">${result.learningResource.title} →</a>
          </div>
        ` : ''}
        <div class="recommendation-box">
          <div class="rec-title">Recommended Action</div>
          <div class="rec-text">${result.recommendation}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="UI.showToast('Result bookmarked!','success')">📌 Pin Result</button>
          <button class="btn btn-sm btn-secondary" onclick="UI.showToast('Scan result saved','success')">📌 Save Result</button>
          <button class="btn btn-sm btn-secondary" onclick="this.classList.toggle('favorited'); UI.showToast(this.classList.contains('favorited')?'Added to favorites':'Removed from favorites','success')">⭐ Favorite</button>
          <button class="btn btn-sm btn-secondary" onclick="UI.showToast('Marked as reviewed','success')">✅ Mark Reviewed</button>
          <button class="btn btn-sm btn-secondary" onclick="const card=this.closest('.scan-result-card'); card.style.transition='all 0.3s ease'; card.style.opacity='0'; card.style.transform='translateX(100px)'; setTimeout(()=>card.remove(),300); UI.showToast('Scan deleted','info')">🗑️ Delete</button>
          <button class="btn btn-sm btn-secondary" onclick="UI.showToast('Re-scanning...','info')">🔄 Re-scan</button>
        </div>
      </div>
    `;
  },

  updateShieldState(state, count = 0) {
    const icon = document.querySelector('.shield-icon');
    const badge = document.querySelector('.shield-badge');
    const statusText = document.getElementById('shieldStatus');
    const threatText = document.getElementById('shieldThreatCount');
    const statusBar = document.getElementById('shieldStatusBar');
    if (!icon) return;
    icon.className = 'shield-icon';
    const pulseClass = `shield-pulse-${state}`;
    if (state) {
      icon.classList.add(state);
      if (state === 'safe') icon.style.animation = `shield-float 3s ease-in-out infinite, shield-pulse-safe 2s ease-in-out infinite`;
      else if (state === 'scanning') icon.style.animation = `shield-pulse-scanning 0.5s ease-in-out infinite`;
      else if (state === 'critical') icon.style.animation = `shield-pulse-critical 0.8s ease-in-out infinite`;
      else icon.style.animation = `shield-float 3s ease-in-out infinite`;
    }
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else badge.style.display = 'none';
    }
    const statusLabels = { safe: 'All Safe', scanning: 'Scanning...', warning: 'Warning', danger: 'High Risk', critical: 'Critical Threat' };
    const statusIcons = { safe: '🛡️', scanning: '🔍', warning: '⚠️', danger: '🚨', critical: '🚨' };
    if (statusText) statusText.textContent = statusLabels[state] || 'Active';
    if (threatText) threatText.textContent = count;
    if (statusBar) statusBar.textContent = `${statusIcons[state] || '🟢'} ${statusLabels[state] || 'Monitoring...'}`;
  },

  renderNotifications(container) {
    const notifications = Storage.getNotifications();
    if (!notifications.length) {
      container.innerHTML = `<div class="empty-state" style="padding:32px 20px;"><div class="empty-state-icon">🔔</div><div class="empty-state-title">No Notifications</div><div class="empty-state-text">You're all caught up!</div></div>`;
      return;
    }
    const icons = { safe: '🟢', warning: '🟡', danger: '🔴', info: '🔵' };
    container.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-icon ${n.type || 'info'}">${icons[n.type] || 'ℹ'}</div>
        <div class="notif-body">
          <div class="notif-title">${Utils.escapeHtml(n.title || '')}</div>
          <div class="notif-text">${Utils.escapeHtml(n.text || '')}</div>
          ${n.recommendation ? `<div class="notif-text" style="font-size:11px;color:var(--accent-secondary);margin-top:2px;">→ ${Utils.escapeHtml(n.recommendation)}</div>` : ''}
        </div>
        <div class="notif-time">${Utils.formatRelativeTime(n.timestamp)}</div>
      </div>
    `).join('');
  },

  initCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (!palette) return;
    const input = palette.querySelector('.cp-search input');
    const results = palette.querySelector('.cp-results');

    const commands = [
      { icon: '📊', title: 'Go to Dashboard', desc: 'View your security overview', action: 'dashboard.html', shortcut: 'G D' },
      { icon: '🔍', title: 'Open Scanner', desc: 'Scan messages, links, files', action: 'scan.html', shortcut: 'G S' },
      { icon: '🛡️', title: 'Open Protection', desc: 'Analytics, reports, learning', action: 'protection.html', shortcut: 'G P' },
      { icon: '🔒', title: 'Security Center', desc: 'History, community, threats', action: 'security-center.html', shortcut: 'G C' },
      { icon: '🤖', title: 'AI Assistant', desc: 'Ask security questions', action: 'ai-assistant.html', shortcut: 'G A' },
      { icon: '🔔', title: 'View Notifications', desc: 'Check alerts and updates', action: 'notifications.html', shortcut: 'G N' },
      { icon: '👤', title: 'Profile', desc: 'Your account and stats', action: 'profile.html', shortcut: 'G P' },
      { icon: '⚙️', title: 'Settings', desc: 'Configure preferences', action: 'settings.html', shortcut: 'G S' },
      { icon: '❓', title: 'Help Center', desc: 'Guides and FAQ', action: 'help.html', shortcut: 'G H' },
      { icon: '📋', title: 'New Scan', desc: 'Start a new security scan', action: 'scan', shortcut: 'N' },
      { icon: '📤', title: 'Export Data', desc: 'Export scan history', action: 'export', shortcut: 'E' },
      { icon: '⌨️', title: 'Keyboard Shortcuts', desc: 'View all keyboard shortcuts', action: 'shortcuts', shortcut: '?' }
    ];

    const renderResults = (query) => {
      const q = query.toLowerCase();
      const filtered = commands.filter(c =>
        c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      );
      results.innerHTML = filtered.map(c => `
        <div class="cp-item" data-action="${c.action}">
          <div class="cp-icon" style="background:var(--bg-frost)">${c.icon}</div>
          <div class="cp-info">
            <div class="cp-title">${c.title}</div>
            <div class="cp-desc">${c.desc}</div>
          </div>
          <span class="cp-shortcut">${c.shortcut}</span>
        </div>
      `).join('');

      results.querySelectorAll('.cp-item').forEach(el => {
        el.addEventListener('click', () => {
          const action = el.getAttribute('data-action');
          if (action.endsWith('.html')) navigateTo(action);
          else if (action === 'export') { const h = Storage.getScanHistory(); const t = h.map(s => `Date: ${Utils.formatDate(s.timestamp)}\nType: ${s.type}\nRisk: ${s.riskScore}%/100\nSeverity: ${s.severity}\n---`).join('\n'); Utils.downloadFile(t, 'scan_history.txt', 'text/plain'); UI.showToast('Exported as Text Document','success'); }
          else if (action === 'shortcuts') UI.showKeyboardShortcuts();
          else if (action === 'scan') navigateTo('scan.html');
          palette.classList.remove('open');
        });
      });
      if (filtered.length) results.querySelector('.cp-item')?.classList.add('active');
    };

    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('keydown', (e) => {
      const items = results.querySelectorAll('.cp-item');
      const active = results.querySelector('.cp-item.active');
      let idx = Array.from(items).indexOf(active);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(idx + 1, items.length - 1)]?.classList.add('active'); active?.classList.remove('active'); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(idx - 1, 0)]?.classList.add('active'); active?.classList.remove('active'); }
      if (e.key === 'Enter') { e.preventDefault(); active?.click(); }
    });

    renderResults('');
  },

  initOnboarding() {
    if (Storage.getOnboardingComplete()) return;
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    let step = 0;
    const title = overlay.querySelector('.ob-title');
    const desc = overlay.querySelector('.ob-desc');
    const icon = overlay.querySelector('.ob-icon');
    const dots = overlay.querySelector('.ob-dots');
    const nextBtn = overlay.querySelector('.ob-next');
    const skipBtn = overlay.querySelector('.ob-skip');

    const update = () => {
      const s = OnboardingSteps[step];
      icon.textContent = s.icon;
      title.textContent = s.title;
      desc.textContent = s.desc;
      dots.innerHTML = OnboardingSteps.map((_, i) => `<span class="ob-dot ${i === step ? 'active' : ''}"></span>`).join('');
      nextBtn.textContent = step === OnboardingSteps.length - 1 ? 'Get Started' : 'Next';
    };

    nextBtn.addEventListener('click', () => {
      if (step < OnboardingSteps.length - 1) { step++; update(); }
      else { overlay.classList.remove('open'); Storage.setOnboardingComplete(true); }
    });
    skipBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      Storage.setOnboardingComplete(true);
    });
    update();
  },

  initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    const searchResults = document.createElement('div');
    searchResults.className = 'global-search-results';
    searchResults.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:var(--bg-secondary);border:1px solid var(--border-glass);border-radius:var(--radius-md);margin-top:4px;max-height:300px;overflow-y:auto;display:none;z-index:100;';
    searchInput.parentNode.style.position = 'relative';
    searchInput.parentNode.appendChild(searchResults);

    searchInput.addEventListener('input', Utils.debounce((e) => {
      const q = searchInput.value.trim();
      if (!q) { searchResults.style.display = 'none'; return; }
      const results = Storage.getScanHistory().filter(h =>
        JSON.stringify(h).toLowerCase().includes(q.toLowerCase())
      );
      if (results.length) {
        searchResults.innerHTML = results.slice(0, 8).map(r =>
          `<div style="padding:8px 12px;font-size:12px;color:var(--text-secondary);cursor:pointer;border-bottom:1px solid var(--border-glass);" onclick="UI.showToast('Viewing scan result','info');this.closest('.global-search-results').style.display='none'">${Utils.truncate(r.content || r.category || 'Scan', 60)} <span class="badge badge-${(r.severity||'info').toLowerCase()}" style="float:right;">${r.severity||''}</span></div>`
        ).join('');
        searchResults.style.display = 'block';
      } else {
        searchResults.innerHTML = '<div class="empty-state" style="padding:16px 12px;"><div class="empty-state-icon" style="font-size:24px;">🔍</div><div class="empty-state-text" style="font-size:12px;">No results found for your search.</div></div>';
        searchResults.style.display = 'block';
      }
    }, 300));

    document.addEventListener('click', (e) => {
      if (!searchInput.parentNode.contains(e.target)) searchResults.style.display = 'none';
    });
  },

  setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open, .notification-center.open, .command-palette-overlay.open')
          .forEach(el => el.classList.remove('open'));
        document.querySelector('.shield-panel.open')?.classList.remove('open');
        document.getElementById('settingsPanel')?.classList.remove('open');
        document.getElementById('settingsPanelOverlay')?.classList.remove('open');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const palette = document.getElementById('commandPalette');
        if (palette) {
          palette.classList.toggle('open');
          if (palette.classList.contains('open')) palette.querySelector('input')?.focus();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        UI.showKeyboardShortcuts();
      }
    });
  },

  showKeyboardShortcuts() {
    const shortcuts = [
      { group: 'General', keys: [
        { combo: 'Ctrl+K', desc: 'Command Palette' },
        { combo: 'Ctrl+/', desc: 'Show Shortcuts' },
        { combo: 'Escape', desc: 'Close panels/modals' },
        { combo: 'Ctrl+Enter', desc: 'Send message (AI Assistant)' }
      ]},
      { group: 'Navigation', keys: [
        { combo: 'G then D', desc: 'Dashboard' },
        { combo: 'G then S', desc: 'Scanner' },
        { combo: 'G then P', desc: 'Protection' },
        { combo: 'G then C', desc: 'Security Center' },
        { combo: 'G then A', desc: 'AI Assistant' },
        { combo: 'G then N', desc: 'Notifications' }
      ]},
      { group: 'Actions', keys: [
        { combo: 'N', desc: 'New Scan' },
        { combo: 'E', desc: 'Export Data' }
      ]}
    ];
    let html = `<div class="modal-header"><h2>⌨️ Keyboard Shortcuts</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div>
      <div class="shortcuts-modal">`;
    shortcuts.forEach(g => {
      html += `<div class="shortcut-group"><h4>${g.group}</h4>`;
      g.keys.forEach(k => {
        html += `<div class="shortcut-row"><span>${k.desc}</span><kbd>${k.combo}</kbd></div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
    this.showModal(html);
  },

  initQuickSettings() {
    let overlay = document.getElementById('settingsPanelOverlay');
    let panel = document.getElementById('settingsPanel');

    if (!panel) {
      overlay = document.createElement('div');
      overlay.id = 'settingsPanelOverlay';
      overlay.className = 'settings-panel-overlay';
      document.body.appendChild(overlay);

      panel = document.createElement('div');
      panel.id = 'settingsPanel';
      panel.className = 'settings-panel';
      panel.innerHTML = `
        <div class="settings-panel-header">
          <h2>⚙️ Quick Settings</h2>
          <button class="settings-panel-close" aria-label="Close settings">✕</button>
        </div>
        <div class="settings-panel-body"></div>
      `;
      document.body.appendChild(panel);
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (!settingsBtn) return;

    const closePanel = () => {
      panel.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    const openPanel = () => {
      panel.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      this.renderQuickSettings();
    };

    if (settingsBtn) settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); openPanel(); });
    const closeBtn = panel.querySelector('.settings-panel-close');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (overlay) overlay.addEventListener('click', closePanel);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  },

  renderQuickSettings() {
    const body = document.querySelector('.settings-panel-body');
    if (!body) return;
    const settings = window._cachedSettings || Storage.getSettings();

    body.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Dark Mode</div><div class="settings-row-desc">Toggle dark/light theme</div></div>
          <label class="toggle-switch"><input type="checkbox" id="qsThemeToggle" ${settings.theme === 'light' ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Theme Accent</div></div>
          <div class="settings-color-options">
            ${['#6366f1','#06b6d4','#22c55e','#eab308','#ef4444','#f97316','#8b5cf6','#ec4899'].map(c =>
              `<div class="settings-color-swatch ${settings.accentColor === c ? 'active' : ''}" style="background:${c}" data-color="${c}"></div>`
            ).join('')}
          </div>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Animations</div><div class="settings-row-desc">Enable UI animations</div></div>
          <label class="toggle-switch"><input type="checkbox" id="qsAnimToggle" ${settings.animations !== false ? 'checked' : ''}><span class="slider"></span></label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Enable Notifications</div></div>
          <label class="toggle-switch"><input type="checkbox" id="qsNotifToggle" ${settings.notifications !== false ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Sound</div><div class="settings-row-desc">Play sound on alerts</div></div>
          <label class="toggle-switch"><input type="checkbox" id="qsSoundToggle" ${settings.sound !== false ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Desktop Notifications</div></div>
          <label class="toggle-switch"><input type="checkbox" id="qsDesktopToggle" ${settings.desktop !== false ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Alert Level</div></div>
          <select class="form-select" id="qsAlertLevel" style="width:auto;padding:6px 24px 6px 10px;font-size:12px;min-width:100px;">
            <option value="all" ${settings.alertLevel === 'all' ? 'selected' : ''}>All Alerts</option>
            <option value="high" ${settings.alertLevel === 'high' ? 'selected' : ''}>High+ Only</option>
            <option value="critical" ${settings.alertLevel === 'critical' ? 'selected' : ''}>Critical Only</option>
            <option value="none" ${settings.alertLevel === 'none' ? 'selected' : ''}>None</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Connected Apps</div>
        <div style="padding:12px;background:var(--bg-frost);border-radius:var(--radius-sm);text-align:center;font-size:13px;color:var(--text-secondary);">
          Manage connected apps from your <a href="profile.html" style="color:var(--accent-primary);font-weight:500;cursor:pointer;">Profile page →</a>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Security</div>
        <div class="settings-row">
          <div><div class="settings-row-label">Protection Status</div></div>
          <span class="settings-row-value" style="color:var(--accent-success);">🛡️ Active</span>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">AI Engine</div></div>
          <span class="settings-row-value" style="color:var(--accent-success);">🤖 Online</span>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Privacy Mode</div></div>
          <label class="toggle-switch"><input type="checkbox" id="qsPrivacyToggle" ${settings.privacyMode ? 'checked' : ''}><span class="slider"></span></label>
        </div>
        <button class="settings-btn-danger" id="qsClearData">🗑️ Clear Local Data</button>
        <button class="settings-btn-danger" id="qsResetSettings" style="margin-top:4px;">⚙️ Reset Settings</button>
      </div>
    `;

    // Bind events
    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => {
        Storage.updateSettings({ [key]: el.checked });
        window._cachedSettings = { ...window._cachedSettings, [key]: el.checked };
        API.updateSettings({ [key]: el.checked }).catch(() => {});
        if (key === 'theme') {
          document.body.classList.toggle('light-theme', el.checked);
          document.body.classList.toggle('dark-theme', !el.checked);
        }
        if (key === 'animations') {
          document.documentElement.style.setProperty('--transition-fast', el.checked ? '0.2s ease' : '0s');
          document.documentElement.style.setProperty('--transition-normal', el.checked ? '0.3s ease' : '0s');
        }
      });
    };
    bindToggle('qsThemeToggle', 'theme');
    bindToggle('qsAnimToggle', 'animations');
    bindToggle('qsNotifToggle', 'notifications');
    bindToggle('qsSoundToggle', 'sound');
    bindToggle('qsDesktopToggle', 'desktop');
    bindToggle('qsPrivacyToggle', 'privacyMode');

    const alertSelect = document.getElementById('qsAlertLevel');
    if (alertSelect) alertSelect.addEventListener('change', () => {
      const val = alertSelect.value;
      Storage.updateSettings({ alertLevel: val });
      window._cachedSettings = { ...window._cachedSettings, alertLevel: val };
      API.updateSettings({ alert_level: val }).catch(() => {});
    });

    // Color swatches
    body.querySelectorAll('.settings-color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        body.querySelectorAll('.settings-color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        const color = sw.getAttribute('data-color');
        Storage.updateSettings({ accentColor: color });
        window._cachedSettings = { ...window._cachedSettings, accentColor: color };
        API.updateSettings({ accent_color: color }).catch(() => {});
        document.documentElement.style.setProperty('--accent-primary', color);
      });
    });

    // Danger buttons
    const clearBtn = document.getElementById('qsClearData');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      UI.showConfirmDialog('Clear all local data? This cannot be undone.', (confirmed) => {
        if (!confirmed) return;
        Storage.clear();
        UI.showToast('All local data cleared', 'warning');
        setTimeout(() => location.reload(), 1000);
      });
    });

    const resetBtn = document.getElementById('qsResetSettings');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      UI.showConfirmDialog('Reset all settings to defaults?', async (confirmed) => {
        if (!confirmed) return;
        const defaults = { theme: 'dark', accentColor: '#6366f1', notifications: true, language: 'en', animations: true, autoSave: true, privacyMode: false, fontSize: 'normal', highContrast: false };
        Storage.set('settings', defaults);
        window._cachedSettings = defaults;
        try { await API.updateSettings(defaults); } catch {}
        UI.showToast('Settings reset to defaults', 'success');
        this.renderQuickSettings();
      });
    });
  },

  renderConnectedApps(container) {
    const apps = [
      { id:'whatsapp', name:'WhatsApp', icon:'💬', connected:false },
      { id:'telegram', name:'Telegram', icon:'✈️', connected:true },
      { id:'discord', name:'Discord', icon:'🎮', connected:false },
      { id:'slack', name:'Slack', icon:'🔷', connected:false },
      { id:'teams', name:'Microsoft Teams', icon:'💼', connected:false },
      { id:'gchat', name:'Google Chat', icon:'💬', connected:true },
      { id:'email', name:'Email', icon:'📧', connected:true },
      { id:'sms', name:'SMS', icon:'📱', connected:false }
    ];

    container.innerHTML = apps.map(a => {
      const isConnected = Storage.get('app_' + a.id, a.connected);
      return `
        <div class="settings-app-card" data-app="${a.id}">
          <span class="app-icon">${a.icon}</span>
          <div class="app-info">
            <div class="app-name">${a.name}</div>
            <div class="app-status ${isConnected ? 'connected' : ''}">
              ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          <button class="app-action-btn ${isConnected ? 'disconnect' : ''}" data-app="${a.id}">
            ${isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.app-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const appId = btn.getAttribute('data-app');
        const card = container.querySelector(`[data-app="${appId}"]`);
        const wasConnected = Storage.get('app_' + appId, apps.find(a => a.id === appId)?.connected || false);
        const newState = !wasConnected;
        Storage.set('app_' + appId, newState);
        const statusEl = card.querySelector('.app-status');
        statusEl.textContent = newState ? '🟢 Connected' : '🔴 Disconnected';
        statusEl.className = 'app-status' + (newState ? ' connected' : '');
        btn.textContent = newState ? 'Disconnect' : 'Connect';
        btn.className = 'app-action-btn' + (newState ? ' disconnect' : '');
        UI.showToast(`${apps.find(a => a.id === appId)?.name || appId} ${newState ? 'connected' : 'disconnected'}`, newState ? 'success' : 'info');
      });
    });
  },

  updateHealthScore(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const health = Storage.getSecurityHealth();
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (health / 100) * circumference;
    const color = health > 70 ? '#22c55e' : health > 40 ? '#eab308' : '#ef4444';

    container.innerHTML = `
      <div class="health-score-ring">
        <svg width="100" height="100">
          <circle class="hs-bg" cx="50" cy="50" r="42"/>
          <circle class="hs-fill" cx="50" cy="50" r="42" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <span class="hs-text" style="color:${color}">${health}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Security Health</div>
    `;
  },

  initMobileBottomNav() {
    const existing = document.querySelector('.mobile-bottom-nav');
    if (existing) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const items = [
      { icon: '🏠', label: 'Home', page: 'dashboard.html' },
      { icon: '🛡', label: 'Protection', page: 'protection.html' },
      { icon: '🔍', label: 'Scanner', page: 'scan.html' },
      { icon: '🤖', label: 'AI', page: 'ai-assistant.html' },
      { icon: '👤', label: 'Profile', page: 'profile.html' }
    ];

    const nav = document.createElement('div');
    nav.className = 'mobile-bottom-nav';

    items.forEach(item => {
      const isActive = currentPage === item.page;
      const el = document.createElement('div');
      el.className = 'mobile-bottom-nav-item' + (isActive ? ' active' : '');
      el.setAttribute('data-href', item.page);
      el.innerHTML = `<span class="mobile-bottom-nav-icon">${item.icon}</span><span class="mobile-bottom-nav-label">${item.label}</span>`;
      el.addEventListener('click', () => navigateTo(item.page));
      nav.appendChild(el);
    });

    document.body.appendChild(nav);
  }
};
