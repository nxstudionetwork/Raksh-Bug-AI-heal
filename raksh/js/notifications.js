let currentNotifications = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('notificationsPage')) return;
  initNotificationsPage();
});

function initNotificationsPage() {
  const container = document.getElementById('notificationsListContainer');
  const markAllBtn = document.getElementById('markAllReadBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const searchInput = document.getElementById('notifSearchInput');
  const tabContainer = document.getElementById('notifFilterTabs');

  let currentFilter = 'all';
  let currentSearch = '';

  async function loadNotifications() {
    try {
      const data = await API.getNotifications({ limit: 100 });
      currentNotifications = data.notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        text: n.description || '',
        read: n.status === 'read',
        timestamp: new Date(n.created_at).getTime(),
      }));
    } catch {
      currentNotifications = [];
    }
    render();
  }

  function render() {
    renderGroupedNotifications(container, currentNotifications, currentFilter, currentSearch, loadNotifications);
  }

  if (!container) return;

  loadNotifications();

  if (tabContainer) {
    tabContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.notif-tab');
      if (!tab) return;
      const filter = tab.getAttribute('data-filter');
      tabContainer.querySelectorAll('.notif-tab').forEach(t => {
        t.className = 'notif-tab';
      });
      tab.className = 'notif-tab active active-' + filter;
      currentFilter = filter;
      render();
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      const unread = currentNotifications.filter(n => !n.read).length;
      if (!unread) { UI.showToast('All notifications are already read', 'info'); return; }
      await API.markAllNotificationsRead();
      await loadNotifications();
      UI.showToast('All notifications marked as read', 'success');
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (!currentNotifications.length) { UI.showToast('No notifications to clear', 'info'); return; }
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);';
      modal.innerHTML = `<div class="glass-card" style="padding:24px;max-width:360px;width:90%;text-align:center;border:1px solid var(--border-glass);">
        <div style="font-size:36px;margin-bottom:12px;">🗑️</div>
        <h3 style="font-size:16px;font-weight:600;margin-bottom:6px;">Clear All Notifications?</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">This action cannot be undone.</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-sm btn-ghost" id="cancelClearBtn">Cancel</button>
          <button class="btn btn-sm btn-danger" id="confirmClearBtn">Clear All</button>
        </div>
      </div>`;
      document.body.appendChild(modal);
      document.getElementById('cancelClearBtn').addEventListener('click', () => modal.remove());
      document.getElementById('confirmClearBtn').addEventListener('click', async () => {
        await API.clearAllNotifications();
        await loadNotifications();
        UI.showToast('All notifications cleared', 'info');
        modal.remove();
      });
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      currentSearch = searchInput.value.toLowerCase();
      render();
    }, 200));
  }
}

function getGroupLabel(timestamp) {
  const now = new Date();
  const d = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const notifDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (notifDate.getTime() === today.getTime()) return 'Today';
  if (notifDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

function getDisplayTime(timestamp, group) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (group === 'Today') {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    return hours + 'h ago';
  }
  if (group === 'Yesterday') return 'Yesterday';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const NOTIF_ICONS = { safe: '🛡️', warning: '⚠️', critical: '🚨', system: 'ℹ️' };
const NOTIF_ACTION_ICONS = { safe: '🟢', warning: '🟡', critical: '🔴', system: '🔵' };

function renderGroupedNotifications(container, notifications, filter, search, refreshCallback) {
  if (!container) return;

  if (filter && filter !== 'all') {
    notifications = notifications.filter(n => n.type === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    notifications = notifications.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.text || '').toLowerCase().includes(q)
    );
  }

  if (!notifications.length) {
    container.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <div class="notif-empty-text">No notifications yet</div>
      </div>
    `;
    return;
  }

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  notifications.forEach(n => {
    const group = getGroupLabel(n.timestamp);
    if (groups[group]) groups[group].push(n);
    else groups.Earlier.push(n);
  });

  const groupOrder = ['Today', 'Yesterday', 'Earlier'];

  let html = '';
  groupOrder.forEach(groupLabel => {
    const items = groups[groupLabel];
    if (!items || !items.length) return;
    html += `<div class="notif-group"><div class="notif-group-header">${groupLabel}</div>`;
    items.forEach((n, idx) => {
      const typeClass = n.type === 'danger' ? 'critical' : n.type || 'system';
      const isRead = n.read;
      const timeDisplay = getDisplayTime(n.timestamp, groupLabel);
      const icon = NOTIF_ICONS[typeClass] || 'ℹ️';
      html += `
        <div class="notif-card type-${typeClass} ${isRead ? 'read' : 'unread'} notif-item-enter" data-id="${n.id}" style="animation-delay:${idx * 0.025}s">
          <div class="notif-read-dot"></div>
          <div class="notif-card-icon type-${typeClass}">${icon}</div>
          <div class="notif-card-body">
            <div class="notif-card-title">${Utils.escapeHtml(n.title || '')}</div>
            <div class="notif-card-text">${Utils.escapeHtml(n.text || '')}</div>
          </div>
          <div class="notif-card-time">${timeDisplay}</div>
          <div class="notif-card-actions">
            <button class="view-btn" data-id="${n.id}" title="View details">View Details</button>
            ${!isRead ? `<button class="mark-read-btn" data-id="${n.id}" title="Mark as read">✓</button>` : ''}
            <button class="delete-btn" data-id="${n.id}" title="Delete">✕</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll('.notif-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.notif-card-actions')) return;
      const id = this.getAttribute('data-id');
      if (id) {
        API.markNotificationRead(id).then(() => refreshCallback());
      }
    });
  });

  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      const notif = currentNotifications.find(n => n.id === id);
      if (!notif) return;
      API.markNotificationRead(id).then(() => refreshCallback());
      UI.showModal(`<div class="modal-header"><h2>${Utils.escapeHtml(notif.title || 'Notification')}</h2><button class="modal-close" onclick="UI.closeModal()">✕</button></div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${Utils.escapeHtml(notif.text || '')}</div>`);
    });
  });

  container.querySelectorAll('.mark-read-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      if (id) {
        API.markNotificationRead(id).then(() => refreshCallback());
      }
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      if (id) {
        const card = this.closest('.notif-card');
        if (card) card.classList.add('notif-item-exit');
        setTimeout(() => {
          API.deleteNotification(id).then(() => refreshCallback());
        }, 250);
      }
    });
  });
}
